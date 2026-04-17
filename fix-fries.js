const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const frenchFriesImage = "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&q=80";

async function fixFries() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://janvirao00021_db_user:JCdmAKFy0phfVntr@fooddash.kwqf0m4.mongodb.net/?appName=fooddash";
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for fixes...");

    const db = mongoose.connection.db;

    // Fix Missing French Fries Image
    const res = await db.collection("menuitems").updateMany(
      { name: /Fries/i },
      { $set: { image: frenchFriesImage } }
    );
    console.log(`Updated ${res.modifiedCount} "Fries" items with the actual french fries image.`);

  } catch (error) {
    console.error("Error applying fixes:", error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

fixFries();
