import mongoose, { Document, Model, Schema } from "mongoose";

// ─── Interface ──────────────────────────────────────────────────────────────

export interface IRestaurant extends Document {
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  logo?: string;
  coverImage?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isApproved: boolean;
  isOpen: boolean;
  rating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ─────────────────────────────────────────────────────────────────

const RestaurantSchema = new Schema<IRestaurant>(
  {
    name: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner reference is required"],
      index: true, // Optimizes queries for a specific partner's restaurants
    },
    logo: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    isApproved: {
      type: Boolean,
      default: false, // Must be explicitly approved by an admin
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot be more than 5"],
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// ─── Model (singleton — prevents overwrite error in dev HMR) ────────────────

const Restaurant: Model<IRestaurant> =
  mongoose.models.Restaurant ?? mongoose.model<IRestaurant>("Restaurant", RestaurantSchema);

export default Restaurant;
