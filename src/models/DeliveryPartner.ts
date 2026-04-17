import mongoose, { Document, Model, Schema } from "mongoose";

export interface IDeliveryPartner extends Document {
  user: mongoose.Types.ObjectId;
  partnerId: string;
  name: string;
  phone: string;
  vehicleType: "BIKE" | "SCOOTER" | "CAR" | "CYCLE";
  licenseNumber: string;
  availability: "AVAILABLE" | "BUSY" | "OFFLINE";
  assignedOrders: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryPartnerSchema = new Schema<IDeliveryPartner>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    partnerId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    vehicleType: {
      type: String,
      enum: ["BIKE", "SCOOTER", "CAR", "CYCLE"],
      required: true,
    },
    licenseNumber: { type: String, required: true },
    availability: {
      type: String,
      enum: ["AVAILABLE", "BUSY", "OFFLINE"],
      default: "OFFLINE",
    },
    assignedOrders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
  },
  { timestamps: true }
);

const DeliveryPartner: Model<IDeliveryPartner> =
  mongoose.models.DeliveryPartner ??
  mongoose.model<IDeliveryPartner>("DeliveryPartner", DeliveryPartnerSchema);

export default DeliveryPartner;
