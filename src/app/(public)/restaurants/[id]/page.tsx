"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/shared/SafeImage";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { UserRole } from "@/constants/roles";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import { Heart, Loader2, MapPin, ShoppingCart, Star, Clock, Users } from "lucide-react";
import { toast } from "sonner";

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

type RestaurantDetail = {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  city: string;
  state: string;
  address: string;
  pincode: string;
  rating: number;
  totalReviews: number;
  isOpen: boolean;
  isFavorite?: boolean;
};

type RestaurantReview = {
  _id: string;
  rating: number;
  comment?: string;
  photoUrls?: string[];
  providerReply?: {
    message: string;
    repliedAt: string;
  } | null;
  createdAt: string;
  user: {
    _id: string;
    name: string;
  };
};

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuth();
  const { addItem } = useCart();
  
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [reviews, setReviews] = useState<RestaurantReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isStartingGroupOrder, setIsStartingGroupOrder] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      if (!id) return;
      try {
        setIsLoading(true);
        const response = await fetch(`/api/restaurants/${id}`);
        if (!response.ok) {
          if (response.status === 404) throw new Error("Restaurant not found.");
          throw new Error("Failed to load restaurant details.");
        }
        
        const data = await response.json();
        setRestaurant(data.restaurant);
        setCategories(data.categories || []);
        setReviews(data.reviews || []);
      } catch (error) {
        setError(getErrorMessage(error, "Failed to load restaurant details."));
      } finally {
        setIsLoading(false);
      }
    }

    fetchDetails();
  }, [id]);

  const isCustomer = String(user?.role) === UserRole.CUSTOMER;
  const canOrder = Boolean(restaurant?.isOpen) && (!user || isCustomer);

  const handleAddToCart = async (menuItemId: string) => {
    if (!restaurant) return;

    if (!user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/restaurants/${restaurant._id}`)}`);
      return;
    }

    setActiveItemId(menuItemId);
    try {
      await addItem(menuItemId, 1, restaurant._id);
    } finally {
      setActiveItemId(null);
    }
  };

  const handleStartGroupOrder = async () => {
    if (!restaurant || !user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/restaurants/${id}`)}`);
      return;
    }

    setIsStartingGroupOrder(true);
    try {
      const response = await fetch("/api/group-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ restaurantId: restaurant._id }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to start group order");

      toast.success("Group order started!");
      router.push(`/group-order/${data.data.inviteCode}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to start group order"));
    } finally {
      setIsStartingGroupOrder(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!restaurant) return;
    if (!user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/restaurants/${restaurant._id}`)}`);
      return;
    }

    setIsTogglingFavorite(true);
    try {
      const shouldFavorite = !restaurant.isFavorite;
      const response = await fetch(`/api/restaurants/${restaurant._id}/favorite`, {
        method: shouldFavorite ? "POST" : "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update favorites");
      setRestaurant((current) => (current ? { ...current, isFavorite: data.data.isFavorite } : current));
      toast.success(data.message);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update favorites"));
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
        {/* Skeleton Top Banner */}
        <Skeleton className="w-full h-64 md:h-80 lg:h-96 rounded-none object-cover" />
        <div className="container mx-auto px-4 max-w-6xl -mt-16 md:-mt-24 relative z-10">
           <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-zinc-950 shadow-md mb-4" />
           <Skeleton className="h-10 w-64 mb-4" />
           <Skeleton className="h-5 w-full max-w-xl mb-6" />
           
           <div className="mt-12 space-y-8">
             <Skeleton className="h-8 w-48 mb-6" />
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <Skeleton className="h-32 w-full rounded-xl" />
               <Skeleton className="h-32 w-full rounded-xl" />
               <Skeleton className="h-32 w-full rounded-xl" />
             </div>
           </div>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <span className="text-6xl mb-4">🏪</span>
        <h2 className="text-2xl font-bold mb-2">Oops!</h2>
        <p className="text-zinc-500 mb-6 max-w-md text-center">
          {error || "We couldn't find the restaurant you were looking for. It might be closed or unapproved."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24">
      {/* 1. Hero Cover Banner */}
      <div className="w-full h-64 md:h-80 lg:h-96 relative bg-zinc-200 dark:bg-zinc-900 overflow-hidden">
        {restaurant.coverImage ? (
          <SafeImage
            src={restaurant.coverImage}
            alt={`${restaurant.name} cover`}
            fill
            priority
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary flex items-center justify-center text-white/20 text-9xl">
            🍽️
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl -mt-16 md:-mt-24 relative z-10">
        
        {/* 2. Restaurant Header Box */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-end border border-zinc-100 dark:border-zinc-800">
          
          <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-2xl border-4 border-white dark:border-zinc-900 shadow-md bg-white flex items-center justify-center overflow-hidden flex-shrink-0 -mt-16 md:-mt-20">
            {restaurant.logo ? (
              <SafeImage
                src={restaurant.logo}
                alt={`${restaurant.name} logo`}
                fill
                className="object-contain p-2"
              />
            ) : (
              <span className="text-5xl">🏪</span>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-2">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                    {restaurant.name}
                  </h1>
                  {restaurant.isOpen ? (
                    <Badge className="bg-green-500 hover:bg-green-600 text-white border-transparent">Open</Badge>
                  ) : (
                    <Badge variant="secondary">Closed</Badge>
                  )}
                  <Button
                    variant={restaurant.isFavorite ? "default" : "outline"}
                    size="sm"
                    className="gap-2"
                    disabled={isTogglingFavorite}
                    onClick={handleToggleFavorite}
                  >
                    {isTogglingFavorite ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Heart className={`w-4 h-4 ${restaurant.isFavorite ? "fill-current" : ""}`} />
                    )}
                    {!user ? "Log in to save" : restaurant.isFavorite ? "Saved" : "Save"}
                  </Button>
                  {isCustomer && restaurant.isOpen && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-2 gap-2"
                      onClick={handleStartGroupOrder}
                      disabled={isStartingGroupOrder}
                    >
                      {isStartingGroupOrder ? (
                         <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Users className="w-4 h-4" />
                      )}
                      Start Group Order
                    </Button>
                  )}
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base mb-4 max-w-2xl line-clamp-2">
                  {restaurant.description}
                </p>
              </div>
              
              {/* Stats Box */}
              <div className="flex md:flex-col gap-4 md:gap-2 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 font-semibold text-lg text-zinc-900 dark:text-zinc-50">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                  <span>{restaurant.rating > 0 ? restaurant.rating.toFixed(1) : "New"}</span>
                </div>
                {restaurant.totalReviews > 0 && (
                  <span className="text-xs text-zinc-500 font-medium">
                    {restaurant.totalReviews}+ ratings
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-300">
              <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                <MapPin className="w-4 h-4 text-primary" />
                {restaurant.city}, {restaurant.state}
              </span>
              <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                <Clock className="w-4 h-4 text-primary" />
                Delivery: 30-45 min
              </span>
            </div>
          </div>
        </div>

        {/* 3. Menu Content Grouped by Categories */}
        <div className="mt-12 space-y-12">
          {categories.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <span className="text-4xl block mb-4">📋</span>
              <h3 className="text-lg font-bold">No Menu Items Yet</h3>
              <p className="text-zinc-500">This restaurant has not mapped their menu catalog yet.</p>
            </div>
          ) : (
            categories.map((group) => {
              // Hide empty categories
              if (group.items.length === 0) return null;

              return (
                <div key={group.category._id} className="scroll-mt-24" id={`cat-${group.category._id}`}>
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-6 flex items-center gap-2">
                    {group.category.name}
                    <span className="text-sm font-normal text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full">
                      {group.items.length}
                    </span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {group.items.map((item) => (
                      <Card 
                        key={item._id} 
                        className={`overflow-hidden border-zinc-200 dark:border-zinc-800 transition-all hover:border-primary/50 ${!item.isAvailable && 'opacity-60 grayscale-[0.5]'}`}
                      >
                        <div className="flex h-full p-4 gap-4">
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <div className="flex items-start gap-2 mb-1">
                                {/* Veg / Non-Veg Standardized Indian Icon */}
                                <div className={`w-4 h-4 mt-0.5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                                </div>
                                <h3 className="font-semibold text-lg leading-tight line-clamp-2 text-zinc-900 dark:text-white">
                                  {item.name}
                                </h3>
                              </div>
                              <p className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1 mb-2">
                                {formatCurrency(item.price)}
                              </p>
                              {item.description && (
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="mt-4 flex items-center justify-between">
                              {!item.isAvailable && (
                                <Badge variant="secondary" className="text-xs bg-red-50 text-red-600 border-transparent dark:bg-red-950/50">Sold Out</Badge>
                              )}
                              {item.isAvailable && (
                                <Button
                                  size="sm"
                                  className="ml-auto"
                                  disabled={!canOrder || activeItemId === item._id}
                                  onClick={() => handleAddToCart(item._id)}
                                >
                                  {activeItemId === item._id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Adding...
                                    </>
                                  ) : !user ? (
                                    "Log in to order"
                                  ) : !restaurant?.isOpen ? (
                                    "Currently closed"
                                  ) : !isCustomer ? (
                                    "Customer only"
                                  ) : (
                                    <>
                                      <ShoppingCart className="mr-2 h-4 w-4" />
                                      Add to cart
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {/* Optional Item Image Right Rail */}
                          {item.image && (
                            <div className="w-28 h-28 relative rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                              <SafeImage
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <section className="mt-16">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Ratings & Reviews
            </h2>
            <Badge variant="secondary">{restaurant.totalReviews}</Badge>
          </div>

          {reviews.length === 0 ? (
            <Card className="p-6 text-sm text-zinc-500">
              No reviews yet. After delivery, customers can rate their order and leave feedback here.
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review._id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{review.user.name}</p>
                      <p className="text-xs text-zinc-500">
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                      <Star className="w-4 h-4 fill-current" />
                      {review.rating.toFixed(1)}
                    </div>
                  </div>
                  {review.comment ? (
                    <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{review.comment}</p>
                  ) : (
                    <p className="mt-3 text-sm italic text-zinc-400">No written comment.</p>
                  )}

                  {review.photoUrls && review.photoUrls.length > 0 ? (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {review.photoUrls.map((photoUrl) => (
                        <div key={photoUrl} className="relative h-28 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                          <SafeImage src={photoUrl} alt="Review photo" fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {review.providerReply ? (
                    <div className="mt-4 rounded-2xl border bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        Restaurant reply
                      </p>
                      <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                        {review.providerReply.message}
                      </p>
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
