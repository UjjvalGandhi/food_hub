import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import User from "@/models/User";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const headersList = await headers();
    const userRole = headersList.get("x-user-role");

    if (userRole !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query: { isApproved?: boolean } = {};
    if (status === "pending") {
      query.isApproved = false;
    } else if (status === "approved") {
      query.isApproved = true;
    }

    // Populate owner details to show who owns the restaurant
    const restaurants = await Restaurant.find(query)
      .populate({
        path: "owner",
        model: User,
        select: "name email phone isApproved role",
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ restaurants });
  } catch (error) {
    console.error("Admin Restaurants GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
