"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type {
  ApiResponse,
  CustomerOrder,
  OrderStatus,
  OrderStatusEvent,
  OrdersListData,
  PaginationMeta,
} from "@/types";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Clock3, Heart, Package, Star, Truck } from "lucide-react";
import { formatCurrency, getErrorMessage } from "@/lib/utils";

const ORDER_TIMELINE: Array<{
  key: OrderStatus;
  label: string;
  icon: typeof Clock3;
}> = [
  { key: "PENDING", label: "Placed", icon: Clock3 },
  { key: "ACCEPTED", label: "Accepted", icon: CheckCircle2 },
  { key: "PREPARING", label: "Preparing", icon: Package },
  { key: "OUT_FOR_DELIVERY", label: "On the way", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: Heart },
];

export default function OrdersPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { socket, isConnected } = useSocket();
  const { fetchCart, setDrawerOpen } = useCart();
  const router = useRouter();

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeReorderId, setActiveReorderId] = useState<string | null>(null);
  const [activeReviewOrder, setActiveReviewOrder] = useState<CustomerOrder | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewPhotoUrls, setReviewPhotoUrls] = useState<string[]>(["", "", ""]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    totalElements: 0,
    hasNext: false,
    hasPrev: false,
    totalPages: 1,
  });

  // Redirect if not logged in or not customer
  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) {
        router.push("/login");
      } else if (String(user.role) !== "CUSTOMER") {
        router.push("/dashboard");
      }
    }
  }, [user, isAuthLoading, router]);

  const fetchOrders = async (pageNum: number) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/orders/customer?page=${pageNum}&limit=10`);
      const data = await res.json() as ApiResponse<OrdersListData<CustomerOrder>>;
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to fetch orders");
      setOrders(data.data.orders);
      setPagination(data.data.pagination);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to fetch orders"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && String(user.role) === "CUSTOMER") {
      fetchOrders(page);
    }
  }, [user, page]);

  // Handle Real-time Socket Updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleOrderStatusUpdate = (payload: OrderStatusEvent) => {
      setOrders((prev) => {
        // Only react if the updated order exists in the current view
        const orderExists = prev.some((o) => o._id === payload.orderId);
        if (!orderExists) return prev;

        toast.info(
          <div className="flex flex-col gap-1">
            <span className="font-bold">🔔 Order Status Updated!</span>
            <span className="text-sm">
              Order <span className="font-mono bg-muted px-1 rounded">#{payload.orderId.slice(-6).toUpperCase()}</span> is now <span className="font-bold text-primary">{payload.status.replace(/_/g, " ")}</span>.
            </span>
          </div>,
          { duration: 6000 }
        );

        return prev.map((o) =>
          o._id === payload.orderId
            ? { ...o, status: payload.status, updatedAt: payload.updatedAt }
            : o
        );
      });
    };

    socket.on("order_status_update", handleOrderStatusUpdate);

    return () => {
      socket.off("order_status_update", handleOrderStatusUpdate);
    };
  }, [socket, isConnected]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "PATCH",
      });
      const data = await res.json() as ApiResponse<{ order: CustomerOrder }>;
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to cancel order");
      }
      toast.success(data.message);
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: "CANCELLED" } : o))
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to cancel order"));
    }
  };

  const handleReorder = async (orderId: string) => {
    setActiveReorderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/reorder`, {
        method: "POST",
      });
      const data = await res.json() as ApiResponse<{
        addedItems: number;
        requestedItems: number;
      }>;

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to reorder items");
      }

      await fetchCart();
      setDrawerOpen(true);
      toast.success(data.message);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to reorder items"));
    } finally {
      setActiveReorderId(null);
    }
  };

  const openReviewDialog = (order: CustomerOrder) => {
    setActiveReviewOrder(order);
    setReviewRating(order.review?.rating ?? 5);
    setReviewComment(order.review?.comment ?? "");
    setReviewPhotoUrls(
      Array.from({ length: 3 }, (_, index) => order.review?.photoUrls?.[index] ?? "")
    );
  };

  const handleSubmitReview = async () => {
    if (!activeReviewOrder) return;

    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/orders/${activeReviewOrder._id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment,
          photoUrls: reviewPhotoUrls.filter((url) => url.trim().length > 0),
        }),
      });
      const data = await res.json() as ApiResponse<{
        review: {
          rating: number;
          comment?: string;
          photoUrls?: string[];
          providerReply?: {
            message: string;
            repliedAt: string;
          } | null;
          createdAt: string;
        };
      }>;

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save review");
      }

      setOrders((current) =>
        current.map((order) =>
          order._id === activeReviewOrder._id
            ? { ...order, review: data.data.review }
            : order
        )
      );
      toast.success(data.message);
      setActiveReviewOrder(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save review"));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "ACCEPTED":
      case "PREPARING":
      case "OUT_FOR_DELIVERY":
        return "default";
      case "DELIVERED":
        return "default"; // or can use custom green
      case "CANCELLED":
      case "REJECTED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getTimelineIndex = (status: OrderStatus) => {
    const index = ORDER_TIMELINE.findIndex((step) => step.key === status);
    if (status === "REJECTED" || status === "CANCELLED") return 0;
    if (index === -1 && status === "READY_FOR_PICKUP") return 2;
    if (index === -1 && status === "PICKED_UP") return 3;
    return index;
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl mt-20">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl mt-20 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 tracking-tight">My Orders</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 mt-12 text-center rounded-2xl border border-dashed text-muted-foreground bg-muted/20">
          <div className="text-4xl mb-4">🛒</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No orders yet
          </h2>
          <p className="mb-6 max-w-sm">
            You have not placed any food orders. Discover amazing local
            restaurants and start eating!
          </p>
          <Button onClick={() => router.push("/restaurants")}>Browse Restaurants</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order._id} className="overflow-hidden">
              <CardHeader className="bg-muted/40 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle>{order.restaurant?.name || "Unknown Restaurant"}</CardTitle>
                    <CardDescription>
                      Order ID: {order._id.slice(-6).toUpperCase()} •{" "}
                      {format(new Date(order.createdAt), "MMM d, yyyy h:mm a")}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground hidden sm:block">Total</p>
                      <p className="font-bold text-lg">{formatCurrency(order.totalAmount)}</p>
                    </div>
                    <motion.div
                      key={order.status} // Re-animate every time status changes
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Badge variant={getStatusBadgeVariant(order.status)} className="px-3 py-1 uppercase text-[10px] tracking-wider font-bold shadow-sm">
                        {order.status.replace(/_/g, " ")}
                      </Badge>
                    </motion.div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-5">
                  {ORDER_TIMELINE.map((step, index) => {
                    const Icon = step.icon;
                    const activeIndex = getTimelineIndex(order.status);
                    const isComplete = activeIndex >= index && !["CANCELLED", "REJECTED"].includes(order.status);
                    const isCurrent = activeIndex === index && !["CANCELLED", "REJECTED"].includes(order.status);

                    return (
                      <div key={step.key} className="relative rounded-2xl border p-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full ${
                              isComplete
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{step.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {isCurrent ? "Current step" : isComplete ? "Done" : "Pending"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Accordion type="single" collapsible className="w-full border-none">
                  <AccordionItem value="items" className="border-none">
                    <AccordionTrigger className="hover:no-underline py-0 text-sm font-medium">
                      View Order Details ({order.items.reduce((acc, i) => acc + i.quantity, 0)} items)
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-0">
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 font-medium">
                                {item.quantity}
                              </Badge>
                              <span>{item.name}</span>
                            </div>
                            <span className="text-muted-foreground">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <Separator className="my-4" />
                      
                      <div className="text-sm">
                        <span className="font-semibold block mb-1">Delivering to:</span>
                        <span className="text-muted-foreground block">
                          {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.pincode}
                        </span>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>

              <CardFooter className="pt-0 justify-end gap-3">
                {!["DELIVERED", "CANCELLED", "REJECTED"].includes(order.status) && (
                  <Button asChild size="sm">
                    <Link href={`/orders/${order._id}`}>Track Order</Link>
                  </Button>
                )}
                {order.status === "DELIVERED" && (
                  <Button
                    variant={order.review ? "outline" : "default"}
                    size="sm"
                    onClick={() => openReviewDialog(order)}
                  >
                    {order.review ? "Edit Review" : "Rate Order"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReorder(order._id)}
                  disabled={activeReorderId === order._id}
                >
                  {activeReorderId === order._id ? "Reordering..." : "Reorder"}
                </Button>
                {order.status === "PENDING" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancelOrder(order._id)}
                  >
                    Cancel Order
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}

          {/* Pagination Controls */}
          {(pagination.hasNext || pagination.hasPrev) && (
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                disabled={!pagination.hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={!pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={Boolean(activeReviewOrder)} onOpenChange={(open) => !open && setActiveReviewOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate Your Order</DialogTitle>
            <DialogDescription>
              Share your feedback after delivery. Your rating helps other customers discover great restaurants.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <p className="mb-3 text-sm font-medium">Your rating</p>
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, index) => {
                  const starValue = index + 1;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setReviewRating(starValue)}
                      className="rounded-full p-2 transition hover:bg-amber-50"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          starValue <= reviewRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-zinc-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Comment</p>
              <Textarea
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder="What did you enjoy? What could be better?"
                rows={5}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Food photo URLs</p>
              <div className="space-y-2">
                {reviewPhotoUrls.map((url, index) => (
                  <Input
                    key={index}
                    value={url}
                    onChange={(event) =>
                      setReviewPhotoUrls((current) =>
                        current.map((value, valueIndex) =>
                          valueIndex === index ? event.target.value : value
                        )
                      )
                    }
                    placeholder={`Photo URL ${index + 1}`}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Add up to 3 image links for food photos.
              </p>
            </div>

            <Button className="w-full" onClick={handleSubmitReview} disabled={isSubmittingReview}>
              {isSubmittingReview ? "Saving review..." : "Submit Review"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
