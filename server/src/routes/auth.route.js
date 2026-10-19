
const express = require("express");
const requireClerkAuth = require("../middleware/clerkAuth");

const router = express.Router();

router.get("/protected", requireClerkAuth, (req, res) => {
    return res.status(200).json({
        success: true,
        message: "You are authenticated!",
        userId: req.userId
    });
});

module.exports = router;
