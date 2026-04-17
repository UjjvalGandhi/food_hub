require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

// We need to redefine the schemas or just use plain objects to insert,
// but using the raw collections is easier and avoids TS/compilation issues in a simple script.

const categoriesData = [
  { name: "Starters", isActive: true },
  { name: "Main Course", isActive: true },
  { name: "Desserts", isActive: true },
  { name: "Beverages", isActive: true },
];

const itemsData = {
  "Starters": [
    { name: "Garlic Bread", price: 150, description: "Toasted bread with garlic butter and herbs.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=500&q=80" },
    { name: "Chicken Wings", price: 250, description: "Spicy and crispy fried chicken wings.", isVeg: false, isAvailable: true, image: "https://images.unsplash.com/photo-1569691899455-88464f6d3ab1?w=500&q=80" },
    { name: "Paneer Tikka", price: 200, description: "Grilled cottage cheese cubes marinated in spices.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1599487405620-6e480e609ca0?w=500&q=80" }
  ],
  "Main Course": [
    { name: "Margherita Pizza", price: 350, description: "Classic pizza with tomato sauce and mozzarella cheese.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&q=80" },
    { name: "Butter Chicken", price: 400, description: "Creamy chicken curry served with naan.", isVeg: false, isAvailable: true, image: "https://images.unsplash.com/photo-1603894584373-5ac82b6ae398?w=500&q=80" },
    { name: "Pasta Alfredo", price: 300, description: "Creamy white sauce pasta with vegetables.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&q=80" }
  ],
  "Desserts": [
    { name: "Chocolate Brownie", price: 180, description: "Warm chocolate brownie with vanilla ice cream.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&q=80" },
    { name: "Cheesecake", price: 220, description: "New York style classic cheesecake.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&q=80" }
  ],
  "Beverages": [
    { name: "Cold Coffee", price: 120, description: "Chilled blended coffee with ice cream.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&q=80" },
    { name: "Fresh Lime Soda", price: 90, description: "Refreshing sweet and salt lime soda.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80" },
    { name: "Mango Shake", price: 150, description: "Thick and creamy mango milkshake.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1628172909403-cc4944883ab0?w=500&q=80" }
  ]
};

async function seed() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://janvirao00021_db_user:JCdmAKFy0phfVntr@fooddash.kwqf0m4.mongodb.net/?appName=fooddash";
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    
    // Get all restaurants
    const restaurants = await db.collection("restaurants").find({}).toArray();
    console.log(`Found ${restaurants.length} restaurants`);

    if (restaurants.length === 0) {
      console.log("No restaurants found, nothing to seed.");
      process.exit(0);
    }

    // Clear existing menu categories and items (optional, but good for starting fresh)
    await db.collection("menucategories").deleteMany({});
    await db.collection("menuitems").deleteMany({});
    console.log("Cleared existing menu items and categories");

    let totalCats = 0;
    let totalItems = 0;

    for (const restaurant of restaurants) {
      for (const cat of categoriesData) {
        // Create category
        const catInsert = await db.collection("menucategories").insertOne({
          name: cat.name,
          isActive: cat.isActive,
          restaurant: restaurant._id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        totalCats++;
        const categoryId = catInsert.insertedId;

        // Create items for this category
        const items = itemsData[cat.name];
        for (const item of items) {
          await db.collection("menuitems").insertOne({
            name: item.name,
            price: item.price,
            description: item.description,
            isVeg: item.isVeg,
            isAvailable: item.isAvailable,
            category: categoryId,
            restaurant: restaurant._id,
            image: item.image,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          totalItems++;
        }
      }
    }

    console.log(`Successfully seeded ${totalCats} categories and ${totalItems} items across ${restaurants.length} restaurants.`);
  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

seed();
