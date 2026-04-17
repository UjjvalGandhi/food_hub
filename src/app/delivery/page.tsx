"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useRouter } from "next/navigation";
import {
  Bike,
  CheckCircle2,
  Clock,
  History,
  IndianRupee,
  Loader2,
  LogOut,
  MapPin,
  Navigation,
  Package,
  Settings2,
  ShieldCheck,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserRole } from "@/constants/roles";
import { DashboardSmartSuggestions } from "@/components/dashboard/DashboardSmartSuggestions";
import type { OrderStatus } from "@/types";

type DeliveryOrder = {
  _id: string;
  restaurant: {
    _id: string;
    name: string;
    location?: string;
  };
  user: {
    _id: string;
    name: string;
  };
  totalAmount: number;
  status: OrderStatus;
  deliveryAddress: {
    street: string;
    city: string;
    pincode: string;
  };
  updatedAt: string;
};

type DeliveryProfile = {
  _id: string;
  partnerId: string;
  name: string;
  phone: string;
  vehicleType: "BIKE" | "SCOOTER" | "CAR" | "CYCLE";
  licenseNumber: string;
  availability: "AVAILABLE" | "BUSY" | "OFFLINE";
  user: {
    _id: string;
    email: string;
    isApproved: boolean;
    isBlocked: boolean;
  };
};

