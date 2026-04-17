import { UserRole } from "@/constants/roles";

const DEFAULT_ROLE_REDIRECTS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "/admin",
  [UserRole.PROVIDER]: "/provider/restaurant",
  [UserRole.CUSTOMER]: "/dashboard",
  [UserRole.DELIVERY_PARTNER]: "/delivery",
};

const RESTRICTED_PREFIXES: Record<string, UserRole[]> = {
  "/admin": [UserRole.ADMIN],
  "/provider": [UserRole.PROVIDER],
  "/restaurant-owner": [UserRole.PROVIDER],
  "/dashboard": [UserRole.CUSTOMER],
  "/delivery": [UserRole.DELIVERY_PARTNER],
};

function isSafeRelativePath(path: string) {
  return path.startsWith("/") && !path.startsWith("//");
}

export function getDefaultRedirectForRole(role: UserRole) {
  return DEFAULT_ROLE_REDIRECTS[role] ?? "/";
}

export function getLoginRedirectForRole(role: UserRole, callbackUrl?: string | null) {
  if (!callbackUrl || !isSafeRelativePath(callbackUrl)) {
    return getDefaultRedirectForRole(role);
  }

  if (callbackUrl.startsWith("/login") || callbackUrl.startsWith("/register")) {
    return getDefaultRedirectForRole(role);
  }

  const restrictedMatch = Object.entries(RESTRICTED_PREFIXES).find(([prefix]) =>
    callbackUrl.startsWith(prefix)
  );

  if (restrictedMatch && !restrictedMatch[1].includes(role)) {
    return getDefaultRedirectForRole(role);
  }

  return callbackUrl;
}
