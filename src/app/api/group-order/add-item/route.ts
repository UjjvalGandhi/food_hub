import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GroupOrder from "@/models/GroupOrder";
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

    const { groupOrderId, menuItemId, name, price, quantity, action } = await req.json();

    if (!groupOrderId || !menuItemId || !action) {
      return NextResponse.json(
        { success: false, message: "groupOrderId, menuItemId, and action are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const groupOrder = await GroupOrder.findById(groupOrderId);
    if (!groupOrder) {
      return NextResponse.json(
        { success: false, message: "Group order not found." },
        { status: 404 }
      );
    }

    if (groupOrder.status !== "OPEN") {
       return NextResponse.json(
        { success: false, message: "Group order is no longer open for modifications." },
        { status: 400 }
      );
    }

    const participantIndex = groupOrder.participants.findIndex(
        (p) => String(p.userId) === userId
    );

    if (participantIndex === -1) {
         return NextResponse.json(
        { success: false, message: "You are not a participant in this group order." },
        { status: 403 }
      );
    }

    const participant = groupOrder.participants[participantIndex];

    if (action === "ADD") {
        const existingItemIndex = participant.items.findIndex(
            (item) => String(item.menuItemId) === menuItemId
        );

        if (existingItemIndex > -1) {
            participant.items[existingItemIndex].quantity += (quantity || 1);
        } else {
            participant.items.push({
                menuItemId: menuItemId as any,
                name,
                price,
                quantity: quantity || 1
            });
        }
    } else if (action === "UPDATE") {
         const existingItemIndex = participant.items.findIndex(
            (item) => String(item.menuItemId) === menuItemId
        );

        if (existingItemIndex > -1) {
            if (quantity <= 0) {
                 participant.items.splice(existingItemIndex, 1);
            } else {
                 participant.items[existingItemIndex].quantity = quantity;
            }
        } else {
            return NextResponse.json(
                { success: false, message: "Item not found in your cart." },
                { status: 404 }
            );
        }
    } else if (action === "REMOVE") {
         participant.items = participant.items.filter(
            (item) => String(item.menuItemId) !== menuItemId
        );
    }

    await groupOrder.save();

    return NextResponse.json(
      {
        success: true,
        message: "Group order cart updated",
        data: groupOrder,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GroupOrder Add/Update Item API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