type DeliveryStats = {
  availableJobs: number;
  activeDeliveries: number;
  completedDeliveries: number;
  deliveredToday: number;
  totalEarnings: number;
  todayEarnings: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatAvailability(availability: DeliveryProfile["availability"]) {
  return availability.replace(/_/g, " ");
}

function getStatusTone(status: DeliveryOrder["status"]) {
  if (status === "DELIVERED") return "bg-green-500/10 text-green-600 hover:bg-green-500/10";
  if (status === "READY_FOR_PICKUP") return "bg-blue-500/10 text-blue-600 hover:bg-blue-500/10";
  return "bg-amber-500/10 text-amber-600 hover:bg-amber-500/10";
}

export default function DeliveryDashboard() {
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const { socket, isConnected } = useSocket();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"available" | "accepted" | "history">("available");
  const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([]);
  const [acceptedOrders, setAcceptedOrders] = useState<DeliveryOrder[]>([]);
  const [historyOrders, setHistoryOrders] = useState<DeliveryOrder[]>([]);
  const [profile, setProfile] = useState<DeliveryProfile | null>(null);
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);

  const fetchAvailable = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/orders/available", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) setAvailableOrders(result.data);
    } catch (err) {
      console.error("Failed to fetch available orders", err);
    }
  }, [token]);

  const fetchMyOrders = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/orders/delivery-partner", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setAcceptedOrders(result.data.accepted);
        setHistoryOrders(result.data.history);
      }
    } catch (err) {
      console.error("Failed to fetch my orders", err);
    }
  }, [token]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/delivery/profile");
      const result = await res.json();
      if (result.success) {
        setProfile(result.data.profile);
        setStats(result.data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch delivery profile", err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchProfile(), fetchAvailable(), fetchMyOrders()]);
    setIsLoading(false);
  }, [fetchAvailable, fetchMyOrders, fetchProfile]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== UserRole.DELIVERY_PARTNER)) {
      router.replace("/login?callbackUrl=/delivery");
      return;
    }

    if (token) {
      void refreshAll();
    }
  }, [authLoading, user, token, router, refreshAll]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on("new_delivery_available", (data) => {
      toast.info("New delivery available near you!", {
        description: `Order from ${data.restaurantName} is ready for pickup.`,
      });
      void Promise.all([fetchAvailable(), fetchProfile()]);
    });

    return () => {
      socket.off("new_delivery_available");
    };
  }, [socket, isConnected, fetchAvailable, fetchProfile]);

  const handleAvailabilityChange = async (availability: "AVAILABLE" | "OFFLINE") => {
    setIsProfileUpdating(true);
    try {
      const res = await fetch("/api/delivery/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Unable to update availability.");
      }

      toast.success(`You are now ${availability === "AVAILABLE" ? "available" : "offline"}.`);
      await fetchProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update availability.");
    } finally {
      setIsProfileUpdating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleAcceptOrder = async (orderId: string) => {
    setIsActionLoading(orderId);
    try {
      const res = await fetch("/api/orders/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to accept order");
      }

      toast.success("Order accepted!");
      await Promise.all([fetchAvailable(), fetchMyOrders(), fetchProfile()]);
      setActiveTab("accepted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setIsActionLoading(`${orderId}-${status}`);
    try {
      const res = await fetch("/api/orders/update-delivery-status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, status }),
      });
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to update status");
      }

      toast.success(`Order marked ${status.replace(/_/g, " ").toLowerCase()}.`);
      await Promise.all([fetchMyOrders(), fetchProfile()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsActionLoading(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isApproved = Boolean(profile?.user.isApproved && !profile?.user.isBlocked);
  const canTakeOrders = isApproved && profile?.availability === "AVAILABLE";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_38%),linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(241,245,249,0.75)_100%)]">
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
              <Bike className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Delivery Partner Hub</h1>
              <p className="text-muted-foreground">
                Manage your profile, accept jobs, and keep customers updated in real time.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={isConnected ? "outline" : "destructive"} className="px-3 py-1">
              <div className={`mr-2 h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
              {isConnected ? "Live updates active" : "Offline"}
            </Badge>
            {profile ? (
              <Badge variant="outline" className="px-3 py-1">
                Partner ID: {profile.partnerId}
              </Badge>
            ) : null}
            {profile ? (
              <Badge className={profile.availability === "AVAILABLE" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-100"}>
                {formatAvailability(profile.availability)}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={profile?.availability === "AVAILABLE" ? "outline" : "default"}
            disabled={isProfileUpdating || !isApproved}
            onClick={() =>
              void handleAvailabilityChange(
                profile?.availability === "AVAILABLE" ? "OFFLINE" : "AVAILABLE"
              )
            }
          >
            {isProfileUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-4 w-4" />
            )}
            {profile?.availability === "AVAILABLE" ? "Go Offline" : "Go Available"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/delivery/profile">
              <Settings2 className="mr-2 h-4 w-4" />
              Manage Profile
            </Link>
          </Button>
          <Button variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => void handleLogout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <Card className="mt-8 overflow-hidden border-0 bg-zinc-950 text-white shadow-2xl shadow-zinc-950/15">
        <CardContent className="grid gap-8 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Live route control</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Stay ready, move fast, keep customers calm.</h2>
            <p className="mt-3 max-w-2xl text-sm text-zinc-300">
              Your delivery workspace now gives you live job visibility, current status, earnings pulse, and one-tap updates from pickup to doorstep.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Badge className="bg-white/10 text-white hover:bg-white/10">Profile synced</Badge>
              <Badge className="bg-white/10 text-white hover:bg-white/10">
                {isConnected ? "Socket connected" : "Socket reconnecting"}
              </Badge>
              <Badge className="bg-white/10 text-white hover:bg-white/10">
                {profile ? formatAvailability(profile.availability) : "Loading status"}
              </Badge>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Ready pool</p>
              <p className="mt-2 text-2xl font-bold">{stats?.availableJobs ?? 0}</p>
              <p className="mt-1 text-sm text-zinc-300">Orders waiting for pickup</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Today</p>
              <p className="mt-2 text-2xl font-bold">{stats?.deliveredToday ?? 0}</p>
              <p className="mt-1 text-sm text-zinc-300">Deliveries completed</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Earnings pulse</p>
              <p className="mt-2 text-2xl font-bold">{formatCurrency(stats?.todayEarnings ?? 0)}</p>
              <p className="mt-1 text-sm text-zinc-300">Today&apos;s value handled</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!isApproved ? (
        <Card className="mt-8 border-amber-200 bg-amber-50/60">
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-amber-900">Approval pending</h2>
              <p className="mt-1 text-sm text-amber-800">
                Your delivery account is created, but an admin still needs to approve it before you can accept jobs.
              </p>
            </div>
            <Button asChild variant="outline" className="border-amber-300 bg-white">
              <Link href="/delivery/profile">Review profile</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Available Jobs"
          value={stats?.availableJobs ?? 0}
          hint="Ready-for-pickup orders near the delivery pool"
          icon={<Package className="h-5 w-5" />}
        />
        <StatCard
          title="Active Deliveries"
          value={stats?.activeDeliveries ?? 0}
          hint="Orders currently assigned to you"
          icon={<Navigation className="h-5 w-5" />}
        />
        <StatCard
          title="Today Earnings"
          value={formatCurrency(stats?.todayEarnings ?? 0)}
          hint={`${stats?.deliveredToday ?? 0} deliveries completed today`}
          icon={<IndianRupee className="h-5 w-5" />}
        />
        <StatCard
          title="Lifetime Deliveries"
          value={stats?.completedDeliveries ?? 0}
          hint={`Total payout ${formatCurrency(stats?.totalEarnings ?? 0)}`}
          icon={<History className="h-5 w-5" />}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="border-border/60">
          <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Partner
              </p>
              <p className="mt-2 text-base font-semibold">{profile?.name ?? user?.name}</p>
              <p className="text-sm text-muted-foreground">{profile?.user.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Vehicle
              </p>
              <p className="mt-2 text-base font-semibold">{profile?.vehicleType ?? "Not set"}</p>
              <p className="text-sm text-muted-foreground">License {profile?.licenseNumber ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Contact
              </p>
              <p className="mt-2 text-base font-semibold">{profile?.phone ?? "Not set"}</p>
              <p className="text-sm text-muted-foreground">
                Status: {profile ? formatAvailability(profile.availability) : "Loading"}
              </p>
            </div>
          </CardContent>
        </Card>

        <DashboardSmartSuggestions authToken={token ?? undefined} />
      </div>

      <div className="mt-8 flex overflow-x-auto border-b border-border no-scrollbar">
        {[
          { key: "available", label: "Available Orders", icon: Package, count: availableOrders.length },
          { key: "accepted", label: "My Active Deliveries", icon: Navigation, count: acceptedOrders.length },
          { key: "history", label: "Delivery History", icon: History, count: historyOrders.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.count > 0 ? (
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {tab.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {activeTab === "available" ? (
          <OrderGrid
            emptyTitle="No orders available"
            emptyDescription={
              canTakeOrders
                ? "New ready-for-pickup orders will appear here in real time."
                : "Switch to available after approval to start receiving jobs."
            }
          >
            {availableOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                type="available"
                disabled={!canTakeOrders}
                onAction={() => void handleAcceptOrder(order._id)}
                loading={isActionLoading === order._id}
              />
            ))}
          </OrderGrid>
        ) : null}

        {activeTab === "accepted" ? (
          <OrderGrid
            emptyTitle="No active deliveries"
            emptyDescription="Accepted orders will stay here until you finish the delivery flow."
          >
            {acceptedOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                type="accepted"
                onAction={(status) => void handleUpdateStatus(order._id, status)}
                loadingAction={isActionLoading}
              />
            ))}
          </OrderGrid>
        ) : null}

        {activeTab === "history" ? (
          <OrderGrid
            emptyTitle="No delivery history"
            emptyDescription="Your completed deliveries will appear here once you finish your first order."
          >
            {historyOrders.map((order) => (
              <OrderCard key={order._id} order={order} type="history" />
            ))}
          </OrderGrid>
        ) : null}
      </div>
    </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: number | string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderGrid({
  children,
  emptyTitle,
  emptyDescription,
}: {
  children: React.ReactNode;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (!children || (Array.isArray(children) && children.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed p-20 text-center">
        <Package className="h-12 w-12 text-muted-foreground/30" />
        <h3 className="mt-4 text-lg font-semibold">{emptyTitle}</h3>
        <p className="mt-2 max-w-lg text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function OrderCard({
  order,
  type,
  onAction,
  loading,
  loadingAction,
  disabled,
}: {
  order: DeliveryOrder;
  type: "available" | "accepted" | "history";
  onAction?: (value: string) => void;
  loading?: boolean;
  loadingAction?: string | null;
  disabled?: boolean;
}) {
  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case "READY_FOR_PICKUP":
        return "PICKED_UP";
      case "PICKED_UP":
        return "OUT_FOR_DELIVERY";
      case "OUT_FOR_DELIVERY":
        return "DELIVERED";
      default:
        return null;
    }
  };

  const nextStatus = getNextStatus(order.status);
  const isUpdating = loadingAction?.startsWith(order._id);

  return (
    <Card className="overflow-hidden border-border bg-card/50 transition-all hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="font-mono text-[10px] uppercase">
            #{order._id.slice(-6)}
          </Badge>
          <Badge className={getStatusTone(order.status)}>{order.status.replace(/_/g, " ")}</Badge>
        </div>
        <CardTitle className="mt-2 text-lg">{order.restaurant.name}</CardTitle>
        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {order.restaurant.location || `${order.deliveryAddress.city} delivery`}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-6">
        <div className="rounded-xl bg-muted/50 p-3">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <User className="h-3 w-3 text-primary" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Customer
              </p>
              <p className="font-medium">{order.user?.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.pincode}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
              <IndianRupee className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">Order Value</p>
              <p className="font-bold">{formatCurrency(order.totalAmount)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-right">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {new Date(order.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        {type === "available" ? (
          <Button className="w-full" onClick={() => onAction?.(order._id)} disabled={loading || disabled}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Accept Delivery"}
          </Button>
        ) : null}

        {type === "accepted" && nextStatus ? (
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => onAction?.(nextStatus)}
            disabled={Boolean(loadingAction)}
          >
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              `Mark as ${nextStatus.replace(/_/g, " ")}`
            )}
          </Button>
        ) : null}

        {type === "history" ? (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 py-2 text-sm font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Successfully Delivered
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
