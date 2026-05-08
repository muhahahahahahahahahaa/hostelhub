const mongoose = require("mongoose");

const withdrawalRequestSchema = new mongoose.Schema(
    {
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ["requested", "completed", "cancelled"],
            default: "requested",
        },
        requestedAt: {
            type: Date,
            default: Date.now,
        },
        processedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);

withdrawalRequestSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
