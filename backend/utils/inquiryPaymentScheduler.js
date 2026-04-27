const Inquiry = require("../models/Inquiry");
const Notification = require("../models/Notification");

const CHECK_INTERVAL_MS = 60 * 1000;

const createPaymentNotification = async ({
    recipient,
    inquiry,
    listing,
    title,
    message,
}) => {
    if (!recipient) {
        return;
    }

    await Notification.create({
        recipient,
        inquiry,
        listing: listing || null,
        type: "inquiry",
        title,
        message,
    });
};

const expireOverdueAgreementPayments = async () => {
    const overdueInquiries = await Inquiry.find({
        status: "Confirmed",
        "payment.status": "pending",
        "payment.dueAt": { $ne: null, $lte: new Date() },
    }).populate("listing", "title owner");

    for (const inquiry of overdueInquiries) {
        inquiry.payment = {
            ...(inquiry.payment?.toObject?.() || inquiry.payment || {}),
            status: "expired",
            lastCheckedAt: new Date(),
        };
        inquiry.status = "Declined";
        await inquiry.save();

        await Promise.all([
            createPaymentNotification({
                recipient: inquiry.renter,
                inquiry: inquiry._id,
                listing: inquiry.listing?._id || inquiry.listing,
                title: "Payment deadline expired",
                message: `${inquiry.listing?.title || "Your booking"} was cancelled because the payment was not completed within 24 hours.`,
            }),
            createPaymentNotification({
                recipient: inquiry.listing?.owner,
                inquiry: inquiry._id,
                listing: inquiry.listing?._id || inquiry.listing,
                title: "Booking cancelled",
                message: `${inquiry.listing?.title || "A booking"} was cancelled because payment was not completed within 24 hours.`,
            }),
        ]);
    }
};

const startInquiryPaymentScheduler = () => {
    let isRunning = false;

    const run = async () => {
        if (isRunning) {
            return;
        }

        isRunning = true;
        try {
            await expireOverdueAgreementPayments();
        } catch (error) {
            console.error("Failed to expire overdue agreement payments", error);
        } finally {
            isRunning = false;
        }
    };

    run();
    return setInterval(run, CHECK_INTERVAL_MS);
};

module.exports = {
    expireOverdueAgreementPayments,
    startInquiryPaymentScheduler,
};
