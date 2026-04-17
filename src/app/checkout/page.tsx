"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CircleCheckBig,
  CreditCard,
  MapPin,
  Minus,
  Plus,
  QrCode,
  Receipt,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { UserRole } from "@/constants/roles";
import type { ApiResponse, CustomerOrder } from "@/types";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

type PaymentStep = "idle" | "cod" | "online";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function FakeQrCode() {
  const cells = [
    "111111101011111",
    "100000100010001",
    "101110101110101",
    "101110100010101",
    "101110101010101",
    "100000100000001",
    "111111101111111",
    "000100001000100",
    "111011111010111",
    "100010001010001",
    "101110111011101",
    "101000001000101",
    "101011111110101",
    "100000001000001",
    "111111101011111",
  ];

  return (
    <div className="grid grid-cols-15 gap-0 rounded-2xl bg-white p-3 shadow-inner">
      {cells.join("").split("").map((cell, index) => (
        <div
          key={index}
          className={cell === "1" ? "h-3 w-3 bg-zinc-900" : "h-3 w-3 bg-white"}
        />
      ))}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    cart,
    isLoading: isCartLoading,
    fetchCart,
    updateQuantity,
    removeItem,
    setDrawerOpen,
  } = useCart();

  const [address, setAddress] = useState({ street: "", city: "", pincode: "" });
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("COD");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentStep, setPaymentStep] = useState<PaymentStep>("idle");
  const [paymentCountdown, setPaymentCountdown] = useState(3);

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) {
        router.replace("/login?callbackUrl=/checkout");
      } else if (String(user.role) !== UserRole.CUSTOMER) {
        router.replace("/dashboard");
      }
    }
  }, [isAuthLoading, router, user]);

  useEffect(() => {
    if (user && String(user.role) === UserRole.CUSTOMER) {
      fetchCart();
    }
  }, [fetchCart, user]);

  const placeOrder = async () => {
    try {
      setIsPlacingOrder(true);
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryAddress: address,
          paymentMethod,
        }),
      });

      const data = await response.json() as ApiResponse<{ order: CustomerOrder }>;
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to place order");
      }

      toast.success(
        paymentMethod === "ONLINE"
          ? "Payment approved and order placed successfully."
          : data.message
      );
      await fetchCart();
      setAddress({ street: "", city: "", pincode: "" });
      setPaymentStep("idle");
      setPaymentCountdown(3);
      router.push("/orders");
    } catch (error) {
      setPaymentStep("idle");
      toast.error(getErrorMessage(error, "Failed to place order"));
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!cart || cart.items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!address.street || !address.city || !address.pincode) {
      toast.error("Please fill in your complete delivery address.");
      return;
    }

    if (!/^\d{6}$/.test(address.pincode.trim())) {
      toast.error("Please enter a valid 6-digit pincode.");
      return;
    }

    if (paymentMethod === "ONLINE") {
      setPaymentStep("online");
      setPaymentCountdown(3);

      for (const nextCount of [3, 2, 1]) {
        setPaymentCountdown(nextCount);
        await wait(1000);
      }

      await placeOrder();
      return;
    }

    setPaymentStep("cod");
    await wait(1800);
    await placeOrder();
  };

  if (isAuthLoading || isCartLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <Skeleton className="h-[32rem] rounded-3xl" />
          <Skeleton className="h-[32rem] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-28 text-center sm:px-6 lg:px-8">
        <Card className="rounded-[2rem]">
          <CardContent className="px-6 py-16">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h1 className="mt-5 text-3xl font-black tracking-tight">Your checkout is empty</h1>
            <p className="mt-3 text-muted-foreground">
              Add a few dishes first and then come back here to place your order.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-2xl">
                <Link href="/restaurants">Browse restaurants</Link>
              </Button>
              <Button variant="outline" className="rounded-2xl" onClick={() => setDrawerOpen(true)}>
                Open cart drawer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-16 pt-28 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="outline" className="mb-3 rounded-full px-3 py-1">Checkout</Badge>
            <h1 className="text-4xl font-black tracking-tight">Review and place your order</h1>
            <p className="mt-2 text-muted-foreground">
              Confirm your items, delivery address, and payment method.
            </p>
          </div>
          <Button variant="outline" className="rounded-2xl" asChild>
            <Link href="/restaurants">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue shopping
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            <Card className="rounded-[2rem] border-zinc-200/80 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Order items
                </CardTitle>
                <CardDescription>
                  From {cart.restaurant.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.items.map((item) => (
                  <div
                    key={item.menuItem}
                    className="flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatCurrency(item.price)} each
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <div className="flex items-center gap-2 rounded-xl border px-2 py-1">
                        <button
                          type="button"
                          className="rounded p-1 hover:bg-muted"
                          onClick={() => {
                            if (item.quantity === 1) {
                              removeItem(item.menuItem);
                            } else {
                              updateQuantity(item.menuItem, item.quantity - 1);
                            }
                          }}
                        >
                          {item.quantity === 1 ? (
                            <Trash2 className="h-4 w-4" />
                          ) : (
                            <Minus className="h-4 w-4" />
                          )}
                        </button>
                        <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          className="rounded p-1 hover:bg-muted"
                          onClick={() => updateQuantity(item.menuItem, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="min-w-20 text-right font-bold">
                        {formatCurrency(item.quantity * item.price)}
                      </p>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => setDrawerOpen(true)}
                >
                  Edit in cart drawer
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-zinc-200/80 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Delivery address
                </CardTitle>
                <CardDescription>
                  We will use this address for the current order.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street address</Label>
                  <Input
                    id="street"
                    placeholder="123 Main St, Apt 4B"
                    value={address.street}
                    onChange={(event) => setAddress({ ...address, street: event.target.value })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Mumbai"
                      value={address.city}
                      onChange={(event) => setAddress({ ...address, city: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="400001"
                      value={address.pincode}
                      onChange={(event) => setAddress({ ...address, pincode: event.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-zinc-200/80 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment method
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant={paymentMethod === "COD" ? "default" : "outline"}
                  className="h-16 justify-start rounded-2xl"
                  onClick={() => setPaymentMethod("COD")}
                >
                  <div className="text-left">
                    <div className="font-semibold">Cash on delivery</div>
                    <div className="text-xs opacity-75">Pay when your food arrives</div>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === "ONLINE" ? "default" : "outline"}
                  className="h-16 justify-start rounded-2xl"
                  onClick={() => setPaymentMethod("ONLINE")}
                >
                  <div className="text-left">
                    <div className="font-semibold">Online payment</div>
                    <div className="text-xs opacity-75">Quick QR demo approval</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-24 rounded-[2rem] border-zinc-200/80 shadow-sm">
              <CardHeader>
                <CardTitle>Order summary</CardTitle>
                <CardDescription>
                  {cart.items.reduce((sum, item) => sum + item.quantity, 0)} item(s) in your cart
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div key={item.menuItem} className="flex items-start justify-between text-sm">
                      <span className="max-w-[70%] text-muted-foreground">
                        {item.quantity} x {item.name}
                      </span>
                      <span className="font-medium">{formatCurrency(item.quantity * item.price)}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl bg-muted/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total payable</span>
                    <span className="text-2xl font-black">{formatCurrency(cart.totalAmount)}</span>
                  </div>
                </div>

                <Button type="submit" className="h-12 w-full rounded-2xl text-base" disabled={isPlacingOrder}>
                  {isPlacingOrder ? "Placing order..." : "Place order"}
                  {!isPlacingOrder ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>

      <Dialog
        open={paymentStep !== "idle"}
        onOpenChange={(open) => {
          if (!open && !isPlacingOrder) {
            setPaymentStep("idle");
            setPaymentCountdown(3);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          {paymentStep === "cod" ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">Cash on Delivery Confirmed</DialogTitle>
                <DialogDescription className="text-center">
                  Preparing your order and collecting payment at delivery.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-5 py-4">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <div className="absolute inset-0 animate-ping rounded-full bg-emerald-200" />
                  <Banknote className="relative h-10 w-10" />
                </div>
                <div className="rounded-full bg-muted px-4 py-2 text-sm font-medium">
                  Collect {formatCurrency(cart?.totalAmount ?? 0)} on delivery
                </div>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">Scan QR to Pay</DialogTitle>
                <DialogDescription className="text-center">
                  This demo QR auto-approves payment after 3 seconds.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-5 py-4">
                <div className="rounded-[2rem] border bg-zinc-50 p-5">
                  <div className="mb-4 flex items-center justify-center gap-2 text-sm font-medium text-zinc-500">
                    <QrCode className="h-4 w-4" />
                    UPI Demo QR
                  </div>
                  <FakeQrCode />
                </div>
                <div className="w-full max-w-xs">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Approving payment</span>
                    <span className="font-semibold">{paymentCountdown}s</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-1000"
                      style={{ width: `${((4 - paymentCountdown) / 3) * 100}%` }}
                    />
                  </div>
                </div>
                {paymentCountdown <= 1 ? (
                  <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                    <CircleCheckBig className="h-4 w-4" />
                    Payment approved
                  </div>
                ) : null}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
