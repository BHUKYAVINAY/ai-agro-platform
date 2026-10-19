const express = require("express");
const multer = require("multer");

const requireClerkAuth = require("../middleware/clerkAuth");

const {
    createObservation,
    getObservations,
    updateObservation,
    deleteObservation
} = require("../controllers/cropObservation.controller");

const router = express.Router();

// Store uploaded images in memory temporarily.
const storage = multer.memoryStorage();

const imageFilter = (req, file, callback) => {
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.mimetype)) {
        return callback(
            new Error("Only JPG, PNG, and WEBP images are allowed.")
        );
    }

    callback(null, true);
};

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    },
    fileFilter: imageFilter
});

// All observation routes require authentication.
router.use(requireClerkAuth);

// Create an observation, optionally with a crop photo.
router.post("/:cropId", upload.single("photo"), createObservation);

// Get observation history for a crop.
router.get("/:cropId", getObservations);

// Update an observation, optionally with a new crop photo.
router.patch(
    "/:cropId/:observationId",
    upload.single("photo"),
    updateObservation
);

// Delete an observation.
router.delete("/:cropId/:observationId", deleteObservation);

module.exports = router;