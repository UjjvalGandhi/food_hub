const mongoose = require('mongoose');

// Define Schema manually for test to avoid path issues
const GroupOrderSchema = new mongoose.Schema(
  {
    creator: { type: mongoose.Schema.Types.ObjectId, required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, required: true },
    inviteCode: { type: String, required: true, unique: true },
    status: { type: String, default: 'COLLECTING' },
    totalAmount: { type: Number, default: 0 },
    items: []
  },
  { timestamps: true }
);

GroupOrderSchema.pre('save', function (next) {
  console.log('Pre-save hook called. typeof next:', typeof next);
  try {
    if (typeof next === 'function') {
      next();
    } else {
      console.log('next is not a function!');
    }
  } catch (err) {
    console.error('Error in pre-save:', err);
  }
});

const GroupOrder = mongoose.models.GroupOrderTest || mongoose.model('GroupOrderTest', GroupOrderSchema);

async function test() {
  const URI = "mongodb+srv://janvirao00021_db_user:JCdmAKFy0phfVntr@fooddash.kwqf0m4.mongodb.net/?appName=fooddash";
  try {
    await mongoose.connect(URI);
    console.log('Connected to DB');

    const go = new GroupOrder({
      creator: new mongoose.Types.ObjectId(),
      restaurant: new mongoose.Types.ObjectId(),
      inviteCode: 'TEST' + Math.random().toString(36).substring(7).toUpperCase()
    });

    console.log('Attempting to save...');
    await go.save();
    console.log('Saved successfully!');
    
    process.exit(0);
  } catch (err) {
    console.error('Test Failed:', err);
    process.exit(1);
  }
}

test();
