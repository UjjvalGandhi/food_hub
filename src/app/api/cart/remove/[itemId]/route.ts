import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Cart from "@/models/Cart";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    if (!userId || userRole !== UserRole.CUSTOMER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { itemId } = await params;

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    await connectDB();

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.menuItem.toString() === itemId
    );

    if (itemIndex === -1) {
      return NextResponse.json({ error: "Item not found in cart" }, { status: 404 });
    }

    // Remove the item
    cart.items.splice(itemIndex, 1);

    // If cart is empty, delete it completely
    if (cart.items.length === 0) {
      await Cart.findByIdAndDelete(cart._id);
      return NextResponse.json({ message: "Cart deleted", cart: null }, { status: 200 });
    }

    // Save will trigger the pre-save hook to recalculate totalAmount
    await cart.save();

    return NextResponse.json({ message: "Item removed from cart", cart }, { status: 200 });
  } catch (error: any) {
    console.error("Cart remove DELETE Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
