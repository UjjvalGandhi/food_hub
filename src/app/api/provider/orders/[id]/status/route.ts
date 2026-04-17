import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order, { OrderStatus } from "@/models/Order";
import Restaurant from "@/models/Restaurant";
import DeliveryPartner from "@/models/DeliveryPartner";
import { UserRole } from "@/constants/roles";
import { updateOrderStatusSchema } from "@/schemas/order.schema";
import { headers } from "next/headers";

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["PREPARING"],
  PREPARING: ["READY_FOR_PICKUP"],
  READY_FOR_PICKUP: ["PICKED_UP"],
  PICKED_UP: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  REJECTED: [], // Terminal state
  DELIVERED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

function getSocketServer() {
  return globalThis.__socketIoServer__ || (global as { io?: typeof globalThis.__socketIoServer__ }).io;
}

async function emitOrderStatusUpdate(
  order: { _id: { toString(): string }; user: { toString(): string }; status: OrderStatus; updatedAt: Date | string }
) {
  const io = getSocketServer();
  if (!io) return;

  const payload = {
    orderId: order._id.toString(),
    status: order.status,
    updatedAt: typeof order.updatedAt === "string" ? order.updatedAt : order.updatedAt.toISOString(),
  };

  io.to(`user:${order.user.toString()}`).emit("order_status_update", payload);
  io.to("admin:global").emit("admin_order_update", payload);
}

async function autoAssignDeliveryPartner(orderId: string) {
  const availablePartner = await DeliveryPartner.findOne({ availability: "AVAILABLE" }).select("_id").lean();
  if (!availablePartner) return null;

  await Order.findByIdAndUpdate(orderId, {
    $set: { deliveryPartner: availablePartner._id },
  });

  await DeliveryPartner.findByIdAndUpdate(availablePartner._id, {
    $addToSet: { assignedOrders: orderId },
    $set: { availability: "BUSY" },
  });

  return availablePartner._id.toString();
}

function scheduleAutoDelivery(orderId: string) {
  const steps: Array<{ delayMs: number; from: OrderStatus; to: OrderStatus }> = [
    { delayMs: 4000, from: "READY_FOR_PICKUP", to: "PICKED_UP" },
    { delayMs: 9000, from: "PICKED_UP", to: "OUT_FOR_DELIVERY" },
    { delayMs: 15000, from: "OUT_FOR_DELIVERY", to: "DELIVERED" },
  ];

  for (const step of steps) {
    setTimeout(async () => {
      try {
        await connectDB();
        const order = await Order.findById(orderId);
        if (!order || order.status !== step.from) return;

        order.status = step.to;
        await order.save();

        if (step.to === "DELIVERED" && order.deliveryPartner) {
          await DeliveryPartner.findByIdAndUpdate(order.deliveryPartner, {
            $set: { availability: "AVAILABLE" },
          });
        }

        await emitOrderStatusUpdate(order);
      } catch (error) {
        console.error(`[Auto Delivery] Failed to progress ${orderId} to ${step.to}:`, error);
      }
    }, step.delayMs);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    // Verify provider role
    if (!userId || userRole !== UserRole.PROVIDER) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const { id: orderId } = await params;
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = updateOrderStatusSchema.safeParse(body);
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

    const { status } = parsed.data;

    await connectDB();

    // Ensure the provider owns a restaurant
    const restaurant = await Restaurant.findOne({ owner: userId });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: "Restaurant not found for this provider" },
        { status: 404 }
      );
    }

    // Fetch the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    // Ensure order belongs to the provider's restaurant
    if (order.restaurant.toString() !== restaurant._id.toString()) {
      return NextResponse.json(
        { success: false, message: "Order does not belong to your restaurant" },
        { status: 403 }
      );
    }

    const currentStatus = order.status as OrderStatus;
    const requestedStatus = status.toUpperCase() as OrderStatus;

    // Reject invalid transitions based on current state
    const validNextStates = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!validNextStates.includes(requestedStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid status transition from ${currentStatus} to ${requestedStatus}. Allowed transitions are: ${
            validNextStates.length > 0 ? validNextStates.join(", ") : "None (Terminal State)"
          }`,
        },
        { status: 400 }
      );
    }

    // Update status safely (immutability hook will permit this check since only status is changing)
    order.status = requestedStatus;
    await order.save();

    const io = getSocketServer();
    await emitOrderStatusUpdate(order);

    if (io && order.status === "READY_FOR_PICKUP") {
      io.to("delivery:partners").emit("new_delivery_available", {
        orderId: order._id.toString(),
        restaurantName: restaurant.name,
        address: order.deliveryAddress,
      });
    }

    if (order.status === "READY_FOR_PICKUP") {
      await autoAssignDeliveryPartner(order._id.toString());
      scheduleAutoDelivery(order._id.toString());
    }

    return NextResponse.json(
      {
        success: true,
        message:
          order.status === "READY_FOR_PICKUP"
            ? "Order marked ready. Auto-delivery flow started."
            : "Order status updated successfully",
        data: { order },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Provider Order Status PATCH Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
