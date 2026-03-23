const Listing = require("../models/Listing");
const Inquiry = require("../models/Inquiry");
const SavedListing = require("../models/SavedListing");

const normalizeListingPayload = (payload = {}) => {
    const normalizeNumber = (value) => {
        if (value === "" || value === undefined || value === null) return undefined;
        const parsed = Number(value);
        return Number.isNaN(parsed) ? undefined : parsed;
    };

    const normalizeAmenities = (value) => {
        if (Array.isArray(value)) {
            return value.map((item) => String(item).trim()).filter(Boolean);
        }
        if (typeof value === "string") {
            return value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
        }
        return [];
    };

    const normalizeImages = (value) => {
        if (Array.isArray(value)) {
            return value.map((item) => String(item).trim()).filter(Boolean);
        }
        if (typeof value === "string") {
            return value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
        }
        return [];
    };

    return {
        title: payload.title?.trim(),
        description: payload.description?.trim(),
        houseRules: (payload.houseRules ?? payload.requirements)?.trim(),
        location: payload.location?.trim(),
        category: payload.category,
        roomType: payload.roomType ?? payload.type,
        monthlyRent: normalizeNumber(payload.monthlyRent ?? payload.salaryMin),
        deposit: normalizeNumber(payload.deposit ?? payload.salaryMax),
        availableBeds: normalizeNumber(payload.availableBeds),
        amenities: normalizeAmenities(payload.amenities),
        ...(payload.images !== undefined ? { images: normalizeImages(payload.images) } : {}),
        ...(payload.isClosed !== undefined ? { isClosed: Boolean(payload.isClosed) } : {}),
    };
};

exports.createListing = async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Only owners can post listings" });
        }

        const listing = await Listing.create({
            ...normalizeListingPayload(req.body),
            owner: req.user._id,
        });

        res.status(201).json(listing);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getListings = async (req, res) => {
    const {
        keyword,
        location,
        category,
        roomType,
        type,
        minRent,
        maxRent,
        minSalary,
        maxSalary,
        renterId,
        userId,
    } = req.query;

    const selectedRoomType = roomType || type;
    const selectedMinRent = minRent || minSalary;
    const selectedMaxRent = maxRent || maxSalary;
    const currentRenterId = renterId || userId;

    const query = { isClosed: false };

    if (keyword) {
        query.$or = [
            { title: { $regex: keyword, $options: "i" } },
            { description: { $regex: keyword, $options: "i" } },
            { amenities: { $regex: keyword, $options: "i" } },
        ];
    }

    if (location) {
        query.location = { $regex: location, $options: "i" };
    }

    if (category) {
        query.category = category;
    }
    if (selectedRoomType) {
        query.roomType = selectedRoomType;
    }

    if (selectedMinRent || selectedMaxRent) {
        query.monthlyRent = {};

        if (selectedMinRent) {
            query.monthlyRent.$gte = Number(selectedMinRent);
        }
        if (selectedMaxRent) {
            query.monthlyRent.$lte = Number(selectedMaxRent);
        }
        if (Object.keys(query.monthlyRent).length === 0) {
            delete query.monthlyRent;
        }
    }

    try {
        const listings = await Listing.find(query).populate(
            "owner",
            "name hostelName hostelLogo"
        );

        let savedListingIds = [];
        let inquiryStatusMap = {};

        if (currentRenterId) {
            const savedListings = await SavedListing.find({
                renter: currentRenterId,
            }).select("listing");
            savedListingIds = savedListings.map((item) => String(item.listing));

            const inquiries = await Inquiry.find({
                renter: currentRenterId,
            }).select("listing status");
            inquiries.forEach((inquiry) => {
                inquiryStatusMap[String(inquiry.listing)] = inquiry.status;
            });
        }

        const listingsWithExtras = listings.map((listing) => {
            const listingId = String(listing._id);
            return {
                ...listing.toObject(),
                isSaved: savedListingIds.includes(listingId),
                inquiryStatus: inquiryStatusMap[listingId] || null,
            };
        });

        res.json(listingsWithExtras);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getOwnerListings = async (req, res) => {
    try {
        const userId = req.user._id;
        const { role } = req.user;
        if (role !== "owner") {
            return res.status(403).json({ message: "Access denied" });
        }

        const listings = await Listing.find({ owner: userId })
            .populate("owner", "name hostelName hostelLogo")
            .lean();

        const listingsWithInquiryCounts = await Promise.all(
            listings.map(async (listing) => {
                const inquiryCount = await Inquiry.countDocuments({
                    listing: listing._id,
                });
                return {
                    ...listing,
                    inquiryCount,
                };
            })
        );

        res.json(listingsWithInquiryCounts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getListingById = async (req, res) => {
    try {
        const currentRenterId = req.query.renterId || req.query.userId;
        const listing = await Listing.findById(req.params.id).populate(
            "owner",
            "name hostelName hostelLogo"
        );

        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        let inquiryStatus = null;

        if (currentRenterId) {
            const inquiry = await Inquiry.findOne({
                listing: listing._id,
                renter: currentRenterId,
            }).select("status");

            if (inquiry) {
                inquiryStatus = inquiry.status;
            }
        }

        res.json({
            ...listing.toObject(),
            inquiryStatus,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        if (listing.owner.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: "Not authorized to update this listing" });
        }

        Object.assign(listing, normalizeListingPayload(req.body));
        const updated = await listing.save();
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        if (listing.owner.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: "Not authorized to delete this listing" });
        }

        await Inquiry.deleteMany({ listing: listing._id });
        await SavedListing.deleteMany({ listing: listing._id });
        await listing.deleteOne();

        res.json({ message: "Listing deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.toggleListingStatus = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        if (listing.owner.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: "Not authorized to update this listing" });
        }

        listing.isClosed = !listing.isClosed;
        await listing.save();

        res.json({
            message: listing.isClosed ? "Listing closed" : "Listing reopened",
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
