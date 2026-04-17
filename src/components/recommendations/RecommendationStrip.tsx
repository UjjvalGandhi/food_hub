"use client";

import React, { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { SafeImage } from "@/components/shared/SafeImage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface Recommendation {
  _id: string;
  name: string;
  description: string;
  price: number;
  restaurant: { name: string };
  aiReasoning: string;
  matchPercentage: number;
  image?: string;
}

interface RecommendationStripProps {
  title: string;
  icon: LucideIcon;
  context: {
    mood?: string;
    healthGoal?: string;
    dietPreference?: string;
  };
  colorClassName: string;
}

export function RecommendationStrip({
  title,
  icon: Icon,
  context,
  colorClassName,
}: RecommendationStripProps) {
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });

  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (context.mood) params.append("mood", context.mood);
        if (context.healthGoal) params.append("healthGoal", context.healthGoal);
        if (context.dietPreference) params.append("dietPreference", context.dietPreference);

        const response = await fetch(`/api/recommendations/contextual?${params.toString()}`);
        const data = await response.json();
        setItems(data.recommendations || []);
      } catch (error) {
        console.error("Failed to fetch recommendations strip:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [context]);

  if (!loading && items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <div className={`p-2 rounded-xl ${colorClassName} bg-opacity-20`}>
          <Icon className={`w-5 h-5 ${colorClassName.replace('bg-', 'text-')}`} />
        </div>
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 px-1">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-[0_0_280px] min-w-0">
                  <Skeleton className="h-48 w-full rounded-2xl" />
                  <div className="mt-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            : items.map((item, index) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-[0_0_280px] min-w-0"
                >
                  <Card className="group relative h-full overflow-hidden rounded-2xl border-none bg-card shadow-md transition-all hover:shadow-xl hover:-translate-y-1 ring-1 ring-border/50">
                    <div className="relative h-36 overflow-hidden">
                      <SafeImage
                        src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80"}
                        alt={item.name}
                        fill
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-3 flex gap-2">
                        <Badge className="bg-white/20 backdrop-blur-md border-none text-white text-[10px] font-bold">
                          {item.matchPercentage}% MATCH
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-base line-clamp-1">{item.name}</h4>
                        <span className="text-primary font-black">₹{item.price}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                        {item.restaurant.name}
                      </p>
                      <p className="text-xs text-foreground/70 line-clamp-2 leading-relaxed italic">
                        &ldquo;{item.aiReasoning}&rdquo;
                      </p>
                      <div className="pt-2">
                        <Button size="sm" className="w-full rounded-xl text-xs font-bold h-8 shadow-inner">
                          Quick Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
        </div>
      </div>
    </section>
  );
}
