import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 * Clears the HttpOnly token cookie server-side.
 * The client cannot delete HttpOnly cookies directly.
 */
export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });

  response.cookies.set("token", "", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   0,    // immediately expire
    path:     "/",
  });

  return response;
}
