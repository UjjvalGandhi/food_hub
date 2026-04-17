"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, CheckCircle2, Clock3, MapPin, Package, Truck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { UserRole } from "@/constants/roles";
import type { ApiResponse, CustomerOrder, OrdersListData, OrderStatus, OrderStatusEvent } from "@/types";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const ACTIVE_STATUSES: OrderStatus[] = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
];

const TIMELINE_STEPS: Array<{ key: OrderStatus; label: string; icon: typeof Clock3 }> = [
  { key: "PENDING", label: "Placed", icon: Clock3 },
  { key: "ACCEPTED", label: "Accepted", icon: CheckCircle2 },
  { key: "PREPARING", label: "Preparing", icon: Package },
  { key: "OUT_FOR_DELIVERY", label: "On the way", icon: Truck },
];

function getActiveOrder(orders: CustomerOrder[]) {
  return orders.find((order) => ACTIVE_STATUSES.includes(order.status)) ?? null;
}

function getCurrentStepIndex(status: OrderStatus) {
  if (status === "READY_FOR_PICKUP") return 2;
  if (status === "PICKED_UP") return 3;
  return TIMELINE_STEPS.findIndex((step) => step.key === status);
}

function getStatusCopy(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return "The restaurant has your order and is about to confirm it.";
    case "ACCEPTED":
      return "Your order has been accepted and the kitchen is getting started.";
    case "PREPARING":
      return "Your meal is being cooked fresh right now.";
    case "READY_FOR_PICKUP":
      return "Your meal is packed and waiting for a delivery partner.";
    case "PICKED_UP":
      return "A delivery partner has picked up your order.";
    case "OUT_FOR_DELIVERY":
      return "Your food is on the way to your doorstep.";
    default:
      return "We are tracking your order live.";
  }
}

export function CurrentOrderSpotlight() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { socket, isConnected } = useSocket();
  const [activeOrder, setActiveOrder] = useState<CustomerOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user || user.role !== UserRole.CUSTOMER) {
      setActiveOrder(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchActiveOrder = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/orders/customer?page=1&limit=10");
        const data = await response.json() as ApiResponse<OrdersListData<CustomerOrder>>;

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load current order");
        }

        if (isMounted) {
          setActiveOrder(getActiveOrder(data.data.orders));
        }
      } catch (error) {
        if (isMounted) {
          toast.error(getErrorMessage(error, "Failed to load current order"));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchActiveOrder();

    return () => {
      isMounted = false;
    };
  }, [isAuthLoading, user]);

  useEffect(() => {
    if (!socket || !isConnected || !activeOrder) return;

    const handleOrderStatusUpdate = (payload: OrderStatusEvent) => {
      if (payload.orderId !== activeOrder._id) return;

      setActiveOrder((current) =>
        current
          ? {
              ...current,
              status: payload.status,
              updatedAt: payload.updatedAt,
            }
          : current
      );
    };

    socket.on("order_status_update", handleOrderStatusUpdate);
    return () => {
      socket.off("order_status_update", handleOrderStatusUpdate);
    };
  }, [activeOrder, isConnected, socket]);

  const activeStep = useMemo(
    () => (activeOrder ? getCurrentStepIndex(activeOrder.status) : 0),
    [activeOrder]
  );

  if (isAuthLoading || isLoading) {
    return (
      <section className="bg-background py-6">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-56 rounded-[2rem]" />
        </div>
      </section>
    );
  }

  if (!activeOrder) {
    return null;
  }

  return (
    <section className="bg-background py-6">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Card className="overflow-hidden rounded-[2rem] border-none bg-gradient-to-r from-emerald-950 via-zinc-950 to-zinc-900 text-white shadow-2xl">
          <CardContent className="grid gap-8 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-8">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-white/10 text-white hover:bg-white/10">
                  Current Order
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/20">
                  {activeOrder.status.replace(/_/g, " ")}
                </Badge>
                <Badge className="bg-white/10 text-white hover:bg-white/10">
                  {isConnected ? "Live" : "Refreshing"}
                </Badge>
              </div>

              <div>
                <h2 className="text-3xl font-black tracking-tight">
                  Your order from {activeOrder.restaurant?.name || "the restaurant"} is moving
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
                  {getStatusCopy(activeOrder.status)}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                {TIMELINE_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isComplete = activeStep >= index;

                  return (
                    <div key={step.key} className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                      <div
                        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${
                          isComplete ? "bg-white text-zinc-950" : "bg-white/10 text-zinc-300"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="font-semibold">{step.label}</p>
                      <p className="mt-1 text-xs text-zinc-300">
                        {isComplete ? "Done" : "Pending"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-300">Order snapshot</p>
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-sm text-zinc-300">Updated</p>
                  <p className="mt-1 text-lg font-semibold" suppressHydrationWarning>
                    {hasMounted
                      ? formatDistanceToNow(new Date(activeOrder.updatedAt), { addSuffix: true })
                      : "Just updated"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-300">Total</p>
                  <p className="mt-1 text-lg font-semibold">{formatCurrency(activeOrder.totalAmount)}</p>
                </div>
                <div>
                  <p className="mb-2 text-sm text-zinc-300">Delivering to</p>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="mt-0.5 h-4 w-4 text-emerald-300" />
                    <span>
                      {activeOrder.deliveryAddress.street}, {activeOrder.deliveryAddress.city}, {activeOrder.deliveryAddress.pincode}
                    </span>
                  </div>
                </div>
                <Button asChild className="mt-2 w-full rounded-2xl bg-white text-zinc-950 hover:bg-zinc-100">
                  <Link href={`/orders/${activeOrder._id}`}>
                    Track live order
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
