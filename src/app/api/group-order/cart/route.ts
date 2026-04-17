import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GroupOrder from "@/models/GroupOrder";
import { serializeGroupOrder } from "@/lib/group-order";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const groupOrderId = searchParams.get("groupOrderId");

    if (!groupOrderId) {
      return NextResponse.json(
        { success: false, message: "groupOrderId is required." },
        { status: 400 }
      );
    }

    await connectDB();

    const groupOrder = await GroupOrder.findById(groupOrderId)
        .populate("restaurantId", "name address")
        .populate("createdBy", "name email");

    if (!groupOrder) {
      return NextResponse.json(
        { success: false, message: "Group order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: serializeGroupOrder(groupOrder),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("GroupOrder Cart API Error:", error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
