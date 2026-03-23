const SavedListing = require("../models/SavedListing");
const Listing = require("../models/Listing");
const Inquiry = require("../models/Inquiry");

exports.saveListing = async (req, res) => {
    try {
        if (req.user.role !== "renter") {
            return res.status(403).json({ message: "Only renters can save listings" });
        }

        const listing = await Listing.findById(req.params.listingId);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        const exists = await SavedListing.findOne({
            listing: req.params.listingId,
            renter: req.user._id,
        });
        if (exists) {
            return res.status(400).json({ message: "Listing already saved" });
        }

        const saved = await SavedListing.create({
            listing: req.params.listingId,
            renter: req.user._id,
        });
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ message: "Failed to save listing", error: err.message });
    }
};

exports.unsaveListing = async (req, res) => {
    try {
        await SavedListing.findOneAndDelete({
            listing: req.params.listingId,
            renter: req.user._id,
        });
        res.json({ message: "Listing removed from saved list" });
    } catch (err) {
        res.status(500).json({
            message: "Failed to remove saved listing",
            error: err.message,
        });
    }
};

exports.getMySavedListings = async (req, res) => {
    try {
        const savedListings = await SavedListing.find({ renter: req.user._id })
            .populate({
                path: "listing",
                populate: {
                    path: "owner",
                    select: "name hostelName hostelLogo",
                },
            })
            .sort({ createdAt: -1 });

        const listingIds = savedListings
            .map((item) => item.listing?._id)
            .filter(Boolean);

        const inquiries = await Inquiry.find({
            renter: req.user._id,
            listing: { $in: listingIds },
        }).select("listing status");

        const inquiryStatusMap = {};
        inquiries.forEach((inquiry) => {
            inquiryStatusMap[String(inquiry.listing)] = inquiry.status;
        });

        const savedListingsWithStatus = savedListings.map((savedListing) => {
            const listingObject = savedListing.listing?.toObject?.() || savedListing.listing;
            const listingId = String(savedListing.listing?._id || "");

            return {
                ...savedListing.toObject(),
                listing: listingObject
                    ? {
                        ...listingObject,
                        inquiryStatus: inquiryStatusMap[listingId] || null,
                    }
                    : null,
            };
        });

        res.json(savedListingsWithStatus);
    } catch (err) {
        res.status(500).json({
            message: "Failed to fetch saved listings",
            error: err.message,
        });
    }
};
