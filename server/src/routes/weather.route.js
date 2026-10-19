
const express = require("express");
const requireClerkAuth = require("../middleware/clerkAuth");
const { getWeather } = require("../controllers/weather.controller");

const router = express.Router();

router.get("/", requireClerkAuth, getWeather);

module.exports = router;
