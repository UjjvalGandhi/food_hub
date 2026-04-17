import { RecommendationGenerator } from "../lib/recommendationGenerator";
import { ScoringContext } from "../lib/recommendationEngine";

const mockItems: any[] = [
  { name: "Spicy Ramen", description: "Hot and spicy noodles" },
  { name: "Miso Soup", description: "Healthy soybean soup" },
];

const testCases = [
  { context: { weather: "Rainy" }, expected: "raining" },
  { context: { weather: "Hot" }, expected: "heat" },
  { context: { mood: "stressed" }, expected: "Stressed" },
  { context: { mood: "tired" }, expected: "energy" },
  { context: { healthGoal: "weight loss" }, expected: "goals" },
];

console.log("Starting tests for RecommendationGenerator...\n");

testCases.forEach(({ context, expected }, index) => {
  const message = RecommendationGenerator.generateMessage(context as ScoringContext, mockItems);
  const passed = message.toLowerCase().includes(expected.toLowerCase());
  console.log(`Test ${index + 1}: ${passed ? "✅ PASSED" : "❌ FAILED"}`);
  console.log(`Context: ${JSON.stringify(context)}`);
  console.log(`Result: "${message}"\n`);
});
