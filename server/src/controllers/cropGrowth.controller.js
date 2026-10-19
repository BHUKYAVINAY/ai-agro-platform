
const mongoose = require("mongoose");
const Crop = require("../models/Crop.model");

const validStages = [
    "Seedling",
    "Vegetative",
    "Flowering",
    "Fruiting",
    "Maturity",
    "Harvested"
];

const validStatuses = ["Growing", "Harvested", "Failed"];
const validUnits = ["Acres", "Hectares"];

const allowedFields = [
    "cropName",
    "variety",
    "plantingDate",
    "fieldSize",
    "fieldSizeUnit",
    "growthStage",
    "estimatedHarvestDate",
    "status",
    "notes"
];

const validateDate = (value) => {
    if (value === null || value === "") return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
};

// CREATE CROP
const createCrop = async (req, res) => {
    try {
        const {
            cropName,
            variety,
            plantingDate,
            fieldSize,
            fieldSizeUnit,
            growthStage,
            estimatedHarvestDate,
            status,
            notes
        } = req.body;

        if (
            typeof cropName !== "string" ||
            !cropName.trim() ||
            !plantingDate ||
            fieldSize === undefined ||
            fieldSize === "" ||
            !Number.isFinite(Number(fieldSize)) ||
            Number(fieldSize) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Crop name, planting date, and a positive field size are required."
            });
        }

        const parsedPlantingDate = validateDate(plantingDate);

        if (!parsedPlantingDate) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid planting date."
            });
        }

        const parsedHarvestDate =
            estimatedHarvestDate === undefined ||
            estimatedHarvestDate === null ||
            estimatedHarvestDate === ""
                ? null
                : validateDate(estimatedHarvestDate);

        if (parsedHarvestDate === undefined) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid estimated harvest date."
            });
        }

        if (
            parsedHarvestDate &&
            parsedHarvestDate < parsedPlantingDate
        ) {
            return res.status(400).json({
                success: false,
                message: "Harvest date cannot be before the planting date."
            });
        }

        if (growthStage && !validStages.includes(growthStage)) {
            return res.status(400).json({
                success: false,
                message: "Invalid crop growth stage."
            });
        }

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid crop status."
            });
        }

        if (fieldSizeUnit && !validUnits.includes(fieldSizeUnit)) {
            return res.status(400).json({
                success: false,
                message: "Field size unit must be Acres or Hectares."
            });
        }

        const crop = await Crop.create({
            clerkUserId: req.userId,
            cropName: cropName.trim(),
            variety,
            plantingDate: parsedPlantingDate,
            fieldSize: Number(fieldSize),
            fieldSizeUnit,
            growthStage,
            estimatedHarvestDate: parsedHarvestDate,
            status,
            notes
        });

        return res.status(201).json({
            success: true,
            message: "Crop added successfully.",
            crop
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        console.error("Create crop error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to add crop."
        });
    }
};

// GET ALL CROPS FOR SIGNED-IN FARMER
const getCrops = async (req, res) => {
    try {
        const crops = await Crop.find({
            clerkUserId: req.userId
        }).sort({ plantingDate: -1 });

        return res.status(200).json({
            success: true,
            count: crops.length,
            crops
        });
    } catch (error) {
        console.error("Get crops error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve crops."
        });
    }
};

// UPDATE CROP
const updateCrop = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid crop ID."
            });
        }

        const updates = {};

        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided for update."
            });
        }

        if (
            updates.cropName !== undefined &&
            (typeof updates.cropName !== "string" ||
                !updates.cropName.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Crop name cannot be empty."
            });
        }

        if (
            updates.fieldSize !== undefined &&
            (!Number.isFinite(Number(updates.fieldSize)) ||
                Number(updates.fieldSize) <= 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "Field size must be a positive number."
            });
        }

        if (
            updates.growthStage !== undefined &&
            !validStages.includes(updates.growthStage)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid crop growth stage."
            });
        }

        if (
            updates.status !== undefined &&
            !validStatuses.includes(updates.status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid crop status."
            });
        }

        if (
            updates.fieldSizeUnit !== undefined &&
            !validUnits.includes(updates.fieldSizeUnit)
        ) {
            return res.status(400).json({
                success: false,
                message: "Field size unit must be Acres or Hectares."
            });
        }

        if (updates.cropName !== undefined) {
            updates.cropName = updates.cropName.trim();
        }

        if (updates.fieldSize !== undefined) {
            updates.fieldSize = Number(updates.fieldSize);
        }

        if (updates.plantingDate !== undefined) {
            const date = validateDate(updates.plantingDate);

            if (!date) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid planting date."
                });
            }

            updates.plantingDate = date;
        }

        if (updates.estimatedHarvestDate !== undefined) {
            const date = validateDate(updates.estimatedHarvestDate);

            if (updates.estimatedHarvestDate !== null && !date) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid estimated harvest date."
                });
            }

            updates.estimatedHarvestDate = date;
        }

        const existingCrop = await Crop.findOne({
            _id: id,
            clerkUserId: req.userId
        });

        if (!existingCrop) {
            return res.status(404).json({
                success: false,
                message: "Crop not found."
            });
        }

        const finalPlantingDate =
            updates.plantingDate || existingCrop.plantingDate;

        const finalHarvestDate =
            updates.estimatedHarvestDate !== undefined
                ? updates.estimatedHarvestDate
                : existingCrop.estimatedHarvestDate;

        if (
            finalHarvestDate &&
            finalHarvestDate < finalPlantingDate
        ) {
            return res.status(400).json({
                success: false,
                message: "Harvest date cannot be before the planting date."
            });
        }

        const crop = await Crop.findOneAndUpdate(
            { _id: id, clerkUserId: req.userId },
            { $set: updates },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: "Crop updated successfully.",
            crop
        });
    } catch (error) {
        console.error("Update crop error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to update crop."
        });
    }
};

// DELETE CROP
const deleteCrop = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid crop ID."
            });
        }

        const crop = await Crop.findOneAndDelete({
            _id: id,
            clerkUserId: req.userId
        });

        if (!crop) {
            return res.status(404).json({
                success: false,
                message: "Crop not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Crop deleted successfully."
        });
    } catch (error) {
        console.error("Delete crop error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to delete crop."
        });
    }
};

module.exports = {
    createCrop,
    getCrops,
    updateCrop,
    deleteCrop
};
