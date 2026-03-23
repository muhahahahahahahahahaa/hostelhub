const Inquiry = require("../models/Inquiry");
const Listing = require("../models/Listing");

const VALID_STATUSES = ["New", "Contacted", "Confirmed", "Declined"];

exports.createInquiry = async (req, res) => {
    try {
        if (req.user.role !== "renter") {
            return res.status(403).json({ message: "Only renters can send inquiries" });
        }

        const listing = await Listing.findById(req.params.listingId);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }
        if (listing.isClosed) {
            return res.status(400).json({ message: "This listing is currently closed" });
        }

        const existing = await Inquiry.findOne({
            listing: req.params.listingId,
            renter: req.user._id,
        });

        if (existing) {
            return res.status(400).json({ message: "Inquiry already sent for this listing" });
        }

        const inquiry = await Inquiry.create({
            listing: req.params.listingId,
            renter: req.user._id,
        });

        res.status(201).json(inquiry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMyInquiries = async (req, res) => {
    try {
        const inquiries = await Inquiry.find({ renter: req.user._id })
            .populate({
                path: "listing",
                select:
                    "title owner location roomType category availableBeds monthlyRent deposit",
                populate: {
                    path: "owner",
                    select: "name hostelName hostelLogo",
                },
            })
            .sort({ createdAt: -1 });

        res.json(inquiries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getInquiriesForListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.listingId);

        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }
        if (listing.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to view inquiries" });
        }

        const inquiries = await Inquiry.find({ listing: req.params.listingId })
            .populate(
                "listing",
                "title location category roomType availableBeds monthlyRent deposit amenities"
            )
            .populate("renter", "name email avatar backgroundCheckDocument")
            .sort({ createdAt: -1 });

        res.json(inquiries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getInquiryById = async (req, res) => {
    try {
        const inquiry = await Inquiry.findById(req.params.id)
            .populate(
                "listing",
                "title location roomType category availableBeds monthlyRent deposit amenities owner"
            )
            .populate("renter", "name email avatar backgroundCheckDocument");

        if (!inquiry) {
            return res.status(404).json({ message: "Inquiry not found", id: req.params.id });
        }

        const renterId = String(inquiry.renter?._id || inquiry.renter);
        const ownerId = String(inquiry.listing?.owner?._id || inquiry.listing?.owner);
        const isAuthorized =
            renterId === req.user._id.toString() || ownerId === req.user._id.toString();

        if (!isAuthorized) {
            return res.status(403).json({ message: "Not authorized to view this inquiry" });
        }

        res.json(inquiry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateInquiryStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({ message: "Invalid inquiry status" });
        }

        const inquiry = await Inquiry.findById(req.params.id).populate("listing");
        if (!inquiry) {
            return res.status(404).json({ message: "Inquiry not found" });
        }
        if (inquiry.listing.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this inquiry" });
        }

        inquiry.status = status;
        await inquiry.save();

        res.json({ message: "Inquiry status updated", status });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
