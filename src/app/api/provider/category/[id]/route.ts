import { NextResponse } from "next/server";
import { z } from "zod";
import MenuCategory from "@/models/MenuCategory";
import { getProviderContext } from "@/lib/provider-auth";

const updateCategorySchema = z
  .object({
    name: z.string().min(1, "Category name is required").trim().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required.",
  });

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function verifyProviderCategory(categoryId: string) {
  const context = await getProviderContext();
  if ("errorResponse" in context) return context;
  const restaurant = context.restaurant;

  if (!restaurant) {
    return {
      errorResponse: NextResponse.json(
        { error: "Restaurant not found. Please create a restaurant first." },
        { status: 404 }
      ),
    };
  }

  const category = await MenuCategory.findById(categoryId);
  if (!category) {
    return {
      errorResponse: NextResponse.json(
        { error: "Category not found." },
        { status: 404 }
      ),
    };
  }

  if (String(category.restaurant) !== String(restaurant._id)) {
    return {
      errorResponse: NextResponse.json(
        { error: "Forbidden. You cannot modify another restaurant's category." },
        { status: 403 }
      ),
    };
  }

  return { ...context, restaurant, category };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required." },
        { status: 400 }
      );
    }

    const context = await verifyProviderCategory(id);
    if ("errorResponse" in context) return context.errorResponse;
    if (!("category" in context)) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 404 }
      );
    }

    const restaurant = context.restaurant;

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found. Please create a restaurant first." },
        { status: 404 }
      );
    }

    const category = context.category;

    const parsed = updateCategorySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation Error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (parsed.data.name) {
      const duplicate = await MenuCategory.findOne({
        restaurant: restaurant._id,
        _id: { $ne: category._id },
        name: { $regex: new RegExp(`^${escapeRegExp(parsed.data.name)}$`, "i") },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "A category with this name already exists." },
          { status: 409 }
        );
      }
    }

    category.set(parsed.data);
    await category.save();

    return NextResponse.json(
      {
        message: "Category updated successfully.",
        category,
      },
      { status: 200 }
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

    console.error("Error updating provider category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}