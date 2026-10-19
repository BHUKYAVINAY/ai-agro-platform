
const express = require("express");
const cors = require("cors");
const { clerkMiddleware } = require("@clerk/express");

const authRoutes = require("./routes/auth.route");
const assistantRoutes = require("./routes/assistant.route");
const farmerRoutes = require("./routes/farmer.route");
const diseaseRoutes = require("./routes/disease.route");
const cropRoutes = require("./routes/crop.route");
const weatherRoutes = require("./routes/weather.route");
const alertsRoutes = require("./routes/alerts.route");
const farmTaskRoutes = require("./routes/farmTask.route");
const cropGrowthRoutes = require("./routes/cropGrowth.route")
const cropObservationRoutes = require("./routes/cropObservation.route");
const mandiRoutes = require("./routes/mandiRoutes");


const app = express();

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true
    })
);

// Initialize Clerk before protected routes.
app.use(clerkMiddleware());

app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "AGRO-AI backend is running!"
    });
});

app.use("/api/test", authRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/farmer", farmerRoutes);
app.use("/api/disease", diseaseRoutes);
app.use("/api/crop", cropRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/tasks", farmTaskRoutes);
app.use("/api/crop-growth", cropGrowthRoutes);
app.use("/api/crop-observations", cropObservationRoutes);
app.use("/api/mandi-prices", mandiRoutes);



// Handle unknown routes.
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found."
    });
});

// Final error handler.
app.use((error, req, res, next) => {
    console.error("Unhandled server error:", error);

    if (res.headersSent) {
        return next(error);
    }

    return res.status(500).json({
        success: false,
        message: "An unexpected server error occurred."
    });
});

module.exports = app;
