const express = require("express");
const {
    createListing,
    getListings,
    getListingById,
    getListingTemplatePreview,
    updateListing,
    deleteListing,
    toggleListingStatus,
    getOwnerListings,
} = require("../controllers/listingController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.route("/").post(protect, createListing).get(getListings);
router.get("/owner", protect, getOwnerListings);
router.get("/:id/template-preview", getListingTemplatePreview);
router
    .route("/:id")
    .get(getListingById)
    .put(protect, updateListing)
    .delete(protect, deleteListing);
router.put("/:id/toggle-close", protect, toggleListingStatus);

module.exports = router;
