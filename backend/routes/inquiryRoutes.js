const express = require("express");
const {
    createInquiry,
    getMyInquiries,
    getInquiriesForListing,
    getInquiryById,
    getInquiryAgreementPreview,
    acceptAgreement,
    confirmWithAgreement,
    initiateAgreementPayment,
    checkAgreementPayment,
    updateInquiryStatus,
} = require("../controllers/inquiryController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/:listingId", protect, createInquiry);
router.get("/my", protect, getMyInquiries);
router.get("/listing/:listingId", protect, getInquiriesForListing);
router.get("/:id/agreement-preview", protect, getInquiryAgreementPreview);
router.post("/:id/agreement-preview", protect, getInquiryAgreementPreview);
router.get("/:id", protect, getInquiryById);
router.post("/:id/accept-agreement", protect, acceptAgreement);
router.post("/:id/confirm-with-agreement", protect, confirmWithAgreement);
router.post("/:id/payment/initiate", protect, initiateAgreementPayment);
router.get("/:id/payment/status", protect, checkAgreementPayment);
router.post("/:id/payment/status", protect, checkAgreementPayment);
router.put("/:id/status", protect, updateInquiryStatus);

module.exports = router;
