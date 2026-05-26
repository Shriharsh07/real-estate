const Property = require("../models/Property");

const validStatusByType = {
  sale: ["for-sale", "sold"],
  rent: ["for-rent", "rented"],
  house: ["for-sale", "for-rent", "sold", "rented"],
  apartment : ["for-sale", "for-rent", "sold", "rented"],
  duplex : ["for-sale", "for-rent", "sold", "rented"],
  land : ["for-sale", "for-rent", "sold", "rented"],
  commercial : ["for-sale", "for-rent", "sold", "rented"]
};

// CREATE
exports.createProperty = async (req, res) => {
  try {
    const { type, status } = req.body;

    if (!validStatusByType[type]?.includes(status)) {
      return res.status(400).json({ message: "Invalid status for type" });
    }

    const property = await Property.create(req.body);
    res.status(200).json(property);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL (with filters)
exports.getProperties = async (req, res) => {
  try {
    const { type, status, location, owner, minPrice, maxPrice } = req.query;

    let filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (location) filter.location = { $regex: location, $options: "i" };
    if (owner) filter.owner = owner;
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const properties = await Property.find(filter).populate('owner').sort({ createdAt: -1 });

    res.json(properties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ONE
exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.json(property);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.updateProperty = async (req, res) => {
  try {
    const { type, status } = req.body;

    if (!validStatusByType[type]?.includes(status)) {
      return res.status(400).json({ message: "Invalid status for type" });
    }

    const updated = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
exports.deleteProperty = async (req, res) => {
  try {
    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: "Property deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const total = await Property.countDocuments();

    const available = await Property.countDocuments({ status: "available" });
    const sold = await Property.countDocuments({ status: "sold" });
    const rented = await Property.countDocuments({ status: "rented" });

    res.json({
      total,
      available,
      sold,
      rented
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
