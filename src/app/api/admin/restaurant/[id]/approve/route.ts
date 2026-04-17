import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { headers } from "next/headers";
import { connectDB } from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import User from "@/models/User";
import { UserRole } from "@/constants/roles";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const requestHeaders = await headers();
    const userRole = requestHeaders.get("x-user-role");

    if (userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const { id: restaurantId } = await params;
    if (!restaurantId) {
      return NextResponse.json(
        { success: false, message: "Restaurant ID is required." },
        { status: 400 }
      );
    }

    await connectDB();
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const restaurant = await Restaurant.findById(restaurantId).session(session);
      if (!restaurant) {
        await session.abortTransaction();
        return NextResponse.json(
          { success: false, message: "Restaurant not found." },
          { status: 404 }
        );
      }

      if (restaurant.isApproved) {
        await session.abortTransaction();
        return NextResponse.json(
          { success: false, message: "Restaurant is already approved." },
          { status: 400 }
        );
      }

      const owner = await User.findById(restaurant.owner).session(session);
      if (!owner) {
        await session.abortTransaction();
        return NextResponse.json(
          { success: false, message: "Provider account not found for this restaurant." },
          { status: 404 }
        );
      }

      restaurant.isApproved = true;
      owner.isApproved = true;

      await restaurant.save({ session });
      await owner.save({ session });
      await session.commitTransaction();

      return NextResponse.json({
        success: true,
        message: "Restaurant and provider account approved successfully",
        data: {
          restaurant,
          owner: {
            _id: owner._id,
            isApproved: owner.isApproved,
          },
        },
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error approving restaurant:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}