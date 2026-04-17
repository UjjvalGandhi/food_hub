import { NextResponse } from "next/server";
import { z } from "zod";
import MenuCategory from "@/models/MenuCategory";
import MenuItem from "@/models/MenuItem";
import { getProviderContext } from "@/lib/provider-auth";

const updateMenuItemSchema = z
  .object({
    name: z.string().min(1, "Item name cannot be empty").trim().optional(),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "Price cannot be negative").optional(),
    image: z.string().url("Must be a valid image URL").optional().or(z.literal("")),
    isVeg: z.boolean().optional(),
    isAvailable: z.boolean().optional(),
    category: z.string().min(1, "Category ID cannot be empty").optional(),
    stock: z.union([z.coerce.number().min(0, "Stock cannot be negative"), z.null()]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required.",
  });

async function verifyProviderAndItem(menuItemId: string) {
  const context = await getProviderContext();
  if ("errorResponse" in context) return context;
  const restaurant = context.restaurant;

  if (!restaurant) {
    return {
      errorResponse: NextResponse.json(
        { error: "Restaurant not found. Please create a restaurant first." },
        { status: 404 }
      )
    };
  }

  const menuItem = await MenuItem.findById(menuItemId);
  if (!menuItem) {
    return {
      errorResponse: NextResponse.json(
        { error: "Menu item not found." },
        { status: 404 }
      )
    };
  }

  if (String(menuItem.restaurant) !== String(restaurant._id)) {
    return {
      errorResponse: NextResponse.json(
        { error: "Forbidden. You cannot edit items belonging to another restaurant." },
        { status: 403 }
      )
    };
  }

  return { ...context, restaurant, menuItem };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const menuItemId = resolvedParams.id;

    if (!menuItemId) {
      return NextResponse.json({ error: "Menu item ID is required." }, { status: 400 });
    }

    const verification = await verifyProviderAndItem(menuItemId);
    if ("errorResponse" in verification) return verification.errorResponse;
    if (!("menuItem" in verification) || !verification.menuItem) {
      return NextResponse.json({ error: "Menu item not found." }, { status: 404 });
    }

    const { restaurant, menuItem } = verification;

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found. Please create a restaurant first." },
        { status: 404 }
      );
    }

    const categories = await MenuCategory.find({ restaurant: restaurant._id })
      .sort({ isActive: -1, name: 1 })
      .lean();

    await menuItem.populate({
      path: "category",
      model: MenuCategory,
      select: "_id name isActive",
    });

    return NextResponse.json(
      { restaurant, categories, menuItem },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching menu item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const menuItemId = resolvedParams.id;

    if (!menuItemId) {
      return NextResponse.json({ error: "Menu item ID is required." }, { status: 400 });
    }

    const verification = await verifyProviderAndItem(menuItemId);
    if ("errorResponse" in verification) return verification.errorResponse;
    if (!("menuItem" in verification) || !verification.menuItem) {
      return NextResponse.json({ error: "Menu item not found." }, { status: 404 });
    }

    const { restaurant, menuItem } = verification;

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
            "Restaurant approval is still pending. Menu items can only be updated after admin approval.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = updateMenuItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation Error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updates = parsed.data;

    if (updates.category) {
      const newCategory = await MenuCategory.findById(updates.category);
      if (!newCategory) {
        return NextResponse.json({ error: "Provided category not found." }, { status: 404 });
      }
      if (String(newCategory.restaurant) !== String(restaurant._id)) {
        return NextResponse.json(
          { error: "Forbidden. The new category does not belong to your restaurant." },
          { status: 403 }
        );
      }
    }

    menuItem.set(updates);
    await menuItem.save();
    await menuItem.populate({
      path: "category",
      model: MenuCategory,
      select: "_id name isActive",
    });

    return NextResponse.json(
      { message: "Menu item updated successfully.", menuItem },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating menu item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const menuItemId = resolvedParams.id;

    if (!menuItemId) {
      return NextResponse.json({ error: "Menu item ID is required." }, { status: 400 });
    }

    const verification = await verifyProviderAndItem(menuItemId);
    if ("errorResponse" in verification) return verification.errorResponse;

    if (!("restaurant" in verification) || !verification.restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found. Please create a restaurant first." },
        { status: 404 }
      );
    }

    if (!verification.restaurant.isApproved) {
      return NextResponse.json(
        {
          error:
            "Restaurant approval is still pending. Menu items can only be deleted after admin approval.",
        },
        { status: 403 }
      );
    }

    await MenuItem.findByIdAndDelete(menuItemId);

    return NextResponse.json(
      { message: "Menu item deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
