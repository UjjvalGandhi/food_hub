import { NextResponse } from "next/server";
import { headers } from "next/headers";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Review from "@/models/Review";
import Restaurant from "@/models/Restaurant";
import { UserRole } from "@/constants/roles";

async function refreshRestaurantRating(restaurantId: string) {
  const stats = await Review.aggregate<{ averageRating: number; totalReviews: number }>([
    { $match: { restaurant: new mongoose.Types.ObjectId(restaurantId) } },
    {
      $group: {
        _id: "$restaurant",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const aggregate = stats[0];

  await Restaurant.findByIdAndUpdate(restaurantId, {
    $set: {
      rating: aggregate ? Number(aggregate.averageRating.toFixed(1)) : 0,
      totalReviews: aggregate?.totalReviews ?? 0,
    },
  });
}

export async function POST(
  req: Request,
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
    const body = await req.json();
    const rating = Number(body.rating);
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";
    const photoUrls = Array.isArray(body.photoUrls)
      ? body.photoUrls
          .filter((value: unknown): value is string => typeof value === "string")
          .map((value: string) => value.trim())
          .filter(Boolean)
          .slice(0, 3)
      : [];

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: "Rating must be between 1 and 5." },
        { status: 400 }
      );
    }

    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }

    if (String(order.user) !== userId) {
      return NextResponse.json(
        { success: false, message: "You cannot review this order." },
        { status: 403 }
      );
    }

    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { success: false, message: "You can only review delivered orders." },
        { status: 400 }
      );
    }

    const review = await Review.findOneAndUpdate(
      { order: order._id },
      {
        $set: {
          user: order.user,
          restaurant: order.restaurant,
          order: order._id,
          rating,
          comment,
          photoUrls,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    await refreshRestaurantRating(order.restaurant.toString());

    return NextResponse.json(
      {
        success: true,
        message: "Thanks for rating your order.",
        data: {
          review: {
            rating: review.rating,
            comment: review.comment,
            photoUrls: review.photoUrls || [],
            providerReply: review.providerReply
              ? {
                  message: review.providerReply.message,
                  repliedAt: review.providerReply.repliedAt,
                }
              : null,
            createdAt: review.updatedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Order Review POST Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
