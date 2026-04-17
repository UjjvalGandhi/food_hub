import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import User, { UserRole } from "@/models/User";
import DeliveryPartner from "@/models/DeliveryPartner";
import { registerSchema } from "@/schemas/auth.schema";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  // ── 1. Parse & Validate ────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  const { name, email, password, role, phone, vehicleType, licenseNumber } = parsed.data;

  // ── 2. Connect to DB ───────────────────────────────────────────────────────
  try {
    await connectDB();
  } catch {
    return NextResponse.json(
      { success: false, message: "Database connection failed" },
      { status: 503 }
    );
  }

  // ── 3. Duplicate email check ───────────────────────────────────────────────
  const existing = await User.findOne({ email }).lean();
  if (existing) {
    return NextResponse.json(
      { success: false, message: "An account with this email already exists" },
      { status: 409 }
    );
  }

  // ── 4. Hash password ───────────────────────────────────────────────────────
  const hashedPassword = await hashPassword(password);

  // ── 5. Create user ─────────────────────────────────────────────────────────
  // PROVIDER role defaults to isApproved: false (model default) —
  // an admin must explicitly approve them before they can operate.
  let user: InstanceType<typeof User>;
  try {
    const isProvider = role === UserRole.PROVIDER;
    const isDeliveryPartner = role === UserRole.DELIVERY_PARTNER;

    user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      isApproved: !(isProvider || isDeliveryPartner),
      isBlocked:  false,
    });

    if (isDeliveryPartner) {
      const partnerId = `DP-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      await DeliveryPartner.create({
        user: user._id,
        partnerId,
        name,
        phone,
        vehicleType,
        licenseNumber,
        availability: "OFFLINE",
      });
    }
  } catch (err) {
    console.error("[Register] User creation failed:", err);
    return NextResponse.json(
      { success: false, message: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }

  // ── 6. Return safe user object (no password) ───────────────────────────────
  return NextResponse.json(
    {
      success: true,
      message:
        role === UserRole.PROVIDER || role === UserRole.DELIVERY_PARTNER
          ? `${role === UserRole.PROVIDER ? "Provider" : "Delivery Partner"} account created. Sign in to complete your profile. Admin approval is still required before going live.`
          : "Account created successfully. Please sign in to continue.",
      data: {
        id:         String(user._id),
        name:       user.name,
        email:      user.email,
        role:       user.role,
        isApproved: user.isApproved,
        requiresApproval: role === UserRole.PROVIDER || role === UserRole.DELIVERY_PARTNER,
        createdAt:  user.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
}

