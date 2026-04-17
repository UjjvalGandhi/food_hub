import mongoose, { Document, Model, Schema } from "mongoose";
import { UserRole } from "@/constants/roles";

export { UserRole } from "@/constants/roles";

// ─── Interface ──────────────────────────────────────────────────────────────

export interface IUser extends Document {
  name:        string;
  email:       string;
  password:    string;
  role:        UserRole;
  isApproved:  boolean;
  isBlocked:   boolean;
  dietaryPreferences?: string[];
  healthGoals?: string[];
  cuisinePreferences: string[];
  favoriteRestaurants: mongoose.Types.ObjectId[];
  createdAt:   Date;
  updatedAt:   Date;
}

// ─── Schema ─────────────────────────────────────────────────────────────────

const UserSchema = new Schema<IUser>(
  {
    name: {
      type:     String,
      required: [true, "Name is required"],
      trim:     true,
    },

    email: {
      type:      String,
      required:  [true, "Email is required"],
      unique:    true,
      lowercase: true,
      trim:      true,
      index:     true,
    },

    // Hashing is handled in the auth layer — NOT here
    password: {
      type:     String,
      required: [true, "Password is required"],
      select:   false, // Never returned in queries by default
    },

    role: {
      type:    String,
      enum:    Object.values(UserRole),
      default: UserRole.CUSTOMER,
    },

    isApproved: {
      type:    Boolean,
      default: false,
    },

    isBlocked: {
      type:    Boolean,
      default: false,
    },
    healthGoals: { type: [{ type: String, trim: true }], default: [] },
    dietaryPreferences: { type: [{ type: String, trim: true }], default: [] },
    cuisinePreferences: { type: [{ type: String, trim: true }], default: [] },
    favoriteRestaurants: {
      type: [{ type: Schema.Types.ObjectId, ref: "Restaurant" }],
      default: [],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ─── Model (singleton — prevents overwrite error in dev HMR) ────────────────

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;
