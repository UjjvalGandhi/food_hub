const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").resolve(process.cwd(), ".env.local") });

const MenuItemSchema = new mongoose.Schema({
  moodTags: [String],
  healthMetrics: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    healthScore: Number,
    tags: [String]
  }
});

const MenuItem = mongoose.models.MenuItem || mongoose.model("MenuItem", MenuItemSchema);

async function seedMetadata() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB...");

    const items = await MenuItem.find({});
    console.log(`Found ${items.length} items.`);

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
