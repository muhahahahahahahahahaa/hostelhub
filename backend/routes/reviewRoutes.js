const express = require("express");
const {
    createReview,
    getListingReviews,
    updateReview,
} = require("../controllers/reviewController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/listing/:listingId", getListingReviews);
router.post("/listing/:listingId", protect, createReview);
router.put("/:reviewId", protect, updateReview);

module.exports = router;
