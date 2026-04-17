import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { normalizeUserRole } from "@/constants/roles";

/**
 * GET /api/auth/me
 * Reads the HttpOnly token cookie, verifies it, and returns the safe user object.
 * Used by AuthContext on mount to rehydrate client-side user state.
 */
export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  const tokenMatch = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  const token = tokenMatch?.[1];

  if (!token) {
    return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
  }

  const result = await verifyToken(token);
  if (!result.success) {
    return NextResponse.json({ success: false, message: result.error }, { status: 401 });
  }

  try {
    await connectDB();
    const user = await User.findById(result.payload.userId).lean();
    if (!user || user.isBlocked) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 401 });
    }

    const normalizedRole = normalizeUserRole(String(user.role)) ?? result.payload.role;

    return NextResponse.json({
      success: true,
      message: "Session loaded successfully",
      data: {
        id:         String(user._id),
        name:       user.name,
        email:      user.email,
        role:       normalizedRole,
        isApproved: user.isApproved,
      },
      token: token,
    });
  } catch {
    return NextResponse.json({ success: false, message: "Service unavailable" }, { status: 503 });
  }
}
