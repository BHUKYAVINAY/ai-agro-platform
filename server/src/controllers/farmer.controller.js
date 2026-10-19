
const Farmer = require("../models/farmer.model");

const allowedSoils = [
    "Black Soil",
    "Red Soil",
    "Sandy Soil",
    "Clay Soil",
    "Loamy Soil",
    "Alluvial Soil",
    "Other"
];

const allowedWaterSources = [
    "Borewell",
    "Open Well",
    "Canal",
    "River",
    "Rainwater",
    "Other"
];

const allowedIrrigationMethods = [
    "Drip Irrigation",
    "Sprinkler Irrigation",
    "Flood Irrigation",
    "Furrow Irrigation",
    "Rainfed",
    "Other"
];

const getFarmerProfile = async (req, res) => {
    try {
        const farmer = await Farmer.findOne({
            clerkUserId: req.userId
        }).lean();

        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: "Farmer profile not found."
            });
        }

        return res.status(200).json({
            success: true,
            farmer
        });
    } catch (error) {
        console.error("Get farmer profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch farmer profile."
        });
    }
};

const saveFarmerProfile = async (req, res) => {
    try {
        const {
            name,
            location,
            district,
            state,
            farmSize,
            soilType,
            waterSource,
            irrigationMethod,
            crops
        } = req.body;

        const textFields = [
            name,
            location,
            district,
            state,
            soilType,
            waterSource,
            irrigationMethod
        ];

        if (
            textFields.some(
                (value) =>
                    typeof value !== "string" ||
                    !value.trim()
            ) ||
            farmSize === undefined ||
            farmSize === null ||
            farmSize === "" ||
            !Array.isArray(crops) ||
            crops.length === 0 ||
            !crops.every(
                (crop) =>
                    typeof crop === "string" &&
                    crop.trim().length > 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required farmer details."
            });
        }

        const size = Number(farmSize);

        if (!Number.isFinite(size) || size <= 0) {
            return res.status(400).json({
                success: false,
                message: "Farm size must be greater than zero."
            });
        }

        if (!allowedSoils.includes(soilType)) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid soil type."
            });
        }

        if (!allowedWaterSources.includes(waterSource)) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid water source."
            });
        }

        if (
            !allowedIrrigationMethods.includes(
                irrigationMethod
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid irrigation method."
            });
        }

        const uniqueCrops = [
            ...new Set(crops.map((crop) => crop.trim()))
        ];

        const farmerData = {
            name: name.trim(),
            location: location.trim(),
            district: district.trim(),
            state: state.trim(),
            farmSize: size,
            soilType,
            waterSource,
            irrigationMethod,
            crops: uniqueCrops
        };

        const farmer = await Farmer.findOneAndUpdate(
            {
                clerkUserId: req.userId
            },
            {
                $set: farmerData,
                $setOnInsert: {
                    clerkUserId: req.userId
                }
            },
            {
                returnDocument: "after",
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        return res.status(200).json({
            success: true,
            message: "Farmer profile saved successfully.",
            farmer
        });
    } catch (error) {
        console.error("Save farmer profile error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Some farmer details are invalid."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to save farmer profile."
        });
    }
};

module.exports = {
    getFarmerProfile,
    saveFarmerProfile
};