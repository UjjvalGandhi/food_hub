import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import DeliveryPartner from "@/models/DeliveryPartner";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const headersList = await headers();
    const userRole = headersList.get("x-user-role");

    if (userRole !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const partners = await DeliveryPartner.find()
      .populate("user", "name email isApproved isBlocked createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: partners });
  } catch (error) {
    console.error("[GET Admin Delivery Partners] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const headersList = await headers();
    const userRole = headersList.get("x-user-role");

    if (userRole !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, action } = body; // action: "approve" | "block"

    if (!userId || !action) {
      return NextResponse.json({ success: false, message: "userId and action are required" }, { status: 400 });
    }

    await connectDB();

    const update =
      action === "approve"
        ? { isApproved: true }
        : action === "block"
        ? { isBlocked: true }
        : null;

    if (!update) {
      return NextResponse.json({ success: false, message: "Invalid action. Use 'approve' or 'block'." }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true }).lean();
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (action === "approve") {
      await DeliveryPartner.findOneAndUpdate(
        { user: userId },
        { $set: { availability: "AVAILABLE" } }
      );
    }

    return NextResponse.json({ success: true, message: `Partner ${action}d successfully`, data: user });
  } catch (error) {
    console.error("[PATCH Admin Delivery Partners] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
