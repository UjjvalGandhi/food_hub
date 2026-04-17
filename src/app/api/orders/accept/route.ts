import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import DeliveryPartner from "@/models/DeliveryPartner";
import { verifyToken } from "@/lib/auth";
import { UserRole } from "@/constants/roles";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const result = await verifyToken(token);

    if (!result.success || result.payload.role !== UserRole.DELIVERY_PARTNER) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, message: "Order ID is required" }, { status: 400 });
    }

    // 2. Connect DB
    await connectDB();

    // 3. Find Delivery Partner
    const partner = await DeliveryPartner.findOne({ user: result.payload.userId });
    if (!partner) {
      return NextResponse.json({ success: false, message: "Delivery partner profile not found" }, { status: 404 });
    }

    // 4. Update Order
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        status: "READY_FOR_PICKUP",
        deliveryPartner: { $exists: false },
      },
      {
        $set: { deliveryPartner: partner._id },
      },
      { new: true }
    );

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not available for acceptance" },
        { status: 400 }
      );
    }

    // 5. Update Partner's assigned orders
    await DeliveryPartner.findByIdAndUpdate(partner._id, {
      $addToSet: { assignedOrders: order._id },
      $set: { availability: "BUSY" },
    });

    return NextResponse.json({
      success: true,
      message: "Order accepted successfully",
      data: order,
    });
  } catch (error) {
    console.error("[POST Accept Order] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
