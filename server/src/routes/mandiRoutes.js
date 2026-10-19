
const express = require("express");
const router = express.Router();

const {
    createMandiPrice,
    getMandiPrices,
    deleteMandiPrice,
} = require("../controllers/mandiController");

const { requireAuth } = require("@clerk/express");

// Get all saved mandi prices for the signed-in farmer
router.get("/", requireAuth(), getMandiPrices);

// Save a new mandi price
router.post("/", requireAuth(), createMandiPrice);

// Delete a saved mandi price
router.delete("/:id", requireAuth(), deleteMandiPrice);

module.exports = router;
