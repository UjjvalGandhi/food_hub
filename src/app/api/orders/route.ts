import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Cart from "@/models/Cart";
import Restaurant from "@/models/Restaurant";
import MenuItem from "@/models/MenuItem";
import { UserRole } from "@/constants/roles";
import { placeOrderSchema } from "@/schemas/order.schema";
import { headers } from "next/headers";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    // Verify customer
    if (!userId || userRole !== UserRole.CUSTOMER) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = placeOrderSchema.safeParse(body);
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

    const { deliveryAddress } = parsed.data;

    await connectDB();

    // Fetch cart
    const cart = await Cart.findOne({ user: userId });

    // Validate cart not empty
    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cart is empty" },
        { status: 400 }
      );
    }

    // Ensure restaurant still approved / open
    const restaurant = await Restaurant.findById(cart.restaurant);
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: "Restaurant no longer exists" },
        { status: 404 }
      );
    }

    if (!restaurant.isApproved || !restaurant.isOpen) {
      return NextResponse.json(
        { success: false, message: "Restaurant is currently closed or unavailable" },
        { status: 400 }
      );
    }

    // Verify all menu items in the cart are still available and exist
    const menuItemIds = cart.items.map((item: any) => item.menuItem);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });

    // Create a map for quick availability lookup
    const menuItemsMap = new Map(
      menuItems.map((item: any) => [item._id.toString(), item])
    );

    for (const cartItem of cart.items) {
      const liveItem = menuItemsMap.get(cartItem.menuItem.toString());
      
      // Edge Case: Menu item removed after added to cart
      if (!liveItem) {
        return NextResponse.json(
          {
            success: false,
            message: `Item "${cartItem.name}" is no longer available on the menu. Please update your cart.`,
          },
          { status: 400 }
        );
      }

      // Edge Case: Menu item marked as unavailable
      if (!liveItem.isAvailable) {
        return NextResponse.json(
          {
            success: false,
            message: `Item "${cartItem.name}" is currently unavailable. Please remove it from your cart.`,
          },
          { status: 400 }
        );
      }
    }

    // Create order (snapshot everything)
    const newOrder = new Order({
      user: userId,
      restaurant: restaurant._id,
      items: cart.items.map((item: any) => ({
        menuItemId: item.menuItem, // Mapping from Cart's 'menuItem' to Order's 'menuItemId'
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      totalAmount: cart.totalAmount,
      status: "PENDING",
      deliveryAddress: {
        street: deliveryAddress.street,
        city: deliveryAddress.city,
        pincode: deliveryAddress.pincode,
      },
      paymentMethod: parsed.data.paymentMethod || "COD",
      paymentStatus: "PENDING",
    });

    // We can use a MongoDB transaction to ensure the order is created AND the cart is deleted atomically
    const session = await mongoose.startSession();
    session.startTransaction();

    let savedOrder;
    try {
      savedOrder = await newOrder.save({ session });
      
      // Delete cart after successful order creation
      await Cart.findByIdAndDelete(cart._id, { session });
      
      await session.commitTransaction();
    } catch (txnError) {
      await session.abortTransaction();
      throw txnError; 
    } finally {
      session.endSession();
    }

    // Emit Socket events if socket server is initialized
    if ((global as any).io) {
      const io = (global as any).io;
      const payload = {
        orderId: savedOrder._id.toString(),
        restaurantId: restaurant._id.toString(),
        totalAmount: savedOrder.totalAmount,
        createdAt: savedOrder.createdAt
      };

      io.to(`provider:${restaurant._id.toString()}`).emit("new_order", payload);
      io.to("admin:global").emit("admin_new_order", payload);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully",
        data: { order: savedOrder },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create Order POST Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
