
const express = require("express");
const multer = require("multer");
const requireClerkAuth = require("../middleware/clerkAuth");

const {
    detectCropDisease
} = require("../controllers/disease.controller");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    },
    fileFilter: (req, file, callback) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return callback(
                new Error("Upload a JPG, PNG, or WebP image.")
            );
        }

        callback(null, true);
    }
});

const handleUpload = (req, res, next) => {
    upload.single("photo")(req, res, (error) => {
        if (!error) {
            return next();
        }

        const isSizeError =
            error instanceof multer.MulterError &&
            error.code === "LIMIT_FILE_SIZE";

        return res.status(isSizeError ? 413 : 400).json({
            success: false,
            message: isSizeError
                ? "Image must be 5 MB or smaller."
                : error.message || "Unable to upload image."
        });
    });
};

router.post(
    "/detect",
    requireClerkAuth,
    handleUpload,
    detectCropDisease
);

module.exports = router;
