import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { verifyToken } from "@/lib/auth";
import { UserRole } from "@/constants/roles";

export async function GET(req: NextRequest) {
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

    // 2. Connect DB
    await connectDB();

    // 3. Fetch Orders ready for pickup
    const orders = await Order.find({
      status: "READY_FOR_PICKUP",
      deliveryPartner: { $exists: false },
    })
      .populate("restaurant", "name location")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("[GET Available Orders] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
