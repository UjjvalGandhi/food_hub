import { NextResponse } from "next/server";
import { headers } from "next/headers";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Restaurant from "@/models/Restaurant";
import Review from "@/models/Review";
import DeliveryPartner from "@/models/DeliveryPartner";
import { UserRole } from "@/constants/roles";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    if (!userId || userRole !== UserRole.CUSTOMER) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const { id: orderId } = await params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ success: false, message: "Invalid order ID" }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findOne({ _id: orderId, user: userId })
      .populate({
        path: "restaurant",
        model: Restaurant,
        select: "name logo city address _id",
      })
      .populate({
        path: "deliveryPartner",
        model: DeliveryPartner,
        select: "name phone vehicleType _id",
      })
      .select("-__v")
      .lean();

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const review = await Review.findOne({ order: order._id })
      .select("rating comment photoUrls providerReply createdAt")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Order fetched successfully",
      data: {
        ...order,
        review: review
          ? {
              rating: review.rating,
              comment: review.comment,
              photoUrls: review.photoUrls || [],
              providerReply: review.providerReply
                ? {
                    message: review.providerReply.message,
                    repliedAt: review.providerReply.repliedAt,
                  }
                : null,
              createdAt: review.createdAt,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Customer Order GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
