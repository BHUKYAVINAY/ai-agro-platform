
const FarmTask = require("../models/farmTask.model");

const validCategories = [
    "Irrigation",
    "Fertilizer",
    "Pest Control",
    "Crop Inspection",
    "Harvesting",
    "Other"
];

const validStatuses = ["Pending", "In Progress", "Completed"];
const validPriorities = ["Low", "Medium", "High"];

const allowedFields = [
    "title",
    "description",
    "crop",
    "category",
    "dueDate",
    "status",
    "priority",
    "notes"
];

// 1. Create a new farm task
const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            crop,
            category,
            dueDate,
            priority,
            notes
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Task title is required."
            });
        }

        if (!dueDate || Number.isNaN(Date.parse(dueDate))) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid due date."
            });
        }

        if (category && !validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task category."
            });
        }

        if (priority && !validPriorities.includes(priority)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task priority."
            });
        }

        const task = await FarmTask.create({
            clerkUserId: req.userId,
            title,
            description,
            crop,
            category,
            dueDate,
            priority,
            notes
        });

        return res.status(201).json({
            success: true,
            message: "Farm task created successfully.",
            task
        });
    } catch (error) {
        console.error("Create task error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to create farm task."
        });
    }
};

// 2. Get tasks belonging only to the signed-in farmer
const getTasks = async (req, res) => {
    try {
        const { status, category } = req.query;

        const filter = {
            clerkUserId: req.userId
        };

        if (status) {
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid task status."
                });
            }

            filter.status = status;
        }

        if (category) {
            if (!validCategories.includes(category)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid task category."
                });
            }

            filter.category = category;
        }

        const tasks = await FarmTask.find(filter).sort({
            dueDate: 1,
            createdAt: -1
        });

        return res.status(200).json({
            success: true,
            count: tasks.length,
            tasks
        });
    } catch (error) {
        console.error("Get tasks error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch farm tasks."
        });
    }
};

// 3. Update a task
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = {};

        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid task fields provided."
            });
        }

        if ("title" in updates &&
            (typeof updates.title !== "string" || !updates.title.trim())) {
            return res.status(400).json({
                success: false,
                message: "Task title cannot be empty."
            });
        }

        if ("dueDate" in updates &&
            (!updates.dueDate || Number.isNaN(Date.parse(updates.dueDate)))) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid due date."
            });
        }

        if ("category" in updates &&
            !validCategories.includes(updates.category)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task category."
            });
        }

        if ("status" in updates &&
            !validStatuses.includes(updates.status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task status."
            });
        }

        if ("priority" in updates &&
            !validPriorities.includes(updates.priority)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task priority."
            });
        }

        const task = await FarmTask.findOneAndUpdate(
            {
                _id: id,
                clerkUserId: req.userId
            },
            updates,
            {
                new: true,
                runValidators: true
            }
        );

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Farm task updated successfully.",
            task
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID."
            });
        }

        console.error("Update task error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to update farm task."
        });
    }
};

// 4. Delete a task
const deleteTask = async (req, res) => {
    try {
        const task = await FarmTask.findOneAndDelete({
            _id: req.params.id,
            clerkUserId: req.userId
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Farm task deleted successfully."
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID."
            });
        }

        console.error("Delete task error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to delete farm task."
        });
    }
};

module.exports = {
    createTask,
    getTasks,
    updateTask,
    deleteTask
};
