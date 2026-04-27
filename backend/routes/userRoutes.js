const express = require("express");
const {
    updateProfile,
    getPublicProfile,
    getTemplatePreview,
    getDraftTemplatePreview,
    getSectionTemplatePreview,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.put("/profile", protect, updateProfile);
router.get("/templates/:templateName/preview", protect, getTemplatePreview);
router.post("/templates/preview-draft", protect, getDraftTemplatePreview);
router.post("/templates/:templateName/section-preview", protect, getSectionTemplatePreview);
router.get("/:id", getPublicProfile);

module.exports = router;
