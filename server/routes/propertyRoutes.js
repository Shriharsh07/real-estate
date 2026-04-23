const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty
} = require("../controllers/propertyController");

// CREATE
router.post("/", auth, createProperty);

// GET ALL (public endpoint)
router.get("/", getProperties);

// GET ONE (protected)
router.get("/:id", auth, getPropertyById);

// UPDATE (protected)
router.put("/:id", auth, updateProperty);

// DELETE (protected)
router.delete("/:id", auth, deleteProperty);

module.exports = router;