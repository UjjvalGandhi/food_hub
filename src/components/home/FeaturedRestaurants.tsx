"use client";

import { motion } from "framer-motion";
import { Star, Clock, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { staggerContainer, fadeInUp, standardViewport } from "@/lib/animations";
import { SafeImage } from "@/components/shared/SafeImage";

// IMPORTANT: This data structure mimics what the actual API will return length-wise.
// Easy to swap to a fetch() call later.
const MOCK_RESTAURANTS = [
  {
    id: "rest_1",
    name: "Burger Joint NYC",
    tags: ["American", "Burgers", "Fast Food"],
    rating: 4.8,
    reviews: 1240,
    deliveryTime: "15-25 min",
    deliveryFee: "Free",
    priceRange: "₹₹",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "rest_2",
    name: "Spice Symphony",
    tags: ["Indian", "Curry", "Spicy"],
    rating: 4.6,
    reviews: 890,
    deliveryTime: "30-45 min",
    deliveryFee: "₹40",
    priceRange: "₹₹₹",
    imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "rest_3",
    name: "Sushi Master",
    tags: ["Japanese", "Sushi", "Healthy"],
    rating: 4.9,
    reviews: 2100,
    deliveryTime: "25-40 min",
    deliveryFee: "₹50",
    priceRange: "₹₹₹",
    imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "rest_4",
    name: "La Piazza Pizza",
    tags: ["Italian", "Pizza", "Pasta"],
    rating: 4.5,
    reviews: 3200,
    deliveryTime: "20-35 min",
    deliveryFee: "Free",
    priceRange: "₹₹",
    imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "rest_5",
    name: "Green Bowl Co.",
    tags: ["Healthy", "Salads", "Vegan"],
    rating: 4.7,
    reviews: 540,
    deliveryTime: "15-30 min",
    deliveryFee: "₹30",
    priceRange: "₹",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "rest_6",
    name: "El Taco Loco",
    tags: ["Mexican", "Tacos", "Burritos"],
    rating: 4.4,
    reviews: 1800,
    deliveryTime: "20-30 min",
    deliveryFee: "₹40",
    priceRange: "₹",
    imageUrl: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&q=80&w=800",
  },
];

// Using imported staggered container and card variants directly in JSX

export function FeaturedRestaurants() {
  return (
    <section className="py-24 sm:py-32 bg-background">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">
              Top Rated
            </h2>
            <h3 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              Featured Restaurants
            </h3>
          </div>
          <Link 
            href="/restaurants" 
            className="text-sm font-medium text-primary hover:underline underline-offset-4"
          >
            View all restaurants &rarr;
          </Link>
        </div>

        {/* Grid */}
        <motion.div 
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={standardViewport}
        >
          {MOCK_RESTAURANTS.map((restaurant) => (
            <motion.div key={restaurant.id} variants={fadeInUp}>
              <Link href={`/restaurants/${restaurant.id}`} className="block h-full cursor-pointer">
                <Card className="h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group border-muted/60">
                  
                  {/* Image Placeholder area */}
                  <div className="relative h-48 w-full overflow-hidden bg-muted">
                    <SafeImage
                      src={restaurant.imageUrl} 
                      alt={restaurant.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Floating Badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                      <Badge className="bg-background text-foreground shadow-sm hover:bg-background">
                        {restaurant.deliveryTime}
                      </Badge>
                      {restaurant.deliveryFee === "Free" && (
                        <Badge variant="secondary" className="bg-green-500 text-white shadow-sm hover:bg-green-600 border-none">
                          Free Delivery
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <h4 className="font-bold text-lg line-clamp-1">{restaurant.name}</h4>
                      <div className="flex items-center gap-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-medium shrink-0">
                        <Star className="w-3.5 h-3.5 fill-primary" />
                        <span>{restaurant.rating}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <p className="line-clamp-1">{restaurant.tags.join(" • ")}</p>
                      <span className="shrink-0">•</span>
                      <span className="shrink-0 tracking-widest">{restaurant.priceRange}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground/80 mt-auto pt-4 border-t border-muted/40">
                      <div className="flex items-center gap-1.5">
                        <Car className="w-4 h-4" />
                        <span>{restaurant.deliveryFee === "Free" ? "Free" : restaurant.deliveryFee}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{restaurant.deliveryTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5 ml-auto">
                        <span>({restaurant.reviews}+)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
