const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

async function testEngine() {
  await mongoose.connect(process.env.MONGODB_URI);
  const items = await mongoose.connection.db.collection("menuitems").find({}).toArray();
  
  const context = { mood: "burger" };
  const WEIGHTS = { SPECIAL_BOOST: 20 };
  
  items.forEach(item => {
    let score = 0;
    [context.mood].forEach(ctxParam => {
        if (ctxParam && item.name) {
           const lowerParam = ctxParam.toLowerCase();
           const inName = item.name.toLowerCase().includes(lowerParam);
           const inDesc = item.description ? item.description.toLowerCase().includes(lowerParam) : false;
           if (inName || inDesc) {
              score += WEIGHTS.SPECIAL_BOOST;
           }
        }
      });
      if(score > 0) {
          console.log(item.name, score);
      }
  });
  
  process.exit();
}
testEngine();
