import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import DeliveryPartner from "@/models/DeliveryPartner";
import { verifyToken } from "@/lib/auth";
import { UserRole } from "@/constants/roles";
import { ORDER_STATUSES } from "@/constants/orders";
import type { OrderStatusEvent } from "@/types";

export async function PUT(req: NextRequest) {
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
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, message: "Order ID and status are required" },
        { status: 400 }
      );
    }

    if (!ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });
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
        deliveryPartner: partner._id,
      },
      {
        $set: { status },
      },
      { new: true }
    );

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found or not assigned to you" },
        { status: 404 }
      );
    }

    // 5. If delivered, update partner status
    if (status === "DELIVERED") {
      await DeliveryPartner.findByIdAndUpdate(partner._id, {
        $set: { availability: "AVAILABLE" },
      });
    }

    // 6. Socket Notification (Real-time updates to customer)
    if (globalThis.__socketIoServer__) {
      const io = globalThis.__socketIoServer__;
      const payload: OrderStatusEvent = {
        orderId: order._id.toString(),
        status,
        updatedAt: order.updatedAt.toISOString(),
      };

      io.to(`user:${order.user.toString()}`).emit("order_status_update", payload);
      io.to(`user:${order.user.toString()}`).emit("orderStatusUpdated", {
        ...payload,
        message: `Your order is now ${status.replace(/_/g, " ").toLowerCase()}.`,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("[PUT Update Status] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
