
require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`AGRO-AI server running on port ${PORT}`);
    });
};

startServer().catch((error) => {
    console.error("Unable to start AGRO-AI:", error.message);
    process.exit(1);
});
