const express = require("express");
const {
    createInquiry,
    getMyInquiries,
    getInquiriesForListing,
    getInquiryById,
    updateInquiryStatus,
} = require("../controllers/inquiryController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/:listingId", protect, createInquiry);
router.get("/my", protect, getMyInquiries);
router.get("/listing/:listingId", protect, getInquiriesForListing);
router.get("/:id", protect, getInquiryById);
router.put("/:id/status", protect, updateInquiryStatus);

module.exports = router;
