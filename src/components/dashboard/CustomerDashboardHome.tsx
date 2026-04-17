"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  Brain,
  Clock3,
  Heart,
  Receipt,
  RotateCcw,
  Sparkles,
  Store,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import type { ApiResponse, CustomerOrder, OrdersListData } from "@/types";
import { getErrorMessage, formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RecommendationPanel } from "@/components/recommendations/RecommendationPanel";

type SuggestedRestaurant = {
  id: string;
  name: string;
  orderCount: number;
  recentItems: string[];
};

const ACTIVE_ORDER_STATUSES = new Set([
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
]);

export function CustomerDashboardHome() {
  const { user } = useAuth();
  const { fetchCart, setDrawerOpen } = useCart();

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/orders/customer?page=1&limit=5");
        const data = await response.json() as ApiResponse<OrdersListData<CustomerOrder>>;

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load recent orders");
        }

        if (isMounted) {
          setOrders(data.data.orders);
        }
      } catch (error) {
        if (isMounted) {
          toast.error(getErrorMessage(error, "Failed to load recent orders"));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const personalizedSuggestions = useMemo<SuggestedRestaurant[]>(() => {
    const suggestions = new Map<string, SuggestedRestaurant>();

    for (const order of orders) {
      if (!order.restaurant) continue;

      const existing = suggestions.get(order.restaurant._id);
      const itemNames = order.items.map((item) => item.name);

      if (existing) {
        existing.orderCount += 1;
        existing.recentItems = Array.from(new Set([...existing.recentItems, ...itemNames])).slice(0, 3);
      } else {
        suggestions.set(order.restaurant._id, {
          id: order.restaurant._id,
          name: order.restaurant.name,
          orderCount: 1,
          recentItems: itemNames.slice(0, 3),
        });
      }
    }

    return Array.from(suggestions.values())
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 3);
  }, [orders]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const activeOrders = orders.filter((order) => ACTIVE_ORDER_STATUSES.has(order.status)).length;
    const deliveredOrders = orders.filter((order) => order.status === "DELIVERED").length;

    return { totalOrders, activeOrders, deliveredOrders };
  }, [orders]);

  const recentOrder = orders[0] ?? null;

  const handleReorder = async (orderId: string) => {
    setReorderingId(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}/reorder`, { method: "POST" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to reorder items");
      }

      await fetchCart();
      setDrawerOpen(true);
      toast.success(data.message || "Items added to cart");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to reorder items"));
    } finally {
      setReorderingId(null);
    }
  };

  return (
    <div className="mt-8 space-y-10">
      <section className="overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 text-white shadow-2xl">
        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.3fr_0.9fr] lg:px-10">
          <div className="space-y-5">
            <Badge className="w-fit rounded-full bg-white/10 px-4 py-1.5 text-white hover:bg-white/10">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Personalized Dashboard
            </Badge>
            <div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                {user?.name ? `${user.name}, your cravings hub is ready.` : "Your cravings hub is ready."}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
                Revisit your recent orders, jump back into your favorite restaurants, and get suggestions shaped by what you actually order.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-2xl bg-white text-zinc-950 hover:bg-zinc-100">
                <Link href="/restaurants">
                  Explore Restaurants
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10">
                <Link href="/recommendations">
                  <Brain className="mr-2 h-4 w-4" />
                  AI Discovery
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <Card className="rounded-3xl border-white/10 bg-white/10 text-white shadow-none backdrop-blur-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <Receipt className="h-5 w-5 text-emerald-300" />
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-300">Orders</span>
                </div>
                <p className="mt-4 text-3xl font-black">{stats.totalOrders}</p>
                <p className="mt-1 text-sm text-zinc-300">Recent orders loaded</p>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-white/10 bg-white/10 text-white shadow-none backdrop-blur-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <Truck className="h-5 w-5 text-sky-300" />
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-300">Active</span>
                </div>
                <p className="mt-4 text-3xl font-black">{stats.activeOrders}</p>
                <p className="mt-1 text-sm text-zinc-300">Orders in progress</p>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-white/10 bg-white/10 text-white shadow-none backdrop-blur-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <Heart className="h-5 w-5 text-rose-300" />
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-300">Delivered</span>
                </div>
                <p className="mt-4 text-3xl font-black">{stats.deliveredOrders}</p>
                <p className="mt-1 text-sm text-zinc-300">Successful recent meals</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black tracking-tight">Recent Orders</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your latest meals, ready to revisit in one click.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-2xl">
              <Link href="/orders">See all orders</Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-40 rounded-3xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <Card className="rounded-3xl border-dashed">
              <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <Receipt className="h-10 w-10 text-muted-foreground/40" />
                <h4 className="mt-4 text-xl font-bold">No orders yet</h4>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Once you place an order, your recent meals and smart repeats will appear here.
                </p>
                <Button asChild className="mt-6 rounded-2xl">
                  <Link href="/restaurants">Start ordering</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {orders.slice(0, 3).map((order) => (
                <Card key={order._id} className="rounded-3xl border-zinc-200/80 shadow-sm transition-transform hover:-translate-y-0.5">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-lg font-bold">{order.restaurant?.name || "Restaurant"}</h4>
                          <Badge variant="outline" className="rounded-full uppercase">
                            {order.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.items.map((item) => item.name).slice(0, 3).join(", ")}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Clock3 className="h-4 w-4" />
                            {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                          </span>
                          <span className="font-semibold text-foreground">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button
                          variant="outline"
                          className="rounded-2xl"
                          onClick={() => handleReorder(order._id)}
                          disabled={reorderingId === order._id}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          {reorderingId === order._id ? "Reordering..." : "Reorder"}
                        </Button>
                        <Button asChild className="rounded-2xl">
                          <Link href={`/orders/${order._id}`}>Track / View</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-5">
          <div>
            <h3 className="text-2xl font-black tracking-tight">Suggested From Recent Orders</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Quick restaurant ideas based on what you ordered most recently.
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-36 rounded-3xl" />
              ))}
            </div>
          ) : personalizedSuggestions.length === 0 ? (
            <Card className="rounded-3xl">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">
                  Your suggestions will become more personal after your first few orders.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {personalizedSuggestions.map((restaurant) => (
                <Card key={restaurant.id} className="rounded-3xl border-zinc-200/80 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Store className="h-5 w-5 text-primary" />
                      {restaurant.name}
                    </CardTitle>
                    <CardDescription>
                      Ordered {restaurant.orderCount} time{restaurant.orderCount > 1 ? "s" : ""} recently
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {restaurant.recentItems.map((item) => (
                        <Badge key={item} variant="secondary" className="rounded-full px-3 py-1">
                          {item}
                        </Badge>
                      ))}
                    </div>
                    <Button asChild variant="outline" className="w-full rounded-2xl">
                      <Link href={`/restaurants/${restaurant.id}`}>
                        Order from {restaurant.name}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {recentOrder && (
            <Card className="rounded-3xl border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  Recent Craving Hint
                </p>
                <p className="mt-3 text-lg font-bold leading-snug">
                  You last ordered from {recentOrder.restaurant?.name || "your recent restaurant"}.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Want something similar? Start with {recentOrder.items[0]?.name || "your favorite dish"} or explore more recommendations built around your recent choices.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button asChild className="rounded-2xl">
                    <Link href="/recommendations">Open AI recommendations</Link>
                  </Button>
                  {recentOrder.restaurant?._id && (
                    <Button asChild variant="outline" className="rounded-2xl">
                      <Link href={`/restaurants/${recentOrder.restaurant._id}`}>Visit restaurant</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      <section className="space-y-5">
        <div>
          <h3 className="text-2xl font-black tracking-tight">AI Food Suggestions</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Mood-based picks that now sit inside a more useful dashboard flow.
          </p>
        </div>
        <RecommendationPanel />
      </section>
    </div>
  );
}
