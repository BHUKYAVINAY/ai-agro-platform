
const express = require("express");
const requireClerkAuth = require("../middleware/clerkAuth");

const {
    createCrop,
    getCrops,
    updateCrop,
    deleteCrop
} = require("../controllers/cropGrowth.controller");

const router = express.Router();

// Every crop route requires a signed-in user.
router.use(requireClerkAuth);

// Add a crop
router.post("/", createCrop);

// Get the signed-in farmer's crops
router.get("/", getCrops);

// Update crop details or growth stage
router.patch("/:id", updateCrop);

// Delete a crop
router.delete("/:id", deleteCrop);

module.exports = router;
