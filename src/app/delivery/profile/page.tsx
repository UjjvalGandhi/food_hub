"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bike, ChevronLeft, Loader2, LogOut, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/constants/roles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type DeliveryProfileResponse = {
  profile: {
    partnerId: string;
    name: string;
    phone: string;
    vehicleType: "BIKE" | "SCOOTER" | "CAR" | "CYCLE";
    licenseNumber: string;
    availability: "AVAILABLE" | "BUSY" | "OFFLINE";
    user: {
      email: string;
      isApproved: boolean;
      isBlocked: boolean;
    };
  };
};

export default function DeliveryProfilePage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    vehicleType: "BIKE" as "BIKE" | "SCOOTER" | "CAR" | "CYCLE",
    licenseNumber: "",
    availability: "OFFLINE" as "AVAILABLE" | "OFFLINE",
  });
  const [partnerId, setPartnerId] = useState("");
  const [email, setEmail] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/delivery/profile");
      const result = (await res.json()) as { success: boolean; data?: DeliveryProfileResponse; message?: string };

      if (!res.ok || !result.success || !result.data) {
        throw new Error(result.message || "Unable to load delivery profile.");
      }

      const { profile } = result.data;
      setPartnerId(profile.partnerId);
      setEmail(profile.user.email);
      setIsApproved(profile.user.isApproved);
      setIsBlocked(profile.user.isBlocked);
      setForm({
        name: profile.name,
        phone: profile.phone,
        vehicleType: profile.vehicleType,
        licenseNumber: profile.licenseNumber,
        availability: profile.availability === "AVAILABLE" ? "AVAILABLE" : "OFFLINE",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load delivery profile.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== UserRole.DELIVERY_PARTNER)) {
      router.replace("/login?callbackUrl=/delivery/profile");
      return;
    }

    if (user?.role === UserRole.DELIVERY_PARTNER) {
      void loadProfile();
    }
  }, [authLoading, user, router, loadProfile]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/delivery/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Unable to update delivery profile.");
      }

      toast.success("Delivery profile updated.");
      await loadProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update delivery profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.08),_transparent_32%),linear-gradient(180deg,_rgba(250,250,250,1)_0%,_rgba(244,244,245,0.78)_100%)]">
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" asChild className="px-0 text-muted-foreground">
            <Link href="/delivery">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.15rem] bg-gradient-to-br from-emerald-500 to-lime-500 text-white shadow-lg shadow-emerald-500/20">
              <Bike className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Delivery Profile</h1>
              <p className="text-muted-foreground">Keep your rider details and availability updated.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Partner ID: {partnerId}</Badge>
          <Badge className={isApproved && !isBlocked ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-amber-100 text-amber-700 hover:bg-amber-100"}>
            {isApproved && !isBlocked ? "Approved" : "Pending approval"}
          </Badge>
          <Button variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => void handleLogout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <Card className="mb-6 overflow-hidden border-0 bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-500/20">
        <CardContent className="grid gap-4 p-6 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Profile readiness</p>
            <p className="mt-2 text-2xl font-bold">{isApproved && !isBlocked ? "Approved" : "Pending"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Contact</p>
            <p className="mt-2 text-lg font-semibold">{email}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Availability</p>
            <p className="mt-2 text-lg font-semibold">{form.availability}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>These details help assign the right deliveries to you.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSave}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <Select
                    value={form.vehicleType}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        vehicleType: value as "BIKE" | "SCOOTER" | "CAR" | "CYCLE",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BIKE">Bike</SelectItem>
                      <SelectItem value="SCOOTER">Scooter</SelectItem>
                      <SelectItem value="CAR">Car</SelectItem>
                      <SelectItem value="CYCLE">Cycle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={form.licenseNumber}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, licenseNumber: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Availability</Label>
                <Select
                  value={form.availability}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      availability: value as "AVAILABLE" | "OFFLINE",
                    }))
                  }
                  disabled={!isApproved || isBlocked}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="OFFLINE">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
              <CardDescription>Your current delivery account status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="mt-1 font-medium">{email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Approval</p>
                <p className="mt-1 font-medium">
                  {isApproved && !isBlocked ? "Approved and ready for deliveries" : "Waiting for admin approval"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Current availability</p>
                <p className="mt-1 font-medium">{form.availability}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Delivery flow</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Once approved, switch to available, accept ready jobs from the dashboard, then move them through picked up, out for delivery, and delivered.
                  </p>
                  <Button asChild variant="outline" className="mt-4 bg-white">
                    <Link href="/delivery">Open delivery dashboard</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </div>
  );
}
