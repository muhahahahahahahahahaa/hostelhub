const express = require("express");
const {
    updateProfile,
    deleteResume,
    getPublicProfile,
} = require("../controllers/userController");
const {protect} = require("../middlewares/authMiddleware");

const router = express.Router();

//protected routes
router.put("/profile", protect, updateProfile);
router.post("/resume", protect, deleteResume);

//public route
router.get("/:id", getPublicProfile);

module.exports = router