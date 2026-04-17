import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { connectDB } from "@/lib/db";
import GroupOrder from "@/models/GroupOrder";
import MenuItem from "@/models/MenuItem";
import User from "@/models/User";
import { UserRole } from "@/constants/roles";
import { serializeGroupOrder } from "@/lib/group-order";

async function loadGroupOrder(code: string) {
  return GroupOrder.findOne({ inviteCode: code })
    .populate("restaurantId", "name logo address city rating")
    .populate("createdBy", "name")
    .populate("participants.userId", "name");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    await connectDB();

    const groupOrder = await loadGroupOrder(code);

    if (!groupOrder) {
      return NextResponse.json(
        { success: false, message: "Group order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeGroupOrder(groupOrder),
    });
  } catch (error) {
    console.error("Group Order GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    if (!userId || userRole !== UserRole.CUSTOMER) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { menuItemId, quantity, action } = await req.json();

    if (!menuItemId || !["ADD", "UPDATE", "REMOVE"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "menuItemId and a valid action are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const [groupOrder, user] = await Promise.all([
      GroupOrder.findOne({ inviteCode: code }),
      User.findById(userId).select("name"),
    ]);

    if (!groupOrder) {
      return NextResponse.json(
        { success: false, message: "Group order not found" },
        { status: 404 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (!["OPEN", "COLLECTING"].includes(groupOrder.status)) {
      return NextResponse.json(
        { success: false, message: "Group order is no longer collecting items" },
        { status: 400 }
      );
    }

    const menuItem = await MenuItem.findOne({
      _id: menuItemId,
      restaurant: groupOrder.restaurantId,
      isAvailable: true,
    }).select("name price");

    if (!menuItem) {
      return NextResponse.json(
        { success: false, message: "This menu item is unavailable." },
        { status: 404 }
      );
    }

    let participant = groupOrder.participants.find(
      (entry) => String(entry.userId) === userId
    );

    if (!participant) {
      groupOrder.participants.push({
        userId: userId as never,
        name: user.name,
        items: [],
        subtotal: 0,
        paymentStatus: "PENDING",
      });
      participant = groupOrder.participants[groupOrder.participants.length - 1];
    }

    const safeQuantity = Math.max(0, Number(quantity ?? 1));
    const existingItemIndex = participant.items.findIndex(
      (item) => String(item.menuItemId) === menuItemId
    );

    if (action === "ADD") {
      if (existingItemIndex > -1) {
        participant.items[existingItemIndex].quantity += Math.max(1, safeQuantity);
        participant.items[existingItemIndex].price = menuItem.price;
        participant.items[existingItemIndex].name = menuItem.name;
      } else {
        participant.items.push({
          menuItemId: menuItem._id as never,
          name: menuItem.name,
          price: menuItem.price,
          quantity: Math.max(1, safeQuantity),
        });
      }
    }

    if (action === "UPDATE") {
      if (existingItemIndex === -1) {
        return NextResponse.json(
          { success: false, message: "Item not found in your shared cart." },
          { status: 404 }
        );
      }

      if (safeQuantity === 0) {
        participant.items.splice(existingItemIndex, 1);
      } else {
        participant.items[existingItemIndex].quantity = safeQuantity;
        participant.items[existingItemIndex].price = menuItem.price;
        participant.items[existingItemIndex].name = menuItem.name;
      }
    }

    if (action === "REMOVE" && existingItemIndex > -1) {
      participant.items.splice(existingItemIndex, 1);
    }

    groupOrder.status = "OPEN";
    await groupOrder.save();

    const populatedOrder = await loadGroupOrder(code);
    const serialized = populatedOrder
      ? serializeGroupOrder(populatedOrder)
      : serializeGroupOrder(groupOrder);

    if (globalThis.__socketIoServer__) {
      globalThis.__socketIoServer__
        .to(`groupOrder:${groupOrder._id}`)
        .emit(`group-order-updated:${groupOrder._id}`, serialized);
    }

    return NextResponse.json({
      success: true,
      message: "Group order updated",
      data: serialized,
    });
  } catch (error) {
    console.error("Group Order PATCH Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
