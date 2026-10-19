
const express = require("express");
const requireClerkAuth = require("../middleware/clerkAuth");

const {
    createTask,
    getTasks,
    updateTask,
    deleteTask
} = require("../controllers/farmTask.controller");

const router = express.Router();

// All task routes require authentication
router.use(requireClerkAuth);

// Create a task
router.post("/", createTask);

// Get all tasks
router.get("/", getTasks);

// Update a task
router.patch("/:id", updateTask);

// Delete a task
router.delete("/:id", deleteTask);

module.exports = router;
