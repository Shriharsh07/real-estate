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

// GET ALL
router.get("/", auth, getProperties);

// GET ONE
router.get("/:id", auth, getPropertyById);

// UPDATE
router.put("/:id", auth, updateProperty);

// DELETE
router.delete("/:id", auth, deleteProperty);

module.exports = router;