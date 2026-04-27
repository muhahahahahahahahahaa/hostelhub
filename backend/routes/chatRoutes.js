const express = require("express");
const {
    accessChat,
    getMyChats,
    getChatById,
    sendMessageForListing,
    sendMessage,
} = require("../controllers/chatController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, getMyChats);
router.post("/access", protect, accessChat);
router.post("/listing/:listingId/messages", protect, sendMessageForListing);
router.get("/:id", protect, getChatById);
router.post("/:id/messages", protect, sendMessage);

module.exports = router;
