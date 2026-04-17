import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import MenuCategory from "@/models/MenuCategory";
import MenuItem from "@/models/MenuItem";
import Review from "@/models/Review";
import User from "@/models/User";
import { headers } from "next/headers";
import mongoose from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const restaurantId = resolvedParams.id;

    if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
      return NextResponse.json({ error: "Invalid Restaurant ID" }, { status: 400 });
    }

    await connectDB();
    const headersList = await headers();
    const userId = headersList.get("x-user-id");

    // 1. Fetch the restaurant (must be approved and open)
    const restaurant = await Restaurant.findOne(
      { _id: restaurantId, isApproved: true },
      // Exclude internal/sensitive data
      { __v: 0, owner: 0, isApproved: 0, createdAt: 0, updatedAt: 0 }
    ).lean();

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found or not available." },
        { status: 404 }
      );
    }

    // 2. Fetch active categories for this restaurant
    const categories = await MenuCategory.find(
      { restaurant: restaurantId, isActive: true },
      { __v: 0, restaurant: 0, isActive: 0, createdAt: 0, updatedAt: 0 } // exclude internals
    )
      .sort({ name: 1 })
      .lean();

    // 3. Fetch menu items for this restaurant so the UI can show sold-out state
    const items = await MenuItem.find(
      { restaurant: restaurantId },
      { __v: 0, restaurant: 0, createdAt: 0, updatedAt: 0 } // exclude internals
    ).lean();

    const [reviews, isFavorite] = await Promise.all([
      Review.find({ restaurant: restaurantId })
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .limit(5)
        .select("rating comment photoUrls providerReply createdAt user")
        .lean(),
      userId
        ? User.exists({ _id: userId, favoriteRestaurants: restaurantId })
        : Promise.resolve(null),
    ]);

    // 4. Group items by category to match the requested structured response
    const groupedCategories = categories.map((cat) => {
      return {
        category: cat,
        items: items.filter(
          (item) => item.category.toString() === cat._id.toString()
        ),
      };
    });

    return NextResponse.json(
      {
        restaurant,
        categories: groupedCategories,
        reviews: reviews.map((review) => {
          const reviewUser = review.user as unknown as {
            _id: mongoose.Types.ObjectId;
            name: string;
          };

          return {
            _id: String(review._id),
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
            user: {
              _id: String(reviewUser._id),
              name: reviewUser.name,
            },
          };
        }),
        isFavorite: Boolean(isFavorite),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching restaurant details:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
