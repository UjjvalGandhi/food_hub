import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { connectDB } from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import User from "@/models/User";
import { UserRole } from "@/constants/roles";

export async function POST() {
  try {
    const requestHeaders = await headers();
    const userRole = requestHeaders.get("x-user-role");

    if (userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    await connectDB();

    const approvedRestaurants = await Restaurant.find({ isApproved: true })
      .select("owner")
      .lean();

    const validProviderIds = approvedRestaurants.flatMap((restaurant) =>
      restaurant.owner ? [String(restaurant.owner)] : []
    );

    const providerIds = Array.from(
      new Set(validProviderIds)
    );

    const skippedRestaurants = approvedRestaurants.length - validProviderIds.length;

    if (providerIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No approved restaurants found to sync.",
        data: {
          approvedRestaurants: 0,
          providersSynced: 0,
          skippedRestaurants,
        },
      });
    }

    const syncResult = await User.updateMany(
      {
        _id: { $in: providerIds },
        role: UserRole.PROVIDER,
        isApproved: false,
      },
      {
        $set: { isApproved: true },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Provider approval states synchronized successfully.",
      data: {
        approvedRestaurants: approvedRestaurants.length,
        providersSynced: syncResult.modifiedCount,
        skippedRestaurants,
      },
    });
  } catch (error) {
    console.error("Provider approval sync POST Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
