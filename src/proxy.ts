import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { normalizeUserRole, UserRole } from "@/constants/roles";

// ─── Edge-safe JWT verification ───────────────────────────────────────────────
// IMPORTANT: Do NOT import from @/lib/auth, @/lib/db, or @/models/* here.
// Those modules pull in mongoose → mongodb → Node.js crypto, which is
// unavailable in the Edge Runtime.
// We use the Web Crypto API via jose (crypto.subtle) directly instead.

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "");

async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    const userId = payload.userId as string | undefined;
    const rawRole = payload.role as string | undefined;
    const role = normalizeUserRole(rawRole);
    if (!userId || !role) return null;
    return { userId, role };
  } catch {
    return null; // expired or invalid
  }
}

// ─── Route Config ─────────────────────────────────────────────────────────────

const PROTECTED_PREFIXES = [
  "/admin",
  "/provider",
  "/delivery",
  "/dashboard",
  "/api/admin",
  "/api/delivery",
  "/api/provider",
  "/api/cart",
  "/api/orders",
];

const ROLE_MAP: Record<string, UserRole[]> = {
  "/api/orders/delivery-partner": [UserRole.DELIVERY_PARTNER],
  "/api/orders/available": [UserRole.DELIVERY_PARTNER],
  "/api/orders/accept": [UserRole.DELIVERY_PARTNER],
  "/api/orders/update-delivery-status": [UserRole.DELIVERY_PARTNER],
  "/api/admin": [UserRole.ADMIN],
  "/admin": [UserRole.ADMIN],
  "/api/delivery": [UserRole.DELIVERY_PARTNER],
  "/api/provider": [UserRole.PROVIDER],
  "/provider": [UserRole.PROVIDER],
  "/delivery": [UserRole.DELIVERY_PARTNER],
  "/api/cart": [UserRole.CUSTOMER],
  "/api/orders": [UserRole.CUSTOMER],
  "/dashboard": [UserRole.CUSTOMER],
};

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/unauthorized",
  "/api/auth",
  "/_next",
  "/favicon.ico",
];

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");
  const isPublicRoute = PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  const token = request.cookies.get("token")?.value;

  if (!token) {
    if (!isProtectedRoute || isPublicRoute) {
      return NextResponse.next();
    }

    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(loginUrl);
  }

  // ① Verify JWT using Web Crypto API (jose) — edge-compatible
  const payload = await verifyJWT(token);

  if (!payload) {
    if (!isProtectedRoute || isPublicRoute) {
      const response = NextResponse.next();
      response.cookies.delete("token");
      return response;
    }

    if (isApiRoute) {
      const response = NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
      response.cookies.delete("token");
      return response;
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "session_expired");
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("token");
    return response;
  }

  // ② Role check for protected app routes
  const allowed = Object.entries(ROLE_MAP)
    .sort(([left], [right]) => right.length - left.length)
    .find(([prefix]) => pathname.startsWith(prefix))?.[1];

  if (isProtectedRoute && allowed && !allowed.includes(payload.role)) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // ③ Pass user context via headers to both app routes and API handlers
  const headers = new Headers(request.headers);
  headers.set("x-user-id",   payload.userId);
  headers.set("x-user-role", payload.role);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
