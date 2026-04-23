const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const { uploadImages } = require("../controllers/uploadController");

router.post("/", auth, upload.array("images", 5), uploadImages);

module.exports = router;