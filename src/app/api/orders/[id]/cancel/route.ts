import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    // Verify customer role
    if (!userId || userRole !== UserRole.CUSTOMER) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const { id: orderId } = await params;
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    // Ensure order belongs to customer
    if (order.user.toString() !== userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to cancel this order" },
        { status: 403 }
      );
    }

    // Allow cancel only if status = PENDING
    if (order.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message: `Order cannot be cancelled because it is already in ${order.status} state. Cancellations are only permitted when the order is PENDING.`,
        },
        { status: 400 } // Bad Request
      );
    }

    // Update status safely
    order.status = "CANCELLED";
    await order.save(); // Model hook handles the timestamp update automatically

    // Emit Socket events if socket server is initialized
    if ((global as any).io) {
      const io = (global as any).io;
      const payload = {
        orderId: order._id.toString(),
        status: order.status,
        updatedAt: order.updatedAt
      };

      io.to(`user:${order.user.toString()}`).emit("order_status_update", payload);
      io.to("admin:global").emit("admin_order_update", payload);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order cancelled successfully",
        data: { order },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Customer Order Cancel PATCH Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
