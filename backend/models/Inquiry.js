const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
    {
        listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },
        renter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        status: {
            type: String,
            enum: ["New", "Contacted", "Confirmed", "Declined"],
            default: "New",
        },
    },
    {
        timestamps: true,
    }
);

inquirySchema.index({ listing: 1, renter: 1 }, { unique: true });

module.exports = mongoose.model("Inquiry", inquirySchema);
