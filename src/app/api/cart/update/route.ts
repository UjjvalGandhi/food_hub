import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Cart from "@/models/Cart";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";

export async function PATCH(req: Request) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    if (!userId || userRole !== UserRole.CUSTOMER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { menuItemId, quantity } = body;

    if (!menuItemId || typeof quantity !== "number" || quantity < 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    await connectDB();

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.menuItem.toString() === menuItemId
    );

    if (itemIndex === -1) {
      return NextResponse.json({ error: "Item not found in cart" }, { status: 404 });
    }

    if (quantity === 0) {
      // Remove item if quantity is zero
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    }

    // If cart is empty, delete it
    if (cart.items.length === 0) {
      await Cart.findByIdAndDelete(cart._id);
      return NextResponse.json({ message: "Cart deleted", cart: null }, { status: 200 });
    }

    // Save will trigger the pre-save hook to recalculate totalAmount
    await cart.save();

    return NextResponse.json({ message: "Cart updated", cart }, { status: 200 });
  } catch (error: any) {
    console.error("Cart update PATCH Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
