const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["inquiry", "reminder"],
            default: "inquiry",
        },
        reminderKind: {
            type: String,
            enum: ["ending_soon", "ending_today", ""],
            default: "",
        },
        reminderDateKey: {
            type: String,
            default: "",
            trim: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        inquiry: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inquiry",
            default: null,
        },
        listing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Listing",
            default: null,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index(
    { recipient: 1, inquiry: 1, reminderKind: 1, reminderDateKey: 1 },
    {
        unique: true,
        partialFilterExpression: {
            reminderKind: { $in: ["ending_soon", "ending_today"] },
            reminderDateKey: { $exists: true, $ne: "" },
        },
    }
);

module.exports = mongoose.model("Notification", notificationSchema);
