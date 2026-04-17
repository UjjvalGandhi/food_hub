"use client";

import { motion } from "framer-motion";
import { Plus, Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fadeInUp, standardViewport } from "@/lib/animations";
import { SafeImage } from "@/components/shared/SafeImage";

const MOCK_DISHES = [
  {
    id: "dish_1",
    name: "Classic Cheeseburger",
    restaurant: "Burger Joint NYC",
    price: "₹250",
    rating: 4.8,
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "dish_2",
    name: "Spicy Tuna Roll",
    restaurant: "Sushi Master",
    price: "₹350",
    rating: 4.9,
    imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "dish_3",
    name: "Margherita Pizza",
    restaurant: "La Piazza Pizza",
    price: "₹399",
    rating: 4.7,
    imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "dish_4",
    name: "Chicken Tikka Masala",
    restaurant: "Spice Symphony",
    price: "₹420",
    rating: 4.8,
    imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "dish_5",
    name: "Quinoa Salad Bowl",
    restaurant: "Green Bowl Co.",
    price: "₹250",
    rating: 4.6,
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "dish_6",
    name: "Beef Taco Combo",
    restaurant: "El Taco Loco",
    price: "₹280",
    rating: 4.5,
    imageUrl: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&q=80&w=600",
  },
];

// Using imported variants directly in JSX

export function PopularDishes() {
  return (
    <section className="py-24 sm:py-32 bg-muted/30 overflow-hidden">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={standardViewport}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">
                Trending Now
              </h2>
              <h3 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
                Popular Dishes
              </h3>
            </div>
          </div>

          {/* Carousel */}
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full relative px-3 sm:px-10"
          >
            <CarouselContent className="-ml-4 md:-ml-6">
              {MOCK_DISHES.map((dish) => (
                <CarouselItem key={dish.id} className="pl-4 md:pl-6 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <Card className="h-full overflow-hidden border-muted/60 transition-all hover:shadow-lg group">
                    <div className="relative h-48 w-full overflow-hidden bg-muted">
                      <SafeImage
                        src={dish.imageUrl}
                        alt={dish.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-1 bg-background/90 backdrop-blur-sm text-foreground px-2 py-1 rounded-md text-xs font-bold shadow-sm">
                        <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                        {dish.rating}
                      </div>
                    </div>
                    
                    <CardContent className="p-5 flex flex-col h-[calc(100%-12rem)]">
                      <h4 className="font-bold text-lg mb-1 line-clamp-1">{dish.name}</h4>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-1">{dish.restaurant}</p>
                      
                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-muted/40">
                        <span className="font-extrabold text-lg">{dish.price}</span>
                        <Button size="icon" className="h-8 w-8 rounded-full">
                          <Plus className="h-4 w-4" />
                          <span className="sr-only">Add to cart</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Desktop Navigation Buttons */}
            <div className="hidden sm:block">
              <CarouselPrevious className="left-2 z-10 size-10 border-muted-foreground/20 bg-background/95 shadow-md hover:bg-primary hover:text-primary-foreground" />
              <CarouselNext className="right-2 z-10 size-10 border-muted-foreground/20 bg-background/95 shadow-md hover:bg-primary hover:text-primary-foreground" />
            </div>
          </Carousel>
          
        </motion.div>
      </div>
    </section>
  );
}
