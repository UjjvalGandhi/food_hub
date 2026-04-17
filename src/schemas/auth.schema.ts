import { z } from "zod";
import { UserRole } from "@/constants/roles";

// ─── Reusable Field Rules ────────────────────────────────────────────────────

const emailField = z
  .string()
  .email("Enter a valid email address")
  .trim()
  .transform((val) => val.toLowerCase());

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters") // bcrypt hard limit
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[0-9]/, "Include at least one number")
  .regex(/[^A-Za-z0-9]/, "Include at least one special character");

// ─── Register ────────────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be at most 50 characters")
      .trim(),
    email:           emailField,
    role:            z.enum([UserRole.CUSTOMER, UserRole.PROVIDER, UserRole.DELIVERY_PARTNER]),
    password:        passwordField,
    confirmPassword: z.string(),
    phone:           z.string().optional(),
    vehicleType:     z.enum(["BIKE", "SCOOTER", "CAR", "CYCLE"]).optional(),
    licenseNumber:   z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path:    ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.role === UserRole.DELIVERY_PARTNER) {
        return !!data.phone && !!data.vehicleType && !!data.licenseNumber;
      }
      return true;
    },
    {
      message: "Phone, vehicle type, and license number are required for delivery partners",
      path: ["role"],
    }
  );

export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Login ───────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email:    emailField,
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
