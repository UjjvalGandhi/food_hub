"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import {
  Bike,
  CheckCircle2,
  ChefHat,
  Clock3,
  Home,
  MapPin,
  Package,
  Phone,
  Receipt,
  Store,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import type { ApiResponse, CustomerOrder, OrderStatus, OrderStatusEvent } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { UserRole } from "@/constants/roles";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const TRACKING_STEPS: Array<{
  key: OrderStatus;
  label: string;
  description: string;
  icon: typeof Clock3;
}> = [
  { key: "PENDING", label: "Order placed", description: "We received your order.", icon: Clock3 },
  { key: "ACCEPTED", label: "Restaurant confirmed", description: "The kitchen has started preparing.", icon: CheckCircle2 },
  { key: "PREPARING", label: "Preparing food", description: "Your dishes are being cooked fresh.", icon: ChefHat },
  { key: "READY_FOR_PICKUP", label: "Ready for pickup", description: "Packed and waiting for a rider.", icon: Package },
  { key: "PICKED_UP", label: "Picked up", description: "Your rider has collected the order.", icon: Bike },
  { key: "OUT_FOR_DELIVERY", label: "On the way", description: "Your food is heading to your doorstep.", icon: Truck },
  { key: "DELIVERED", label: "Delivered", description: "Enjoy your meal.", icon: Home },
];

const ETA_BY_STATUS: Partial<Record<OrderStatus, string>> = {
  PENDING: "35-40 min",
  ACCEPTED: "30-35 min",
  PREPARING: "20-25 min",
  READY_FOR_PICKUP: "15-20 min",
  PICKED_UP: "10-15 min",
  OUT_FOR_DELIVERY: "5-10 min",
  DELIVERED: "Delivered",
};

function getTrackingIndex(status: OrderStatus) {
  const index = TRACKING_STEPS.findIndex((step) => step.key === status);
  if (index !== -1) return index;
  if (status === "REJECTED" || status === "CANCELLED") return 0;
  return 0;
}

