const Inquiry = require("../models/Inquiry");
const Notification = require("../models/Notification");
const Review = require("../models/Review");

const HOUR_IN_MS = 60 * 60 * 1000;
const CHECK_INTERVAL_MS = HOUR_IN_MS;

const getUtcDateStart = (value = new Date()) => {
    const date = new Date(value);
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const getDateKey = (value) => {
    const date = new Date(value);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const createReminderNotification = async ({
    recipient,
    inquiry,
    listing,
    reminderKind,
    reminderDateKey,
    title,
    message,
}) => {
    if (!recipient || !inquiry || !reminderKind || !reminderDateKey) {
        return;
    }

    try {
        const existingNotification = await Notification.exists({
            recipient,
            inquiry,
            reminderKind,
            reminderDateKey,
        });

        if (existingNotification) {
            return;
        }

        await Notification.create({
            recipient,
            inquiry,
            listing: listing || null,
            type: "reminder",
            reminderKind,
            reminderDateKey,
            title,
            message,
        });
    } catch (error) {
        if (error?.code !== 11000) {
            throw error;
        }
    }
};

const sendInquiryReminderNotifications = async () => {
    const inquiries = await Inquiry.find({
        status: "Confirmed",
        requestedTo: { $ne: null },
    }).populate("listing", "title owner");

    const todayUtc = getUtcDateStart();

    for (const inquiry of inquiries) {
        const requestedToUtc = getUtcDateStart(inquiry.requestedTo);
        const daysUntilEnd = Math.round((requestedToUtc - todayUtc) / (1000 * 60 * 60 * 24));
        const reminderDateKey = getDateKey(inquiry.requestedTo);
        const listingTitle = inquiry.listing?.title || "your booking";
        const listingId = inquiry.listing?._id || inquiry.listing;

        if (daysUntilEnd === 3) {
            await Promise.all([
                createReminderNotification({
                    recipient: inquiry.renter,
                    inquiry: inquiry._id,
                    listing: listingId,
                    reminderKind: "ending_soon",
                    reminderDateKey,
                    title: "Booking ends in 3 days",
                    message: `${listingTitle} will end in 3 days.`,
                }),
                createReminderNotification({
                    recipient: inquiry.listing?.owner,
                    inquiry: inquiry._id,
                    listing: listingId,
                    reminderKind: "ending_soon",
                    reminderDateKey,
                    title: "Renter booking ends in 3 days",
                    message: `${listingTitle} will end in 3 days.`,
                }),
            ]);
        }

        if (daysUntilEnd === 0) {
            await Promise.all([
                createReminderNotification({
                    recipient: inquiry.renter,
                    inquiry: inquiry._id,
                    listing: listingId,
                    reminderKind: "ending_today",
                    reminderDateKey,
                    title: "Booking ends today",
                    message: `${listingTitle} ends today.`,
                }),
                createReminderNotification({
                    recipient: inquiry.listing?.owner,
                    inquiry: inquiry._id,
                    listing: listingId,
                    reminderKind: "ending_today",
                    reminderDateKey,
                    title: "Renter booking ends today",
                    message: `${listingTitle} ends today.`,
                }),
            ]);
        }

        if (daysUntilEnd < 0 && inquiry.payment?.status === "paid") {
            const existingReview = await Review.exists({ inquiry: inquiry._id });
            if (existingReview) {
                continue;
            }

            await createReminderNotification({
                recipient: inquiry.renter,
                inquiry: inquiry._id,
                listing: listingId,
                reminderKind: "review_available",
                reminderDateKey,
                title: "Review your completed rental",
                message: `${listingTitle} rental has ended. You can leave a review now.`,
            });
        }
    }
};

const startInquiryReminderScheduler = () => {
    let isRunning = false;

    const run = async () => {
        if (isRunning) {
            return;
        }

        isRunning = true;
        try {
            await sendInquiryReminderNotifications();
        } catch (error) {
            console.error("Failed to send inquiry reminder notifications", error);
        } finally {
            isRunning = false;
        }
    };

    run();
    return setInterval(run, CHECK_INTERVAL_MS);
};

module.exports = {
    sendInquiryReminderNotifications,
    startInquiryReminderScheduler,
};
