import { z } from "zod";
import { ORDER_STATUSES } from "@/constants/orders";

// ─── Order Schema ──────────────────────────────────────────────────────────

export const deliveryAddressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  pincode: z.string().regex(/^\d{6}$/, "Invalid pincode"),
});

export const placeOrderSchema = z.object({
  deliveryAddress: deliveryAddressSchema,
  paymentMethod: z.enum(["COD", "ONLINE"]).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES, { message: "Invalid order status" }),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
