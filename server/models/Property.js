const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  location: String,

  type: {
    type: String,
    enum: ["sale", "rent"],
    required: true
  },

  status: {
    type: String,
    enum: ["available", "sold", "rented"],
    default: "available"
  },

  price: { type: Number, required: true },

  images: [String], // 🔥 for Cloudinary later

  owner: {
    name: String,
    phone: String,
    email: String
  }

}, { timestamps: true });

module.exports = mongoose.model("Property", propertySchema);