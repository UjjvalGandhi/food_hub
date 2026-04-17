"use client";

import React from "react";
import { RecommendationStrip } from "./RecommendationStrip";
import { CloudRain, Dumbbell, MoonStar } from "lucide-react";

export function SmartRecommendations() {
  return (
    <div className="space-y-10 py-6">
      <RecommendationStrip
        title="Rainy day comfort — try something warm"
        icon={CloudRain}
        context={{ mood: "comfort" }}
        colorClassName="bg-blue-500"
      />

      <RecommendationStrip
        title="High protein meals for your fitness goal"
        icon={Dumbbell}
        context={{ healthGoal: "muscle-gain" }}
        colorClassName="bg-orange-500"
      />

      <RecommendationStrip
        title="Late night cravings? Try these snacks"
        icon={MoonStar}
        context={{ mood: "late-night" }}
        colorClassName="bg-purple-500"
      />
    </div>
  );
}
