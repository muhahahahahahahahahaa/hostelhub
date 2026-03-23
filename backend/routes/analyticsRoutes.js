const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { getOwnerAnalytics } = require("../controllers/analyticsController");

router.get("/overview", protect, getOwnerAnalytics);

module.exports = router;
