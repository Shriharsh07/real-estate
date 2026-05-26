const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  createOwner,
  getOwners,
  getOwnerById,
  updateOwner,
  deleteOwner
} = require("../controllers/ownerController");

// CREATE
router.post("/", auth, createOwner);

// GET ALL
router.get("/", getOwners);

// GET ONE
router.get("/:id", auth, getOwnerById);

// UPDATE
router.put("/:id", auth, updateOwner);

// DELETE
router.delete("/:id", auth, deleteOwner);

module.exports = router;
