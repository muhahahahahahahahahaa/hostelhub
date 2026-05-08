const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
    getOwnerAnalytics,
    requestWithdrawal,
} = require("../controllers/analyticsController");

router.get("/overview", protect, getOwnerAnalytics);
router.post("/wallet/withdraw", protect, requestWithdrawal);

module.exports = router;
