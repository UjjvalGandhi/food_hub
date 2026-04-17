"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-primary py-24 sm:py-32">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg
          className="absolute left-[50%] top-0 h-[48rem] max-w-none -translate-y-1/2 translate-x-[-50%] sm:left-[50%] sm:translate-x-[-30%] lg:left-[50%] lg:translate-x-[-20%] xl:translate-x-0"
          width="800"
          height="800"
          fill="none"
          viewBox="0 0 800 800"
        >
          <circle cx="400" cy="400" r="400" fill="url(#pattern-circles)" />
          <defs>
            <radialGradient id="pattern-circles" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(400 400) rotate(90) scale(400)">
              <stop stopColor="white" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      <div className="container relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center justify-center"
        >
          <h2 className="text-4xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl mb-6">
            Ready to grow your food business?
          </h2>
          
          <p className="mx-auto max-w-2xl text-lg text-primary-foreground/80 sm:text-xl mb-10 leading-relaxed">
            Join thousands of restaurants reaching more customers, increasing revenue, and delivering happiness every single day.
          </p>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Button 
              size="lg" 
              variant="secondary" 
              className="h-14 rounded-full px-10 text-lg font-bold shadow-xl text-primary hover:bg-white"
              asChild
            >
              <Link href="/register?role=PROVIDER">
                Become a Partner
              </Link>
            </Button>
          </motion.div>
          
          <p className="mt-6 text-sm text-primary-foreground/60">
            No long-term contracts. Setup in less than 24 hours.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
