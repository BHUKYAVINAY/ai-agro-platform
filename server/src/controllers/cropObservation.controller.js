const mongoose = require("mongoose");
const { Readable } = require("stream");

const Crop = require("../models/Crop.model");
const CropObservation = require("../models/CropObservation.model");
const cloudinary = require("../config/cloudinary");

const ALLOWED_CONDITIONS = [
    "Healthy",
    "Yellowing",
    "Wilting",
    "Spots or lesions",
    "Pest damage",
    "Other"
];

const uploadPhoto = (file) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "agro-ai/crop-observations",
                resource_type: "image",
                allowed_formats: ["jpg", "jpeg", "png", "webp"]
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        Readable.from(file.buffer).pipe(stream);
    });

const deleteCloudinaryPhoto = async (publicId) => {
    if (!publicId) return;

    try {
        await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
            invalidate: true
        });
    } catch (error) {
        console.error("Cloudinary cleanup error:", error.message);
    }
};

const validObjectId = (id) => mongoose.isValidObjectId(id);

const validHeight = (value) =>
    value === null ||
    value === "" ||
    (
        Number.isFinite(Number(value)) &&
        Number(value) >= 0
    );

const parseDate = (value) => {
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime()) ? null : date;
};

// Create an observation, optionally with a photo.
const createObservation = async (req, res) => {
    let uploadedPublicId = "";

    try {
        const { cropId } = req.params;
        const {
            observedAt,
            plantHeightCm,
            leafCondition,
            notes
        } = req.body;

        if (!validObjectId(cropId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid crop ID."
            });
        }

        const crop = await Crop.findOne({
            _id: cropId,
            clerkUserId: req.userId
        });

        if (!crop) {
            return res.status(404).json({
                success: false,
                message: "Crop not found."
            });
        }

        if (
            plantHeightCm !== undefined &&
            !validHeight(plantHeightCm)
        ) {
            return res.status(400).json({
                success: false,
                message: "Plant height must be a non-negative number."
            });
        }

        const observationDate = parseDate(observedAt);

        if (!observationDate) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid observation date."
            });
        }

        if (
            leafCondition &&
            !ALLOWED_CONDITIONS.includes(leafCondition)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid leaf condition."
            });
        }

        if (
            notes !== undefined &&
            (
                typeof notes !== "string" ||
                notes.length > 1000
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Notes must be at most 1000 characters."
            });
        }

        let photoUrl = "";
        let photoPublicId = "";

        if (req.file) {
            const result = await uploadPhoto(req.file);
            photoUrl = result.secure_url;
            photoPublicId = result.public_id;
            uploadedPublicId = result.public_id;
        }

        const observation = await CropObservation.create({
            clerkUserId: req.userId,
            cropId: crop._id,
            observedAt: observationDate,
            plantHeightCm:
                plantHeightCm === undefined ||
                plantHeightCm === null ||
                plantHeightCm === ""
                    ? null
                    : Number(plantHeightCm),
            leafCondition: leafCondition || "Healthy",
            notes: notes || "",
            photoUrl,
            photoPublicId
        });

        return res.status(201).json({
            success: true,
            message: "Crop observation saved successfully.",
            observation
        });
    } catch (error) {
        if (uploadedPublicId) {
            await deleteCloudinaryPhoto(uploadedPublicId);
        }

        console.error("Create observation error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to save crop observation."
        });
    }
};

// Get observation history for a crop.
const getObservations = async (req, res) => {
    try {
        const { cropId } = req.params;

        if (!validObjectId(cropId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid crop ID."
            });
        }

        const crop = await Crop.findOne({
            _id: cropId,
            clerkUserId: req.userId
        });

        if (!crop) {
            return res.status(404).json({
                success: false,
                message: "Crop not found."
            });
        }

        const observations = await CropObservation.find({
            cropId: crop._id,
            clerkUserId: req.userId
        }).sort({ observedAt: -1 });

        return res.status(200).json({
            success: true,
            count: observations.length,
            observations
        });
    } catch (error) {
        console.error("Get observations error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch crop observations."
        });
    }
};

