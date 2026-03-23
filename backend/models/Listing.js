const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        houseRules: { type: String, required: true, trim: true },
        location: { type: String, required: true, trim: true },
        category: {
            type: String,
            enum: ["Student", "Worker", "Female Only", "Male Only", "Mixed"],
            required: true,
        },
        roomType: {
            type: String,
            enum: ["Dorm Bed", "Shared Room", "Private Room"],
            required: true,
        },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        monthlyRent: { type: Number, required: true, min: 0 },
        deposit: { type: Number, required: true, min: 0 },
        availableBeds: { type: Number, default: 1, min: 1 },
        amenities: { type: [String], default: [] },
        images: { type: [String], default: [] },
        isClosed: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Listing", listingSchema);
