import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { UserRole } from "@/constants/roles";
import Restaurant from "@/models/Restaurant";

export async function getProviderContext(options?: {
  allowMissingRestaurant?: boolean;
}) {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("x-user-id");
  const userRole = requestHeaders.get("x-user-role");

  if (!userId) {
    return {
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (userRole !== UserRole.PROVIDER) {
    return {
      errorResponse: NextResponse.json(
        { error: "Forbidden. Provider access required." },
        { status: 403 }
      ),
    };
  }

  await connectDB();

  const restaurant = await Restaurant.findOne({ owner: userId });

  if (!restaurant && !options?.allowMissingRestaurant) {
    return {
      errorResponse: NextResponse.json(
        { error: "Restaurant not found. Please create a restaurant first." },
        { status: 404 }
      ),
    };
  }

  return { userId, restaurant };
}