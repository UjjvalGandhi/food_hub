import { NextResponse } from "next/server";
import { z } from "zod";
import MenuCategory from "@/models/MenuCategory";
import MenuItem from "@/models/MenuItem";
import { getProviderContext } from "@/lib/provider-auth";

const createMenuItemSchema = z.object({
  name: z.string().min(1, "Item name is required").trim(),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  image: z.string().url("Must be a valid image URL").optional().or(z.literal("")),
  isVeg: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  category: z.string().min(1, "Category ID is required"),
  stock: z.union([z.coerce.number().min(0, "Stock cannot be negative"), z.null()]).optional(),
});

export async function GET() {
  try {
    const context = await getProviderContext({ allowMissingRestaurant: true });
    if ("errorResponse" in context) return context.errorResponse;

    if (!context.restaurant) {
      return NextResponse.json(
        { restaurant: null, categories: [], menuItems: [] },
        { status: 200 }
      );
    }

    const restaurant = context.restaurant;

    const [categories, menuItems] = await Promise.all([
      MenuCategory.find({ restaurant: restaurant._id })
        .sort({ isActive: -1, name: 1 })
        .lean(),
      MenuItem.find({ restaurant: restaurant._id })
        .populate({
          path: "category",
          model: MenuCategory,
          select: "_id name isActive",
        })
        .sort({ createdAt: -1, name: 1 })
        .lean(),
    ]);

    return NextResponse.json(
      {
        restaurant,
        categories,
        menuItems,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching provider menu:", error);
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

    if (!restaurant.isApproved) {
      return NextResponse.json(
        {
          error:
            "Restaurant approval is still pending. Menu items can only be created after admin approval.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createMenuItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation Error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { category: categoryId, ...itemData } = parsed.data;

    const category = await MenuCategory.findById(categoryId);

    if (!category) {
      return NextResponse.json(
        { error: "Menu category not found." },
        { status: 404 }
      );
    }

    if (String(category.restaurant) !== String(restaurant._id)) {
      return NextResponse.json(
        { error: "Category mismatch. This category does not belong to your restaurant." },
        { status: 403 }
      );
    }

    const newMenuItem = await MenuItem.create({
      ...itemData,
      category: category._id,
      restaurant: restaurant._id,
      isAvailable: itemData.isAvailable ?? true,
      stock: itemData.stock ?? null,
    });

    await newMenuItem.populate({
      path: "category",
      model: MenuCategory,
      select: "_id name isActive",
    });

    return NextResponse.json(
      {
        message: "Menu item created successfully.",
        menuItem: newMenuItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating menu item:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
