

const express = require("express");

const requireClerkAuth = require("../middleware/clerkAuth");

const {
    getFarmerProfile,
    saveFarmerProfile
} = require("../controllers/farmer.controller");

const router = express.Router();

router.get(
    "/profile",
    requireClerkAuth,
    getFarmerProfile
);

router.post(
    "/profile",
    requireClerkAuth,
    saveFarmerProfile
);

module.exports = router;