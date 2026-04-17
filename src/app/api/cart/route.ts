import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Cart from "@/models/Cart";
import Restaurant from "@/models/Restaurant";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    if (!userId || userRole !== UserRole.CUSTOMER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    // Find the cart and populate basic restaurant info
    // We select only needed fields and exclude internals like __v
    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: "restaurant",
        model: Restaurant,
        select: "name logo address city isOpen isApproved _id",
      })
      .select("-__v -createdAt -updatedAt")
      .lean();

    if (!cart) {
      // Return empty cart structure instead of 404 to indicate they just don't have items
      return NextResponse.json(
        { message: "Cart is empty", cart: null },
        { status: 200 }
      );
    }

    // You might also want to prune __v and other fields from items
    const sanitizedCart = {
      ...cart,
      items: cart.items.map((item: any) => ({
        menuItem: item.menuItem,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    };

    return NextResponse.json({ cart: sanitizedCart }, { status: 200 });
  } catch (error: any) {
    console.error("Cart GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
