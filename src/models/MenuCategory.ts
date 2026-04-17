import mongoose, { Document, Model, Schema } from "mongoose";

// ─── Interface ──────────────────────────────────────────────────────────────

export interface IMenuCategory extends Document {
  name: string;
  restaurant: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ─────────────────────────────────────────────────────────────────

const MenuCategorySchema = new Schema<IMenuCategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Restaurant reference is required"],
      index: true, // Optimizes finding all categories for a specific restaurant
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────

// Ensure a restaurant cannot have two categories with the exact same name
MenuCategorySchema.index({ restaurant: 1, name: 1 }, { unique: true });

// ─── Model (singleton) ──────────────────────────────────────────────────────

const MenuCategory: Model<IMenuCategory> =
  mongoose.models.MenuCategory ?? mongoose.model<IMenuCategory>("MenuCategory", MenuCategorySchema);

export default MenuCategory;
