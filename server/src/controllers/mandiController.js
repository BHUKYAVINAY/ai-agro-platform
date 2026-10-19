
const MandiPrice = require("../models/MandiPrice");
const { getAuth } = require("@clerk/express");
const mongoose = require("mongoose");

// Get the authenticated farmer's Clerk user ID
const getFarmerId = (req) => {
    const { userId } = getAuth(req);
    return userId;
};

// Save a new manual mandi price
exports.createMandiPrice = async (req, res) => {
    try {
        const farmerId = getFarmerId(req);

        if (!farmerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthenticated. Please sign in again.",
            });
        }

        const {
            cropName,
            marketName,
            district,
            state,
            minPrice,
            maxPrice,
            modalPrice,
            priceDate,
        } = req.body;

        if (
            !cropName?.trim() ||
            !marketName?.trim() ||
            !district?.trim() ||
            !state?.trim() ||
            !priceDate
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all required fields.",
            });
        }

        const min = Number(minPrice);
        const max = Number(maxPrice);
        const modal = Number(modalPrice);

        if (
            minPrice === "" ||
            maxPrice === "" ||
            modalPrice === "" ||
            minPrice == null ||
            maxPrice == null ||
            modalPrice == null ||
            !Number.isFinite(min) ||
            !Number.isFinite(max) ||
            !Number.isFinite(modal) ||
            min < 0 ||
            max < min ||
            modal < min ||
            modal > max
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Enter valid prices: minimum <= modal <= maximum.",
            });
        }

        const parsedDate = new Date(priceDate);

        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid price date.",
            });
        }

        const mandiPrice = await MandiPrice.create({
            farmerId,
            cropName: cropName.trim(),
            marketName: marketName.trim(),
            district: district.trim(),
            state: state.trim(),
            minPrice: min,
            maxPrice: max,
            modalPrice: modal,
            priceDate: parsedDate,
            source: "Manual entry",
        });

        return res.status(201).json({
            success: true,
            message: "Mandi price saved successfully.",
            mandiPrice,
        });
    } catch (error) {
        console.error("Create mandi price error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to save mandi price.",
        });
    }
};

// Get only the signed-in farmer's saved prices
exports.getMandiPrices = async (req, res) => {
    try {
        const farmerId = getFarmerId(req);

        if (!farmerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthenticated. Please sign in again.",
            });
        }

        const mandiPrices = await MandiPrice.find({
            farmerId,
        }).sort({ priceDate: -1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: mandiPrices.length,
            mandiPrices,
        });
    } catch (error) {
        console.error("Get mandi prices error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch mandi prices.",
        });
    }
};

// Delete a saved price belonging to the signed-in farmer
exports.deleteMandiPrice = async (req, res) => {
    try {
        const farmerId = getFarmerId(req);

        if (!farmerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthenticated. Please sign in again.",
            });
        }

        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid mandi price ID.",
            });
        }

        const deletedPrice = await MandiPrice.findOneAndDelete({
            _id: id,
            farmerId,
        });

        if (!deletedPrice) {
            return res.status(404).json({
                success: false,
                message: "Mandi price not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Mandi price deleted successfully.",
        });
    } catch (error) {
        console.error("Delete mandi price error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete mandi price.",
        });
    }
};
