// database.js
require("dotenv").config();
const mongoose = require("mongoose");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB successfully!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Define a schema for your "plans" collection
const planSchema = new mongoose.Schema({
  destination: { type: String, required: true },
  budget: Number,
  weather: String,
  itinerary: String,
  created_at: { type: Date, default: Date.now },
});

// Create a model (like a table)
const Plan = mongoose.model("Plan", planSchema);

// Export it so you can use it in other files
module.exports = Plan;