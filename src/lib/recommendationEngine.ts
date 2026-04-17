import { IMenuItem } from "@/models/MenuItem";
import { IUser } from "@/models/User";
import { IOrder } from "@/models/Order";

export interface ScoringContext {
  mood?: string;
  weather?: string;
  healthGoal?: string;
  dietPreference?: string;
}

export class RecommendationEngine {
  private static readonly WEIGHTS = {
    MOOD_MATCH: 10,
    WEATHER_MATCH: 10,
    DIET_MATCH: 20,
    HEALTH_GOAL_MATCH: 15,
    CUISINE_MATCH: 15,
    PAST_ORDER_BOOST: 5,
    SPECIAL_BOOST: 20,
  };

  private static normalize(value?: string) {
    return (value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private static aliases(value?: string) {
    const normalized = this.normalize(value);
    const variants = new Set<string>([normalized]);

    const aliasMap: Record<string, string[]> = {
      "weight-loss": ["weightloss", "low-calorie", "balanced-diet"],
      "muscle-gain": ["high-protein", "protein-rich", "musclegain"],
      focus: ["brain-food", "mental-focus"],
      balanced: ["balanced-diet", "wholesome"],
      vegan: ["plant-based", "vegan-friendly"],
      keto: ["low-carb", "ketogenic"],
      "gluten-free": ["glutenfree"],
      "diabetic-friendly": ["low-sugar", "diabetic"],
      stressed: ["comfort-food", "cozy"],
      tired: ["energizing", "protein-rich"],
      energetic: ["celebration", "fresh"],
      happy: ["celebration", "feel-good"],
      "late-night": ["snack", "munchies", "fast-food"],
      rainy: ["rain", "rainy-day", "cozy"],
      hot: ["summer", "cooling", "refreshing"],
      clear: ["fresh"],
    };

    (aliasMap[normalized] || []).forEach((alias) => variants.add(alias));
    return Array.from(variants).filter(Boolean);
  }

  private static matchesAny(tags: string[] | undefined, value?: string) {
    if (!tags?.length || !value) return false;
    const normalizedTags = tags.map((tag) => this.normalize(tag));
    return this.aliases(value).some((candidate) => normalizedTags.includes(candidate));
  }

  private static matchesText(item: IMenuItem, value?: string) {
    if (!value) return false;
    return this.aliases(value).some((candidate) => {
      const readable = candidate.replace(/-/g, " ");
      return (
        item.name.toLowerCase().includes(readable) ||
        item.description?.toLowerCase().includes(readable)
      );
    });
  }

  /**
   * Scores a list of menu items based on user context, preferences, and order history.
   */
  public static scoreItems(
    items: IMenuItem[],
    user: IUser | null,
    pastOrders: IOrder[],
    context: ScoringContext
  ): (IMenuItem & { score: number; scoringBreakdown: string[] })[] {
    const scoredItems = items.map((item) => {
      let score = 0;
      const breakdown: string[] = [];

      // 1. Mood Match
      if (this.matchesAny(item.moodTags, context.mood)) {
        score += this.WEIGHTS.MOOD_MATCH;
        breakdown.push(`Mood match: +${this.WEIGHTS.MOOD_MATCH}`);
      }

      // 2. Weather Match
      if (this.matchesAny(item.weatherTags, context.weather)) {
        score += this.WEIGHTS.WEATHER_MATCH;
        breakdown.push(`Weather match: +${this.WEIGHTS.WEATHER_MATCH}`);
      }

      // 3. User Preferences and Contextual Preferences
      
      // Diet Match (from user profile or context)
      const userDietPrefs = user?.dietaryPreferences || [];
      const contextDietPref = context.dietPreference;
      if (
        userDietPrefs.some((pref) => this.matchesAny(item.dietTags, pref)) ||
        this.matchesAny(item.dietTags, contextDietPref)
      ) {
        score += this.WEIGHTS.DIET_MATCH;
        breakdown.push(`Diet preference match: +${this.WEIGHTS.DIET_MATCH}`);
      }

      // Health Goal Match (from user profile or context)
      const userHealthGoals = user?.healthGoals || [];
      const contextHealthGoal = context.healthGoal;
      if (
        userHealthGoals.some((goal) => this.matchesAny(item.healthTags, goal)) ||
        this.matchesAny(item.healthTags, contextHealthGoal)
      ) {
        score += this.WEIGHTS.HEALTH_GOAL_MATCH;
        breakdown.push(`Health goal match: +${this.WEIGHTS.HEALTH_GOAL_MATCH}`);
      }

      // Keyword matching (name/description) for mood, healthGoal, dietPreference
      [context.mood, context.healthGoal, context.dietPreference].forEach(ctxParam => {
        if (this.matchesText(item, ctxParam)) {
          score += this.WEIGHTS.SPECIAL_BOOST;
          breakdown.push(`Keyword match for '${ctxParam}': +${this.WEIGHTS.SPECIAL_BOOST}`);
        }
      });

      // Cuisine Match (from user profile)
      if (
        user &&
        item.cuisine &&
        user.cuisinePreferences?.some(
          (preference) => this.normalize(preference) === this.normalize(item.cuisine)
        )
      ) {
        score += this.WEIGHTS.CUISINE_MATCH;
        breakdown.push(`Cuisine preference match: +${this.WEIGHTS.CUISINE_MATCH}`);
      }

      // 4. Past Order Similarity
      const orderCount = pastOrders.reduce((count, order) => {
        return count + order.items.filter(orderItem => orderItem.menuItemId.toString() === item._id.toString()).length;
      }, 0);

      if (orderCount > 0) {
        const orderBoost = Math.min(orderCount * this.WEIGHTS.PAST_ORDER_BOOST, 20);
        score += orderBoost;
        breakdown.push(`Past order similarity: +${orderBoost}`);
      }

      // 5. Special Logic Boosts
      this.applySpecialBoosts(item, context, (points, reason) => {
        score += points;
        breakdown.push(`${reason}: +${points}`);
      });

      return {
        ...item.toObject ? item.toObject() : item,
        score,
        scoringBreakdown: breakdown,
      };
    });

    return scoredItems.sort((a, b) => b.score - a.score);
  }

  private static applySpecialBoosts(
    item: IMenuItem,
    context: ScoringContext,
    addPoints: (points: number, reason: string) => void
  ) {
    // Weather: Rain -> soup, tea, noodles
    const normalizedWeather = this.normalize(context.weather);
    const normalizedGoal = this.normalize(context.healthGoal);
    const normalizedMood = this.normalize(context.mood);

    if (normalizedWeather === "rainy" || normalizedWeather === "rain") {
      const rainyItems = ["soup", "tea", "noodles", "chai"];
      if (rainyItems.some(keyword => item.name.toLowerCase().includes(keyword) || item.description?.toLowerCase().includes(keyword))) {
        addPoints(this.WEIGHTS.SPECIAL_BOOST, "Rainy day comfort");
      }
    }

    // Health Goal: Weight Loss -> low calorie
    if (normalizedGoal === "weightloss" || normalizedGoal === "weight-loss") {
      if (this.matchesAny(item.healthTags, "low-calorie") || (item.healthMetrics?.calories && item.healthMetrics.calories < 400)) {
        addPoints(this.WEIGHTS.SPECIAL_BOOST, "Weight loss alignment");
      }
    }

    if (normalizedGoal === "muscle-gain") {
      if (this.matchesAny(item.healthTags, "high-protein") || (item.healthMetrics?.protein && item.healthMetrics.protein >= 20)) {
        addPoints(this.WEIGHTS.SPECIAL_BOOST, "Protein boost");
      }
    }

    if (normalizedGoal === "diabetic-friendly") {
      if (this.matchesAny(item.healthTags, "diabetic-friendly") || this.matchesAny(item.dietTags, "low-sugar")) {
        addPoints(this.WEIGHTS.SPECIAL_BOOST, "Diabetic friendly");
      }
    }

    // Mood: Late Night -> snacks and fast food
    if (normalizedMood === "late-night" || normalizedMood === "latenight") {
      const lateNightTags = ["snack", "fast-food", "munchies"];
      if (lateNightTags.some(tag => item.category?.toString().toLowerCase().includes(tag) || item.moodTags?.includes(tag))) {
        addPoints(this.WEIGHTS.SPECIAL_BOOST, "Late night cravings");
      }
    }
  }
}
