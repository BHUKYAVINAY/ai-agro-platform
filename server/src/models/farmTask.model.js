
const mongoose = require("mongoose");

const farmTaskSchema = new mongoose.Schema(
    {
        // Clerk ID of the farmer who owns this task
        clerkUserId: {
            type: String,
            required: true,
            index: true
        },

        // Task information
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },

        crop: {
            type: String,
            trim: true,
            maxlength: 80,
            default: ""
        },

        category: {
            type: String,
            enum: [
                "Irrigation",
                "Fertilizer",
                "Pest Control",
                "Crop Inspection",
                "Harvesting",
                "Other"
            ],
            default: "Other"
        },

        dueDate: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: ["Pending", "In Progress", "Completed"],
            default: "Pending"
        },

        priority: {
            type: String,
            enum: ["Low", "Medium", "High"],
            default: "Medium"
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

// Efficiently find a farmer's tasks by due date
farmTaskSchema.index({
    clerkUserId: 1,
    dueDate: 1
});

module.exports = mongoose.model("FarmTask", farmTaskSchema);
