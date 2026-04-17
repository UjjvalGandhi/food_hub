import mongoose, { Document, Model, Schema } from "mongoose";

// ─── Interface ──────────────────────────────────────────────────────────────

export interface IMenuItem extends Document {
  name: string;
  description?: string;
  price: number;
  image?: string;
  isVeg?: boolean;
  isAvailable: boolean;
  category: mongoose.Types.ObjectId;
  restaurant: mongoose.Types.ObjectId;
  stock: number | null;
  healthMetrics?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    healthScore: number; // 1-10
    tags: string[]; // e.g., ["Low Carb", "High Protein", "Gluten Free"]
  };
  dietTags?: string[]; // e.g., ["vegan", "keto", "gluten-free", "vegetarian"]
  healthTags?: string[]; // e.g., ["low-calorie", "high-protein", "diabetic-friendly"]
  moodTags?: string[]; // e.g., ["comfort-food", "celebration", "late-night"]
  weatherTags?: string[]; // e.g., ["rainy-day", "cold-weather", "summer"]
  cuisine?: string; // e.g., "Italian", "Chinese", "Indian"
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ─────────────────────────────────────────────────────────────────

const MenuItemSchema = new Schema<IMenuItem>(
  {
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    image: {
      type: String,
      trim: true,
    },
    isVeg: {
      type: Boolean,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "MenuCategory",
      required: [true, "Category reference is required"],
      index: true, // Optimizes finding all items in a specific category
    },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Restaurant reference is required"],
      index: true, // Optimizes finding all items for a specific restaurant
    },
    stock: {
      type: Number,
      default: null, // null means unlimited stock
      min: [0, "Stock cannot be negative"],
    },
    healthMetrics: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      healthScore: { type: Number, default: 5, min: 1, max: 10 },
      tags: [{ type: String, trim: true }],
    },
    dietTags: [{ type: String, trim: true }],
    healthTags: [{ type: String, trim: true }],
    moodTags: [{ type: String, trim: true }],
    weatherTags: [{ type: String, trim: true }],
    cuisine: { type: String, trim: true },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// ─── Model (singleton) ──────────────────────────────────────────────────────

const MenuItem: Model<IMenuItem> =
  mongoose.models.MenuItem ?? mongoose.model<IMenuItem>("MenuItem", MenuItemSchema);

export default MenuItem;
