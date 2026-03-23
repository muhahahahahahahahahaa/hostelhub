const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
    {
        owner: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
        totalListingsPosted: {type: Number, default: 0},
        totalInquiriesReceived: {type: Number, default: 0},
        totalConfirmed: {type: Number, default: 0},
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Analytics", analyticsSchema);
