import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import DeliveryPartner from "@/models/DeliveryPartner";
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

    // 3. Find Delivery Partner
    const partner = await DeliveryPartner.findOne({ user: result.payload.userId });
    if (!partner) {
      return NextResponse.json({ success: false, message: "Delivery partner profile not found" }, { status: 404 });
    }

    // 4. Fetch Orders assigned to this partner
    const orders = await Order.find({
      deliveryPartner: partner._id,
    })
      .populate("restaurant", "name location")
      .populate("user", "name")
      .sort({ updatedAt: -1 })
      .lean();

    // 5. Categorize orders
    const accepted = orders.filter(o => o.status !== "DELIVERED" && o.status !== "CANCELLED");
    const history = orders.filter(o => o.status === "DELIVERED" || o.status === "CANCELLED");

    return NextResponse.json({
      success: true,
      data: {
        accepted,
        history,
      }
    });
  } catch (error) {
    console.error("[GET Partner Orders] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
