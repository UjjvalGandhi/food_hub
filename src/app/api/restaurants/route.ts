import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import User from "@/models/User";
import { headers } from "next/headers";

export async function GET(request: Request) {
  try {
    await connectDB();
    const headersList = await headers();
    const userId = headersList.get("x-user-id");

    const { searchParams } = new URL(request.url);

    // 1. Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    // 2. Build the query object
    // Mandatory constraints for public viewing:
    const query: Record<string, unknown> = {
      isApproved: true,
      isOpen: true,
    };
    const favoritesOnly = searchParams.get("favoritesOnly") === "1";

    // 3. Optional filters
    const city = searchParams.get("city");
    if (city) {
      // Case-insensitive exact match or partial match depending on preference.
      // Using regex for flexibility in case of varying input cases (e.g. "new york" vs "New York")
      query.city = { $regex: new RegExp(city, "i") };
    }

    const search = searchParams.get("search");
    if (search) {
      // Search by restaurant name
      query.name = { $regex: new RegExp(search, "i") };
    }

    if (favoritesOnly && userId) {
      const user = await User.findById(userId).select("favoriteRestaurants").lean();
      const favoriteRestaurantIds = (user?.favoriteRestaurants || []).map((favoriteId) => String(favoriteId));
      query._id = { $in: favoriteRestaurantIds };
    }

    // 4. Execute query with projection to exclude internal fields
    // Exclude __v, owner (internal linking), isApproved (implied true), createdAt, updatedAt
    const projection = {
      __v: 0,
      owner: 0,
      isApproved: 0,
      createdAt: 0,
      updatedAt: 0,
    };

    const [restaurants, total, userWithFavorites] = await Promise.all([
      Restaurant.find(query, projection)
        .sort({ rating: -1, totalReviews: -1 }) // Sort by highest rated first
        .skip(skip)
        .limit(limit)
        .lean(), // Convert to plain JS objects for performance
      Restaurant.countDocuments(query),
      userId ? User.findById(userId).select("favoriteRestaurants").lean() : Promise.resolve(null),
    ]);

    const favoritesSet = new Set(
      (userWithFavorites?.favoriteRestaurants || []).map((favoriteId) => String(favoriteId))
    );
    const enrichedRestaurants = restaurants.map((restaurant) => ({
      ...restaurant,
      isFavorite: favoritesSet.has(String(restaurant._id)),
    }));

    // 5. Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json(
      {
        data: enrichedRestaurants,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching public restaurants:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export { POST } from "../provider/restaurant/route";
