const Listing = require("../models/Listing");
const Review = require("../models/Review");
const {
    buildReviewStatsMap,
    getReviewEligibility,
} = require("../utils/reviewStats");

const REVIEW_EDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const populateReview = (query) =>
    query.populate("renter", "name avatar").populate("inquiry", "requestedFrom requestedTo");

const validateReviewPayload = ({ rating, comment }) => {
    const parsedRating = Number(rating);
    const normalizedComment = String(comment || "").trim();

    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return { error: "Rating must be between 1 and 5" };
    }

    if (normalizedComment.length > 1000) {
        return { error: "Review comment is too long" };
    }

    return {
        rating: parsedRating,
        comment: normalizedComment,
    };
};

exports.getListingReviews = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.listingId).select("_id");
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        const reviews = await populateReview(
            Review.find({ listing: listing._id }).sort({ createdAt: -1 })
        );
        const statsMap = await buildReviewStatsMap([listing._id]);

        res.json({
            reviews,
            reviewSummary: statsMap[String(listing._id)],
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch reviews", error: err.message });
    }
};

exports.createReview = async (req, res) => {
    try {
        if (req.user.role !== "renter") {
            return res.status(403).json({ message: "Only renters can review listings" });
        }

        const listing = await Listing.findById(req.params.listingId).select("_id");
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        const payload = validateReviewPayload(req.body);
        if (payload.error) {
            return res.status(400).json({ message: payload.error });
        }

        const eligibility = await getReviewEligibility({
            listingId: listing._id,
            renterId: req.user._id,
        });

        if (!eligibility.canReview || !eligibility.inquiryId) {
            return res.status(400).json({
                message: eligibility.reason || "Review is not available for this listing",
            });
        }

        const review = await Review.create({
            listing: listing._id,
            renter: req.user._id,
            inquiry: eligibility.inquiryId,
            rating: payload.rating,
            comment: payload.comment,
        });

        const [populatedReview, reviews, statsMap] = await Promise.all([
            populateReview(Review.findById(review._id)),
            populateReview(Review.find({ listing: listing._id }).sort({ createdAt: -1 })),
            buildReviewStatsMap([listing._id]),
        ]);

        res.status(201).json({
            message: "Review submitted",
            review: populatedReview,
            reviews,
            reviewSummary: statsMap[String(listing._id)],
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "You have already reviewed this rental" });
        }

        res.status(500).json({ message: "Failed to submit review", error: err.message });
    }
};

exports.updateReview = async (req, res) => {
    try {
        if (req.user.role !== "renter") {
            return res.status(403).json({ message: "Only renters can update reviews" });
        }

        const review = await Review.findById(req.params.reviewId);
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        if (String(review.renter) !== String(req.user._id)) {
            return res.status(403).json({ message: "You can update only your own review" });
        }

        const editDeadline = new Date(review.createdAt).getTime() + REVIEW_EDIT_WINDOW_MS;
        if (Date.now() > editDeadline) {
            return res.status(400).json({
                message: "Review can be updated only within 7 days",
            });
        }

        const payload = validateReviewPayload(req.body);
        if (payload.error) {
            return res.status(400).json({ message: payload.error });
        }

        review.rating = payload.rating;
        review.comment = payload.comment;
        await review.save();

        const [updatedReview, reviews, statsMap] = await Promise.all([
            populateReview(Review.findById(review._id)),
            populateReview(Review.find({ listing: review.listing }).sort({ createdAt: -1 })),
            buildReviewStatsMap([review.listing]),
        ]);

        res.json({
            message: "Review updated",
            review: updatedReview,
            reviews,
            reviewSummary: statsMap[String(review.listing)],
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to update review", error: err.message });
    }
};
