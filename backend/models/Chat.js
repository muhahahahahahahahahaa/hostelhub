const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            default: "",
            trim: true,
            maxlength: 1000,
        },
        attachmentUrl: {
            type: String,
            trim: true,
            default: "",
        },
        attachmentName: {
            type: String,
            trim: true,
            default: "",
        },
        attachmentMimeType: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

const chatSchema = new mongoose.Schema(
    {
        listing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Listing",
            required: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        renter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        messages: {
            type: [chatMessageSchema],
            default: [],
        },
        lastMessage: {
            type: String,
            default: "",
            trim: true,
        },
        lastMessageAt: {
            type: Date,
            default: null,
        },
        ownerUnreadCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        renterUnreadCount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

chatSchema.index({ listing: 1, renter: 1 }, { unique: true });
chatSchema.index({ owner: 1, lastMessageAt: -1 });
chatSchema.index({ renter: 1, lastMessageAt: -1 });

module.exports = mongoose.model("Chat", chatSchema)
