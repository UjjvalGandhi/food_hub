import { ScoringContext } from "./recommendationEngine";

type RecommendationLike = {
  name: string;
};

export class RecommendationGenerator {
  /**
   * Generates a natural language recommendation message based on context and items.
   */
  public static generateMessage(context: ScoringContext, items: RecommendationLike[]): string {
    if (items.length === 0) {
      return "We couldn't find anything matching your preferences perfectly, but here are some popular choices!";
    }

    const topItemName = items[0].name;
    const secondItemName = items[1]?.name;

    // 1. Weather-based recommendations
    if (context.weather) {
      const weather = context.weather.toLowerCase();
      if (weather.includes("rain")) {
        return `It's raining outside 🌧️ — warm up with a bowl of ${topItemName}${secondItemName ? ` or ${secondItemName}` : ""}.`;
      }
      if (weather.includes("hot") || weather.includes("sun")) {
        return `Beat the heat ☀️ with something refreshing like ${topItemName}.`;
      }
      if (weather.includes("cold") || weather.includes("winter")) {
        return `Stay cozy ❄️ with a hot serving of ${topItemName}.`;
      }
    }

    // 2. Mood-based recommendations
    if (context.mood) {
      const mood = context.mood.toLowerCase();
      if (mood === "stressed") {
        return `Rough day? 🧘 Treat yourself to some comforting ${topItemName}. You deserve it!`;
      }
      if (mood === "tired" || mood === "exhausted") {
        return `Low on energy? ⚡ Recharge with ${topItemName} — the perfect pick-me-up!`;
      }
      if (mood === "happy" || mood === "energetic") {
        return `Matching your vibe! 🥳 Celebrate the good mood with ${topItemName}.`;
      }
      if (mood === "late-night") {
        return `Late night cravings? 🌙 ${topItemName} is exactly what you need right now.`;
      }
    }

    // 3. Health Goal-based recommendations
    if (context.healthGoal) {
      const goal = context.healthGoal.toLowerCase();
      if (goal.includes("weight") || goal.includes("loss")) {
        return `Stick to your goals! 💪 Our ${topItemName} is both delicious and weight-loss friendly.`;
      }
      if (goal.includes("muscle") || goal.includes("protein")) {
        return `Fuel those gains! 🍗 ${topItemName} is packed with the protein you need.`;
      }
      if (goal.includes("focus") || goal.includes("brain")) {
        return `Brain power! 🧠 Stay sharp with a nutrient-rich ${topItemName}.`;
      }
    }

    // Default fallback
    return `We've handpicked ${topItemName} and more specifically for you!`;
  }
}
