const Owner = require("../models/Owner");

// CREATE
exports.createOwner = async (req, res) => {
  try {
    const owner = await Owner.create(req.body);
    res.status(200).json(owner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL
exports.getOwners = async (req, res) => {
  try {
    const owners = await Owner.find().sort({ createdAt: -1 });
    res.json(owners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ONE
exports.getOwnerById = async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id).populate('properties');
    
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }
    
    res.json(owner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.updateOwner = async (req, res) => {
  try {
    const updated = await Owner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({ message: "Owner not found" });
    }
    
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
exports.deleteOwner = async (req, res) => {
  try {
    const owner = await Owner.findByIdAndDelete(req.params.id);
    
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }
    
    res.json({ message: "Owner deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
