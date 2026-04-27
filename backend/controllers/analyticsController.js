const Listing = require("../models/Listing");
const Inquiry = require("../models/Inquiry");
const Chat = require("../models/Chat");

const getTrend = (current, previous) => {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
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
