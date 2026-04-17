"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertMessage } from "@/components/shared/AlertMessage";
import { useAuth } from "@/context/AuthContext";
import { getLoginRedirectForRole } from "@/lib/auth-redirect";
import { loginSchema } from "@/schemas/auth.schema";

function getFirstError(errors?: string[]) {
  return errors?.[0] ?? "";
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const callbackUrl = searchParams.get("callbackUrl");

  const queryNotice = useMemo(() => {
    const error = searchParams.get("error");
    const registered = searchParams.get("registered");

    if (registered === "provider") {
      return {
        variant: "warning" as const,
        title: "Provider account created",
        message: "Sign in to finish your restaurant onboarding. Admin approval is still required before your restaurant goes live.",
      };
    }

    if (registered === "customer") {
      return {
        variant: "success" as const,
        title: "Account created",
        message: "Your customer account is ready. Sign in to start ordering.",
      };
    }

    if (error === "session_expired") {
      return {
        variant: "warning" as const,
        title: "Session expired",
        message: "Please sign in again to continue.",
      };
    }

    return null;
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(getLoginRedirectForRole(user.role, callbackUrl));
    }
  }, [callbackUrl, isLoading, router, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setFieldErrors({});

    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        email: getFirstError(flattened.email),
        password: getFirstError(flattened.password),
      });
      return;
    }

    const result = await login(parsed.data, { callbackUrl });
    if (!result.success) {
      setSubmitError(result.message);
    }
  };

  return (
    <div className="px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-amber-50 p-10 lg:block">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-primary">Welcome back</p>
            <h1 className="text-4xl font-bold tracking-tight">Sign in to continue your FoodPartner journey.</h1>
            <p className="mt-4 text-base text-muted-foreground">
              Customers can track orders, providers can manage restaurant operations, and admins can monitor the marketplace.
            </p>
          </div>

          <Card className="mx-auto w-full max-w-md">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">Log in</CardTitle>
              <CardDescription>
                Enter your account details to continue.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {queryNotice && (
                <AlertMessage
                  variant={queryNotice.variant}
                  title={queryNotice.title}
                  message={queryNotice.message}
                />
              )}

              {submitError && (
                <AlertMessage
                  variant="error"
                  title="Unable to sign in"
                  message={submitError}
                />
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="you@example.com"
                  />
                  {fieldErrors.email && <p className="text-sm text-destructive">{fieldErrors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder="Enter your password"
                  />
                  {fieldErrors.password && <p className="text-sm text-destructive">{fieldErrors.password}</p>}
                </div>

                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Log in"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                New to FoodPartner?{" "}
                <Link
                  href={callbackUrl ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/register"}
                  className="font-medium text-primary hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] px-4 pb-16 pt-28" />}>
      <LoginPageContent />
    </Suspense>
  );
}
