"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { staggerContainer, fadeInUp, standardViewport } from "@/lib/animations";

const TESTIMONIALS = [
  {
    id: "t1",
    name: "Sarah Jenkins",
    role: "Food Blogger",
    content: "The fastest delivery I've ever experienced. The food arrived piping hot, and the restaurant selection is incredible. FoodPartner is my new go-to app!",
    rating: 5,
    avatarUrl: "https://i.pravatar.cc/150?u=sarah",
    initials: "SJ",
  },
  {
    id: "t2",
    name: "Marcus Chen",
    role: "Regular Customer",
    content: "I love how easy it is to discover new local restaurants. The interface is beautiful, and I've never had a missing item in my orders. Highly recommend.",
    rating: 5,
    avatarUrl: "https://i.pravatar.cc/150?u=marcus",
    initials: "MC",
  },
  {
    id: "t3",
    name: "Emily Rodriguez",
    role: "Busy Professional",
    content: "When I'm working late, FoodPartner is a lifesaver. The delivery tracking is perfectly accurate, and the drivers are always incredibly polite.",
    rating: 4,
    avatarUrl: "https://i.pravatar.cc/150?u=emily",
    initials: "ER",
  },
];

// Using imported staggered variants directly in JSX

export function Testimonials() {
  return (
    <section className="py-24 sm:py-32 bg-background relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
      
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            Real Reviews
          </h2>
          <h3 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            What Our Customers Say
          </h3>
          <p className="mt-4 text-lg text-muted-foreground">
            Don&apos;t just take our word for it — hear from the people who use FoodPartner every day.
          </p>
        </div>

        {/* Grid */}
        <motion.div 
          className="grid gap-8 md:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={standardViewport}
        >
          {TESTIMONIALS.map((testimonial) => (
            <motion.div key={testimonial.id} variants={fadeInUp}>
              <Card className="h-full bg-muted/30 border-muted/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5">
                <CardContent className="p-8 flex flex-col h-full">
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-5 h-5 ${i < testimonial.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} 
                      />
                    ))}
                  </div>
                  
                  {/* Content */}
                  <blockquote className="text-lg text-foreground/90 leading-relaxed mb-8 flex-1">
                    &ldquo;{testimonial.content}&rdquo;
                  </blockquote>
                  
                  {/* Author */}
                  <div className="flex items-center gap-4 mt-auto">
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarImage src={testimonial.avatarUrl} alt={testimonial.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-base">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                  
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
