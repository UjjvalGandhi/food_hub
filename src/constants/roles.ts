/**
 * User role constants — intentionally kept free of any Node.js dependencies
 * so this file is safe to import in the Edge Runtime (middleware).
 */
export enum UserRole {
  CUSTOMER = "CUSTOMER",
  PROVIDER = "PROVIDER",
  ADMIN    = "ADMIN",
  DELIVERY_PARTNER = "DELIVERY_PARTNER",
}

export function normalizeUserRole(role: string | null | undefined): UserRole | null {
  if (!role) return null;

  if (role === "PARTNER") {
    return UserRole.PROVIDER;
  }

  return Object.values(UserRole).includes(role as UserRole) ? (role as UserRole) : null;
}
