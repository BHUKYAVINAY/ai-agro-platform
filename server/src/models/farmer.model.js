
const mongoose = require("mongoose");

const farmerSchema = new mongoose.Schema(
    {
        clerkUserId: {
            type: String,
            required: true,
            unique: true
        },

        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        location: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },

        district: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        state: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        farmSize: {
            type: Number,
            required: true,
            min: 0.01
        },

        soilType: {
            type: String,
            required: true,
            enum: [
                "Black Soil",
                "Red Soil",
                "Sandy Soil",
                "Clay Soil",
                "Loamy Soil",
                "Alluvial Soil",
                "Other"
            ]
        },

        // Source from which the farmer obtains water.
        waterSource: {
            type: String,
            required: true,
            enum: [
                "Borewell",
                "Open Well",
                "Canal",
                "River",
                "Rainwater",
                "Other"
            ]
        },

        // Method used to supply water to crops.
        irrigationMethod: {
            type: String,
            required: true,
            enum: [
                "Drip Irrigation",
                "Sprinkler Irrigation",
                "Flood Irrigation",
                "Furrow Irrigation",
                "Rainfed",
                "Other"
            ]
        },

        crops: {
            type: [{
                type: String,
                trim: true
            }],
            required: true,
            validate: {
                validator: (crops) =>
                    Array.isArray(crops) &&
                    crops.length > 0 &&
                    crops.every(
                        (crop) =>
                            typeof crop === "string" &&
                            crop.length > 0
                    ),
                message: "Select at least one valid crop."
            }
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Farmer", farmerSchema);