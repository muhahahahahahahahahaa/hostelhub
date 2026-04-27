const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const listingRoutes = require("./routes/listingRoutes");
const inquiryRoutes = require("./routes/inquiryRoutes");
const savedListingRoutes = require("./routes/savedListingRoutes");
const analyticsRoute = require("./routes/analyticsRoutes");
const chatRoutes = require("./routes/chatRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const { startInquiryReminderScheduler } = require("./utils/inquiryReminderScheduler");
const { startInquiryPaymentScheduler } = require("./utils/inquiryPaymentScheduler");

const app = express();

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

const startServer = async () => {
    await connectDB();
    startInquiryReminderScheduler();
    startInquiryPaymentScheduler();

    app.use(express.json());

    app.use("/api/auth", authRoutes);
    app.use("/api/user", userRoutes);
    app.use("/api/listings", listingRoutes);
    app.use("/api/inquiries", inquiryRoutes);
    app.use("/api/saved-listings", savedListingRoutes);
    app.use("/api/analytics", analyticsRoute);
    app.use("/api/chats", chatRoutes);
    app.use("/api/notifications", notificationRoutes);

    app.use("/uploads", express.static(path.join(__dirname, "uploads"), {}));

    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
};

startServer();
