const mongoose = require("mongoose");

const savedListingSchema = new mongoose.Schema(
    {
        renter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },
    },
    { timestamps: true }
);

savedListingSchema.index({ renter: 1, listing: 1 }, { unique: true });

module.exports = mongoose.model("SavedListing", savedListingSchema);
