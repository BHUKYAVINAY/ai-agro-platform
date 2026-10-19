
const mongoose = require("mongoose");

const cropObservationSchema = new mongoose.Schema(
    {
        clerkUserId: {
            type: String,
            required: true,
            index: true
        },

        cropId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Crop",
            required: true,
            index: true
        },

        observedAt: {
            type: Date,
            required: true,
            default: Date.now
        },

        plantHeightCm: {
            type: Number,
            min: 0,
            default: null
        },

        leafCondition: {
            type: String,
            enum: [
                "Healthy",
                "Yellowing",
                "Wilting",
                "Spots or lesions",
                "Pest damage",
                "Other"
            ],
            default: "Healthy"
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },

        photoUrl: {
            type: String,
            trim: true,
            default: ""
        },
        
        photoPublicId: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

cropObservationSchema.index({
    clerkUserId: 1,
    cropId: 1,
    observedAt: -1
});

module.exports = mongoose.model(
    "CropObservation",
    cropObservationSchema
);
