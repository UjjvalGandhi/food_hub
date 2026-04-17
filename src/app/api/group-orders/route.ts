import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GroupOrder from "@/models/GroupOrder";
import Restaurant from "@/models/Restaurant";
import User from "@/models/User";
import { generateInviteCode } from "@/lib/utils";
import { serializeGroupOrder } from "@/lib/group-order";
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

    const [restaurant, user] = await Promise.all([
      Restaurant.findOne({ _id: restaurantId, isApproved: true, isOpen: true }),
      User.findById(userId).select("name"),
    ]);

    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: "Restaurant is unavailable for group ordering." },
        { status: 404 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    const inviteCode = generateInviteCode();

    const groupOrder = new GroupOrder({
      createdBy: userId,
      restaurantId,
      inviteCode,
      status: "OPEN",
      totalAmount: 0,
      participants: [
        {
          userId: user._id,
          name: user.name,
          items: [],
          subtotal: 0,
          paymentStatus: "PENDING",
        },
      ],
    });

    await groupOrder.save();

    const populated = await GroupOrder.findById(groupOrder._id)
      .populate("restaurantId", "name logo address city rating")
      .populate("createdBy", "name")
      .populate("participants.userId", "name");

    return NextResponse.json(
      {
        success: true,
        message: "Group order created successfully",
        data: {
          groupOrderId: groupOrder._id,
          inviteCode: groupOrder.inviteCode,
          groupOrder: populated ? serializeGroupOrder(populated) : serializeGroupOrder(groupOrder),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[GroupOrder API] POST Error:", error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
