"use client";

import { motion } from "framer-motion";
import { Search, ShoppingBag, Bike } from "lucide-react";
import { Card } from "@/components/ui/card";
import { staggerContainer, fadeInUp, standardViewport } from "@/lib/animations";

const steps = [
  {
    title: "Browse Restaurants",
    description: "Find the best local restaurants and explore their menus to satisfy your cravings.",
    icon: Search,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Place Order",
    description: "Choose your favorite dishes, customize your order, and securely checkout in seconds.",
    icon: ShoppingBag,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    title: "Fast Delivery",
    description: "Track your food in real-time as our delivery partners bring it straight to your door.",
    icon: Bike,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
];

// Using imported staggered container and card variants directly in JSX

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-muted/30 py-24 sm:py-32">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            Simple Process
          </h2>
          <h3 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            How It Works
          </h3>
          <p className="mt-4 text-lg text-muted-foreground">
            Get your favorite food delivered to your doorstep in just three simple steps.
          </p>
        </div>

        {/* Steps Grid */}
        <motion.div 
          className="grid gap-8 md:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={standardViewport}
        >
          {steps.map((step, index) => (
            <motion.div key={step.title} variants={fadeInUp}>
              <Card className="group relative overflow-hidden border-muted/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5 bg-background h-full h-full flex flex-col items-center text-center p-6 sm:p-8">
                
                {/* Step Number Background Ghost */}
                <div className="absolute -right-4 -top-8 text-9xl font-black text-muted/10 transition-colors duration-300 group-hover:text-primary/5 select-none pointer-events-none">
                  {index + 1}
                </div>

                <div className={`mb-6 flex h-20 w-20 items-center justify-center rounded-2xl ${step.bgColor} transition-transform duration-300 group-hover:scale-110`}>
                  <step.icon className={`h-10 w-10 ${step.color}`} />
                </div>
                
                <h4 className="mb-3 text-xl font-bold">{step.title}</h4>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
                
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
