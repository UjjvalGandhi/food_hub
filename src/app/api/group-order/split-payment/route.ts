import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GroupOrder from "@/models/GroupOrder";

type SplitSummary = {
  userId: unknown;
  name: string;
  amountOwed: number;
  originalSubtotal: number;
};

export async function POST(req: Request) {
  try {
    const { groupOrderId, inviteCode, splitType } = await req.json();

    if ((!groupOrderId && !inviteCode) || !splitType) {
      return NextResponse.json(
        { success: false, message: "groupOrderId or inviteCode, and splitType are required." },
        { status: 400 }
      );
    }

    if (!["EQUAL", "BY_ITEM"].includes(splitType)) {
         return NextResponse.json(
        { success: false, message: "splitType must be EQUAL or BY_ITEM." },
        { status: 400 }
      );
    }

    await connectDB();

    const groupOrder = groupOrderId
      ? await GroupOrder.findById(groupOrderId).populate("participants.userId", "name")
      : await GroupOrder.findOne({ inviteCode }).populate("participants.userId", "name");
    
    if (!groupOrder) {
      return NextResponse.json(
        { success: false, message: "Group order not found." },
        { status: 404 }
      );
    }

    // Explicitly run save to ensure subtotals and totalAmount are up to date
    // before calculating
    await groupOrder.save();
    
    const participantCount = groupOrder.participants.length;
    if (participantCount === 0) {
      return NextResponse.json(
        { success: false, message: "No participants found for this group order." },
        { status: 400 }
      );
    }

    let splitSummary: SplitSummary[] = [];

    if (splitType === "EQUAL") {
       const equalShare = Number((groupOrder.totalAmount / participantCount).toFixed(2));
       splitSummary = groupOrder.participants.map(p => ({
           userId: p.userId,
           name: p.name,
           amountOwed: equalShare,
           originalSubtotal: p.subtotal
       }));
    } else if (splitType === "BY_ITEM") {
        splitSummary = groupOrder.participants.map(p => ({
           userId: p.userId,
           name: p.name,
           amountOwed: p.subtotal,
           originalSubtotal: p.subtotal
       }));
    }

    return NextResponse.json(
      {
        success: true,
        data: {
            totalAmount: groupOrder.totalAmount,
            splitType,
            participantCount,
            splits: splitSummary
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("GroupOrder Split Payment API Error:", error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
