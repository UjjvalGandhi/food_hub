"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SafeImage } from "@/components/shared/SafeImage";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import {
  ArrowLeft,
  Copy,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Share2,
  ShoppingCart,
  Users,
} from "lucide-react";

type GroupOrderItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  user: {
    _id: string;
    name: string;
  };
  lineTotal: number;
};

type Participant = {
  userId: string;
  name: string;
  subtotal: number;
  paymentStatus: string;
  itemCount: number;
  items: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
};

type GroupOrderData = {
  _id: string;
  inviteCode: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  creator: {
    _id: string;
    name: string;
  };
  restaurant: {
    _id: string;
    name: string;
    logo?: string;
    address: string;
    city: string;
    rating: number;
  };
  items: GroupOrderItem[];
  participants: Participant[];
  splitPreview: {
    equalShare: number;
    byItem: Array<{
      userId: string;
      name: string;
      amountOwed: number;
    }>;
  };
};

type MenuItemType = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  isVeg: boolean;
};

type CategoryGroup = {
  category: {
    _id: string;
    name: string;
  };
  items: MenuItemType[];
};

export default function GroupOrderPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const { user } = useAuth();
  const { socket } = useSocket();

  const [groupOrder, setGroupOrder] = useState<GroupOrderData | null>(null);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [splitType, setSplitType] = useState<"BY_ITEM" | "EQUAL">("BY_ITEM");
  const [paymentMode, setPaymentMode] = useState<"HOST_PAYS" | "SPLIT">("HOST_PAYS");
  const [checkoutForm, setCheckoutForm] = useState({
    street: "",
    city: "",
    pincode: "",
  });
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const fetchGroupOrder = useCallback(async () => {
    const response = await fetch(`/api/group-orders/${code}`);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Failed to load group order");
    }
    setGroupOrder(result.data);
    return result.data as GroupOrderData;
  }, [code]);

  const fetchMenu = useCallback(async (restaurantId: string) => {
    const response = await fetch(`/api/restaurants/${restaurantId}`);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Failed to load menu");
    }
    setCategories(result.categories || []);
  }, []);

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const order = await fetchGroupOrder();
        await fetchMenu(order.restaurant._id);
        setCheckoutForm((current) => ({
          street: current.street,
          city: current.city || order.restaurant.city || "",
          pincode: current.pincode,
        }));
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to load group order"));
      } finally {
        setIsLoading(false);
      }
    }

    if (code) {
      init();
    }
  }, [code, fetchGroupOrder, fetchMenu]);

  useEffect(() => {
    async function joinOrder() {
      const alreadyJoined = groupOrder?.participants.some((participant) => participant.userId === user?.id);
      if (!user || !groupOrder || alreadyJoined) return;

      try {
        const response = await fetch("/api/group-order/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inviteCode: code }),
        });
        const result = await response.json();
        if (response.ok && result.data) {
          setGroupOrder(result.data);
        }
      } catch {
        // Best-effort join for authenticated customers.
      }
    }

    joinOrder();
  }, [code, groupOrder, user]);

  useEffect(() => {
    if (!socket || !groupOrder?._id) return;

    socket.emit("joinGroupOrder", groupOrder._id);
    const eventName = `group-order-updated:${groupOrder._id}`;
    const handleUpdate = (updatedOrder: GroupOrderData) => setGroupOrder(updatedOrder);

    socket.on(eventName, handleUpdate);

    return () => {
      socket.off(eventName, handleUpdate);
      socket.emit("leaveGroupOrder", groupOrder._id);
    };
  }, [groupOrder?._id, socket]);

  const myParticipant = useMemo(
    () => groupOrder?.participants.find((participant) => participant.userId === user?.id) ?? null,
    [groupOrder?.participants, user?.id]
  );
  const isHost = groupOrder?.creator._id === user?.id;
  const shareableLink = typeof window !== "undefined" ? `${window.location.origin}/group-order/${code}` : "";

  const handleUpdateItem = async (menuItem: MenuItemType, action: "ADD" | "UPDATE" | "REMOVE", quantity = 1) => {
    if (!user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/group-order/${code}`)}`);
      return;
    }

    setActiveItemId(menuItem._id);
    try {
      const response = await fetch(`/api/group-orders/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuItemId: menuItem._id,
          quantity,
          action,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to update group cart");
      setGroupOrder(result.data);
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to update group cart"));
    } finally {
      setActiveItemId(null);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareableLink);
    toast.success("Invite link copied");
  };

  const handleCheckout = async () => {
    if (!groupOrder) return;

    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/group-order/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: code,
          paymentMode,
          splitType,
          deliveryAddress: checkoutForm,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Checkout failed");
      toast.success(
        paymentMode === "HOST_PAYS"
          ? "Shared cart placed successfully"
          : "Group order locked with split summary"
      );
      await fetchGroupOrder();
    } catch (error) {
      toast.error(getErrorMessage(error, "Checkout failed"));
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 space-y-8">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-[32rem] lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-[32rem] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!groupOrder) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-2">Group Order Not Found</h2>
        <p className="text-zinc-500 mb-6">This invite link is invalid or has expired.</p>
        <Button onClick={() => router.push("/restaurants")}>Browse Restaurants</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 gap-2"
          onClick={() => router.push(`/restaurants/${groupOrder.restaurant._id}`)}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to restaurant
        </Button>

        <Card className="mb-8 overflow-hidden border-none bg-white dark:bg-zinc-900 shadow-xl">
          <div className="p-6 md:p-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-zinc-100 flex items-center justify-center">
                {groupOrder.restaurant.logo ? (
                  <SafeImage src={groupOrder.restaurant.logo} alt={groupOrder.restaurant.name} fill className="object-cover" />
                ) : (
                  <span className="text-2xl">🍽️</span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Shared Group Order</h1>
                <p className="text-sm text-zinc-500 mt-1">
                  {groupOrder.restaurant.name} • {groupOrder.restaurant.city}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline">Code: {groupOrder.inviteCode}</Badge>
                  <Badge variant="secondary">Status: {groupOrder.status}</Badge>
                  <Badge variant="outline">{groupOrder.participants.length} participants</Badge>
                </div>
              </div>
            </div>

            <div className="w-full md:w-[24rem] rounded-2xl border bg-zinc-50 dark:bg-zinc-950 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">Share this link</p>
              <div className="flex gap-2">
                <Input value={shareableLink} readOnly className="bg-white dark:bg-zinc-900" />
                <Button onClick={handleCopyLink} className="gap-2">
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              </div>
              <p className="text-xs text-zinc-500 mt-3 flex items-center gap-1">
                <Share2 className="w-3 h-3" />
                Friends can join, add their own items, and split the bill.
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Participants</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {groupOrder.participants.map((participant) => (
                  <div key={participant.userId} className="rounded-2xl border p-4 bg-zinc-50/70 dark:bg-zinc-950/60">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{participant.name}</p>
                        <p className="text-sm text-zinc-500">
                          {participant.itemCount} items • {formatCurrency(participant.subtotal)}
                        </p>
                      </div>
                      <Badge variant={participant.userId === groupOrder.creator._id ? "default" : "outline"}>
                        {participant.userId === groupOrder.creator._id ? "Host" : participant.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {categories.map((group) => (
              <section key={group.category._id}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">{group.category.name}</h2>
                  <Badge variant="secondary">{group.items.length}</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {group.items.map((item) => {
                    const myItem = myParticipant?.items.find((entry) => entry.menuItemId === item._id);
                    return (
                      <Card key={item._id} className="p-4">
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-3 h-3 rounded-sm border ${
                                  item.isVeg ? "border-green-600 bg-green-600/20" : "border-red-600 bg-red-600/20"
                                }`}
                              />
                              <h3 className="font-semibold">{item.name}</h3>
                            </div>
                            <p className="text-sm text-zinc-500 mt-2 line-clamp-2">{item.description}</p>
                            <p className="font-bold mt-3">{formatCurrency(item.price)}</p>

                            <div className="mt-4 flex items-center gap-2">
                              {myItem ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={activeItemId === item._id}
                                    onClick={() =>
                                      handleUpdateItem(item, "UPDATE", Math.max(myItem.quantity - 1, 0))
                                    }
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <span className="w-8 text-center font-semibold">{myItem.quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={activeItemId === item._id}
                                    onClick={() => handleUpdateItem(item, "UPDATE", myItem.quantity + 1)}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  className="w-full"
                                  disabled={!item.isAvailable || activeItemId === item._id}
                                  onClick={() => handleUpdateItem(item, "ADD", 1)}
                                >
                                  {activeItemId === item._id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add to shared cart"}
                                </Button>
                              )}
                            </div>
                          </div>

                          {item.image ? (
                            <div className="relative w-24 h-24 rounded-xl overflow-hidden border flex-shrink-0">
                              <SafeImage src={item.image} alt={item.name} fill className="object-cover" />
                            </div>
                          ) : null}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="space-y-6">
            <Card className="p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-5">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Shared Cart</h2>
              </div>

              <div className="space-y-3">
                {groupOrder.items.length === 0 ? (
                  <p className="text-sm text-zinc-500">No items yet. Invite your team and start adding dishes.</p>
                ) : (
                  groupOrder.items.map((item) => (
                    <div key={`${item.user._id}-${item.menuItemId}`} className="rounded-xl border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-zinc-500">
                            {item.user.name} added {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold">{formatCurrency(item.lineTotal)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 pt-5 border-t space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Group total</span>
                  <span className="font-bold">{formatCurrency(groupOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Equal share</span>
                  <span>{formatCurrency(groupOrder.splitPreview.equalShare)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">Split & Checkout</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Payment mode</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={paymentMode === "HOST_PAYS" ? "default" : "outline"}
                      onClick={() => setPaymentMode("HOST_PAYS")}
                    >
                      Host pays
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMode === "SPLIT" ? "default" : "outline"}
                      onClick={() => setPaymentMode("SPLIT")}
                    >
                      Split bill
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Split style</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={splitType === "BY_ITEM" ? "default" : "outline"}
                      onClick={() => setSplitType("BY_ITEM")}
                    >
                      By items
                    </Button>
                    <Button
                      type="button"
                      variant={splitType === "EQUAL" ? "default" : "outline"}
                      onClick={() => setSplitType("EQUAL")}
                    >
                      Equal
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border p-4 bg-zinc-50/80 dark:bg-zinc-950/60">
                  <p className="text-sm font-medium mb-3">Current split preview</p>
                  <div className="space-y-2">
                    {(splitType === "EQUAL"
                      ? groupOrder.participants.map((participant) => ({
                          userId: participant.userId,
                          name: participant.name,
                          amountOwed: groupOrder.splitPreview.equalShare,
                        }))
                      : groupOrder.splitPreview.byItem
                    ).map((split) => (
                      <div key={split.userId} className="flex justify-between text-sm">
                        <span>{split.name}</span>
                        <span>{formatCurrency(split.amountOwed)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {isHost ? (
                  <>
                    <div className="space-y-3">
                      <Input
                        value={checkoutForm.street}
                        onChange={(event) => setCheckoutForm((current) => ({ ...current, street: event.target.value }))}
                        placeholder="Delivery street address"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          value={checkoutForm.city}
                          onChange={(event) => setCheckoutForm((current) => ({ ...current, city: event.target.value }))}
                          placeholder="City"
                        />
                        <Input
                          value={checkoutForm.pincode}
                          onChange={(event) => setCheckoutForm((current) => ({ ...current, pincode: event.target.value }))}
                          placeholder="Pincode"
                        />
                      </div>
                    </div>

                    <Button className="w-full" onClick={handleCheckout} disabled={isCheckingOut || groupOrder.items.length === 0}>
                      {isCheckingOut ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing
                        </>
                      ) : paymentMode === "HOST_PAYS" ? (
                        "Place shared order"
                      ) : (
                        "Lock split and place order"
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed p-4 text-sm text-zinc-500">
                    The host completes checkout. Your share is currently{" "}
                    <span className="font-semibold text-foreground">
                      {formatCurrency(
                        splitType === "EQUAL"
                          ? groupOrder.splitPreview.equalShare
                          : myParticipant?.subtotal ?? 0
                      )}
                    </span>
                    .
                  </div>
                )}

                <div className="text-xs text-zinc-500 flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  Use one delivery address for the whole office or family order.
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
