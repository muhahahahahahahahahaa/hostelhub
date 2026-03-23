const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
    saveListing,
    unsaveListing,
    getMySavedListings,
} = require("../controllers/savedListingController");

router.post("/:listingId", protect, saveListing);
router.delete("/:listingId", protect, unsaveListing);
router.get("/my", protect, getMySavedListings);

module.exports = router;
