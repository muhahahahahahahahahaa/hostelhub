const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
    {
        listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },
        renter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        requestedFrom: {
            type: Date,
            default: null,
        },
        requestedTo: {
            type: Date,
            default: null,
        },
        ownerAgreementDetails: {
            fullName: { type: String, trim: true, default: "" },
            phoneNumber: { type: String, trim: true, default: "" },
            signatureDataUrl: { type: String, default: "" },
            completedAt: { type: Date, default: null },
        },
        renterAgreementDetails: {
            fullName: { type: String, trim: true, default: "" },
            phoneNumber: { type: String, trim: true, default: "" },
            signatureDataUrl: { type: String, default: "" },
            completedAt: { type: Date, default: null },
        },
        status: {
            type: String,
            enum: ["New", "Contacted", "Confirmed", "Declined"],
            default: "New",
        },
        agreementAcceptedAt: {
            type: Date,
            default: null,
        },
        agreementFinalizedAt: {
            type: Date,
            default: null,
        },
        finalAgreementPdfUrl: {
            type: String,
            trim: true,
            default: "",
        },
        payment: {
            status: {
                type: String,
                enum: ["idle", "pending", "paid", "expired", "cancelled"],
                default: "idle",
            },
            amount: {
                type: Number,
                default: 0,
                min: 0,
            },
            invoiceId: {
                type: String,
                trim: true,
                default: "",
            },
            senderInvoiceNo: {
                type: String,
                trim: true,
                default: "",
            },
            qrText: {
                type: String,
                trim: true,
                default: "",
            },
            qrImage: {
                type: String,
                trim: true,
                default: "",
            },
            urls: {
                type: [
                    {
                        name: { type: String, trim: true, default: "" },
                        description: { type: String, trim: true, default: "" },
                        link: { type: String, trim: true, default: "" },
                    },
                ],
                default: [],
            },
            paidAt: {
                type: Date,
                default: null,
            },
            dueAt: {
                type: Date,
                default: null,
            },
            lastCheckedAt: {
                type: Date,
                default: null,
            },
        },
    },
    {
        timestamps: true,
    }
);

inquirySchema.index({ listing: 1, renter: 1 }, { unique: true });

module.exports = mongoose.model("Inquiry", inquirySchema);
