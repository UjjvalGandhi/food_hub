"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MapPin, Star, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/shared/SafeImage";
import { getErrorMessage } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/constants/roles";
import { toast } from "sonner";

type RestaurantListItem = {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  city: string;
  state: string;
  rating: number;
  totalReviews: number;
  isOpen: boolean;
  isFavorite?: boolean;
};

export default function RestaurantsListPage() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<RestaurantListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filtering and Pagination State
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [activeFavoriteId, setActiveFavoriteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });

  const fetchCatalog = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        limit: "12",
        page: page.toString(),
      });
      if (search) queryParams.set("search", search);
      if (city) queryParams.set("city", city);
      if (showFavoritesOnly) queryParams.set("favoritesOnly", "1");

      const response = await fetch(`/api/restaurants?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Failed to load restaurants.");
      const data = await response.json();
      setRestaurants(data.data || []);
      setPagination(data.pagination);
    } catch (error) {
      setError(getErrorMessage(error, "Failed to load restaurants."));
    } finally {
      setIsLoading(false);
    }
  }, [page, search, city, showFavoritesOnly]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCatalog();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchCatalog]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleFavorite = async (restaurantId: string, isFavorite: boolean) => {
    if (!user || String(user.role) !== UserRole.CUSTOMER) {
      toast.error("Log in as a customer to save restaurants");
      return;
    }

    setActiveFavoriteId(restaurantId);
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/favorite`, {
        method: isFavorite ? "DELETE" : "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update favorites");

      setRestaurants((current) =>
        current
          .map((restaurant) =>
            restaurant._id === restaurantId
              ? { ...restaurant, isFavorite: data.data.isFavorite }
              : restaurant
          )
          .filter((restaurant) => !(showFavoritesOnly && restaurant._id === restaurantId && !data.data.isFavorite))
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to update favorites"));
    } finally {
      setActiveFavoriteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-12 pt-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
              Discover Restaurants
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl text-lg mb-6">
              Explore the best local eateries, ranging from cozy cafes to fine dining experiences.
            </p>
            <div className="mb-4">
              <Button
                variant={showFavoritesOnly ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => {
                  setShowFavoritesOnly((current) => !current);
                  setPage(1);
                }}
              >
                <Heart className={`w-4 h-4 ${showFavoritesOnly ? "fill-current" : ""}`} />
                {showFavoritesOnly ? "Showing favorites" : "Show favorites"}
              </Button>
            </div>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-3xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  className="pl-10 h-11 bg-white dark:bg-zinc-900"
                  placeholder="Search restaurants..."
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="relative w-full sm:w-48">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  className="pl-10 h-11 bg-white dark:bg-zinc-900"
                  placeholder="City..."
                  value={city}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setCity(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-8 text-center border border-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            // SKELETON LOADERS
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={`skeleton-${i}`} className="overflow-hidden border-transparent shadow-sm">
                <Skeleton className="h-48 w-full rounded-none" />
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-4/5" />
                  <div className="flex gap-2 mt-4">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : restaurants.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-4xl mb-4 block">🍽️</span>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                No restaurants found
              </h3>
              <p className="text-zinc-500">
                {search || city 
                  ? "We couldn't find any restaurants matching your search criteria." 
                  : "We couldn't find any open restaurants right now. Check back later!"}
              </p>
              {(search || city) && (
                <Button 
                  variant="outline" 
                  className="mt-6"
                  onClick={() => {
                    setSearch("");
                    setCity("");
                    setPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            // ACTUAL CARDS
            restaurants.map((rest) => (
              <Link key={rest._id} href={`/restaurants/${rest._id}`} className="group block focus:outline-none focus:ring-2 focus:ring-primary rounded-xl">
                <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <div className="relative h-48 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    {rest.coverImage ? (
                      <SafeImage
                        src={rest.coverImage}
                        alt={rest.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-4xl">
                        🍽️
                      </div>
                    )}
                    {/* Floating Status Badge */}
                    <div className="absolute top-3 right-3 z-10">
                      {rest.isOpen ? (
                        <Badge className="bg-green-500/90 hover:bg-green-500 text-white shadow-sm backdrop-blur-sm">Open</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-zinc-900/80 text-white backdrop-blur-sm">Closed</Badge>
                      )}
                    </div>
                    <button
                      type="button"
                      className="absolute left-3 top-3 z-10 rounded-full bg-white/90 p-2 shadow-sm backdrop-blur-sm"
                      onClick={(event) => {
                        event.preventDefault();
                        handleToggleFavorite(rest._id, Boolean(rest.isFavorite));
                      }}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          activeFavoriteId === rest._id || rest.isFavorite
                            ? "fill-rose-500 text-rose-500"
                            : "text-zinc-500"
                        }`}
                      />
                    </button>
                  </div>

                  <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h3 className="text-xl font-bold line-clamp-1 text-zinc-900 dark:text-zinc-50">
                        {rest.name}
                      </h3>
                      {rest.rating > 0 && (
                        <div className="flex items-center space-x-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 px-1.5 py-0.5 rounded text-sm font-medium flex-shrink-0">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{rest.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center text-zinc-500 dark:text-zinc-400 text-sm mb-3">
                      <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                      <span className="line-clamp-1">{rest.city}, {rest.state}</span>
                    </div>

                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-4 flex-1">
                      {rest.description || "Incredible culinary experience delivered straight to your table."}
                    </p>

                    <div className="flex items-center gap-2 mt-auto">
                      <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-normal">
                        <Clock className="w-3 h-3 mr-1" />
                        30-40 min
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center mt-12 gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage || isLoading}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </Button>
            <div className="text-sm font-medium">
              Page {page} of {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage || isLoading}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
