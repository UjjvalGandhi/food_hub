import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { UserRole } from "@/constants/roles";
import Order from "@/models/Order";
import Restaurant from "@/models/Restaurant";
import MenuItem from "@/models/MenuItem";
import DeliveryPartner from "@/models/DeliveryPartner";
import Review from "@/models/Review";

type InsightTone = "info" | "success" | "warning";

type Insight = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  tone: InsightTone;
};

async function resolveAuth(req: NextRequest) {
  const headerBag = await headers();
  const forwardedUserId = headerBag.get("x-user-id");
  const forwardedRole = headerBag.get("x-user-role") as UserRole | null;

  if (forwardedUserId && forwardedRole) {
    return { userId: forwardedUserId, role: forwardedRole };
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  if (!token) return null;

  const result = await verifyToken(token);
  if (!result.success) return null;

  return {
    userId: result.payload.userId,
    role: result.payload.role,
  };
}

function createInsight(
  id: string,
  title: string,
  description: string,
  actionLabel: string,
  href: string,
  tone: InsightTone
): Insight {
  return { id, title, description, actionLabel, href, tone };
}

async function buildAdminInsights() {
  const [pendingCount, activeCount, deliveredToday] = await Promise.all([
    Order.countDocuments({ status: "PENDING" }),
    Order.countDocuments({
      status: { $in: ["PENDING", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "PICKED_UP", "OUT_FOR_DELIVERY"] },
    }),
    Order.countDocuments({
      status: "DELIVERED",
      updatedAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    }),
  ]);

  return [
    pendingCount > 0
      ? createInsight(
          "admin-pending",
          "Restaurants need approval attention",
          `${pendingCount} orders are still waiting for provider action. A quick check can reduce customer wait time.`,
          "Review live activity",
          "/admin",
          "warning"
        )
      : createInsight(
          "admin-flow",
          "Marketplace flow looks healthy",
          "No pending bottlenecks right now. This is a good time to review growth and onboarding opportunities.",
          "Open overview",
          "/admin",
          "success"
        ),
    activeCount >= 10
      ? createInsight(
          "admin-load",
          "Peak traffic is active",
          `${activeCount} orders are moving through the system right now. Consider checking delivery capacity and provider responsiveness.`,
          "Check operations",
          "/admin/delivery-partners",
          "info"
        )
      : createInsight(
          "admin-growth",
          "Room to grow today's demand",
          `Only ${activeCount} active orders are in progress. Promoting top restaurants could lift marketplace activity.`,
          "Review restaurants",
          "/admin/restaurants",
          "info"
        ),
    createInsight(
      "admin-delivered",
      "Delivery momentum snapshot",
      `${deliveredToday} orders were delivered in the last 24 hours. That is a good baseline for measuring daily platform health.`,
      "Stay on dashboard",
      "/admin",
      deliveredToday > 0 ? "success" : "info"
    ),
  ];
}

async function buildProviderInsights(userId: string) {
  const restaurant = await Restaurant.findOne({ owner: userId }).select("_id rating totalReviews").lean();

  if (!restaurant) {
    return [
      createInsight(
        "provider-setup",
        "Finish restaurant setup",
        "Your dashboard is ready, but your restaurant profile needs attention before you can fully operate.",
        "Open restaurant profile",
        "/provider/restaurant",
        "warning"
      ),
    ];
  }

  const [pendingOrders, preparingOrders, menuItems, availableItems, recentReviews] = await Promise.all([
    Order.countDocuments({ restaurant: restaurant._id, status: "PENDING" }),
    Order.countDocuments({ restaurant: restaurant._id, status: "PREPARING" }),
    MenuItem.countDocuments({ restaurant: restaurant._id }),
    MenuItem.countDocuments({ restaurant: restaurant._id, isAvailable: true }),
    Review.find({ restaurant: restaurant._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("rating")
      .lean(),
  ]);

  const lowRatings = recentReviews.filter((review) => review.rating <= 3).length;

  return [
    pendingOrders > 0
      ? createInsight(
          "provider-pending",
          "New orders are waiting",
          `${pendingOrders} incoming orders still need action. Fast acceptance usually improves conversion and customer trust.`,
          "Open live orders",
          "/provider/orders",
          "warning"
        )
      : createInsight(
          "provider-orders",
          "Order queue is under control",
          "No pending orders right now. This is a good time to refine menu quality or update availability.",
          "Manage menu",
          "/provider/menu",
          "success"
        ),
    availableItems === 0 || menuItems === 0
      ? createInsight(
          "provider-menu",
          "Menu needs more active items",
          "Customers convert better when they see a complete, available menu. Add or re-enable dishes to improve ordering chances.",
          "Update menu",
          "/provider/menu",
          "warning"
        )
      : createInsight(
          "provider-stock",
          "Menu availability looks decent",
          `${availableItems} of ${menuItems} menu items are currently available for ordering.`,
          "View menu",
          "/provider/menu",
          "info"
        ),
    lowRatings > 1
      ? createInsight(
          "provider-reviews",
          "Recent reviews need attention",
          `${lowRatings} recent reviews were 3 stars or below. You may want to check prep quality, packaging, or delivery timing.`,
          "Review restaurant profile",
          "/provider/restaurant",
          "warning"
        )
      : createInsight(
          "provider-prep",
          "Kitchen pace snapshot",
          `${preparingOrders} orders are currently being prepared. Keep best-selling items ready during rush windows.`,
          "See live orders",
          "/provider/orders",
          "info"
        ),
  ];
}

async function buildDeliveryInsights(userId: string) {
  const partner = await DeliveryPartner.findOne({ user: userId }).select("_id availability").lean();

  if (!partner) {
    return [
      createInsight(
        "delivery-profile",
        "Complete your delivery profile",
        "Your rider profile is missing, so orders cannot be assigned yet.",
        "Register as delivery partner",
        "/delivery/register",
        "warning"
      ),
    ];
  }

  const [activeDeliveries, completedToday, pickupReadyOrders] = await Promise.all([
    Order.countDocuments({
      deliveryPartner: partner._id,
      status: { $in: ["PICKED_UP", "OUT_FOR_DELIVERY", "READY_FOR_PICKUP"] },
    }),
    Order.countDocuments({
      deliveryPartner: partner._id,
      status: "DELIVERED",
      updatedAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    }),
    Order.countDocuments({
      status: "READY_FOR_PICKUP",
      deliveryPartner: { $exists: false },
    }),
  ]);

  return [
    activeDeliveries > 0
      ? createInsight(
          "delivery-active",
          "Stay focused on current deliveries",
          `You have ${activeDeliveries} active delivery tasks. Updating statuses quickly keeps customers confident.`,
          "Open active deliveries",
          "/delivery",
          "info"
        )
      : createInsight(
          "delivery-ready",
          "You are free for the next pickup",
          "No active runs right now. Keep the app open to catch the next ready order quickly.",
          "View available orders",
          "/delivery",
          "success"
        ),
    pickupReadyOrders > 0
      ? createInsight(
          "delivery-pool",
          "Pickup demand is building",
          `${pickupReadyOrders} orders are waiting for pickup across the platform. This is a good moment to stay online and accept a run.`,
          "Check available orders",
          "/delivery",
          "warning"
        )
      : createInsight(
          "delivery-demand",
          "Pickup queue is light",
          "There are no unassigned pickup-ready orders at the moment, so demand looks calm.",
          "Refresh dashboard",
          "/delivery",
          "info"
        ),
    createInsight(
      "delivery-completed",
      "Daily delivery summary",
      `You have completed ${completedToday} deliveries in the last 24 hours.`,
      "See delivery history",
      "/delivery",
      completedToday > 0 ? "success" : "info"
    ),
  ];
}

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuth(req);
    if (!auth?.userId || !auth.role) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    let insights: Insight[] = [];

    if (auth.role === UserRole.ADMIN) {
      insights = await buildAdminInsights();
    } else if (auth.role === UserRole.PROVIDER) {
      insights = await buildProviderInsights(auth.userId);
    } else if (auth.role === UserRole.DELIVERY_PARTNER) {
      insights = await buildDeliveryInsights(auth.userId);
    } else {
      insights = [
        createInsight(
          "customer-discovery",
          "Try a mood-based meal suggestion",
          "Your recommendation engine is ready. Use it to discover meals based on weather, mood, and health goals.",
          "Open AI recommendations",
          "/recommendations",
          "info"
        ),
      ];
    }

    return NextResponse.json({
      success: true,
      message: "Insights generated successfully",
      data: { insights },
    });
  } catch (error) {
    console.error("Dashboard Insights GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
