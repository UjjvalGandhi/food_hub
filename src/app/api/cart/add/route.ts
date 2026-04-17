import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Cart from "@/models/Cart";
import MenuItem from "@/models/MenuItem";
import Restaurant from "@/models/Restaurant";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    if (!userId || userRole !== UserRole.CUSTOMER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { menuItemId, quantity } = body;

    if (!menuItemId || typeof quantity !== "number" || quantity < 1) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    await connectDB();

    // Fetch menu item
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    if (!menuItem.isAvailable) {
      return NextResponse.json(
        { error: "Menu item is currently unavailable" },
        { status: 400 }
      );
    }

    // Fetch restaurant to check approval status
    const restaurant = await Restaurant.findById(menuItem.restaurant);
    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    if (!restaurant.isApproved || !restaurant.isOpen) {
      return NextResponse.json(
        { error: "Restaurant is not available for orders" },
        { status: 400 }
      );
    }

    // Find the user's cart
    let cart = await Cart.findOne({ user: userId });

    if (cart) {
      // Check if trying to add from a different restaurant
      // We assume cart.restaurant contains the ObjectId of the restaurant
      if (cart.restaurant.toString() !== restaurant._id.toString()) {
        if (cart.items.length > 0) {
          return NextResponse.json(
            { error: "Cannot add items from a different restaurant. Please clear your cart first." },
            { status: 409 } // Conflict
          );
        } else {
          // If cart is completely empty, it shouldn't hold on to the old restaurant ID
          cart.restaurant = restaurant._id as mongoose.Types.ObjectId;
        }
      }

      // Check if item already exists in the cart
      const existingItemIndex = cart.items.findIndex(
        (item) => item.menuItem.toString() === menuItemId
      );

      if (existingItemIndex > -1) {
        // Update quantity
        cart.items[existingItemIndex].quantity += quantity;
        
        // Use the snapshot approach: always update to the latest name and price
        cart.items[existingItemIndex].price = menuItem.price;
        cart.items[existingItemIndex].name = menuItem.name;
      } else {
        // Add new item to existing cart
        cart.items.push({
          menuItem: menuItem._id as mongoose.Types.ObjectId,
          name: menuItem.name,
          price: menuItem.price,
          quantity,
        });
      }
    } else {
      // Create a brand new cart for the user
      cart = new Cart({
        user: userId,
        restaurant: restaurant._id,
        items: [
          {
            menuItem: menuItem._id,
            name: menuItem.name,
            price: menuItem.price,
            quantity,
          },
        ],
      });
    }

    // The pre-save hook in Cart.ts will automatically calculate totalAmount
    await cart.save();

    return NextResponse.json(
      { message: "Item added to cart", cart },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Add to cart POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
