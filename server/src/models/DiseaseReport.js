
const mongoose = require("mongoose");

const diseaseReportSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true
        },

        crop: {
            type: String,
            required: true,
            trim: true
        },

        analysis: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        }
    },
    {
        timestamps: true
    }
);

diseaseReportSchema.index({
    userId: 1,
    createdAt: -1
});

module.exports = mongoose.model(
    "DiseaseReport",
    diseaseReportSchema
);
