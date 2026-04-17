import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GroupOrder from "@/models/GroupOrder";
import User from "@/models/User";
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

    const { groupOrderId, inviteCode } = await req.json();
    if (!groupOrderId && !inviteCode) {
      return NextResponse.json(
        { success: false, message: "groupOrderId or inviteCode is required." },
        { status: 400 }
      );
    }

    await connectDB();

    const groupOrder = groupOrderId
      ? await GroupOrder.findById(groupOrderId)
      : await GroupOrder.findOne({ inviteCode });

    if (!groupOrder) {
      return NextResponse.json(
        { success: false, message: "Group order not found." },
        { status: 404 }
      );
    }

    if (!["OPEN", "COLLECTING"].includes(groupOrder.status)) {
       return NextResponse.json(
        { success: false, message: "Group order is not open for joining." },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
        return NextResponse.json(
            { success: false, message: "User not found." },
            { status: 404 }
        );
    }

    const isExistingParticipant = groupOrder.participants.some(
        (p) => String(p.userId) === userId
    );

    if (isExistingParticipant) {
        const populatedGroupOrder = await GroupOrder.findById(groupOrder._id)
          .populate("restaurantId", "name logo address city rating")
          .populate("createdBy", "name")
          .populate("participants.userId", "name");

        return NextResponse.json(
            {
              success: true,
              message: "Already joined",
              data: populatedGroupOrder ? serializeGroupOrder(populatedGroupOrder) : serializeGroupOrder(groupOrder),
            }
        );
    }

    groupOrder.participants.push({
        userId: user._id,
        name: user.name,
        items: [],
        subtotal: 0,
        paymentStatus: "PENDING"
    });

    await groupOrder.save();

    const populatedGroupOrder = await GroupOrder.findById(groupOrder._id)
      .populate("restaurantId", "name logo address city rating")
      .populate("createdBy", "name")
      .populate("participants.userId", "name");

    return NextResponse.json(
      {
        success: true,
        message: "Successfully joined group order",
        data: populatedGroupOrder ? serializeGroupOrder(populatedGroupOrder) : serializeGroupOrder(groupOrder),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("GroupOrder Join API Error:", error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
