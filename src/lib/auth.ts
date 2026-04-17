import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { normalizeUserRole, UserRole } from "@/constants/roles";

// ─── Secret ───────────────────────────────────────────────────────────────────
// jose requires a Uint8Array key — encode the string secret once at module load.

const JWT_SECRET_STRING = process.env.JWT_SECRET;

if (!JWT_SECRET_STRING) {
  throw new Error("Missing JWT_SECRET — add it to your .env.local file");
}

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

const EXPIRES_IN = "7d";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenPayload {
  userId: string;
  role:   UserRole;
}

export type VerifyResult =
  | { success: true;  payload: TokenPayload }
  | { success: false; error: string };

// ─── generateToken ────────────────────────────────────────────────────────────

/**
 * Signs a JWT using HS256 via the Web Crypto API (edge-compatible).
 * Token expires in 7 days.
 */
export async function generateToken(userId: string, role: UserRole): Promise<string> {
  return new SignJWT({ userId, role } satisfies TokenPayload & JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(JWT_SECRET);
}

// ─── verifyToken ──────────────────────────────────────────────────────────────

/**
 * Verifies a JWT. Returns a typed result union — never throws.
 * Safe to use in both API routes (Node.js) and middleware (Edge Runtime).
 */
export async function verifyToken(token: string): Promise<VerifyResult> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });

    const { userId, role } = payload as JWTPayload & TokenPayload;
    const normalizedRole = normalizeUserRole(role);

    if (!userId || !normalizedRole) {
      return { success: false, error: "Token payload is malformed" };
    }

    return { success: true, payload: { userId, role: normalizedRole } };
  } catch (err) {
    const message = (err as Error).message ?? "";
    if (message.includes("exp")) {
      return { success: false, error: "Token has expired" };
    }
    return { success: false, error: "Invalid token" };
  }
}
