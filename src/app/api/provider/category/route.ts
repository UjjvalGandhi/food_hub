import { NextResponse } from "next/server";
import { z } from "zod";
import MenuCategory from "@/models/MenuCategory";
import MenuItem from "@/models/MenuItem";
import { getProviderContext } from "@/lib/provider-auth";

const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").trim(),
});

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET() {
  try {
    const context = await getProviderContext({ allowMissingRestaurant: true });
    if ("errorResponse" in context) return context.errorResponse;

    if (!context.restaurant) {
      return NextResponse.json(
        { restaurant: null, categories: [] },
        { status: 200 }
      );
    }

    const restaurant = context.restaurant;

    const [categories, itemCounts] = await Promise.all([
      MenuCategory.find({ restaurant: restaurant._id })
        .sort({ isActive: -1, name: 1 })
        .lean(),
      MenuItem.aggregate([
        { $match: { restaurant: restaurant._id } },
        { $group: { _id: "$category", itemCount: { $sum: 1 } } },
      ]),
    ]);

    const counts = new Map(
      itemCounts.map((entry: { _id: string; itemCount: number }) => [
        String(entry._id),
        entry.itemCount,
      ])
    );

    return NextResponse.json(
      {
        restaurant,
        categories: categories.map((category) => ({
          ...category,
          itemCount: counts.get(String(category._id)) ?? 0,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching menu categories:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const context = await getProviderContext();
    if ("errorResponse" in context) return context.errorResponse;
    const restaurant = context.restaurant;

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found. Please create a restaurant first." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation Error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name: categoryName } = parsed.data;
    const existingCategory = await MenuCategory.findOne({ 
      restaurant: restaurant._id,
      name: { $regex: new RegExp(`^${escapeRegExp(categoryName)}$`, "i") },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: `A category named "${categoryName}" already exists for your restaurant.` },
        { status: 409 }
      );
    }

    const newCategory = await MenuCategory.create({
      name: categoryName,
      restaurant: restaurant._id,
      isActive: true,
    });

    return NextResponse.json(
      {
        message: "Menu category created successfully.",
        category: newCategory,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { error: "A category with this name already exists." },
        { status: 409 }
      );
    }

    console.error("Error creating menu category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
