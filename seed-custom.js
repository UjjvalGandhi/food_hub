const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const fallbackImages = {
  logo: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&h=200&fit=crop",
  coverImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=400&fit=crop",
};

const restaurantConfigs = {
  "Green Bowl": {
    logo: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&h=400&fit=crop",
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
        { name: "Sushi Bowl", price: 380, description: "Deconstructed sushi with sticky rice and veggies.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&q=80" }
      ]
    }
  },
  "Spice Market": {
    logo: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop",
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
  "Ocean Catch": {
    logo: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=1200&h=400&fit=crop",
    categories: [
      { name: "Appetizers", isActive: true },
      { name: "Seafood Mains", isActive: true }
    ],
    items: {
      "Appetizers": [
         { name: "Calamari Rings", price: 350, description: "Crispy fried calamari with tartar sauce.", isVeg: false, isAvailable: true, image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500&q=80" },
         { name: "Garlic Butter Prawns", price: 450, description: "Tiger prawns sautéed in garlic butter.", isVeg: false, isAvailable: true, image: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&q=80" }
      ],
      "Seafood Mains": [
        { name: "Grilled Salmon", price: 750, description: "Fresh salmon with lemon butter sauce.", isVeg: false, isAvailable: true, image: "https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=500&q=80" },
        { name: "Prawn Curry", price: 550, description: "Spicy coastal prawn curry served with rice.", isVeg: false, isAvailable: true, image: "https://images.unsplash.com/photo-1621226343510-eb6ce31230e7?w=500&q=80" }
      ]
    }
  },
  "Pizza Hub": {
    logo: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=1200&h=400&fit=crop",
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
         { name: "Cola", price: 60, description: "Chilled cola.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80" }
      ]
    }
  },
  "Burger Joint": {
    logo: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&h=400&fit=crop",
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
  }
};

const defaultSettings = {
  logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop",
  coverImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=400&fit=crop",
  categories: [
    { name: "Chef's Specials", isActive: true },
    { name: "Beverages", isActive: true }
  ],
  items: {
    "Chef's Specials": [
      { name: "Special Meal", price: 500, description: "Signature delicious meal.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1544025162-8315ea07fc7a?w=500&q=80" },
      { name: "Deluxe Thali", price: 350, description: "Complete balanced platter.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&q=80" }
    ],
    "Beverages": [
      { name: "Fresh Lime Soda", price: 90, description: "Refreshing sweet and salt lime soda.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80" },
      { name: "Cold Coffee", price: 150, description: "Chilled blended coffee.", isVeg: true, isAvailable: true, image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&q=80" }
    ]
  }
};

async function seed() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://janvirao00021_db_user:JCdmAKFy0phfVntr@fooddash.kwqf0m4.mongodb.net/?appName=fooddash";
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

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
      const config = restaurantConfigs[res.name] || defaultSettings;
      
      // Update restaurant logo and coverImage
      await db.collection("restaurants").updateOne(
        { _id: res._id },
        { $set: { logo: config.logo, coverImage: config.coverImage } }
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

    console.log(`Successfully updated ${restaurants.length} restaurants with logos & covers.`);
    console.log(`Successfully seeded ${totalCats} categories and ${totalItems} items.`);

  } catch (error) {
    console.error("Error seeding tailored menus:", error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

seed();
