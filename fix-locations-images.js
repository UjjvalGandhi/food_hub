const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const ahmedabadLocations = [
  { city: "Ahmedabad", state: "Gujarat", address: "Bodakdev, Sarkhej - Gandhinagar Hwy", pincode: "380054" },
  { city: "Ahmedabad", state: "Gujarat", address: "Vastrapur, near Alpha One Mall", pincode: "380015" },
  { city: "Ahmedabad", state: "Gujarat", address: "Prahlad Nagar, Corporate Road", pincode: "380015" },
  { city: "Ahmedabad", state: "Gujarat", address: "Navrangpura, CG Road", pincode: "380009" },
  { city: "Ahmedabad", state: "Gujarat", address: "Sindhu Bhavan Road, Thaltej", pincode: "380059" }
];

const fallbackFoodImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80";

async function fixLocationsAndImages() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://janvirao00021_db_user:JCdmAKFy0phfVntr@fooddash.kwqf0m4.mongodb.net/?appName=fooddash";
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for fixes...");

    const db = mongoose.connection.db;

    // 1. Update Restaurant Locations
    const restaurants = await db.collection("restaurants").find({}).toArray();
    for (let i = 0; i < restaurants.length; i++) {
      const loc = ahmedabadLocations[i % ahmedabadLocations.length];
      await db.collection("restaurants").updateOne(
        { _id: restaurants[i]._id },
        { $set: { city: loc.city, state: loc.state, address: loc.address, pincode: loc.pincode } }
      );
    }
    console.log(`Updated ${restaurants.length} restaurants to Ahmedabad locations.`);

    // 2. Fix Missing Menu Images
    const missingImageResult = await db.collection("menuitems").updateMany(
      { $or: [{ image: null }, { image: "" }] },
      { $set: { image: fallbackFoodImage } }
    );
    console.log(`Updated ${missingImageResult.modifiedCount} menu items with a fallback image.`);

  } catch (error) {
    console.error("Error applying fixes:", error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

fixLocationsAndImages();
