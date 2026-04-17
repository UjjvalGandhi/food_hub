import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";

export async function GET() {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    // Verify admin
    if (!userId || userRole !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    // Aggregate counts based on order statuses
    const stats = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Format results to 0 defaults
    let pending = 0;
    let preparing = 0;
    let active = 0;

    stats.forEach((stat) => {
      const status = stat._id;
      const count = stat.count;

      if (status === "PENDING") pending += count;
      if (status === "PREPARING") preparing += count;
      
      // Active states
      if (["PENDING", "ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY"].includes(status)) {
        active += count;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        active,
        pending,
        preparing,
      },
    });
  } catch (error: any) {
    console.error("Admin Order Stats Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
