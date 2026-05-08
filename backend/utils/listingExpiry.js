const Listing = require("../models/Listing");

const getTodayStart = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const isListingExpired = (listing = {}) => {
    if (!listing?.availableUntil) return false;
    const availableUntil = new Date(listing.availableUntil);
    if (Number.isNaN(availableUntil.getTime())) return false;
    return availableUntil < getTodayStart();
};

const getActiveAvailabilityQuery = () => ({
    $or: [
        { availableUntil: null },
        { availableUntil: { $exists: false } },
        { availableUntil: { $gte: getTodayStart() } },
    ],
});

const autoCloseExpiredListings = async (ownerId = null) => {
    const query = {
        isClosed: false,
        availableUntil: { $ne: null, $lt: getTodayStart() },
    };

    if (ownerId) {
        query.owner = ownerId;
    }

    await Listing.updateMany(query, { $set: { isClosed: true } });
};

const attachExpiryState = (listing = {}) => ({
    ...listing,
    isExpired: isListingExpired(listing),
});

const startListingExpiryScheduler = () => {
    const DAY_IN_MS = 24 * 60 * 60 * 1000;

    const run = async () => {
        try {
            await autoCloseExpiredListings();
        } catch (error) {
            console.error("Failed to close expired listings", error);
        }
    };

    run();
    return setInterval(run, DAY_IN_MS);
};

module.exports = {
    attachExpiryState,
    autoCloseExpiredListings,
    getActiveAvailabilityQuery,
    isListingExpired,
    startListingExpiryScheduler,
};
