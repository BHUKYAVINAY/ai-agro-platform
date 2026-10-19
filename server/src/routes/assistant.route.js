
const express = require("express");
const requireClerkAuth = require("../middleware/clerkAuth");

const {
    chatWithAgroAI
} = require("../controllers/assistant.controller");

const router = express.Router();

router.post(
    "/chat",
    requireClerkAuth,
    chatWithAgroAI
);

module.exports = router;
