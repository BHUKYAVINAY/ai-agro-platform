
const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema(
    {
        // Clerk ID of the farmer who owns this crop
        clerkUserId: {
            type: String,
            required: true,
            index: true
        },

        cropName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80
        },

        variety: {
            type: String,
            trim: true,
            maxlength: 100,
            default: ""
        },

        plantingDate: {
            type: Date,
            required: true
        },

        fieldSize: {
            type: Number,
            required: true,
            min: 0.01
        },

        fieldSizeUnit: {
            type: String,
            enum: ["Acres", "Hectares"],
            default: "Acres"
        },

        growthStage: {
            type: String,
            enum: [
                "Seedling",
                "Vegetative",
                "Flowering",
                "Fruiting",
                "Maturity",
                "Harvested"
            ],
            default: "Seedling"
        },

        estimatedHarvestDate: {
            type: Date,
            default: null
        },

        status: {
            type: String,
            enum: ["Growing", "Harvested", "Failed"],
            default: "Growing"
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

// Efficiently find one farmer's crops
cropSchema.index({ clerkUserId: 1, plantingDate: -1 });

module.exports = mongoose.model("Crop", cropSchema);
