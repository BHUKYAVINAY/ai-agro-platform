
const mongoose = require("mongoose");

const mandiPriceSchema = new mongoose.Schema(
    {
        farmerId: {
            type: String,
            required: true,
            index: true,
        },

        cropName: {
            type: String,
            required: true,
            trim: true,
        },

        marketName: {
            type: String,
            required: true,
            trim: true,
        },

        district: {
            type: String,
            required: true,
            trim: true,
        },

        state: {
            type: String,
            required: true,
            trim: true,
        },

        minPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        maxPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        modalPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        priceDate: {
            type: Date,
            required: true,
        },

        source: {
            type: String,
            default: "Manual entry",
        },
    },
    {
        timestamps: true,
    }
);

mandiPriceSchema.pre("validate", function () {
    if (
        this.minPrice > this.maxPrice ||
        this.modalPrice < this.minPrice ||
        this.modalPrice > this.maxPrice
    ) {
        this.invalidate(
            "modalPrice",
            "Prices must satisfy minimum <= modal <= maximum."
        );
    }
});

module.exports = mongoose.model("MandiPrice", mandiPriceSchema);
    