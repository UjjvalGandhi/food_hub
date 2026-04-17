const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

// Actual names from FeaturedRestaurants.tsx
const restaurantConfigs = {
  "Burger Joint NYC": {
    logo: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
    categories: [
      { name: "Burgers", isActive: true },
      { name: "Fries & Sides", isActive: true }
    ],
    items: {
      "Burgers": [
        { name: "Classic Cheeseburger", price: 250, description: "Juicy beef patty with melted cheese and fresh veggies.", isVeg: false, isAvailable: true, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80" },
        { name: "Crispy Chicken Burger", price: 280, description: "Fried chicken fillet with mayo and lettuce.", isVeg: false, isAvailable: true, image: "https://images.unsplash.com/photo-1615719417036-e0e6765ffaff?w=500&q=80" },
        { name: "Veggie Burger", price: 200, description: "Spiced potato and peas patty.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=500&q=80" }
      ],
      "Fries & Sides": [
        { name: "French Fries", price: 120, description: "Crispy golden salted fries.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&q=80" },
        { name: "Onion Rings", price: 150, description: "Deep fried battered onion rings.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=500&q=80" }
      ]
    }
  },
  "Spice Symphony": {
    logo: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=800",
    categories: [
      { name: "Starters", isActive: true },
      { name: "Curries", isActive: true },
      { name: "Breads", isActive: true }
    ],
    items: {
      "Starters": [
        { name: "Paneer Tikka", price: 280, description: "Spiced paneer grilled in tandoor.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1599487405620-6e480e609ca0?w=500&q=80" },
        { name: "Chicken Samosa", price: 150, description: "Crispy pastry filled with spiced minced chicken.", isVeg: false, isAvailable: true, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80" }
      ],
      "Curries": [
        { name: "Butter Chicken", price: 420, description: "Classic rich tomato gravy with tender chicken.", isVeg: false, isAvailable: true, image: "https://images.unsplash.com/photo-1603894584373-5ac82b6ae398?w=500&q=80" },
        { name: "Dal Makhani", price: 300, description: "Slow-cooked black lentils with butter and cream.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&q=80" }
      ],
      "Breads": [
        { name: "Garlic Naan", price: 80, description: "Soft indian flatbread with garlic and butter.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1626200419109-38379f8fa577?w=500&q=80" }
      ]
    }
  },
  "Sushi Master": {
    logo: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=800",
    categories: [
      { name: "Appetizers", isActive: true },
      { name: "Sushi Rolls", isActive: true },
      { name: "Sashimi", isActive: true }
    ],
    items: {
      "Appetizers": [
         { name: "Edamame", price: 150, description: "Steamed soybeans with sea salt.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1621226343510-eb6ce31230e7?w=500&q=80" },
         { name: "Miso Soup", price: 120, description: "Traditional Japanese soybean soup.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500&q=80" }
      ],
      "Sushi Rolls": [
        { name: "California Roll", price: 450, description: "Crab, avocado, and cucumber.", isVeg: false, isAvailable: true, image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&q=80" },
        { name: "Spicy Tuna Roll", price: 550, description: "Fresh tuna with spicy mayo.", isVeg: false, isAvailable: true, image: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=500&q=80" },
        { name: "Veggie Dragon Roll", price: 350, description: "Avocado, cucumber, and asparagus wrapped in rice and seaweed.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=500&q=80" }
      ],
      "Sashimi": [
        { name: "Salmon Sashimi", price: 650, description: "Slices of premium raw salmon.", isVeg: false, isAvailable: true, image: "https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=500&q=80" }
      ]
    }
  },
  "La Piazza Pizza": {
    logo: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=800",
    categories: [
      { name: "Pizzas", isActive: true },
      { name: "Sides", isActive: true },
      { name: "Drinks", isActive: true }
    ],
    items: {
      "Pizzas": [
        { name: "Margherita", price: 299, description: "Classic cheese and tomato pizza.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&q=80" },
        { name: "Pepperoni", price: 450, description: "Spicy pepperoni slices with mozzarella.", isVeg: false, isAvailable: true, image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&q=80" },
        { name: "Veggie Supreme", price: 399, description: "Loaded with fresh vegetables and olives.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&q=80" }
      ],
      "Sides": [
         { name: "Garlic Breadsticks", price: 149, description: "Freshly baked garlic bread with cheese dip.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=500&q=80" }
      ],
      "Drinks": [
         { name: "Italian Soda", price: 110, description: "Refreshing fruit-flavored soda.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80" }
      ]
    }
  },
  "Green Bowl Co.": {
    logo: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800",
    categories: [
      { name: "Healthy Salads", isActive: true },
      { name: "Smoothies", isActive: true },
      { name: "Protein Bowls", isActive: true }
    ],
    items: {
      "Healthy Salads": [
        { name: "Avocado Quinoa Salad", price: 250, description: "Fresh greens with avocado, quinoa, and lemon dressing.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80" },
        { name: "Caesar Salad", price: 220, description: "Classic Caesar salad with croutons and parmesan.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500&q=80" }
      ],
      "Smoothies": [
        { name: "Berry Blast Smoothie", price: 180, description: "Mixed berries blended with almond milk.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1628557044797-f21e177cb814?w=500&q=80" },
        { name: "Green Detox", price: 190, description: "Spinach, apple, and ginger smoothie.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1610970878459-a0e4dc8f98ba?w=500&q=80" }
      ],
      "Protein Bowls": [
        { name: "Tofu Power Bowl", price: 320, description: "Grilled tofu, brown rice, and roasted veggies.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80" },
        { name: "Vegan Protein Bowl", price: 380, description: "Edamame, chickpeas, and sweet potatoes with tahini dressing.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80" }
      ]
    }
  },
  "El Taco Loco": {
    logo: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&q=80&w=800",
    categories: [
      { name: "Tacos", isActive: true },
      { name: "Burritos", isActive: true },
      { name: "Sides", isActive: true }
    ],
    items: {
      "Tacos": [
        { name: "Carne Asada Tacos", price: 180, description: "Grilled steak with onions and cilantro.", isVeg: false, isAvailable: true, image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500&q=80" },
        { name: "Al Pastor Tacos", price: 160, description: "Marinated pork with pineapple and salsa.", isVeg: false, isAvailable: true, image: "https://images.unsplash.com/photo-1599907697472-5b94ef64a2f8?w=500&q=80" },
        { name: "Veggie Tacos", price: 140, description: "Grilled vegetables with black beans and corn salsa.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&q=80" }
      ],
      "Burritos": [
        { name: "Chicken Burrito", price: 320, description: "Large flour tortilla filled with chicken, rice, beans, and cheese.", isVeg: false, isAvailable: true, image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&q=80" }
      ],
      "Sides": [
        { name: "Chips & Guacamole", price: 150, description: "Freshly made tortilla chips with avocado dip.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1588631184319-74d3af123d8c?w=500&q=80" }
      ]
    }
  }
};

const defaultSettings = restaurantConfigs["Burger Joint NYC"]; // Fallback if name not found

// We'll update ALL restaurants that are currently in the database
// The previous "Burger Joint", "Green Bowl", "Pizza Hub", "Ocean Catch", "Spice Market" need their names reverted to these
const renameMapping = {
  "Burger Joint": "Burger Joint NYC",
  "Spice Market": "Spice Symphony",
  "Ocean Catch": "Sushi Master",
  "Pizza Hub": "La Piazza Pizza",
  "Green Bowl": "Green Bowl Co."
};

async function seed() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://janvirao00021_db_user:JCdmAKFy0phfVntr@fooddash.kwqf0m4.mongodb.net/?appName=fooddash";
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for correction...");

    const db = mongoose.connection.db;
    
    // Clear menus first
    await db.collection("menucategories").deleteMany({});
    await db.collection("menuitems").deleteMany({});
    console.log("Cleared existing menucategories and menuitems");

    // Fetch all restaurants
    const restaurants = await db.collection("restaurants").find({}).toArray();
    
    let totalCats = 0;
    let totalItems = 0;

    for (const res of restaurants) {
      // Restore proper names if they were messed up
      const correctedName = renameMapping[res.name] || res.name;

      const config = restaurantConfigs[correctedName] || defaultSettings;
      
      // Update restaurant logo, coverImage, and name
      await db.collection("restaurants").updateOne(
        { _id: res._id },
        { $set: { 
            name: correctedName,
            logo: config.logo, 
            coverImage: config.coverImage 
        } }
      );

      for (const cat of config.categories) {
        // Create Category
        const catInsert = await db.collection("menucategories").insertOne({
          name: cat.name,
          isActive: cat.isActive,
          restaurant: res._id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        totalCats++;
        const categoryId = catInsert.insertedId;

        // Create Items
        const itemsInfo = config.items[cat.name] || [];
        for (const item of itemsInfo) {
          await db.collection("menuitems").insertOne({
            name: item.name,
            price: item.price,
            description: item.description,
            isVeg: item.isVeg,
            isAvailable: item.isAvailable,
            category: categoryId,
            restaurant: res._id,
            image: item.image,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          totalItems++;
        }
      }
    }

    console.log(`Successfully updated ${restaurants.length} restaurants with corrected names, logos & covers.`);
    console.log(`Successfully seeded ${totalCats} categories and ${totalItems} items.`);

  } catch (error) {
    console.error("Error seeding tailored menus:", error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

seed();
