import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { connectDB } from "@/lib/db";
import { UserRole } from "@/constants/roles";
import Restaurant from "@/models/Restaurant";
import Review from "@/models/Review";

export async function GET() {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    if (!userId || userRole !== UserRole.PROVIDER) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const restaurant = await Restaurant.findOne({ owner: userId }).select("_id name").lean();
    if (!restaurant) {
      return NextResponse.json({ success: false, message: "Restaurant not found for this provider" }, { status: 404 });
    }

    const [reviews, stats] = await Promise.all([
      Review.find({ restaurant: restaurant._id })
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .limit(6)
        .select("rating comment photoUrls providerReply createdAt user")
        .lean(),
      Review.aggregate<{ averageRating: number; lowRatings: number; totalReviews: number }>([
        { $match: { restaurant: restaurant._id } },
        {
          $group: {
            _id: "$restaurant",
            averageRating: { $avg: "$rating" },
            lowRatings: {
              $sum: {
                $cond: [{ $lte: ["$rating", 3] }, 1, 0],
              },
            },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
    ]);

    const aggregate = stats[0];

    return NextResponse.json({
      success: true,
      message: "Provider reviews fetched successfully",
      data: {
        restaurantName: restaurant.name,
        summary: {
          averageRating: aggregate ? Number(aggregate.averageRating.toFixed(1)) : 0,
          lowRatings: aggregate?.lowRatings ?? 0,
          totalReviews: aggregate?.totalReviews ?? 0,
        },
        reviews: reviews.map((review) => ({
          _id: String(review._id),
          rating: review.rating,
          comment: review.comment,
          photoUrls: review.photoUrls || [],
          createdAt: review.createdAt,
          providerReply: review.providerReply
            ? {
                message: review.providerReply.message,
                repliedAt: review.providerReply.repliedAt,
              }
            : null,
          user: {
            name: (review.user as unknown as { name: string }).name,
          },
        })),
      },
    });
  } catch (error) {
    console.error("Provider Reviews GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
