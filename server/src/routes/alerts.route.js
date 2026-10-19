
const express = require("express");
const requireClerkAuth = require("../middleware/clerkAuth");
const {
    getWeatherAlerts
} = require("../controllers/alerts.controller");

const router = express.Router();

router.get("/", requireClerkAuth, getWeatherAlerts);

module.exports = router;
