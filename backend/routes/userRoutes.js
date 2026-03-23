const express = require("express");
const {
    updateProfile,
    getPublicProfile,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.put("/profile", protect, updateProfile);
router.get("/:id", getPublicProfile);

module.exports = router;
