const Listing = require("../models/Listing");
const Inquiry = require("../models/Inquiry");
const Chat = require("../models/Chat");
const WithdrawalRequest = require("../models/WithdrawalRequest");

const getTrend = (current, previous) => {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
};

const getPaymentAmount = (inquiry) => {
    const storedAmount = Number(inquiry?.payment?.amount || 0);
    if (Number.isFinite(storedAmount) && storedAmount > 0) {
        return storedAmount;
    }

    const requestedFrom = inquiry?.requestedFrom ? new Date(inquiry.requestedFrom) : null;
    const requestedTo = inquiry?.requestedTo ? new Date(inquiry.requestedTo) : null;
    const dailyRent = Number(inquiry?.listing?.dailyRent ?? inquiry?.listing?.monthlyRent ?? 0);
    const deposit = Number(inquiry?.listing?.deposit || 0);

    if (!requestedFrom || !requestedTo || Number.isNaN(requestedFrom.getTime()) || Number.isNaN(requestedTo.getTime())) {
        return deposit;
    }

    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const durationDays = Math.max(
        1,
        Math.ceil((requestedTo.getTime() - requestedFrom.getTime()) / millisecondsPerDay),
    );

    return (durationDays * dailyRent) + deposit;
};

exports.getOwnerAnalytics = async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Access denied" });
        }

        const ownerId = req.user._id;

        const now = new Date();
        const last7Days = new Date(now);
        last7Days.setDate(now.getDate() - 7);
        const prev7Days = new Date(now);
        prev7Days.setDate(now.getDate() - 14);

        const totalActiveListings = await Listing.countDocuments({
            owner: ownerId,
            isClosed: false,
        });
        const listings = await Listing.find({ owner: ownerId }).select("_id").lean();
        const listingIds = listings.map((listing) => listing._id);

        const totalInquiries = await Inquiry.countDocuments({
            listing: { $in: listingIds },
        });
        const totalConfirmed = await Inquiry.countDocuments({
            listing: { $in: listingIds },
            status: "Confirmed",
        });
        const totalChats = await Chat.countDocuments({
            owner: ownerId,
        });
        const unreadChats = await Chat.countDocuments({
            owner: ownerId,
            ownerUnreadCount: { $gt: 0 },
        });

        const activeListingsLast7 = await Listing.countDocuments({
            owner: ownerId,
            createdAt: { $gte: last7Days, $lte: now },
        });

        const activeListingsPrev7 = await Listing.countDocuments({
            owner: ownerId,
            createdAt: { $gte: prev7Days, $lt: last7Days },
        });

        const activeListingsTrend = getTrend(activeListingsLast7, activeListingsPrev7);

        const inquiriesLast7 = await Inquiry.countDocuments({
            listing: { $in: listingIds },
            createdAt: { $gte: last7Days, $lte: now },
        });

        const inquiriesPrev7 = await Inquiry.countDocuments({
            listing: { $in: listingIds },
            createdAt: { $gte: prev7Days, $lte: last7Days },
        });

        const inquiryTrend = getTrend(inquiriesLast7, inquiriesPrev7);

        const confirmedLast7 = await Inquiry.countDocuments({
            listing: { $in: listingIds },
            status: "Confirmed",
            createdAt: { $gte: last7Days, $lte: now },
        });

        const confirmedPrev7 = await Inquiry.countDocuments({
            listing: { $in: listingIds },
            status: "Confirmed",
            createdAt: { $gte: prev7Days, $lte: last7Days },
        });

        const confirmedTrend = getTrend(confirmedLast7, confirmedPrev7);
        const chatsLast7 = await Chat.countDocuments({
            owner: ownerId,
            updatedAt: { $gte: last7Days, $lte: now },
        });

        const chatsPrev7 = await Chat.countDocuments({
            owner: ownerId,
            updatedAt: { $gte: prev7Days, $lt: last7Days },
        });

        const chatTrend = getTrend(chatsLast7, chatsPrev7);

        const recentListings = await Listing.find({ owner: ownerId })
            .sort({ createdAt: -1 })
            .limit(3)
            .select("title location roomType createdAt isClosed");

        const recentInquiries = await Inquiry.find({
            listing: { $in: listingIds },
        })
            .sort({ createdAt: -1 })
            .limit(3)
            .populate("renter", "name email avatar")
            .populate("listing", "title");

        const recentChats = await Chat.find({
            owner: ownerId,
        })
            .sort({ lastMessageAt: -1, updatedAt: -1 })
            .limit(5)
            .populate("renter", "name email avatar")
            .populate("listing", "title")
            .select("listing renter lastMessage lastMessageAt ownerUnreadCount updatedAt");

        const paymentInquiries = await Inquiry.find({
            listing: { $in: listingIds },
            "payment.status": { $in: ["paid", "pending"] },
        })
            .sort({ "payment.paidAt": -1, updatedAt: -1 })
            .populate("renter", "name email avatar")
            .populate("listing", "title dailyRent monthlyRent deposit")
            .select("listing renter status payment requestedFrom requestedTo updatedAt createdAt");

        const grossWalletTotals = paymentInquiries.reduce(
            (totals, inquiry) => {
                const amount = getPaymentAmount(inquiry);
                if (inquiry.payment?.status === "paid") {
                    totals.availableBalance += amount;
                    totals.totalRevenue += amount;
                    totals.paidCount += 1;
                }

                if (inquiry.payment?.status === "pending") {
                    totals.pendingBalance += amount;
                    totals.pendingCount += 1;
                }

                return totals;
            },
            {
                availableBalance: 0,
                pendingBalance: 0,
                totalRevenue: 0,
                paidCount: 0,
                pendingCount: 0,
            },
        );

        const recentPayments = paymentInquiries
            .filter((inquiry) => inquiry.payment?.status === "paid")
            .slice(0, 3)
            .map((inquiry) => ({
                _id: inquiry._id,
                amount: getPaymentAmount(inquiry),
                status: inquiry.payment?.status || "idle",
                paidAt: inquiry.payment?.paidAt,
                renter: inquiry.renter,
                listing: inquiry.listing,
            }));

        const withdrawalRequests = await WithdrawalRequest.find({
            owner: ownerId,
            status: { $in: ["requested", "completed"] },
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        const totalWithdrawn = withdrawalRequests.reduce(
            (sum, request) => sum + Number(request.amount || 0),
            0,
        );
        const availableBalance = Math.max(0, grossWalletTotals.availableBalance - totalWithdrawn);

        res.json({
            counts: {
                totalActiveListings,
                totalInquiries,
                totalConfirmed,
                totalChats,
                unreadChats,
                trends: {
                    activeListings: activeListingsTrend,
                    totalInquiries: inquiryTrend,
                    totalConfirmed: confirmedTrend,
                    totalChats: chatTrend,
                },
            },
            wallet: {
                ...grossWalletTotals,
                availableBalance,
                totalWithdrawn,
                recentPayments,
                withdrawalRequests,
                canWithdraw: availableBalance > 0,
            },
            data: {
                recentListings,
                recentInquiries,
                recentChats,
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch analytics", error: err.message });
    }
};

exports.requestWithdrawal = async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Access denied" });
        }

        const ownerId = req.user._id;
        const requestedAmount = Number(req.body?.amount || 0);

        if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
            return res.status(400).json({ message: "Withdrawal amount is required" });
        }

        const listings = await Listing.find({ owner: ownerId }).select("_id").lean();
        const listingIds = listings.map((listing) => listing._id);

        const paidInquiries = await Inquiry.find({
            listing: { $in: listingIds },
            "payment.status": "paid",
        })
            .populate("listing", "title dailyRent monthlyRent deposit")
            .select("listing payment requestedFrom requestedTo");

        const totalRevenue = paidInquiries.reduce(
            (sum, inquiry) => sum + getPaymentAmount(inquiry),
            0,
        );

        const existingWithdrawals = await WithdrawalRequest.find({
            owner: ownerId,
            status: { $in: ["requested", "completed"] },
        }).select("amount");

        const totalWithdrawn = existingWithdrawals.reduce(
            (sum, request) => sum + Number(request.amount || 0),
            0,
        );
        const availableBalance = Math.max(0, totalRevenue - totalWithdrawn);

        if (requestedAmount > availableBalance) {
            return res.status(400).json({ message: "Insufficient wallet balance" });
        }

        const withdrawal = await WithdrawalRequest.create({
            owner: ownerId,
            amount: requestedAmount,
        });

        res.status(201).json({
            message: "Withdrawal request submitted",
            withdrawal,
            wallet: {
                availableBalance: Math.max(0, availableBalance - requestedAmount),
                totalWithdrawn: totalWithdrawn + requestedAmount,
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to request withdrawal", error: err.message });
    }
};
