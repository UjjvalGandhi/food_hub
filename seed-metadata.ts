import mongoose from "mongoose";
import MenuItem from "./src/models/MenuItem";
import { connectDB } from "./src/lib/db";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function seedMetadata() {
  try {
    await connectDB();
    console.log("Connected to MongoDB for seeding...");

    const items = await MenuItem.find({});
    console.log(`Found ${items.length} items to update.`);

    const samples = [
      {
        moodTags: ["Energetic", "Happy"],
        healthMetrics: { calories: 450, protein: 30, carbs: 40, fat: 15, healthScore: 8, tags: ["High Protein", "Muscle Gain"] }
      },
      {
        moodTags: ["Stressed", "Comforting"],
        healthMetrics: { calories: 600, protein: 15, carbs: 70, fat: 25, healthScore: 4, tags: ["Comfort Food", "Cheat Meal"] }
      },
      {
        moodTags: ["Tired", "Calming"],
        healthMetrics: { calories: 300, protein: 10, carbs: 50, fat: 5, healthScore: 9, tags: ["Low Fat", "Easy Digest"] }
      }
    ];

    for (let i = 0; i < items.length; i++) {
      const metadata = samples[i % samples.length];
      await MenuItem.findByIdAndUpdate(items[i]._id, {
        $set: {
          moodTags: metadata.moodTags,
          healthMetrics: metadata.healthMetrics
        }
      });
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seedMetadata();
