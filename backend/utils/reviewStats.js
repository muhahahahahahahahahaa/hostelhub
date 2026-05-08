const mongoose = require("mongoose");
const Inquiry = require("../models/Inquiry");
const Review = require("../models/Review");

const toObjectId = (value) => {
    if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
    return new mongoose.Types.ObjectId(value);
};

const defaultReviewSummary = {
    averageRating: 0,
    reviewCount: 0,
    completedRentalCount: 0,
};

const roundRating = (value = 0) => Math.round(Number(value || 0) * 10) / 10;

const buildReviewStatsMap = async (listingIds = []) => {
    const objectIds = listingIds.map(toObjectId).filter(Boolean);
    const statsMap = {};

    objectIds.forEach((id) => {
        statsMap[String(id)] = { ...defaultReviewSummary };
    });

    if (objectIds.length === 0) {
        return statsMap;
    }

    const [reviewStats, rentalStats] = await Promise.all([
        Review.aggregate([
            { $match: { listing: { $in: objectIds } } },
            {
                $group: {
                    _id: "$listing",
                    averageRating: { $avg: "$rating" },
                    reviewCount: { $sum: 1 },
                },
            },
        ]),
        Inquiry.aggregate([
            {
                $match: {
                    listing: { $in: objectIds },
                    status: "Confirmed",
                    "payment.status": "paid",
                    requestedTo: { $ne: null, $lte: new Date() },
                },
            },
            {
                $group: {
                    _id: "$listing",
                    completedRentalCount: { $sum: 1 },
                },
            },
        ]),
    ]);

    reviewStats.forEach((row) => {
        const key = String(row._id);
        statsMap[key] = {
            ...(statsMap[key] || defaultReviewSummary),
            averageRating: roundRating(row.averageRating),
            reviewCount: row.reviewCount || 0,
        };
    });

    rentalStats.forEach((row) => {
        const key = String(row._id);
        statsMap[key] = {
            ...(statsMap[key] || defaultReviewSummary),
            completedRentalCount: row.completedRentalCount || 0,
        };
    });

    return statsMap;
};

const attachReviewSummary = (listing, statsMap = {}) => {
    const listingObject = listing?.toObject?.() || listing;
    const summary = statsMap[String(listingObject?._id)] || defaultReviewSummary;

    return {
        ...listingObject,
        reviewSummary: summary,
    };
};

const getReviewEligibility = async ({ listingId, renterId }) => {
    const listingObjectId = toObjectId(listingId);
    const renterObjectId = toObjectId(renterId);

    if (!listingObjectId || !renterObjectId) {
        return {
            canReview: false,
            reason: "Invalid listing or renter",
            inquiryId: null,
            existingReview: null,
        };
    }

    const completedInquiries = await Inquiry.find({
        listing: listingObjectId,
        renter: renterObjectId,
        status: "Confirmed",
        "payment.status": "paid",
        requestedTo: { $ne: null, $lte: new Date() },
    })
        .sort({ requestedTo: -1, updatedAt: -1 })
        .select("_id requestedTo");

    if (completedInquiries.length === 0) {
        const existingReview = await Review.findOne({
            listing: listingObjectId,
            renter: renterObjectId,
        })
            .sort({ createdAt: -1 })
            .select("_id rating comment inquiry createdAt");

        return {
            canReview: false,
            reason: existingReview
                ? "You have already reviewed this listing"
                : "Review is available after a paid rental ends",
            inquiryId: null,
            existingReview,
        };
    }

    const inquiryIds = completedInquiries.map((inquiry) => inquiry._id);
    const reviewedInquiries = await Review.find({
        inquiry: { $in: inquiryIds },
    }).select("inquiry");
    const reviewedInquiryIds = new Set(reviewedInquiries.map((review) => String(review.inquiry)));
    const eligibleInquiry = completedInquiries.find(
        (inquiry) => !reviewedInquiryIds.has(String(inquiry._id))
    );

    const existingReview = await Review.findOne({
        listing: listingObjectId,
        renter: renterObjectId,
    })
        .sort({ createdAt: -1 })
        .select("_id rating comment inquiry createdAt");

    return {
        canReview: Boolean(eligibleInquiry),
        reason: eligibleInquiry ? "" : "You have already reviewed this completed rental",
        inquiryId: eligibleInquiry?._id || null,
        existingReview,
    };
};

module.exports = {
    buildReviewStatsMap,
    attachReviewSummary,
    getReviewEligibility,
};
