"use client";

import React from "react";
import { motion } from "framer-motion";
import { Flame, Zap, Heart, Info } from "lucide-react";
import { SafeImage } from "@/components/shared/SafeImage";

type RecommendationCardItem = {
  name: string;
  image?: string;
  matchPercentage: number;
  price: number;
  isVeg?: boolean;
  aiReasoning: string;
  restaurant?: {
    name?: string;
  };
  healthMetrics?: {
    calories?: number;
    healthScore?: number;
  };
};

interface AIRecCardProps {
  item: RecommendationCardItem;
  index: number;
}

const AIRecCard: React.FC<AIRecCardProps> = ({ item, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500"
    >
      {/* AI Match Badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/30">
          <Zap className="w-3 h-3 fill-current" />
          {item.matchPercentage}% AI Match
        </div>
      </div>

      {/* Image Section */}
      <div className="relative h-56 overflow-hidden">
        <SafeImage
          src={item.image || "/placeholder-food.jpg"}
          alt={item.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1">
            {item.restaurant?.name || "Premium Kitchen"}
          </p>
          <h3 className="text-white text-xl font-bold leading-tight">{item.name}</h3>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-black text-indigo-500">₹{item.price}</span>
          <div className="flex items-center gap-2">
            {item.isVeg ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md border border-green-200 dark:border-green-800">
                <div className="w-1.5 h-1.5 rounded-full bg-green-600" /> VEG
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md border border-red-200 dark:border-red-800">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600" /> NON-VEG
              </span>
            )}
          </div>
        </div>

        {/* AI Reasoning - The "Wow" factor */}
        <div className="relative bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 mb-4">
          <div className="absolute -top-3 left-4 px-2 bg-white dark:bg-zinc-900 text-[10px] font-bold text-indigo-500 flex items-center gap-1 uppercase tracking-tighter">
            <Info className="w-3 h-3" /> AI Insights
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed italic">
            &ldquo;{item.aiReasoning}&rdquo;
          </p>
        </div>

        {/* Health Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>{item.healthMetrics?.calories || 350} kcal</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Heart className="w-4 h-4 text-rose-500" />
            <span>{item.healthMetrics?.healthScore || 8}/10 Health Info</span>
          </div>
        </div>

        <button className="w-full py-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-zinc-200 dark:shadow-none">
          Order for ₹{item.price}
        </button>
      </div>
    </motion.div>
  );
};

export default AIRecCard;
