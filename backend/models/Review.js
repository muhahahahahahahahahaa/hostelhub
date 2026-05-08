const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        listing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Listing",
            required: true,
        },
        renter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        inquiry: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inquiry",
            required: true,
            unique: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },
    },
    { timestamps: true }
);

reviewSchema.index({ listing: 1, createdAt: -1 });
reviewSchema.index({ renter: 1, listing: 1 });

module.exports = mongoose.model("Review", reviewSchema);
