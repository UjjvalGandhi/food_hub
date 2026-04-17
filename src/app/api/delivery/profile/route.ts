import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import DeliveryPartner from "@/models/DeliveryPartner";
import Order from "@/models/Order";
import User from "@/models/User";
import { UserRole } from "@/constants/roles";

const updateDeliveryProfileSchema = z.object({
  name: z.string().min(2).max(60).trim().optional(),
  phone: z.string().min(8).max(20).trim().optional(),
  vehicleType: z.enum(["BIKE", "SCOOTER", "CAR", "CYCLE"]).optional(),
  licenseNumber: z.string().min(4).max(40).trim().optional(),
  availability: z.enum(["AVAILABLE", "OFFLINE"]).optional(),
});

function getDayStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

async function getDeliveryAuthContext() {
  const requestHeaders = await headers();
  const userRole = requestHeaders.get("x-user-role");
  const userId = requestHeaders.get("x-user-id");

  if (userRole !== UserRole.DELIVERY_PARTNER || !userId) {
    return null;
  }

  return { userId };
}

export async function GET() {
  try {
    const auth = await getDeliveryAuthContext();
    if (!auth) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const partner = await DeliveryPartner.findOne({ user: auth.userId })
      .populate("user", "name email isApproved isBlocked createdAt")
      .lean();

    if (!partner || !partner.user) {
      return NextResponse.json(
        { success: false, message: "Delivery partner profile not found" },
        { status: 404 }
      );
    }

    const populatedUser = partner.user as unknown as {
      _id: string;
      name: string;
      email: string;
      isApproved: boolean;
      isBlocked: boolean;
      createdAt: Date;
    };

    const deliveredOrders = await Order.find({
      deliveryPartner: partner._id,
      status: "DELIVERED",
    })
      .select("totalAmount updatedAt")
      .lean();

    const activeDeliveries = await Order.countDocuments({
      deliveryPartner: partner._id,
      status: { $in: ["READY_FOR_PICKUP", "PICKED_UP", "OUT_FOR_DELIVERY"] },
    });

    const availableJobs = await Order.countDocuments({
      status: "READY_FOR_PICKUP",
      deliveryPartner: { $exists: false },
    });

    const todayStart = getDayStart();
    const deliveredToday = deliveredOrders.filter(
      (order) => new Date(order.updatedAt) >= todayStart
    );

    const totalEarnings = deliveredOrders.reduce(
      (sum, order) => sum + (order.totalAmount ?? 0),
      0
    );
    const todayEarnings = deliveredToday.reduce(
      (sum, order) => sum + (order.totalAmount ?? 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          _id: String(partner._id),
          partnerId: partner.partnerId,
          name: partner.name,
          phone: partner.phone,
          vehicleType: partner.vehicleType,
          licenseNumber: partner.licenseNumber,
          availability: partner.availability,
          createdAt: partner.createdAt,
          user: {
            _id: String(populatedUser._id),
            name: populatedUser.name,
            email: populatedUser.email,
            isApproved: populatedUser.isApproved,
            isBlocked: populatedUser.isBlocked,
            createdAt: populatedUser.createdAt,
          },
        },
        stats: {
          availableJobs,
          activeDeliveries,
          completedDeliveries: deliveredOrders.length,
          deliveredToday: deliveredToday.length,
          totalEarnings,
          todayEarnings,
        },
      },
    });
  } catch (error) {
    console.error("[GET Delivery Profile] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await getDeliveryAuthContext();
    if (!auth) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateDeliveryProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    await connectDB();

    const partner = await DeliveryPartner.findOne({ user: auth.userId })
      .populate("user", "isApproved isBlocked")
      .lean();

    if (!partner) {
      return NextResponse.json(
        { success: false, message: "Delivery partner profile not found" },
        { status: 404 }
      );
    }

    const updateData = parsed.data;

    if (updateData.availability === "AVAILABLE") {
      const user = partner.user as { isApproved?: boolean; isBlocked?: boolean } | null;
      if (!user?.isApproved || user?.isBlocked) {
        return NextResponse.json(
          {
            success: false,
            message: "Your account must be approved and active before going available.",
          },
          { status: 403 }
        );
      }
    }

    if (updateData.availability === "OFFLINE") {
      const activeDeliveries = await Order.countDocuments({
        deliveryPartner: partner._id,
        status: { $in: ["READY_FOR_PICKUP", "PICKED_UP", "OUT_FOR_DELIVERY"] },
      });

      if (activeDeliveries > 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Finish your active deliveries before switching offline.",
          },
          { status: 409 }
        );
      }
    }

    const partnerUpdate: Record<string, unknown> = {};
    const userUpdate: Record<string, unknown> = {};

    if (updateData.name) {
      partnerUpdate.name = updateData.name;
      userUpdate.name = updateData.name;
    }
    if (updateData.phone) partnerUpdate.phone = updateData.phone;
    if (updateData.vehicleType) partnerUpdate.vehicleType = updateData.vehicleType;
    if (updateData.licenseNumber) partnerUpdate.licenseNumber = updateData.licenseNumber;
    if (updateData.availability) partnerUpdate.availability = updateData.availability;

    const updatedPartner = await DeliveryPartner.findByIdAndUpdate(
      partner._id,
      { $set: partnerUpdate },
      { returnDocument: "after" }
    )
      .populate("user", "name email isApproved isBlocked createdAt")
      .lean();

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(auth.userId, { $set: userUpdate }, { returnDocument: "after" });
    }

    return NextResponse.json({
      success: true,
      message: "Delivery profile updated successfully.",
      data: updatedPartner,
    });
  } catch (error) {
    console.error("[PATCH Delivery Profile] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
