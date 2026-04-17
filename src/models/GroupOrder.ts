import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOrderItem {
  menuItemId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
}

export interface IParticipant {
  userId: mongoose.Types.ObjectId;
  name: string;
  items: IOrderItem[];
  subtotal: number;
  paymentStatus: string;
}

export interface IGroupOrder extends Document {
  restaurantId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  status: string;
  participants: IParticipant[];
  cartItems: IOrderItem[];
  totalAmount: number;
  inviteCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const ParticipantSchema = new Schema<IParticipant>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    items: { type: [OrderItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    paymentStatus: { type: String, default: "PENDING" },
  },
  { _id: true }
);

const GroupOrderSchema = new Schema<IGroupOrder>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, default: "OPEN" },
    participants: { type: [ParticipantSchema], default: [] },
    cartItems: { type: [OrderItemSchema], default: [] },
    totalAmount: { type: Number, default: 0 },
    inviteCode: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for `id`
GroupOrderSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Calculate subtotals and totalAmount on save
GroupOrderSchema.pre("save", function (next: any) {
  let mainTotal = 0;

  if (this.participants) {
    this.participants.forEach((p) => {
      let pTotal = 0;
      if (p.items) {
        p.items.forEach((item) => {
          pTotal += item.price * item.quantity;
        });
      }
      p.subtotal = pTotal;
      mainTotal += pTotal;
    });
  }

  if (this.cartItems) {
    this.cartItems.forEach((item) => {
      mainTotal += item.price * item.quantity;
    });
  }

  this.totalAmount = mainTotal;
  next();
});

const GroupOrder: Model<IGroupOrder> =
  mongoose.models.GroupOrder ?? mongoose.model<IGroupOrder>("GroupOrder", GroupOrderSchema);

export default GroupOrder;