// Update observation details and optionally replace its photo.
const updateObservation = async (req, res) => {
    let uploadedPublicId = "";

    try {
        const { cropId, observationId } = req.params;

        if (
            !validObjectId(cropId) ||
            !validObjectId(observationId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid crop or observation ID."
            });
        }

        const crop = await Crop.findOne({
            _id: cropId,
            clerkUserId: req.userId
        });

        if (!crop) {
            return res.status(404).json({
                success: false,
                message: "Crop not found."
            });
        }

        const observation = await CropObservation.findOne({
            _id: observationId,
            cropId: crop._id,
            clerkUserId: req.userId
        });

        if (!observation) {
            return res.status(404).json({
                success: false,
                message: "Observation not found."
            });
        }

        const {
            observedAt,
            plantHeightCm,
            leafCondition,
            notes
        } = req.body;

        const updates = {};

        if (observedAt !== undefined) {
            const date = parseDate(observedAt);

            if (!date) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid observation date."
                });
            }

            updates.observedAt = date;
        }

        if (plantHeightCm !== undefined) {
            if (!validHeight(plantHeightCm)) {
                return res.status(400).json({
                    success: false,
                    message: "Plant height must be a non-negative number or empty."
                });
            }

            updates.plantHeightCm =
                plantHeightCm === "" || plantHeightCm === null
                    ? null
                    : Number(plantHeightCm);
        }

        if (leafCondition !== undefined) {
            if (!ALLOWED_CONDITIONS.includes(leafCondition)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid leaf condition."
                });
            }

            updates.leafCondition = leafCondition;
        }

        if (notes !== undefined) {
            if (
                typeof notes !== "string" ||
                notes.length > 1000
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Notes must be at most 1000 characters."
                });
            }

            updates.notes = notes;
        }

        if (req.file) {
            const result = await uploadPhoto(req.file);
            uploadedPublicId = result.public_id;

            updates.photoUrl = result.secure_url;
            updates.photoPublicId = result.public_id;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Provide a field or photo to update."
            });
        }

        Object.assign(observation, updates);
        await observation.save();

        // Delete the old image only after the new one is saved.
        if (
            req.file &&
            observation.photoPublicId !== uploadedPublicId
        ) {
            await deleteCloudinaryPhoto(
                observation.photoPublicId
            );
        }

        return res.status(200).json({
            success: true,
            message: "Observation updated successfully.",
            observation
        });
    } catch (error) {
        if (uploadedPublicId) {
            await deleteCloudinaryPhoto(uploadedPublicId);
        }

        console.error("Update observation error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to update crop observation."
        });
    }
};

// Delete an observation and its associated photo.
const deleteObservation = async (req, res) => {
    try {
        const { cropId, observationId } = req.params;

        if (
            !validObjectId(cropId) ||
            !validObjectId(observationId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid crop or observation ID."
            });
        }

        const crop = await Crop.findOne({
            _id: cropId,
            clerkUserId: req.userId
        });

        if (!crop) {
            return res.status(404).json({
                success: false,
                message: "Crop not found."
            });
        }

        const observation = await CropObservation.findOneAndDelete({
            _id: observationId,
            cropId: crop._id,
            clerkUserId: req.userId
        });

        if (!observation) {
            return res.status(404).json({
                success: false,
                message: "Observation not found."
            });
        }

        await deleteCloudinaryPhoto(observation.photoPublicId);

        return res.status(200).json({
            success: true,
            message: "Observation and its photo deleted successfully."
        });
    } catch (error) {
        console.error("Delete observation error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to delete crop observation."
        });
    }
};

module.exports = {
    createObservation,
    getObservations,
    updateObservation,
    deleteObservation
};