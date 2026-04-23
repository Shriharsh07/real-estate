const Property = require("../models/Property");

const validStatusByType = {
  sale: ["available", "sold"],
  rent: ["available", "rented"]
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
    const { type, status, location } = req.query;

    let filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (location) filter.location = { $regex: location, $options: "i" };

    const properties = await Property.find(filter).sort({ createdAt: -1 });

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