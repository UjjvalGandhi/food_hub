import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Restaurant from "@/models/Restaurant";
import { UserRole } from "@/constants/roles";
import mongoose from "mongoose";

async function toggleFavorite(restaurantId: string, userId: string, add: boolean) {
  const update = add
    ? { $addToSet: { favoriteRestaurants: restaurantId } }
    : { $pull: { favoriteRestaurants: restaurantId } };

  const user = await User.findByIdAndUpdate(userId, update, {
    returnDocument: "after",
  })
    .select("favoriteRestaurants")
    .lean();

  const favoriteRestaurants = Array.isArray(user?.favoriteRestaurants)
    ? user.favoriteRestaurants
    : [];

  return favoriteRestaurants.some((favoriteId) => String(favoriteId) === restaurantId);
}

export async function POST(
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

    const { id: restaurantId } = await params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return NextResponse.json({ success: false, message: "Invalid restaurant." }, { status: 400 });
    }
    await connectDB();

    const restaurant = await Restaurant.findById(restaurantId).select("_id");
    if (!restaurant) {
      return NextResponse.json({ success: false, message: "Restaurant not found." }, { status: 404 });
    }

    const isFavorite = await toggleFavorite(restaurantId, userId, true);

    return NextResponse.json({
      success: true,
      message: "Restaurant added to favorites.",
      data: { isFavorite },
    });
  } catch (error) {
    console.error("Favorite POST Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
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

    const { id: restaurantId } = await params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return NextResponse.json({ success: false, message: "Invalid restaurant." }, { status: 400 });
    }
    await connectDB();

    const isFavorite = await toggleFavorite(restaurantId, userId, false);

    return NextResponse.json({
      success: true,
      message: "Restaurant removed from favorites.",
      data: { isFavorite },
    });
  } catch (error) {
    console.error("Favorite DELETE Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
