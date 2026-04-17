import mongoose, { Document, Model, Schema } from "mongoose";
import { ORDER_STATUSES, type OrderStatus } from "@/constants/orders";

export type { OrderStatus } from "@/constants/orders";

export interface IOrderItem {
  menuItemId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  restaurant: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  deliveryAddress: {
    street: string;
    city: string;
    pincode: string;
  };
  paymentMethod: "COD" | "ONLINE";
  paymentStatus: "PENDING" | "COMPLETED" | "FAILED";
  deliveryPartner?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "PENDING",
    },
    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
    deliveryPartner: { type: Schema.Types.ObjectId, ref: "DeliveryPartner", index: true },
  },
  { timestamps: true }
);

// Immutability Hook: Enforce that only the status field can be updated
OrderSchema.pre("save", function () {
  if (!this.isNew) {
    const modifiedPaths = this.modifiedPaths();
    
    // If anything other than 'status', 'paymentStatus', 'deliveryPartner' (or 'updatedAt') is modified, throw an error
    const illegalModifications = modifiedPaths.filter(
      (path) => path !== "status" && path !== "paymentStatus" && path !== "deliveryPartner" && path !== "updatedAt"
    );

    if (illegalModifications.length > 0) {
      throw new Error(
        `Order is immutable. Illegal modifications attempted on fields: ${illegalModifications.join(
          ", "
        )}`
      );
    }
  }
});

// We also need to prevent updates via queries like findOneAndUpdate, updateOne, etc.
const immutableUpdateHook = function (this: mongoose.Query<unknown, IOrder>) {
  const update = this.getUpdate();
  if (!update) return;

  if (Array.isArray(update)) {
    return;
  }

  const allowedUpdates = ["status", "paymentStatus", "deliveryPartner", "updatedAt"];
  const updateKeys = Object.keys(update.$set || {}).concat(Object.keys(update));

  // Remove MongoDB operators like $set from our check
  const filteredKeys = updateKeys.filter((key) => !key.startsWith("$"));

  const hasIllegalUpdate = filteredKeys.some((key) => !allowedUpdates.includes(key));
  
  if (update.$set) {
      const setKeys = Object.keys(update.$set);
      const hasIllegalSet = setKeys.some((key) => !allowedUpdates.includes(key));
      if (hasIllegalSet) {
          throw new Error("Order is immutable. Only status updates are allowed.");
      }
  }

  if (hasIllegalUpdate) {
    throw new Error("Order is immutable. Only status updates are allowed.");
  }
};

OrderSchema.pre("findOneAndUpdate", immutableUpdateHook);
OrderSchema.pre("updateOne", immutableUpdateHook);
OrderSchema.pre("updateMany", immutableUpdateHook);

if (process.env.NODE_ENV !== "production" && mongoose.models.Order) {
  delete mongoose.models.Order;
}

const Order: Model<IOrder> = mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
