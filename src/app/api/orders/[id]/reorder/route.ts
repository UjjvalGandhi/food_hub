import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Cart from "@/models/Cart";
import MenuItem from "@/models/MenuItem";
import Restaurant from "@/models/Restaurant";
import { UserRole } from "@/constants/roles";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    if (!userId || userRole !== UserRole.CUSTOMER) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    const { id: orderId } = await params;
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const order = await Order.findById(orderId).lean();
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    if (String(order.user) !== userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to reorder this order" },
        { status: 403 }
      );
    }

    const restaurant = await Restaurant.findById(order.restaurant).select(
      "_id isApproved isOpen"
    );
    if (!restaurant || !restaurant.isApproved || !restaurant.isOpen) {
      return NextResponse.json(
        {
          success: false,
          message: "This restaurant is not currently accepting orders.",
        },
        { status: 400 }
      );
    }

    const menuItemIds = order.items.map((item) => item.menuItemId);
    const liveMenuItems = await MenuItem.find({
      _id: { $in: menuItemIds },
      restaurant: restaurant._id,
      isAvailable: true,
    }).select("_id name price");

    const liveMap = new Map(
      liveMenuItems.map((item) => [String(item._id), item])
    );

    const cartItems = order.items.flatMap((item) => {
      const liveItem = liveMap.get(String(item.menuItemId));
      if (!liveItem) return [];

      return [
        {
          menuItem: liveItem._id,
          name: liveItem.name,
          price: liveItem.price,
          quantity: item.quantity,
        },
      ];
    });

    if (cartItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "None of the items from this order are available right now.",
        },
        { status: 400 }
      );
    }

    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          restaurant: restaurant._id,
          items: cartItems,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    await cart.save();

    return NextResponse.json(
      {
        success: true,
        message:
          cartItems.length === order.items.length
            ? "Your previous order has been added to the cart."
            : "Available items from your previous order were added to the cart.",
        data: {
          cart,
          addedItems: cartItems.length,
          requestedItems: order.items.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Order Reorder POST Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
