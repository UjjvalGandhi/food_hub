"use client";

import { motion, type Variants } from "framer-motion";
import { Search, Utensils, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const floatingVariants: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const floatingVariantsReverse: Variants = {
  animate: {
    y: [0, 10, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background pt-24 pb-32">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-[20%] -left-[10%] h-[50%] w-[50%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] h-[50%] w-[50%] rounded-full bg-secondary/10 blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col justify-center text-center lg:text-left"
          >
            <div className="inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-sm font-medium mb-6 w-fit mx-auto lg:mx-0">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              Now delivering in your city
            </div>
            
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl mb-6">
              Satisfy Your Cravings <br className="hidden lg:block" />
              <span className="text-primary">In Minutes.</span>
            </h1>
            
            <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl mb-10 mx-auto lg:mx-0">
              Discover the best local restaurants, fast delivery, and crave-worthy meals. 
              Your culinary journey starts right here.
            </p>

            {/* Search and CTAs */}
            <div className="flex flex-col gap-4 max-w-md mx-auto lg:mx-0 w-full">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="Enter your delivery address" 
                  className="pl-11 pr-32 h-14 text-base rounded-full border-muted-foreground/20 shadow-sm transition-all focus-visible:ring-primary"
                />
                <Button className="absolute right-1.5 top-1.5 h-11 rounded-full px-6 shadow-md shadow-primary/20">
                  Order Now
                </Button>
              </div>
              
              <div className="mt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <span className="text-sm text-muted-foreground font-medium">Own a restaurant?</span>
                <Button variant="outline" className="rounded-full" asChild>
                  <Link href="/register?role=PROVIDER">Join as Partner</Link>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Visual/Image Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative hidden lg:block h-[600px] w-full"
          >
            {/* Abstract decorative elements instead of a hardcoded image */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-96 w-96 rounded-full bg-gradient-to-tr from-primary/20 to-secondary/20 blur-3xl" />
            </div>

            {/* Floating floating cards */}
            <motion.div 
              variants={floatingVariants}
              animate="animate"
              className="absolute top-[20%] left-[10%] flex items-center gap-3 rounded-2xl border bg-background/80 p-4 shadow-xl backdrop-blur-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Utensils className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold">500+ Restaurants</p>
                <p className="text-xs text-muted-foreground">Local & Global</p>
              </div>
            </motion.div>

            <motion.div 
              variants={floatingVariantsReverse}
              animate="animate"
              className="absolute top-[50%] right-[5%] flex items-center gap-3 rounded-2xl border bg-background/80 p-4 shadow-xl backdrop-blur-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary-foreground">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold">Fast Delivery</p>
                <p className="text-xs text-muted-foreground">Under 30 mins</p>
              </div>
            </motion.div>

            <motion.div 
              variants={floatingVariants}
              animate="animate"
              className="absolute bottom-[20%] left-[20%] flex items-center gap-3 rounded-2xl border bg-background/80 p-4 shadow-xl backdrop-blur-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold">Top Rated</p>
                <p className="text-xs text-muted-foreground">4.8 Average</p>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}