function getTrackingCopy(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return "Your order is waiting for the restaurant to confirm it.";
    case "ACCEPTED":
      return "The restaurant has accepted your order and will begin preparing it.";
    case "PREPARING":
      return "The kitchen is cooking your meal right now.";
    case "READY_FOR_PICKUP":
      return "Your meal is ready and a delivery partner can pick it up.";
    case "PICKED_UP":
      return "The delivery partner has your order and is heading out.";
    case "OUT_FOR_DELIVERY":
      return "Your order is nearby. Keep an eye on the door.";
    case "DELIVERED":
      return "Your order has been delivered. Hope you enjoy it.";
    case "CANCELLED":
      return "This order was cancelled before delivery.";
    case "REJECTED":
      return "The restaurant rejected this order.";
    default:
      return "We are tracking your order live.";
  }
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { user, isLoading: isAuthLoading } = useAuth();
  const { socket, isConnected } = useSocket();

  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) {
        router.replace(`/login?callbackUrl=${encodeURIComponent(`/orders/${orderId}`)}`);
      } else if (String(user.role) !== UserRole.CUSTOMER) {
        router.replace("/dashboard");
      }
    }
  }, [isAuthLoading, orderId, router, user]);

  const fetchOrder = useCallback(async (withRefreshState = false) => {
    try {
      if (withRefreshState) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json() as ApiResponse<CustomerOrder>;
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load order");
      }
      setOrder(data.data);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load order tracking"));
      router.replace("/orders");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    if (user && String(user.role) === UserRole.CUSTOMER && orderId) {
      fetchOrder();
    }
  }, [fetchOrder, orderId, user]);

  useEffect(() => {
    if (!socket || !isConnected || !orderId) return;

    const handleOrderStatusUpdate = (payload: OrderStatusEvent) => {
      if (payload.orderId !== orderId) return;

      setOrder((current) =>
        current
          ? {
              ...current,
              status: payload.status,
              updatedAt: payload.updatedAt,
            }
          : current
      );

      toast.info(`Order status updated: ${payload.status.replace(/_/g, " ")}`);
    };

    socket.on("order_status_update", handleOrderStatusUpdate);

    return () => {
      socket.off("order_status_update", handleOrderStatusUpdate);
    };
  }, [isConnected, orderId, socket]);

  const trackingIndex = useMemo(
    () => (order ? getTrackingIndex(order.status) : 0),
    [order]
  );

  if (isAuthLoading || isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const isClosedOrder = ["DELIVERED", "CANCELLED", "REJECTED"].includes(order.status);
  const eta = ETA_BY_STATUS[order.status] ?? "Updating";

  return (
    <div className="min-h-screen bg-zinc-50 pb-16 pt-28 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Live Order Tracking</p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Track your order
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/orders">Back to orders</Link>
            </Button>
            <Button variant="outline" onClick={() => fetchOrder(true)} disabled={isRefreshing}>
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden border-none bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 text-white shadow-2xl">
          <CardContent className="grid gap-8 p-6 md:grid-cols-[1.4fr_0.9fr] md:p-8">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-white/10 text-white hover:bg-white/10">
                  #{order._id.slice(-6).toUpperCase()}
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/20">
                  {order.status.replace(/_/g, " ")}
                </Badge>
                <Badge className="bg-white/10 text-white hover:bg-white/10">
                  {isConnected ? "Live" : "Offline"}
                </Badge>
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  {order.restaurant?.name || "Your restaurant"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-zinc-300">
                  {getTrackingCopy(order.status)}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-300">Estimated arrival</p>
                  <p className="mt-2 text-2xl font-semibold">{eta}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-300">Order value</p>
                  <p className="mt-2 text-2xl font-semibold">{formatCurrency(order.totalAmount)}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-300">Updated</p>
                  <p className="mt-2 text-lg font-semibold">
                    {formatDistanceToNowStrict(new Date(order.updatedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">Delivery snapshot</p>
              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-emerald-300" />
                  <div>
                    <p className="font-medium">Delivering to</p>
                    <p className="text-sm text-zinc-300">
                      {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.pincode}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Receipt className="mt-0.5 h-5 w-5 text-emerald-300" />
                  <div>
                    <p className="font-medium">Payment</p>
                    <p className="text-sm text-zinc-300">
                      {order.paymentMethod === "ONLINE" ? "Paid online" : "Cash on delivery"} • {order.paymentStatus || "PENDING"}
                    </p>
                  </div>
                </div>
                {order.deliveryPartner ? (
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-5 w-5 text-emerald-300" />
                    <div>
                      <p className="font-medium">Delivery partner</p>
                      <p className="text-sm text-zinc-300">
                        {order.deliveryPartner.name} • {order.deliveryPartner.vehicleType}
                      </p>
                      <p className="text-sm text-zinc-300">{order.deliveryPartner.phone}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <Bike className="mt-0.5 h-5 w-5 text-emerald-300" />
                    <div>
                      <p className="font-medium">Delivery partner</p>
                      <p className="text-sm text-zinc-300">
                        Rider details will appear once a partner accepts your order.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-3xl border-zinc-200/80 shadow-sm dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Order journey</CardTitle>
              <CardDescription>
                A clearer, Zomato-style step-by-step tracker for this order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {TRACKING_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isComplete = trackingIndex > index && !isClosedOrder;
                const isCurrent = trackingIndex === index && !isClosedOrder;
                const isVisibleFuture = trackingIndex < index && !["CANCELLED", "REJECTED"].includes(order.status);

                return (
                  <div key={step.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full border ${
                          isComplete || isCurrent
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {index < TRACKING_STEPS.length - 1 && (
                        <div
                          className={`mt-2 h-12 w-px ${
                            isComplete ? "bg-primary" : "bg-zinc-200 dark:bg-zinc-800"
                          }`}
                        />
                      )}
                    </div>
                    <div className="pt-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-50">{step.label}</p>
                        {isCurrent && <Badge>Current</Badge>}
                        {isComplete && <Badge variant="secondary">Done</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                      {!isComplete && !isCurrent && isVisibleFuture && (
                        <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                          Coming up next
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {order.status === "CANCELLED" && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-950 dark:bg-rose-950/20 dark:text-rose-200">
                  This order was cancelled before it could be delivered.
                </div>
              )}

              {order.status === "REJECTED" && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-950 dark:bg-amber-950/20 dark:text-amber-200">
                  The restaurant rejected this order. You can place a fresh one from another restaurant.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card className="rounded-3xl border-zinc-200/80 shadow-sm dark:border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Restaurant and items
                </CardTitle>
                <CardDescription>
                  Everything included in this order.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={`${item.menuItemId}-${index}`} className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Qty {item.quantity}</p>
                      </div>
                      <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total paid</span>
                  <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-zinc-200/80 shadow-sm dark:border-zinc-800">
              <CardHeader>
                <CardTitle>What you can do now</CardTitle>
                <CardDescription>
                  Quick actions while your order is moving.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button variant="outline" asChild>
                  <Link href={`/restaurants/${order.restaurant?._id || ""}`}>View restaurant</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/orders">See all orders</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
