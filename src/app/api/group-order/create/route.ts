import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GroupOrder from "@/models/GroupOrder";
import User from "@/models/User";
import { headers } from "next/headers";
import { UserRole } from "@/constants/roles";

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    if (!userId || userRole !== UserRole.CUSTOMER) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in as a customer." },
        { status: 403 }
      );
    }

    const { restaurantId } = await req.json();
    if (!restaurantId) {
      return NextResponse.json(
        { success: false, message: "Restaurant ID is required." },
        { status: 400 }
      );
    }

    await connectDB();
    
    const user = await User.findById(userId);
    if (!user) {
        return NextResponse.json(
            { success: false, message: "User not found." },
            { status: 404 }
        );
    }

    const groupOrder = new GroupOrder({
      createdBy: userId,
      restaurantId: restaurantId,
      status: "OPEN",
      participants: [{
          userId: userId,
          name: user.name,
          items: [],
          subtotal: 0,
          paymentStatus: "PENDING"
      }],
      cartItems: [],
      totalAmount: 0,
    });

    await groupOrder.save();

    return NextResponse.json(
      {
        success: true,
        message: "Group order created successfully",
        data: groupOrder,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("GroupOrder Create API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
