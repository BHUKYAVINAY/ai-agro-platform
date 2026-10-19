const express = require("express");
const requireClerkAuth = require("../middleware/clerkAuth");
const { recommendCrops } = require("../controllers/crop.controller");

const router = express.Router();

// Only signed-in users can request crop recommendations.
router.post("/recommend", requireClerkAuth, recommendCrops);

module.exports = router;