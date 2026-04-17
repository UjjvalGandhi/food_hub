"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertMessage } from "@/components/shared/AlertMessage";
import { UserRole } from "@/constants/roles";
import { useAuth } from "@/context/AuthContext";
import { registerSchema } from "@/schemas/auth.schema";
import type { ApiResponse } from "@/types";

function getFirstError(errors?: string[]) {
  return errors?.[0] ?? "";
}

function DeliveryRegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const callbackUrl = searchParams.get("callbackUrl");

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: UserRole.DELIVERY_PARTNER,
    password: "",
    confirmPassword: "",
    phone: "",
    vehicleType: "" as any,
    licenseNumber: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === UserRole.DELIVERY_PARTNER) {
        router.replace("/delivery");
      }
    }
  }, [isLoading, router, user]);

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
        password: getFirstError(flattened.password),
        confirmPassword: getFirstError(flattened.confirmPassword),
        phone: getFirstError(flattened.phone),
        vehicleType: getFirstError(flattened.vehicleType),
        licenseNumber: getFirstError(flattened.licenseNumber),
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

      const result = await response.json() as ApiResponse<any>;
      if (!response.ok || !result.success) {
        if (result.errors) {
          setFieldErrors({
            name: getFirstError(result.errors.name),
            email: getFirstError(result.errors.email),
            password: getFirstError(result.errors.password),
            confirmPassword: getFirstError(result.errors.confirmPassword),
            phone: getFirstError(result.errors.phone),
            vehicleType: getFirstError(result.errors.vehicleType),
            licenseNumber: getFirstError(result.errors.licenseNumber),
          });
        }
        throw new Error(result.message || "Unable to create account.");
      }

      router.replace(`/login?registered=delivery&callbackUrl=${encodeURIComponent("/delivery")}`);
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-background to-indigo-50 p-10 lg:block">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Join the team</p>
            <h1 className="text-4xl font-bold tracking-tight">Become a Delivery Partner.</h1>
            <p className="mt-4 text-base text-muted-foreground">
              Flexible hours, competitive earnings, and a great community. Sign up today and start delivering tomorrow.
            </p>
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-600" />
                <p className="text-sm font-medium">Automatic order assignment</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-600" />
                <p className="text-sm font-medium">Real-time status updates</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-600" />
                <p className="text-sm font-medium">Easy-to-use delivery dashboard</p>
              </div>
            </div>
          </div>

          <Card className="mx-auto w-full max-w-lg">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-bold">Register as Delivery Partner</CardTitle>
              <CardDescription>
                Fill in your details to create your partner account.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {submitError && (
                <div className="mb-4">
                  <AlertMessage
                    variant="error"
                    title="Registration failed"
                    message={submitError}
                  />
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="John Doe"
                    />
                    {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                    {fieldErrors.phone && <p className="text-xs text-destructive">{fieldErrors.phone}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                  {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleType">Vehicle type</Label>
                    <Select
                      value={form.vehicleType}
                      onValueChange={(value) => setForm({ ...form, vehicleType: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BIKE">Bike</SelectItem>
                        <SelectItem value="SCOOTER">Scooter</SelectItem>
                        <SelectItem value="CAR">Car</SelectItem>
                        <SelectItem value="CYCLE">Cycle</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldErrors.vehicleType && <p className="text-xs text-destructive">{fieldErrors.vehicleType}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License number</Label>
                    <Input
                      id="licenseNumber"
                      value={form.licenseNumber}
                      onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                      placeholder="DL-123456789"
                    />
                    {fieldErrors.licenseNumber && <p className="text-xs text-destructive">{fieldErrors.licenseNumber}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                    />
                    {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                    />
                    {fieldErrors.confirmPassword && <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>}
                  </div>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating account..." : "Register as Partner"}
                </Button>

                <p className="text-center text-sm text-muted-foreground pt-2">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                    Log in
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center pt-28">Loading...</div>}>
      <DeliveryRegisterPageContent />
    </Suspense>
  );
}
