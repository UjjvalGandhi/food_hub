const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

async function approveRestaurants() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://janvirao00021_db_user:JCdmAKFy0phfVntr@fooddash.kwqf0m4.mongodb.net/?appName=fooddash";
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB...");

    const db = mongoose.connection.db;
    const result = await db.collection("restaurants").updateMany({}, { $set: { isApproved: true } });
    
    console.log(`Approved ${result.modifiedCount} restaurants.`);
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

approveRestaurants();
