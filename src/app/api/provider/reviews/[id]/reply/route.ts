import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { connectDB } from "@/lib/db";
import { UserRole } from "@/constants/roles";
import Restaurant from "@/models/Restaurant";
import Review from "@/models/Review";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    if (!userId || userRole !== UserRole.PROVIDER) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const { id: reviewId } = await params;
    const body = await req.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json({ success: false, message: "Reply message is required." }, { status: 400 });
    }

    await connectDB();

    const restaurant = await Restaurant.findOne({ owner: userId }).select("_id").lean();
    if (!restaurant) {
      return NextResponse.json({ success: false, message: "Restaurant not found for this provider" }, { status: 404 });
    }

    const review = await Review.findOneAndUpdate(
      { _id: reviewId, restaurant: restaurant._id },
      {
        $set: {
          providerReply: {
            message,
            repliedAt: new Date(),
          },
        },
      },
      { returnDocument: "after", runValidators: true }
    );

    if (!review) {
      return NextResponse.json({ success: false, message: "Review not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Reply posted successfully.",
      data: {
        providerReply: {
          message: review.providerReply?.message,
          repliedAt: review.providerReply?.repliedAt,
        },
      },
    });
  } catch (error) {
    console.error("Provider Review Reply POST Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
