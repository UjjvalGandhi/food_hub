const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: { type: String, select: false },
  role: String,
  isApproved: Boolean,
  isBlocked: Boolean,
});

const DeliveryPartnerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  partnerId: String,
  name: String,
  phone: String,
  vehicleType: String,
  licenseNumber: String,
  availability: String,
  assignedOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const DeliveryPartner =
  mongoose.models.DeliveryPartner || mongoose.model("DeliveryPartner", DeliveryPartnerSchema);

async function getOrResetUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const roles = ["CUSTOMER", "PARTNER", "ADMIN", "DELIVERY_PARTNER"];
    const credentials = [];

    for (const role of roles) {
      // Find one user of this role
      let user = await User.findOne({ role }).select("+password");
      
      if (!user) {
        // Create one if it doesn't exist
        user = await User.create({
          name: `Test ${role}`,
          email: `${role.toLowerCase()}@test.com`,
          password: "password123", // plaintext
          role: role,
          isApproved: true,
          isBlocked: false
        });
        credentials.push({ role, email: user.email, password: "password123", action: "Created" });
      } else {
        // Reset to plaintext password
        user.password = "password123";
        await user.save();
        credentials.push({ role, email: user.email, password: "password123", action: "Reset" });
      }

      if (role === "DELIVERY_PARTNER") {
        const existingPartner = await DeliveryPartner.findOne({ user: user._id });

        if (!existingPartner) {
          await DeliveryPartner.create({
            user: user._id,
            partnerId: "DP-DEMO01",
            name: user.name,
            phone: "+91 9876543210",
            vehicleType: "BIKE",
            licenseNumber: "DL-DEMO-001",
            availability: "AVAILABLE",
            assignedOrders: [],
          });
        } else {
          existingPartner.name = user.name;
          existingPartner.phone = "+91 9876543210";
          existingPartner.vehicleType = "BIKE";
          existingPartner.licenseNumber = "DL-DEMO-001";
          existingPartner.availability = "AVAILABLE";
          await existingPartner.save();
        }
      }
    }

    require('fs').writeFileSync('users_clean.json', JSON.stringify(credentials, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

getOrResetUsers();
