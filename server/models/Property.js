const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
  propertyName: { type: String, required: true },
  description: String,
  location: String,
  pincode: String,

  type: {
    type: String,
    enum: ["sale", "rent", "house", "apartment", "duplex", "land", "commercial"],
    required: true
  },

  status: {
    type: String,
    enum: ["for-sale", "for-rent", "sold", "rented"],
    default: "for-sale"
  },

  price: { type: Number, required: true },

  images: [String], // 🔥 for Cloudinary later

  //house-specific fields
  length: { type: Number },
  width  : { type: Number },
  bedrooms: { type: Number },
  bathrooms: { type: Number },
  totalSqft: { type: Number },

  // residential preference (house / apartment / duplex only)
  vegPreference: {
    type: String,
    enum: ["veg", "non-veg", "any"],
    default: null
  },

  // Owner reference
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' }

}, { timestamps: true });

module.exports = mongoose.model("Property", propertySchema);