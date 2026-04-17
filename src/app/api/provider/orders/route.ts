import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Restaurant from "@/models/Restaurant";
import User from "@/models/User";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    // Verify provider
    if (!userId || userRole !== UserRole.PROVIDER) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    // Get the provider's restaurant
    const restaurant = await Restaurant.findOne({ owner: userId });

    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: "Restaurant not found for this provider" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * safeLimit;

    // Filter by restaurant
    const query: any = { restaurant: restaurant._id };

    // Filter by status support
    if (status) {
      const allowedStatuses = [
        "PENDING",
        "ACCEPTED",
        "REJECTED",
        "PREPARING",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ];
      if (allowedStatuses.includes(status.toUpperCase())) {
        query.status = status.toUpperCase();
      }
    }

    // Return all orders for that restaurant, paginated and sorted newest first
    const [orders, totalElements] = await Promise.all([
      Order.find(query)
        .populate({
          path: "user",
          model: User,
          select: "name phone email", // Provide helpful customer contact info
        })
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Order.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalElements / safeLimit);

    return NextResponse.json(
      {
        success: true,
        message: "Orders fetched successfully",
        data: {
          orders,
          pagination: {
            page: safePage,
            limit: safeLimit,
            totalElements,
            totalPages,
            hasNext: safePage < totalPages,
            hasPrev: safePage > 1,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Provider Orders GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
