import mongoose, { Document, Model, Schema } from "mongoose";

export interface IReview extends Document {
  user: mongoose.Types.ObjectId;
  restaurant: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  photoUrls: string[];
  providerReply?: {
    message: string;
    repliedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true, index: true },
    rating: {
      type: Number,
      required: true,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, "Comment must be under 500 characters"],
    },
    photoUrls: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: [500, "Photo URL must be under 500 characters"],
        },
      ],
      default: [],
      validate: {
        validator: (value: string[]) => value.length <= 3,
        message: "You can attach up to 3 review photos.",
      },
    },
    providerReply: {
      message: {
        type: String,
        trim: true,
        maxlength: [300, "Reply must be under 300 characters"],
      },
      repliedAt: {
        type: Date,
      },
    },
  },
  { timestamps: true }
);

const Review: Model<IReview> =
  mongoose.models.Review ?? mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
