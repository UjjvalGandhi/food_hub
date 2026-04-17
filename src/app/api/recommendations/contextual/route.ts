import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import Restaurant from "@/models/Restaurant";
import User, { IUser } from "@/models/User";
import Order, { IOrder } from "@/models/Order";
import { RecommendationEngine, ScoringContext } from "@/lib/recommendationEngine";
import { getCurrentWeather } from "@/lib/weather";
import { RecommendationGenerator } from "@/lib/recommendationGenerator";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const mood = searchParams.get("mood");
    const healthGoal = searchParams.get("healthGoal");
    const dietPreference = searchParams.get("dietPreference");
    const location = searchParams.get("location") || searchParams.get("city");

    await connectDB();

    // 1. Fetch User and Context if userId is provided
    let user: IUser | null = null;
    let pastOrders: IOrder[] = [];

    if (userId && userId !== "null" && userId !== "undefined") {
      user = await User.findById(userId);
      pastOrders = await Order.find({ user: userId }).lean();
    }

    const context: ScoringContext = {
      mood: mood || undefined,
      healthGoal: healthGoal || undefined,
      dietPreference: dietPreference || undefined,
    };

    const weather = await getCurrentWeather(location || "New Delhi");
    context.weather = weather.condition;

    // 2. Fetch Restaurants based on location if provided
    const restaurantQuery: Record<string, unknown> = { isApproved: true, isOpen: true };
    if (location) {
      // Simple location matching: check if city or address contains the location string
      restaurantQuery.$or = [
        { city: { $regex: location, $options: "i" } },
        { address: { $regex: location, $options: "i" } }
      ];
    }

    const restaurants = await Restaurant.find(restaurantQuery).select("_id");
    const restaurantIds = restaurants.map(r => r._id);

    if (restaurantIds.length === 0) {
      return NextResponse.json({ 
        recommendations: [], 
        summary: "No restaurants found in the specified location." 
      });
    }

    // 3. Fetch available menu items
    const menuItems = await MenuItem.find({
      restaurant: { $in: restaurantIds },
      isAvailable: true,
    }).populate("restaurant", "name city");

    if (menuItems.length === 0) {
      return NextResponse.json({ 
        recommendations: [], 
        summary: "No menu items available for the selected criteria." 
      });
    }

    // 4. Score Items using Recommendation Engine
    const scoredItems = RecommendationEngine.scoreItems(
      menuItems,
      user,
      pastOrders,
      context
    );

    // 5. Format response
    const relevantItems = scoredItems.filter(item => item.score > 0);
    const topRecommendations = relevantItems.slice(0, 10).map(item => ({
      ...item,
      matchPercentage: Math.min(Math.floor((item.score / 60) * 100), 100)
    }));

    return NextResponse.json({
      recommendations: topRecommendations,
      summary: RecommendationGenerator.generateMessage(context, topRecommendations),
      context: {
        mood,
        healthGoal,
        dietPreference,
        location,
        weather,
        timeOfDay: new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"
      }
    });

  } catch (error) {
    console.error("Contextual Recommendation Route Error:", error);
    return NextResponse.json({ error: "Failed to fetch contextual recommendations." }, { status: 500 });
  }
}
