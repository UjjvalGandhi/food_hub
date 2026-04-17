import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Restaurant from "@/models/Restaurant";
import Review from "@/models/Review";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    // Verify customer
    if (!userId || userRole !== UserRole.CUSTOMER) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Limit arbitrary pagination size
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * safeLimit;

    await connectDB();

    // Fetch orders, paginated, sorted by newest
    const [orders, totalElements] = await Promise.all([
      Order.find({ user: userId })
        .populate({
          path: "restaurant",
          model: Restaurant,
          select: "name logo address city _id", // Only basic public restaurant details, no provider info
        })
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Order.countDocuments({ user: userId }),
    ]);

    const reviews = await Review.find({
      order: { $in: orders.map((order) => order._id) },
    })
      .select("order rating comment photoUrls providerReply createdAt")
      .lean();

    const reviewMap = new Map(
      reviews.map((review) => [
        String(review.order),
        {
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
        },
      ])
    );

    const enrichedOrders = orders.map((order) => ({
      ...order,
      review: reviewMap.get(String(order._id)) ?? null,
    }));

    // Construct pagination metadata
    const totalPages = Math.ceil(totalElements / safeLimit);

    return NextResponse.json(
      {
        success: true,
        message: "Orders fetched successfully",
        data: {
          orders: enrichedOrders,
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
  } catch (error) {
    console.error("Customer Orders GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
