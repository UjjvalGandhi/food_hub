"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertMessage } from "@/components/shared/AlertMessage";
import { UserRole } from "@/constants/roles";
import { useAuth } from "@/context/AuthContext";
import { getLoginRedirectForRole } from "@/lib/auth-redirect";
import { registerSchema } from "@/schemas/auth.schema";
import type { ApiResponse, RegistrationData } from "@/types";

function getFirstError(errors?: string[]) {
  return errors?.[0] ?? "";
}

function normalizeRole(value: string | null) {
  return value === UserRole.PROVIDER ? UserRole.PROVIDER : UserRole.CUSTOMER;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to create account.";
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const callbackUrl = searchParams.get("callbackUrl");

  const initialRole = useMemo(
    () => normalizeRole(searchParams.get("role")),
    [searchParams]
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: initialRole,
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setForm((prev) => ({ ...prev, role: initialRole }));
  }, [initialRole]);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(getLoginRedirectForRole(user.role, callbackUrl));
    }
  }, [callbackUrl, isLoading, router, user]);

  const isProvider = form.role === UserRole.PROVIDER;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setFieldErrors({});

    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        name: getFirstError(flattened.name),
        email: getFirstError(flattened.email),
        role: getFirstError(flattened.role),
        password: getFirstError(flattened.password),
        confirmPassword: getFirstError(flattened.confirmPassword),
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const result = await response.json() as ApiResponse<RegistrationData>;
      if (!response.ok || !result.success) {
        if (result.errors) {
          setFieldErrors({
            name: getFirstError(result.errors.name),
            email: getFirstError(result.errors.email),
            role: getFirstError(result.errors.role),
            password: getFirstError(result.errors.password),
            confirmPassword: getFirstError(result.errors.confirmPassword),
          });
        }
        throw new Error(result.message || "Unable to create account.");
      }

      const providerCallbackUrl = callbackUrl?.startsWith("/provider")
        ? callbackUrl
        : "/provider/restaurant";

      router.replace(
        result.data.requiresApproval
          ? `/login?registered=provider&callbackUrl=${encodeURIComponent(providerCallbackUrl)}`
          : `/login?registered=customer${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`
      );
    } catch (error: unknown) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-amber-50 p-10 lg:block">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-primary">Get started</p>
            <h1 className="text-4xl font-bold tracking-tight">Create an account for ordering or growing your restaurant.</h1>
            <p className="mt-4 text-base text-muted-foreground">
              Customers can start ordering right away. Providers can sign in to complete onboarding, then wait for admin approval before going live.
            </p>
          </div>

          <Card className="mx-auto w-full max-w-lg">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">Create account</CardTitle>
              <CardDescription>
                Choose the account type that matches your journey.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {submitError && (
                <AlertMessage
                  variant="error"
                  title="Registration failed"
                  message={submitError}
                />
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, role: UserRole.CUSTOMER }))}
                  className={`rounded-xl border px-4 py-3 text-left transition ${!isProvider ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <p className="font-semibold">Customer</p>
                  <p className="mt-1 text-sm text-muted-foreground">Browse restaurants and place orders immediately.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, role: UserRole.PROVIDER }))}
                  className={`rounded-xl border px-4 py-3 text-left transition ${isProvider ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <p className="font-semibold">Provider</p>
                  <p className="mt-1 text-sm text-muted-foreground">Create a restaurant partner account for admin review.</p>
                </button>
              </div>

              {isProvider && (
                <AlertMessage
                  variant="warning"
                  title="Approval required"
                  message="Provider accounts can sign in to complete restaurant onboarding, but admin approval is still required before the restaurant goes live."
                />
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    autoComplete="name"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Your full name"
                  />
                  {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
                </div>

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
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder="Create a strong password"
                  />
                  {fieldErrors.password && <p className="text-sm text-destructive">{fieldErrors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                    placeholder="Confirm your password"
                  />
                  {fieldErrors.confirmPassword && <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>}
                </div>

                <Button className="w-full" type="submit" disabled={isSubmitting || isLoading}>
                  {isSubmitting ? "Creating account..." : isProvider ? "Create provider account" : "Create customer account"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"}
                  className="font-medium text-primary hover:underline"
                >
                  Log in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] px-4 pb-16 pt-28" />}>
      <RegisterPageContent />
    </Suspense>
  );
}