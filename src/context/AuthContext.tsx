"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { LoginInput } from "@/schemas/auth.schema";
import type { ApiResponse, AuthSessionData, AuthUser } from "@/types";
import { getLoginRedirectForRole } from "@/lib/auth-redirect";

interface LoginOptions {
  callbackUrl?: string | null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user:     AuthUser | null;
  token:    string | null;
  isLoading: boolean;
  login:    (credentials: LoginInput, options?: LoginOptions) => Promise<{ success: boolean; message: string }>;
  logout:   () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Start as loading=true so we can hydrate user state before first render
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [token, setToken]       = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Hydrate: fetch current session from server on mount ───────────────────
  // Token lives in an HttpOnly cookie — JS cannot read it directly.
  // We ask /api/auth/me to validate the cookie and return the safe user object.
  useEffect(() => {
    let cancelled = false;

    async function hydrateUser() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!cancelled) {
          if (res.ok) {
            const json = await res.json() as ApiResponse<AuthUser> & { token?: string };
            if (json.success) {
              setUser(json.data);
              if (json.token) setToken(json.token);
            } else {
              setUser(null);
              setToken(null);
            }
          } else {
            setUser(null);
            setToken(null);
          }
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    hydrateUser();
    return () => { cancelled = true; };
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (
      credentials: LoginInput,
      options?: LoginOptions
    ): Promise<{ success: boolean; message: string }> => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/login", {
          method:      "POST",
          headers:     { "Content-Type": "application/json" },
          credentials: "include",      // receive HttpOnly cookie from server
          body:        JSON.stringify(credentials),
        });

        const json = await res.json() as ApiResponse<AuthSessionData>;

        if (json.success) {
          setUser(json.data.user);
          setToken(json.data.token);
          router.replace(
            getLoginRedirectForRole(json.data.user.role, options?.callbackUrl)
          );
        }

        return { success: json.success, message: json.message };
      } catch {
        return { success: false, message: "Network error. Please try again." };
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Server clears the HttpOnly cookie — client cannot do this itself
      await fetch("/api/auth/logout", {
        method:      "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      router.push("/login");
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
