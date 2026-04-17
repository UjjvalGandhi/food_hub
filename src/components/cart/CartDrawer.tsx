"use client";

import { useCart } from "@/context/CartContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  Banknote,
  QrCode,
  CircleCheckBig,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ApiResponse, CustomerOrder } from "@/types";
import { formatCurrency, getErrorMessage } from "@/lib/utils";

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

export function CartDrawer() {
  const {
    cart,
    isDrawerOpen,
    setDrawerOpen,
    updateQuantity,
    removeItem,
    fetchCart,
    warningModalOpen,
    setWarningModalOpen,
    confirmSwitchRestaurant,
  } = useCart();
  const router = useRouter();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [address, setAddress] = useState({ street: "", city: "", pincode: "" });
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("COD");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentStep, setPaymentStep] = useState<PaymentStep>("idle");
  const [paymentCountdown, setPaymentCountdown] = useState(3);

  const placeOrder = async () => {
    try {
      setIsPlacingOrder(true);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryAddress: address, paymentMethod }),
      });

      const response = await res.json() as ApiResponse<{ order: CustomerOrder }>;

      if (!res.ok || !response.success) {
        throw new Error(response.message || "Failed to place order.");
      }

      toast.success(
        paymentMethod === "ONLINE"
          ? "Payment approved and order placed successfully."
          : response.message
      );
      await fetchCart();
      setDrawerOpen(false);
      setIsCheckingOut(false);
      setAddress({ street: "", city: "", pincode: "" });
      setPaymentStep("idle");
      setPaymentCountdown(3);
      router.push("/orders");
    } catch (error) {
      setPaymentStep("idle");
      toast.error(getErrorMessage(error, "Failed to place order."));
    } finally {
      setIsPlacingOrder(false);
    }
  };
 
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <>
      <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-md p-0">
          <SheetHeader className="px-6 pt-6 pb-2 border-b">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Your Cart
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-hidden">
            {!cart || cart.items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Looks like you have not added any food yet.
                </p>
                <Button
                  onClick={() => {
                    setDrawerOpen(false);
                    router.push("/restaurants");
                  }}
                >
                  Browse Restaurants
                </Button>
              </div>
            ) : (
              <div className="flex h-full flex-col">
                <ScrollArea className="flex-1 p-6">
                  <div className="mb-4">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      From {cart.restaurant.name}
                    </h4>
                  </div>
                  <div className="flex flex-col gap-6">
                    {cart.items.map((item) => (
                      <div key={item.menuItem} className="flex gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <p className="text-muted-foreground text-sm mt-1">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="font-semibold">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                          <div className="flex items-center gap-2 rounded-md border p-1">
                            <button
                              type="button"
                              className="p-1 hover:bg-muted rounded text-muted-foreground disabled:opacity-50"
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
                            <span className="w-4 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              className="p-1 hover:bg-muted rounded text-muted-foreground"
                              onClick={() => updateQuantity(item.menuItem, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {isCheckingOut && (
                    <div className="mt-8 border-t pt-6">
                      <h3 className="font-semibold mb-4">Delivery Details</h3>
                      <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="street">Street Address</Label>
                          <Input
                            id="street"
                            required
                            placeholder="123 Main St, Apt 4B"
                            value={address.street}
                            onChange={(e) => setAddress({ ...address, street: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              required
                              placeholder="Mumbai"
                              value={address.city}
                              onChange={(e) => setAddress({ ...address, city: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="pincode">Pincode</Label>
                            <Input
                              id="pincode"
                              required
                              inputMode="numeric"
                              maxLength={6}
                              placeholder="400001"
                              value={address.pincode}
                              onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="mt-6 border-t pt-4">
                          <Label className="text-sm font-semibold mb-3 block">Payment Method</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              type="button"
                              variant={paymentMethod === "COD" ? "default" : "outline"}
                              className="w-full justify-start h-12"
                              onClick={() => setPaymentMethod("COD")}
                            >
                              <div className="flex flex-col items-start">
                                <span className="font-medium">Cash</span>
                                <span className="text-[10px] opacity-70">On Delivery</span>
                              </div>
                            </Button>
                            <Button
                              type="button"
                              variant={paymentMethod === "ONLINE" ? "default" : "outline"}
                              className="w-full justify-start h-12"
                              onClick={() => setPaymentMethod("ONLINE")}
                            >
                              <div className="flex flex-col items-start">
                                <span className="font-medium">Online</span>
                                <span className="text-[10px] opacity-70">Pay Now</span>
                              </div>
                            </Button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}
                </ScrollArea>

                <div className="border-t p-6 pb-8 bg-muted/30">
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold">{formatCurrency(cart.totalAmount)}</span>
                  </div>

                  {isCheckingOut ? (
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setIsCheckingOut(false)}
                        disabled={isPlacingOrder}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        form="checkout-form"
                        className="flex-1"
                        disabled={isPlacingOrder}
                      >
                        {isPlacingOrder ? "Placing Order..." : "Place Order"}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full text-base py-6"
                      onClick={() => setIsCheckingOut(true)}
                    >
                      Proceed to Checkout
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Warning Modal for Switching Restaurants */}
      <Dialog open={warningModalOpen} onOpenChange={setWarningModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch Restaurants?</DialogTitle>
            <DialogDescription>
              Your cart currently contains items from another restaurant. Adding this item will clear your current cart. Do you wish to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setWarningModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmSwitchRestaurant}>
              Clear Cart & Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  Preparing your order and marking payment for delivery collection.
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
                  Show this QR code for 3 seconds. Payment will auto-confirm in this demo flow.
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
    </>
  );
}
