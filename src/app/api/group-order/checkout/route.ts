import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GroupOrder from "@/models/GroupOrder";
import Order from "@/models/Order";
import Restaurant from "@/models/Restaurant";
import { headers } from "next/headers";
import { UserRole } from "@/constants/roles";
import { deliveryAddressSchema } from "@/schemas/order.schema";
import { serializeGroupOrder } from "@/lib/group-order";

type ConsolidatedOrderItem = {
  menuItemId: unknown;
  name: string;
  price: number;
  quantity: number;
};

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

    const { groupOrderId, inviteCode, paymentMode = "HOST_PAYS", splitType = "BY_ITEM", deliveryAddress } = await req.json();

    if ((!groupOrderId && !inviteCode) || !deliveryAddress) {
      return NextResponse.json(
        { success: false, message: "groupOrderId or inviteCode, and deliveryAddress are required." },
        { status: 400 }
      );
    }

    const parsedAddress = deliveryAddressSchema.safeParse(deliveryAddress);
    if (!parsedAddress.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsedAddress.error.flatten().fieldErrors,
        },
        { status: 422 }
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

    if (String(groupOrder.createdBy) !== userId) {
      return NextResponse.json(
        { success: false, message: "Only the creator can checkout the group order." },
        { status: 403 }
      );
    }

    if (!["OPEN", "COLLECTING"].includes(groupOrder.status)) {
       return NextResponse.json(
        { success: false, message: "Group order is not open or already checked out." },
        { status: 400 }
      );
    }

    const restaurant = await Restaurant.findById(groupOrder.restaurantId).select("_id isApproved isOpen");
    if (!restaurant || !restaurant.isApproved || !restaurant.isOpen) {
      return NextResponse.json(
        { success: false, message: "Restaurant is not available for checkout." },
        { status: 400 }
      );
    }

    if (groupOrder.participants.every((participant) => participant.items.length === 0)) {
      return NextResponse.json(
        { success: false, message: "Add items before checking out the shared cart." },
        { status: 400 }
      );
    }

    groupOrder.status = "CHECKED_OUT";

    const consolidatedItemsMap: Record<string, ConsolidatedOrderItem> = {};
    
    groupOrder.participants.forEach(p => {
        p.items.forEach(item => {
            const key = String(item.menuItemId);
            if (consolidatedItemsMap[key]) {
                 consolidatedItemsMap[key].quantity += item.quantity;
            } else {
                 consolidatedItemsMap[key] = {
                     menuItemId: item.menuItemId,
                     name: item.name,
                     price: item.price,
                     quantity: item.quantity
                 };
            }
        });
    });

    const consolidatedItems = Object.values(consolidatedItemsMap);

    const newOrder = new Order({
        user: userId,
        restaurant: groupOrder.restaurantId,
        items: consolidatedItems,
        totalAmount: groupOrder.totalAmount,
        status: "PENDING",
        deliveryAddress: parsedAddress.data,
        paymentMethod: paymentMode === "HOST_PAYS" ? "ONLINE" : "ONLINE",
        paymentStatus: "PENDING"
    });

    await Promise.all([
        groupOrder.save(),
        newOrder.save()
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Group order checked out successfully",
        data: {
             groupOrder,
             orderId: newOrder._id,
             paymentMode,
             splitType,
             summary: serializeGroupOrder(groupOrder),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("GroupOrder Checkout API Error:", error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
