const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const crypto = require("crypto");
const Inquiry = require("../models/Inquiry");
const Listing = require("../models/Listing");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Chat = require("../models/Chat");
const { getOwnerLeaseTemplates } = require("../utils/leaseTemplates");
const { convertToPdf } = require("../utils/libreOffice");
const { createQPayInvoice, checkQPayPayment } = require("../utils/qpay");
const {
    getBylWebhookSecret,
    createBylCheckout,
    checkBylCheckout,
} = require("../utils/byl");

const VALID_STATUSES = ["New", "Contacted", "Confirmed", "Declined"];
const execFileAsync = promisify(execFile);
const TEMPLATE_PREVIEW_DIR = path.join(__dirname, "..", "uploads", "template-previews");
const ADMIN_CHAT_EMAIL = "admin@hostelhub.local";
const FINAL_AGREEMENT_MESSAGE = "Final signed agreement PDF";
const PAYMENT_WINDOW_MS = 24 * 60 * 60 * 1000;
const createNotification = async ({
    recipient,
    inquiry,
    listing,
    title,
    message,
}) => {
    if (!recipient || !title || !message) {
        return;
    }

    await Notification.create({
        recipient,
        type: "inquiry",
        inquiry: inquiry || null,
        listing: listing || null,
        title,
        message,
    });
};

const ensureAdminChatUser = async () => {
    let adminUser = await User.findOne({ email: ADMIN_CHAT_EMAIL }).select("_id");

    if (adminUser) {
        return adminUser;
    }

    adminUser = await User.create({
        name: "Admin",
        email: ADMIN_CHAT_EMAIL,
        password: crypto.randomBytes(24).toString("hex"),
        role: "owner",
    });

    return adminUser;
};

const buildOverlapQuery = (inquiry) => ({
    _id: { $ne: inquiry._id },
    listing: inquiry.listing?._id || inquiry.listing,
    requestedFrom: { $lte: inquiry.requestedTo },
    requestedTo: { $gte: inquiry.requestedFrom },
});

const getDateOnlyUtcValue = (value) => {
    const date = new Date(value);
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const enforceInquiryAvailability = async (inquiry) => {
    if (!inquiry?.requestedFrom || !inquiry?.requestedTo) {
        return;
    }

    const overlappingConfirmedInquiry = await Inquiry.findOne({
        ...buildOverlapQuery(inquiry),
        status: "Confirmed",
    }).select("_id");

    if (overlappingConfirmedInquiry) {
        throw new Error("Another renter is already confirmed for the selected dates");
    }

    await Inquiry.updateMany(
        {
            ...buildOverlapQuery(inquiry),
            status: { $in: ["New", "Contacted"] },
        },
        {
            $set: {
                status: "Declined",
            },
        }
    );
};

const ensureTemplatePreviewDir = async () => {
    await fs.promises.mkdir(TEMPLATE_PREVIEW_DIR, { recursive: true });
};

const normalizeHeadingText = (value = "") =>
    String(value)
        .toLowerCase()
        .replace(/[.,:;!?]/g, "")
        .replace(/\s+/g, " ")
        .trim();

const escapeXml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

const decodeXmlEntities = (value = "") =>
    String(value)
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&");

const getUploadFilenameFromUrl = (fileUrl = "", req) => {
    const normalizedUrl = String(fileUrl || "").trim();
    const relativeUploadsPrefix = "/uploads/";

    if (normalizedUrl.startsWith(relativeUploadsPrefix)) {
        return decodeURIComponent(normalizedUrl.replace(relativeUploadsPrefix, ""));
    }

    const appBaseUrl = `${req.protocol}://${req.get("host")}`;
    if (normalizedUrl.startsWith(`${appBaseUrl}${relativeUploadsPrefix}`)) {
        return decodeURIComponent(normalizedUrl.replace(`${appBaseUrl}${relativeUploadsPrefix}`, ""));
    }

    try {
        const parsedUrl = new URL(normalizedUrl);
        if (parsedUrl.pathname.startsWith(relativeUploadsPrefix)) {
            return decodeURIComponent(parsedUrl.pathname.replace(relativeUploadsPrefix, ""));
        }
    } catch {
        return "";
    }

    return "";
};

const buildTemplatePreviewUrl = (req, filename) =>
    `${req.protocol}://${req.get("host")}/uploads/template-previews/${filename}`;

const fileExists = async (filePath) => {
    try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
};

const SECTION_HEADINGS = {
    4: ["Түрээслүүлэгчийн эрх, үүрэг", "Түрээслүүлэгчийн эрх үүрэг"],
    5: ["Түрээслэгчийн эрх, үүрэг", "Түрээслэгчийн эрх үүрэг"],
    6: ["Талуудын хүлээх хариуцлага.", "Талуудын хүлээх хариуцлага"],
    7: ["Гэрээ цуцлах"],
    8: ["Бусад"],
};

const TRAILING_BOUNDARY_HEADINGS = ["Талууд"];

const normalizeAgreementField = (value) => String(value || "").trim();
const isDataUrlImage = (value) => /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(String(value || ""));
const DRAWING_NAMESPACES = {
    a: "http://schemas.openxmlformats.org/drawingml/2006/main",
    pic: "http://schemas.openxmlformats.org/drawingml/2006/picture",
};

const extractParagraphText = (paragraph = "") =>
    decodeXmlEntities(
        Array.from(paragraph.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g))
            .map((match) => match[1])
            .join("")
    )
        .replace(/\s+/g, " ")
        .trim();

const buildParagraphFromTemplate = (templateParagraph, text) => {
    const openingTag = templateParagraph.match(/^<w:p\b[^>]*>/)?.[0] || "<w:p>";
    const paragraphProperties =
        templateParagraph.match(/<w:pPr[\s\S]*?<\/w:pPr>/)?.[0] || "";
    const runProperties =
        templateParagraph.match(/<w:r\b[^>]*>\s*(<w:rPr[\s\S]*?<\/w:rPr>)/)?.[1] || "";

    return `${openingTag}${paragraphProperties}<w:r>${runProperties}<w:t xml:space="preserve">${escapeXml(
        text
    )}</w:t></w:r></w:p>`;
};

const parseTemplateContentToSections = (content = "") => {
    const lines = String(content || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    const sections = [];
    let currentSection = null;

    lines.forEach((line) => {
        const sectionMatch = line.match(/^(\d+)\.\s+(.+)$/);
        const clauseMatch = line.match(/^(\d+)\.1\.(\d+)\s+(.+)$/);

        if (sectionMatch && !clauseMatch) {
            if (currentSection) {
                sections.push(currentSection);
            }

            currentSection = {
                sectionNumber: sectionMatch[1],
                title: sectionMatch[2],
                items: [],
            };
            return;
        }

        if (clauseMatch && currentSection && currentSection.sectionNumber === clauseMatch[1]) {
            currentSection.items.push(clauseMatch[3]);
        }
    });

    if (currentSection) {
        sections.push(currentSection);
    }

    return sections;
};

const withTextTagValue = (attrs = "", value = "") => {
    const normalizedAttrs = /xml:space=/.test(attrs)
        ? attrs
        : `${attrs}${String(value).match(/^\s|\s$|\s{2,}/) ? ' xml:space="preserve"' : ""}`;

    return `<w:t${normalizedAttrs}>${escapeXml(value)}</w:t>`;
};

const replaceTextNodes = (paragraph, nextValues) => {
    let valueIndex = 0;

    return paragraph.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, (match, attrs = "") => {
        const nextValue = nextValues[valueIndex];
        valueIndex += 1;
        if (nextValue === undefined) {
            return match;
        }

        return withTextTagValue(attrs, nextValue);
    });
};

const ensureDrawingNamespaces = (xml = "") =>
    Object.entries(DRAWING_NAMESPACES).reduce((nextXml, [prefix, uri]) => {
        if (nextXml.includes(`xmlns:${prefix}=`)) {
            return nextXml;
        }

        return nextXml.replace("<w:document ", `<w:document xmlns:${prefix}="${uri}" `);
    }, xml);

const getDataUrlImageDetails = (value = "") => {
    const match = String(value || "").match(/^data:(image\/([a-zA-Z0-9.+-]+));base64,(.+)$/);

    if (!match) {
        return null;
    }

    const mimeType = match[1];
    const subtype = match[2].toLowerCase();
    const extensionMap = {
        jpeg: "jpeg",
        jpg: "jpg",
        png: "png",
        gif: "gif",
        webp: "webp",
    };

    return {
        mimeType,
        extension: extensionMap[subtype] || "png",
        buffer: Buffer.from(match[3], "base64"),
    };
};

const ensureContentTypeForImage = (contentTypesXml, extension, mimeType) => {
    if (!extension || !mimeType) {
        return contentTypesXml;
    }

    const defaultTagPattern = new RegExp(
        `<Default\\s+Extension="${extension}"\\s+ContentType="[^"]+"\\s*\\/?>`,
        "i"
    );

    if (defaultTagPattern.test(contentTypesXml)) {
        return contentTypesXml;
    }

    return contentTypesXml.replace(
        "</Types>",
        `<Default Extension="${extension}" ContentType="${mimeType}"/></Types>`
    );
};

const addImageRelationship = (relationshipsXml, target) => {
    const existingIds = Array.from(
        relationshipsXml.matchAll(/Id="rId(\d+)"/g),
        (match) => Number(match[1])
    );
    const nextRelationshipId = `rId${(existingIds.length ? Math.max(...existingIds) : 0) + 1}`;

    return {
        relationshipId: nextRelationshipId,
        xml: relationshipsXml.replace(
            "</Relationships>",
            `<Relationship Id="${nextRelationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${target}"/></Relationships>`
        ),
    };
};

const buildTextRun = (runProperties = "", text = "") =>
    `<w:r>${runProperties}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;

const buildItalicRunProperties = (runProperties = "") => {
    if (!runProperties) {
        return "<w:rPr><w:i/></w:rPr>";
    }

    if (runProperties.includes("<w:i/>") || runProperties.includes("<w:i ")) {
        return runProperties;
    }

    return runProperties.replace("</w:rPr>", "<w:i/></w:rPr>");
};

const buildItalicTextRun = (runProperties = "", text = "") =>
    buildTextRun(buildItalicRunProperties(runProperties), text);

const buildTabRun = (runProperties = "") => `<w:r>${runProperties}<w:tab/></w:r>`;

const buildInlineImageRun = ({
    relationshipId,
    docPrId,
    name,
    runProperties = "",
    widthEmu = 640000,
    heightEmu = 180000,
}) => `<w:r>${runProperties}<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${widthEmu}" cy="${heightEmu}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="${docPrId}" name="${escapeXml(
    name
)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${docPrId}" name="${escapeXml(
    name
)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relationshipId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${widthEmu}" cy="${heightEmu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;

const buildParagraphWithRuns = (templateParagraph, runs = []) => {
    const openingTag = templateParagraph.match(/^<w:p\b[^>]*>/)?.[0] || "<w:p>";
    const paragraphProperties =
        templateParagraph.match(/<w:pPr[\s\S]*?<\/w:pPr>/)?.[0] || "";

    return `${openingTag}${paragraphProperties}${runs.join("")}</w:p>`;
};

const formatDateParts = (value) => {
    const date = value ? new Date(value) : new Date();

    if (Number.isNaN(date.getTime())) {
        return {
            year: "____",
            month: "__",
            day: "__",
        };
    }

    return {
        year: String(date.getUTCFullYear()),
        month: String(date.getUTCMonth() + 1).padStart(2, "0"),
        day: String(date.getUTCDate()).padStart(2, "0"),
    };
};

const getBookingDurationDays = (requestedFrom, requestedTo) => {
    const start = new Date(requestedFrom);
    const end = new Date(requestedTo);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return 0;
    }

    return Math.max(
        0,
        Math.round((Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()) -
            Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())) /
            (1000 * 60 * 60 * 24))
    );
};

const getBookingDurationLabel = (requestedFrom, requestedTo) => {
    const durationDays = getBookingDurationDays(requestedFrom, requestedTo);

    if (durationDays <= 0) {
        return "1 өдөр";
    }

    if (durationDays % 30 === 0) {
        const months = Math.max(1, durationDays / 30);
        return `${months} сар`;
    }

    return `${durationDays} өдөр`;
};

const getInquiryPaymentAmount = (inquiry) => {
    const listing = inquiry?.listing || {};
    const durationDays = Math.max(1, getBookingDurationDays(inquiry?.requestedFrom, inquiry?.requestedTo));
    const dailyRent = Number((listing?.dailyRent ?? listing?.monthlyRent) || 0);
    const deposit = Number(listing?.deposit || 0);

    return (durationDays * dailyRent) + deposit;
};

const hasCompletedOwnerAgreement = (inquiry) =>
    Boolean(
        normalizeAgreementField(inquiry?.ownerAgreementDetails?.fullName) &&
            normalizeAgreementField(inquiry?.ownerAgreementDetails?.phoneNumber) &&
            String(inquiry?.ownerAgreementDetails?.signatureDataUrl || "").trim()
    );

const hasCompletedRenterAgreement = (inquiry) =>
    Boolean(
        normalizeAgreementField(inquiry?.renterAgreementDetails?.fullName) &&
            normalizeAgreementField(inquiry?.renterAgreementDetails?.phoneNumber) &&
            String(inquiry?.renterAgreementDetails?.signatureDataUrl || "").trim()
    );

const applyInitialAgreementDetailsToParagraphs = ({ paragraphs, inquiry }) => {
    const listing = inquiry?.listing || {};
    const ownerName = normalizeAgreementField(
        inquiry?.ownerAgreementDetails?.fullName ||
            inquiry?.ownerProfile?.hostelName ||
            inquiry?.ownerProfile?.name
    );
    const renterName = normalizeAgreementField(inquiry?.renterAgreementDetails?.fullName || inquiry?.renter?.name);
    const listingAddress = normalizeAgreementField(listing?.location);
    const listingName = normalizeAgreementField(listing?.title);
    const dailyRent = Number((listing?.dailyRent ?? listing?.monthlyRent) || 0);
    const deposit = Number(listing?.deposit || 0);
    const requestedFrom = inquiry?.requestedFrom;
    const requestedTo = inquiry?.requestedTo;
    const createdDateParts = formatDateParts(inquiry?.createdAt || new Date());
    const fromDateParts = formatDateParts(requestedFrom);
    const toDateParts = formatDateParts(requestedTo);
    const durationDays = getBookingDurationDays(requestedFrom, requestedTo);
    const durationLabel = getBookingDurationLabel(requestedFrom, requestedTo);
    const payableDays = Math.max(1, durationDays || 0);
    const totalRent = dailyRent > 0 ? (payableDays * dailyRent) + deposit : deposit;
    const normalizedTexts = paragraphs.map((paragraph) =>
        normalizeHeadingText(extractParagraphText(paragraph))
    );

    return paragraphs.map((paragraph, index) => {
        const normalizedText = normalizedTexts[index];
        const runProperties =
            paragraph.match(/<w:r\b[^>]*>\s*(<w:rPr[\s\S]*?<\/w:rPr>)/)?.[1] || "";

        if (
            normalizedText.includes(normalizeHeadingText("оны")) &&
            normalizedText.includes(normalizeHeadingText("дугаар")) &&
            normalizedText.includes(normalizeHeadingText("улаанбаатар хот"))
        ) {
            return buildParagraphWithRuns(paragraph, [
                buildItalicTextRun(
                    runProperties,
                    `${createdDateParts.year} оны ${createdDateParts.month} дугаар`
                ),
                buildTabRun(runProperties),
                buildTabRun(runProperties),
                buildTabRun(runProperties),
                buildTextRun(runProperties, "№"),
                buildTabRun(runProperties),
                buildTabRun(runProperties),
                buildTabRun(runProperties),
                buildItalicTextRun(runProperties, "Улаанбаатар хот"),
            ]);
        }

        if (
            normalizedText.includes(normalizeHeadingText("сарын")) &&
            normalizedText.includes(normalizeHeadingText("өдөр")) &&
            !normalizedText.includes(normalizeHeadingText("энэхүү гэрээ нь"))
        ) {
            return buildParagraphWithRuns(paragraph, [
                buildTextRun(runProperties, "сарын "),
                buildItalicTextRun(runProperties, createdDateParts.day),
                buildTextRun(runProperties, "-ны өдөр"),
            ]);
        }

        if (
            normalizedText.includes(normalizeHeadingText("энэхүү түрээсийн гэрээ")) &&
            normalizedText.includes(normalizeHeadingText("түрээслүүлэгч")) &&
            normalizedText.includes(normalizeHeadingText("түрээслэгч")) &&
            normalizedText.includes(normalizeHeadingText("талууд")) &&
            normalizedText.includes(normalizeHeadingText("иргэний хуулийн 318"))
        ) {
            return buildParagraphWithRuns(paragraph, [
                buildTextRun(runProperties, "Энэхүү "),
                buildTextRun(runProperties, " ТҮРЭЭСИЙН ГЭРЭЭ "),
                buildTextRun(runProperties, "(цаашид “Гэрээ” гэх)-г нэг талаас "),
                buildItalicTextRun(runProperties, ownerName || "_________________"),
                buildTextRun(runProperties, " (цаашид “Түрээслүүлэгч” гэх), нөгөө талаас "),
                buildItalicTextRun(runProperties, renterName || "____________________"),
                buildTextRun(
                    runProperties,
                    " (цаашид “Түрээслэгч” гэх) нар (хамтад нь “Талууд” гэх) Монгол Улсын Иргэний хуулийн 318 дугаар зүйл болон холбогдох бусад хууль тогтоомж, дүрэм, журмыг  удирдлага болгон дараах нөхцлийг харилцан тохиролцон байгуулав."
                ),
            ]);
        }

        if (
            normalizedText.includes(normalizeHeadingText("энэхүү гэрээгээр")) &&
            normalizedText.includes(normalizeHeadingText("байрлах"))
        ) {
            return buildParagraphWithRuns(paragraph, [
                buildTextRun(runProperties, "Энэхүү Гэрээгээр Түрээслүүлэгч нь "),
                buildItalicTextRun(runProperties, listingAddress || "________________"),
                buildTextRun(runProperties, " байрлах "),
                buildItalicTextRun(runProperties, listingName || "________"),
                buildTextRun(
                    runProperties,
                    " хөрөнгийг /цаашид Хөрөнгө гэх/ Түрээслэгчийн эзэмшил, ашиглалтанд шилжүүлэх, нөгөө талаас Түрээслэгч нь түрээсийн төлбөрийг төлөх, Талуудын эдлэх эрх, хүлээх үүрэг, хариуцлагатай холбоотой харилцааг зохицуулна."
                ),
            ]);
        }

        if (
            normalizedText.includes(normalizeHeadingText("энэхүү гэрээ нь")) &&
            normalizedText.includes(normalizeHeadingText("өдрөөс")) &&
            normalizedText.includes(normalizeHeadingText("дуустал")) &&
            normalizedText.includes(normalizeHeadingText("хугацаатай"))
        ) {
            return buildParagraphWithRuns(paragraph, [
                buildTextRun(runProperties, "Энэхүү Гэрээ нь "),
                buildItalicTextRun(
                    runProperties,
                    `${fromDateParts.year} оны ${fromDateParts.month} дугаар сарын ${fromDateParts.day}-ний өдрөөс`
                ),
                buildTextRun(runProperties, "  "),
                buildItalicTextRun(
                    runProperties,
                    `${toDateParts.year} оны ${toDateParts.month} дугаар сарын ${toDateParts.day}-ны өдрийг дуустал`
                ),
                buildTextRun(runProperties, " "),
                buildItalicTextRun(runProperties, durationLabel),
                buildTextRun(runProperties, " хугацаатай байна."),
            ]);
        }

        if (
            normalizedText.includes(normalizeHeadingText("түрээсийн төлбөр нь")) &&
            normalizedText.includes(normalizeHeadingText("төгрөг байна")) &&
            normalizedText.includes(normalizeHeadingText("нийт"))
        ) {
            return buildParagraphWithRuns(paragraph, [
                buildTextRun(runProperties, "Түрээсийн төлбөр нь өдрийн "),
                buildItalicTextRun(runProperties, dailyRent ? String(dailyRent) : "______________"),
                buildTextRun(runProperties, " төгрөг байна. Түрээсийн төлбөрийг "),
                buildItalicTextRun(runProperties, `${payableDays} өдөрөөр нь`),
                buildTextRun(runProperties, " бодож авах ба Түрээслэгч нь нийт "),
                buildItalicTextRun(runProperties, totalRent ? String(totalRent) : "__________"),
                buildTextRun(runProperties, " ("),
                buildItalicTextRun(runProperties, totalRent ? String(totalRent) : "_______________"),
                buildTextRun(
                    runProperties,
                    `) төгрөгийг төлнө. Үүнд барьцаа төлбөр ${deposit || 0} төгрөг багтсан.`
                ),
            ]);
        }

        return paragraph;
    });
};

const applyPartyDetailsToParagraphs = async ({ paragraphs, inquiry, workingDir, previewId }) => {
    const ownerName = normalizeAgreementField(
        inquiry?.ownerAgreementDetails?.fullName ||
            inquiry?.ownerProfile?.hostelName ||
            inquiry?.ownerProfile?.name
    );
    const renterName = normalizeAgreementField(inquiry?.renterAgreementDetails?.fullName);
    const ownerPhone = normalizeAgreementField(inquiry?.ownerAgreementDetails?.phoneNumber);
    const renterPhone = normalizeAgreementField(inquiry?.renterAgreementDetails?.phoneNumber);
    const buildPhoneString = (phone = "") =>
        phone ? `Утас________ ${phone} ________` : "Утас________________________";
    const normalizedParagraphTexts = paragraphs.map((paragraph) =>
        normalizeHeadingText(extractParagraphText(paragraph))
    );
    const partiesHeadingIndex = normalizedParagraphTexts.findIndex(
        (text) => text === normalizeHeadingText("Талууд")
    );

    if (partiesHeadingIndex < 0) {
        return paragraphs;
    }

    const relationshipsPath = path.join(workingDir, "word", "_rels", "document.xml.rels");
    const contentTypesPath = path.join(workingDir, "[Content_Types].xml");
    const mediaDir = path.join(workingDir, "word", "media");
    await fs.promises.mkdir(mediaDir, { recursive: true });

    let relationshipsXml = await fs.promises.readFile(relationshipsPath, "utf8");
    let contentTypesXml = await fs.promises.readFile(contentTypesPath, "utf8");
    let nextDocPrId = 5000;

    const createSignatureAsset = async (signatureDataUrl, role) => {
        const imageDetails = getDataUrlImageDetails(signatureDataUrl);

        if (!imageDetails) {
            return null;
        }

        const filename = `${previewId}-${role}-signature.${imageDetails.extension}`;
        await fs.promises.writeFile(path.join(mediaDir, filename), imageDetails.buffer);

        contentTypesXml = ensureContentTypeForImage(
            contentTypesXml,
            imageDetails.extension,
            imageDetails.mimeType
        );

        const relationshipResult = addImageRelationship(relationshipsXml, `media/${filename}`);
        relationshipsXml = relationshipResult.xml;
        nextDocPrId += 1;

        return {
            relationshipId: relationshipResult.relationshipId,
            docPrId: nextDocPrId,
            name: `${role}-signature`,
        };
    };

    const ownerSignatureAsset = await createSignatureAsset(
        inquiry?.ownerAgreementDetails?.signatureDataUrl,
        "owner"
    );
    const renterSignatureAsset = await createSignatureAsset(
        inquiry?.renterAgreementDetails?.signatureDataUrl,
        "renter"
    );

    const updatedParagraphs = paragraphs.map((paragraph, index) => {
        if (index <= partiesHeadingIndex) {
            return paragraph;
        }

        const normalizedText = normalizedParagraphTexts[index];

        if (
            normalizedText.includes(normalizeHeadingText("Түрээслүүлэгч:")) &&
            normalizedText.includes(normalizeHeadingText("Түрээслэгч:"))
        ) {
            return paragraph;
        }

        if (
            normalizedText.includes(normalizeHeadingText("Гарын үсэг")) &&
            normalizedText.includes(normalizeHeadingText("Утас")) === false
        ) {
            const runProperties =
                paragraph.match(/<w:r\b[^>]*>\s*(<w:rPr[\s\S]*?<\/w:rPr>)/)?.[1] || "";

            const leftRuns = ownerSignatureAsset
                ? [
                      buildTextRun(runProperties, "Гарын үсэг"),
                      buildInlineImageRun({
                          relationshipId: ownerSignatureAsset.relationshipId,
                          docPrId: ownerSignatureAsset.docPrId,
                          name: ownerSignatureAsset.name,
                          runProperties,
                      }),
                      buildTextRun(
                          runProperties,
                          ownerName ? ` / ${ownerName} /` : " /__________/"
                      ),
                  ]
                : [
                      buildTextRun(
                          runProperties,
                          ownerName
                              ? `Гарын үсэг__________/ ${ownerName} /`
                              : "Гарын үсэг__________/__________/"
                      ),
                  ];
            const rightRuns = renterSignatureAsset
                ? [
                      buildTextRun(runProperties, "Гарын үсэг"),
                      buildInlineImageRun({
                          relationshipId: renterSignatureAsset.relationshipId,
                          docPrId: renterSignatureAsset.docPrId,
                          name: renterSignatureAsset.name,
                          runProperties,
                      }),
                      buildTextRun(
                          runProperties,
                          renterName ? ` / ${renterName} /` : " /__________/"
                      ),
                  ]
                : [
                      buildTextRun(
                          runProperties,
                          renterName
                              ? `Гарын үсэг__________/ ${renterName} /`
                              : "Гарын үсэг__________/__________/"
                      ),
                  ];

            return buildParagraphWithRuns(paragraph, [
                ...leftRuns,
                buildTextRun(runProperties, "                        "),
                ...rightRuns,
            ]);
        }

        if (normalizedText.includes(normalizeHeadingText("Утас"))) {
            const runProperties =
                paragraph.match(/<w:r\b[^>]*>\s*(<w:rPr[\s\S]*?<\/w:rPr>)/)?.[1] || "";

            return buildParagraphWithRuns(paragraph, [
                buildTextRun(runProperties, buildPhoneString(ownerPhone)),
                buildTextRun(runProperties, "                                 "),
                buildTextRun(runProperties, buildPhoneString(renterPhone)),
            ]);
        }

        return paragraph;
    });

    await fs.promises.writeFile(relationshipsPath, relationshipsXml, "utf8");
    await fs.promises.writeFile(contentTypesPath, contentTypesXml, "utf8");

    return updatedParagraphs;
};

const buildAgreementPreviewDocx = async ({ sourcePath, sections, inquiry }) => {
    const previewId = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
    const workingDir = path.join(TEMPLATE_PREVIEW_DIR, `inquiry-docx-preview-${previewId}`);
    await fs.promises.mkdir(workingDir, { recursive: true });

    try {
        await execFileAsync("unzip", ["-q", sourcePath, "-d", workingDir]);

        const documentXmlPath = path.join(workingDir, "word", "document.xml");
        const originalXml = ensureDrawingNamespaces(
            await fs.promises.readFile(documentXmlPath, "utf8")
        );
        const sectionPropertiesIndex = originalXml.lastIndexOf("<w:sectPr");
        const bodyOpenTag = "<w:body>";
        const bodyStartIndex = originalXml.indexOf(bodyOpenTag);

        if (sectionPropertiesIndex === -1 || bodyStartIndex === -1) {
            throw new Error("Template structure is invalid");
        }

        const bodyContentStart = bodyStartIndex + bodyOpenTag.length;
        const bodyParagraphXml = originalXml.slice(bodyContentStart, sectionPropertiesIndex);
        const paragraphMatches = Array.from(bodyParagraphXml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g));
        const paragraphs = paragraphMatches.map((match) => match[0]);
        const paragraphTexts = paragraphs.map((paragraph) =>
            normalizeHeadingText(extractParagraphText(paragraph))
        );

        const findHeadingIndex = (sectionNumber) => {
            const headingOptions = (SECTION_HEADINGS[sectionNumber] || []).map(normalizeHeadingText);
            return paragraphTexts.findIndex((text) => headingOptions.includes(text));
        };

        const findTrailingBoundaryIndex = (startIndex) => {
            const headingOptions = TRAILING_BOUNDARY_HEADINGS.map(normalizeHeadingText);
            const boundaryIndex = paragraphTexts.findIndex(
                (text, paragraphIndex) =>
                    paragraphIndex > startIndex && headingOptions.includes(text)
            );

            return boundaryIndex >= 0 ? boundaryIndex : null;
        };

        const headingIndexes = sections
            .map((section) => ({
                section,
                index: findHeadingIndex(section.sectionNumber),
            }))
            .filter((entry) => entry.index >= 0)
            .sort((left, right) => left.index - right.index);

        let updatedParagraphs = [...paragraphs];

        [...headingIndexes].reverse().forEach((entry) => {
            const currentIndex = headingIndexes.findIndex(
                (headingEntry) => headingEntry.index === entry.index
            );
            const nextHeadingIndex =
                headingIndexes[currentIndex + 1]?.index ??
                findTrailingBoundaryIndex(entry.index) ??
                paragraphs.length;
            const sectionParagraphs = paragraphs.slice(entry.index + 1, nextHeadingIndex);
            const textParagraphs = sectionParagraphs.filter(
                (paragraph) => extractParagraphText(paragraph).trim().length > 0
            );
            const templateParagraph = textParagraphs[0];

            if (!templateParagraph) {
                return;
            }

            const blankParagraph =
                sectionParagraphs.find(
                    (paragraph) => extractParagraphText(paragraph).trim().length === 0
                ) || "";

            const replacementParagraphs = entry.section.items
                .map((item) => String(item || "").trim())
                .filter(Boolean)
                .map((item) => buildParagraphFromTemplate(templateParagraph, item));

            if (blankParagraph) {
                replacementParagraphs.push(blankParagraph);
            }

            updatedParagraphs.splice(
                entry.index + 1,
                nextHeadingIndex - (entry.index + 1),
                ...replacementParagraphs
            );
        });

        updatedParagraphs = applyInitialAgreementDetailsToParagraphs({
            paragraphs: updatedParagraphs,
            inquiry,
        });

        updatedParagraphs = await applyPartyDetailsToParagraphs({
            paragraphs: updatedParagraphs,
            inquiry,
            workingDir,
            previewId,
        });

        const updatedXml =
            originalXml.slice(0, bodyContentStart) +
            updatedParagraphs.join("") +
            originalXml.slice(sectionPropertiesIndex);

        await fs.promises.writeFile(documentXmlPath, updatedXml, "utf8");

        const generatedDocxFilename = `inquiry-section-preview-${previewId}.docx`;
        const generatedDocxPath = path.join(TEMPLATE_PREVIEW_DIR, generatedDocxFilename);

        await execFileAsync("zip", ["-qr", generatedDocxPath, "."], { cwd: workingDir });

        return {
            generatedPdfPath: path.join(
                TEMPLATE_PREVIEW_DIR,
                `inquiry-section-preview-${previewId}.pdf`
            ),
            generatedDocxPath,
            previewId,
        };
    } finally {
        await fs.promises.rm(workingDir, { recursive: true, force: true });
    }
};

const prepareInquiryPreviewSource = async ({ inquiry, req, requestBody = {} }) => {
    const listingOwnerId = String(inquiry.listing?.owner?._id || inquiry.listing?.owner || "");
    const owner = await User.findById(listingOwnerId).select("name hostelName leaseAgreementTemplates");
    const availableTemplates = owner ? getOwnerLeaseTemplates(owner, req) : [];
    const previewSourceTemplate =
        availableTemplates.find(
            (template) => template.name === inquiry.listing?.leaseTemplateName && template.url
        ) ||
        availableTemplates.find((template) => template.isDefault && template.url) ||
        availableTemplates.find((template) => template.url) ||
        null;

    if (!previewSourceTemplate?.url) {
        throw new Error("Template source file not found");
    }

    const uploadFilename = getUploadFilenameFromUrl(previewSourceTemplate.url, req);

    if (!uploadFilename) {
        throw new Error("Template source file URL is invalid");
    }

    const sourcePath = path.join(__dirname, "..", "uploads", uploadFilename);
    await fs.promises.access(sourcePath, fs.constants.F_OK);

    const previewInquiry = {
        ...(typeof inquiry.toObject === "function" ? inquiry.toObject() : inquiry),
        ownerProfile: owner
            ? typeof owner.toObject === "function"
                ? owner.toObject()
                : owner
            : null,
        ownerAgreementDetails: {
            ...(inquiry.ownerAgreementDetails?.toObject?.() || inquiry.ownerAgreementDetails || {}),
            ...(requestBody.ownerAgreementDetails || {}),
        },
        renterAgreementDetails: {
            ...(inquiry.renterAgreementDetails?.toObject?.() || inquiry.renterAgreementDetails || {}),
            ...(requestBody.renterAgreementDetails || {}),
        },
    };

    return {
        owner,
        sourcePath,
        savedSections: parseTemplateContentToSections(inquiry.listing?.leaseTemplateContent),
        previewInquiry,
    };
};

const generateInquiryAgreementPdf = async ({ inquiry, req, requestBody = {} }) => {
    await ensureTemplatePreviewDir();

    const { sourcePath, savedSections, previewInquiry } = await prepareInquiryPreviewSource({
        inquiry,
        req,
        requestBody,
    });

    const { generatedDocxPath, generatedPdfPath, previewId } = await buildAgreementPreviewDocx({
        sourcePath,
        sections: savedSections,
        inquiry: previewInquiry,
    });

    await convertToPdf({
        sourcePath: generatedDocxPath,
        outputDir: TEMPLATE_PREVIEW_DIR,
    });

    const generatedLibreOfficePdfPath = path.join(
        TEMPLATE_PREVIEW_DIR,
        `${path.parse(generatedDocxPath).name}.pdf`
    );

    const hasLibreOfficePdf = await fileExists(generatedLibreOfficePdfPath);

    if (!hasLibreOfficePdf) {
        throw new Error("Agreement preview PDF was not generated");
    }

    if (generatedLibreOfficePdfPath !== generatedPdfPath) {
        await fs.promises.rename(generatedLibreOfficePdfPath, generatedPdfPath);
    }

    const hasGeneratedPdf = await fileExists(generatedPdfPath);

    if (!hasGeneratedPdf) {
        throw new Error("Agreement preview PDF could not be prepared");
    }

    await fs.promises.rm(generatedDocxPath, { force: true });

    return {
        previewId,
        generatedPdfPath,
        previewUrl: buildTemplatePreviewUrl(req, path.basename(generatedPdfPath)),
    };
};

const appendFinalAgreementToChat = async ({ inquiry, pdfUrl }) => {
    const adminUser = await ensureAdminChatUser();
    let chat = await Chat.findOne({
        listing: inquiry.listing?._id || inquiry.listing,
        renter: inquiry.renter?._id || inquiry.renter,
    });

    if (!chat) {
        chat = await Chat.create({
            listing: inquiry.listing?._id || inquiry.listing,
            owner: inquiry.listing?.owner?._id || inquiry.listing?.owner,
            renter: inquiry.renter?._id || inquiry.renter,
        });
    }

    const alreadyAttached = Array.isArray(chat.messages)
        ? chat.messages.some(
              (message) =>
                  String(message.attachmentUrl || "").trim() === String(pdfUrl || "").trim() &&
                  String(message.sender || "") === String(adminUser._id)
          )
        : false;

    if (alreadyAttached) {
        return;
    }

    chat.messages.push({
        sender: adminUser._id,
        text: FINAL_AGREEMENT_MESSAGE,
        attachmentUrl: pdfUrl,
        attachmentName: `${inquiry.listing?.title || "agreement"}-final-agreement.pdf`,
        attachmentMimeType: "application/pdf",
    });
    chat.lastMessage = FINAL_AGREEMENT_MESSAGE;
    chat.lastMessageAt = new Date();
    chat.ownerUnreadCount += 1;
    chat.renterUnreadCount += 1;

    await chat.save();
};

const finalizeInquiryAgreementIfReady = async ({ inquiry, req }) => {
    const ownerSignature = String(inquiry.ownerAgreementDetails?.signatureDataUrl || "").trim();
    const renterSignature = String(inquiry.renterAgreementDetails?.signatureDataUrl || "").trim();
    const paymentStatus = String(inquiry.payment?.status || "");

    if (!ownerSignature || !renterSignature) {
        return inquiry;
    }

    if (paymentStatus !== "paid") {
        return inquiry;
    }

    if (inquiry.finalAgreementPdfUrl && inquiry.agreementFinalizedAt) {
        return inquiry;
    }

    const { previewUrl } = await generateInquiryAgreementPdf({ inquiry, req });

    inquiry.finalAgreementPdfUrl = previewUrl;
    inquiry.agreementFinalizedAt = new Date();
    await inquiry.save();

    await Promise.all([
        createNotification({
            recipient: inquiry.listing?.owner?._id || inquiry.listing?.owner,
            inquiry: inquiry._id,
            listing: inquiry.listing?._id || inquiry.listing,
            title: "Final agreement is ready",
            message: `${inquiry.listing?.title || "This inquiry"} now has a signed agreement PDF.`,
        }),
        createNotification({
            recipient: inquiry.renter?._id || inquiry.renter,
            inquiry: inquiry._id,
            listing: inquiry.listing?._id || inquiry.listing,
            title: "Final agreement is ready",
            message: `${inquiry.listing?.title || "Your inquiry"} now has a signed agreement PDF.`,
        }),
        appendFinalAgreementToChat({
            inquiry,
            pdfUrl: previewUrl,
        }),
    ]);

    return inquiry;
};

const markInquiryPaymentExpired = async (inquiry) => {
    inquiry.payment = {
        ...(inquiry.payment?.toObject?.() || inquiry.payment || {}),
        status: "expired",
        lastCheckedAt: new Date(),
    };
    inquiry.status = "Declined";
    await inquiry.save();

    await Promise.all([
        createNotification({
            recipient: inquiry.renter?._id || inquiry.renter,
            inquiry: inquiry._id,
            listing: inquiry.listing?._id || inquiry.listing,
            title: "Payment time expired",
            message: `${inquiry.listing?.title || "Your booking"} was cancelled because payment was not completed within 24 hours.`,
        }),
        createNotification({
            recipient: inquiry.listing?.owner?._id || inquiry.listing?.owner,
            inquiry: inquiry._id,
            listing: inquiry.listing?._id || inquiry.listing,
            title: "Booking cancelled",
            message: `${inquiry.listing?.title || "This booking"} was cancelled because the renter did not pay within 24 hours.`,
        }),
    ]);

    return inquiry;
};

const getConfiguredPaymentProvider = () => {
    const configuredProvider = String(process.env.PAYMENT_PROVIDER || "").trim().toLowerCase();

    if (["byl", "qpay"].includes(configuredProvider)) {
        return configuredProvider;
    }

    if (process.env.BYL_PROJECT_ID && (process.env.BYL_TOKEN || process.env.BYL_API_TOKEN)) {
        return "byl";
    }

    return "qpay";
};

const getInquiryPaymentProvider = (payment = {}) => {
    const provider = String(payment?.provider || "").trim().toLowerCase();

    if (!payment?.checkoutId && !payment?.checkoutUrl && (payment?.qrImage || payment?.qrText)) {
        return "qpay";
    }

    if (provider === "qpay" || provider === "byl") {
        return provider;
    }

    if (payment?.checkoutId || payment?.checkoutUrl || payment?.clientReferenceId) {
        return "byl";
    }

    return "qpay";
};

const createAgreementPayment = async ({ inquiry, amount }) => {
    const provider = getConfiguredPaymentProvider();

    if (provider === "byl") {
        const checkout = await createBylCheckout({
            inquiryId: inquiry._id,
            amount,
            description: `${inquiry.listing?.title || "Hostel booking"} payment`,
            customerEmail: inquiry.renter?.email || "",
        });

        return {
            provider,
            status: "pending",
            amount,
            invoiceId: checkout.checkoutId,
            senderInvoiceNo: checkout.clientReferenceId,
            checkoutId: checkout.checkoutId,
            checkoutUrl: checkout.checkoutUrl,
            clientReferenceId: checkout.clientReferenceId,
            qrText: "",
            qrImage: "",
            urls: checkout.checkoutUrl
                ? [
                      {
                          name: "Byl checkout",
                          description: "Open Byl payment page",
                          link: checkout.checkoutUrl,
                      },
                  ]
                : [],
            dueAt: checkout.expiresAt
                ? new Date(checkout.expiresAt)
                : new Date(Date.now() + PAYMENT_WINDOW_MS),
            lastCheckedAt: new Date(),
            paidAt: null,
        };
    }

    const createdPayment = await createQPayInvoice({
        inquiryId: inquiry._id,
        amount,
        description: `${inquiry.listing?.title || "Hostel booking"} payment`,
        customerCode: inquiry.renter?.email || inquiry.renter?.name || String(inquiry.renter),
    });

    return {
        provider,
        status: "pending",
        amount,
        invoiceId: createdPayment.invoiceId,
        senderInvoiceNo: createdPayment.senderInvoiceNo,
        checkoutId: "",
        checkoutUrl: "",
        clientReferenceId: "",
        qrText: createdPayment.qrText,
        qrImage: createdPayment.qrImage,
        urls: createdPayment.urls,
        dueAt: new Date(Date.now() + PAYMENT_WINDOW_MS),
        lastCheckedAt: new Date(),
        paidAt: null,
    };
};

const checkAgreementPaymentStatus = async (payment = {}) => {
    const provider = getInquiryPaymentProvider(payment);

    if (provider === "byl") {
        const checkoutId = payment.checkoutId || payment.invoiceId;
        const checkoutCheck = await checkBylCheckout({ checkoutId });

        return {
            provider,
            paid: checkoutCheck.paid,
            expired: checkoutCheck.expired,
            paidAt: checkoutCheck.paidAt,
            checkoutUrl: checkoutCheck.checkoutUrl,
        };
    }

    return {
        provider,
        ...(await checkQPayPayment({
            invoiceId: payment.invoiceId,
        })),
    };
};

const buildRequestContext = (req) => {
    const configuredBaseUrl = String(
        process.env.BACKEND_PUBLIC_URL || process.env.API_PUBLIC_URL || ""
    ).trim();

    if (!configuredBaseUrl) {
        return req;
    }

    try {
        const parsedUrl = new URL(configuredBaseUrl);

        return {
            protocol: parsedUrl.protocol.replace(/:$/, ""),
            get: (headerName) => {
                if (String(headerName || "").toLowerCase() === "host") {
                    return parsedUrl.host;
                }

                return req.get(headerName);
            },
        };
    } catch {
        return req;
    }
};

const verifyBylWebhookSignature = ({ rawBody, signature }) => {
    const secret = getBylWebhookSecret();

    if (!secret) {
        throw new Error("Byl webhook secret is not configured");
    }

    if (!signature) {
        return false;
    }

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");
    const receivedBuffer = Buffer.from(String(signature), "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    return (
        receivedBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
    );
};

const getPaymentErrorStatus = (error) => {
    const message = String(error?.message || "").toLowerCase();

    if (
        message.includes("access token may be invalid or expired") ||
        message.includes("authentication failed") ||
        message.includes("unauthenticated") ||
        message.includes("хандах эрхгүй") ||
        message.includes("нэвтрэнэ үү")
    ) {
        return 401;
    }

    if (message.includes("invoice") || message.includes("qpay") || message.includes("byl")) {
        return 400;
    }

    return 500;
};

exports.createInquiry = async (req, res) => {
    try {
        if (req.user.role !== "renter") {
            return res.status(403).json({ message: "Only renters can send inquiries" });
        }

        const listing = await Listing.findById(req.params.listingId);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }
        if (listing.isClosed) {
            return res.status(400).json({ message: "This listing is currently closed" });
        }

        const existing = await Inquiry.findOne({
            listing: req.params.listingId,
            renter: req.user._id,
        });

        if (existing) {
            return res.status(400).json({ message: "Inquiry already sent for this listing" });
        }

        const requestedFrom = req.body?.requestedFrom ? new Date(req.body.requestedFrom) : null;
        const requestedTo = req.body?.requestedTo ? new Date(req.body.requestedTo) : null;

        if (!requestedFrom || Number.isNaN(requestedFrom.getTime())) {
            return res.status(400).json({ message: "Please select a valid start date" });
        }

        if (!requestedTo || Number.isNaN(requestedTo.getTime())) {
            return res.status(400).json({ message: "Please select a valid end date" });
        }

        if (requestedFrom > requestedTo) {
            return res.status(400).json({ message: "End date must be the same as or after the start date" });
        }

        const minimumStayDays =
            (getDateOnlyUtcValue(requestedTo) - getDateOnlyUtcValue(requestedFrom)) /
            (1000 * 60 * 60 * 24);

        if (minimumStayDays < 1) {
            return res.status(400).json({ message: "Booking dates must cover at least 1 night" });
        }

        if (listing.availableFrom && requestedFrom < listing.availableFrom) {
            return res.status(400).json({ message: "Selected start date is earlier than the listing availability" });
        }

        if (listing.availableUntil && requestedTo > listing.availableUntil) {
            return res.status(400).json({ message: "Selected end date is later than the listing availability" });
        }

        const inquiry = await Inquiry.create({
            listing: req.params.listingId,
            renter: req.user._id,
            requestedFrom,
            requestedTo,
        });

        await createNotification({
            recipient: listing.owner,
            inquiry: inquiry._id,
            listing: listing._id,
            title: "New inquiry received",
            message: `${req.user.name} sent an inquiry for ${listing.title}.`,
        });

        res.status(201).json(inquiry);
    } catch (err) {
        if (err.message === "Another renter is already confirmed for the selected dates") {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: err.message });
    }
};

exports.getMyInquiries = async (req, res) => {
    try {
        const inquiries = await Inquiry.find({ renter: req.user._id })
            .populate({
                path: "listing",
                select:
                    "title owner location roomType category availableBeds monthlyRent deposit leaseTemplateName leaseTemplateUrl leaseTemplateContent",
                populate: {
                    path: "owner",
                    select: "name hostelName hostelLogo",
                },
            })
            .sort({ createdAt: -1 });

        res.json(inquiries);
    } catch (err) {
        res.status(getPaymentErrorStatus(err)).json({ message: err.message });
    }
};

exports.getInquiriesForListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.listingId);

        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }
        if (listing.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to view inquiries" });
        }

        const inquiries = await Inquiry.find({ listing: req.params.listingId })
            .populate(
                "listing",
                "title location category roomType availableBeds monthlyRent deposit amenities"
            )
            .populate("renter", "name email avatar backgroundCheckDocument")
            .sort({ createdAt: -1 });

        res.json(inquiries);
    } catch (err) {
        res.status(getPaymentErrorStatus(err)).json({ message: err.message });
    }
};

exports.getInquiryById = async (req, res) => {
    try {
        const inquiry = await Inquiry.findById(req.params.id)
            .populate(
                "listing",
                "title location roomType category availableBeds monthlyRent deposit amenities owner leaseTemplateName leaseTemplateUrl leaseTemplateContent"
            )
            .populate("renter", "name email avatar backgroundCheckDocument");

        if (!inquiry) {
            return res.status(404).json({ message: "Inquiry not found", id: req.params.id });
        }

        const renterId = String(inquiry.renter?._id || inquiry.renter);
        const ownerId = String(inquiry.listing?.owner?._id || inquiry.listing?.owner);
        const isAuthorized =
            renterId === req.user._id.toString() || ownerId === req.user._id.toString();

        if (!isAuthorized) {
            return res.status(403).json({ message: "Not authorized to view this inquiry" });
        }

        res.json(inquiry);
    } catch (err) {
        res.status(getPaymentErrorStatus(err)).json({ message: err.message });
    }
};

exports.getInquiryAgreementPreview = async (req, res) => {
    try {
        const inquiry = await Inquiry.findById(req.params.id)
            .populate(
                "listing",
                "title owner location monthlyRent deposit leaseTemplateName leaseTemplateUrl leaseTemplateContent"
            )
            .populate("renter", "name");

        if (!inquiry) {
            return res.status(404).json({ message: "Inquiry not found" });
        }

        const renterId = String(inquiry.renter?._id || inquiry.renter);
        const ownerId = String(inquiry.listing?.owner?._id || inquiry.listing?.owner);
        const isAuthorized =
            renterId === req.user._id.toString() || ownerId === req.user._id.toString();

        if (!isAuthorized) {
            return res.status(403).json({ message: "Not authorized to view this agreement" });
        }

        const requestBody = req.method === "POST" ? req.body || {} : {};
        const { previewUrl, previewId } = await generateInquiryAgreementPdf({
            inquiry,
            req,
            requestBody,
        });

        return res.json({
            previewUrl,
            previewId,
        });
    } catch (err) {
        res.status(getPaymentErrorStatus(err)).json({ message: err.message });
    }
};

exports.acceptAgreement = async (req, res) => {
    try {
        const fullName = normalizeAgreementField(req.body?.fullName);
        const phoneNumber = normalizeAgreementField(req.body?.phoneNumber);
        const signatureDataUrl = String(req.body?.signatureDataUrl || "").trim();
        const inquiry = await Inquiry.findById(req.params.id).populate("listing");

        if (!inquiry) {
            return res.status(404).json({ message: "Inquiry not found" });
        }

        if (String(inquiry.renter) !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to accept this agreement" });
        }

        if (inquiry.status !== "Confirmed") {
            return res.status(400).json({ message: "Agreement can only be reviewed after confirmation" });
        }

        if (!fullName || !phoneNumber || !isDataUrlImage(signatureDataUrl)) {
            return res.status(400).json({ message: "Full name, phone number, and signature are required" });
        }

        inquiry.renterAgreementDetails = {
            fullName,
            phoneNumber,
            signatureDataUrl,
            completedAt: new Date(),
        };
        inquiry.agreementAcceptedAt = new Date();
        await inquiry.save();
        await finalizeInquiryAgreementIfReady({ inquiry, req });

        res.json({
            message: "Agreement accepted successfully",
            agreementAcceptedAt: inquiry.agreementAcceptedAt,
            finalAgreementPdfUrl: inquiry.finalAgreementPdfUrl,
        });
    } catch (err) {
        res.status(getPaymentErrorStatus(err)).json({ message: err.message });
    }
};

exports.confirmWithAgreement = async (req, res) => {
    try {
        const fullName = normalizeAgreementField(req.body?.fullName);
        const phoneNumber = normalizeAgreementField(req.body?.phoneNumber);
        const signatureDataUrl = String(req.body?.signatureDataUrl || "").trim();

        if (!fullName || !phoneNumber || !isDataUrlImage(signatureDataUrl)) {
            return res.status(400).json({ message: "Full name, phone number, and signature are required" });
        }

        const inquiry = await Inquiry.findById(req.params.id).populate("listing");

        if (!inquiry) {
            return res.status(404).json({ message: "Inquiry not found" });
        }

        if (inquiry.listing.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to confirm this inquiry" });
        }

        inquiry.status = "Confirmed";
        inquiry.ownerAgreementDetails = {
            fullName,
            phoneNumber,
            signatureDataUrl,
            completedAt: new Date(),
        };
        await enforceInquiryAvailability(inquiry);
        await inquiry.save();

        await createNotification({
            recipient: inquiry.renter,
            inquiry: inquiry._id,
            listing: inquiry.listing?._id || inquiry.listing,
            title: "Your request was confirmed",
            message: `${inquiry.listing?.title || "Your listing request"} is ready for agreement review.`,
        });

        await finalizeInquiryAgreementIfReady({ inquiry, req });

        res.json({
            message: "Inquiry confirmed successfully",
            status: inquiry.status,
            finalAgreementPdfUrl: inquiry.finalAgreementPdfUrl,
        });
    } catch (err) {
        res.status(getPaymentErrorStatus(err)).json({ message: err.message });
    }
};

exports.initiateAgreementPayment = async (req, res) => {
    try {
        const inquiry = await Inquiry.findById(req.params.id)
            .populate(
                "listing",
                "title owner location monthlyRent deposit leaseTemplateName leaseTemplateUrl leaseTemplateContent"
            )
            .populate("renter", "name email");

        if (!inquiry) {
            return res.status(404).json({ message: "Inquiry not found" });
        }

        if (String(inquiry.renter?._id || inquiry.renter) !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to initiate this payment" });
        }

        if (inquiry.status !== "Confirmed") {
            return res.status(400).json({ message: "Payment is available only for confirmed inquiries" });
        }

        if (!hasCompletedOwnerAgreement(inquiry) || !hasCompletedRenterAgreement(inquiry)) {
            return res.status(400).json({ message: "Both parties must complete the agreement before payment" });
        }

        const dueAt = inquiry.payment?.dueAt ? new Date(inquiry.payment.dueAt) : null;
        const now = new Date();

        if (
            inquiry.payment?.status === "pending" &&
            inquiry.payment?.invoiceId &&
            dueAt &&
            dueAt > now
        ) {
            return res.json({
                payment: inquiry.payment,
            });
        }

        if (dueAt && dueAt <= now && inquiry.payment?.status === "pending") {
            await markInquiryPaymentExpired(inquiry);
            return res.status(400).json({
                message: "Payment deadline expired. This booking was cancelled.",
            });
        }

        const amount = getInquiryPaymentAmount(inquiry);
        const createdPayment = await createAgreementPayment({ inquiry, amount });

        inquiry.payment = {
            ...(inquiry.payment?.toObject?.() || inquiry.payment || {}),
            ...createdPayment,
        };
        await inquiry.save();

        res.json({
            payment: inquiry.payment,
        });
    } catch (err) {
        res.status(getPaymentErrorStatus(err)).json({ message: err.message });
    }
};

exports.checkAgreementPayment = async (req, res) => {
    try {
        const inquiry = await Inquiry.findById(req.params.id)
            .populate(
                "listing",
                "title owner location monthlyRent deposit leaseTemplateName leaseTemplateUrl leaseTemplateContent"
            )
            .populate("renter", "name email");

        if (!inquiry) {
            return res.status(404).json({ message: "Inquiry not found" });
        }

        const ownerId = String(inquiry.listing?.owner?._id || inquiry.listing?.owner || "");
        const renterId = String(inquiry.renter?._id || inquiry.renter || "");
        const isAuthorized =
            ownerId === req.user._id.toString() || renterId === req.user._id.toString();

        if (!isAuthorized) {
            return res.status(403).json({ message: "Not authorized to check this payment" });
        }

        if (!inquiry.payment?.invoiceId) {
            return res.status(400).json({ message: "Payment has not been initiated yet" });
        }

        const dueAt = inquiry.payment?.dueAt ? new Date(inquiry.payment.dueAt) : null;
        if (
            inquiry.payment?.status === "pending" &&
            dueAt &&
            dueAt <= new Date()
        ) {
            await markInquiryPaymentExpired(inquiry);
            return res.json({
                payment: inquiry.payment,
                status: inquiry.status,
                finalAgreementPdfUrl: inquiry.finalAgreementPdfUrl,
            });
        }

        const paymentCheck = await checkAgreementPaymentStatus(inquiry.payment);

        inquiry.payment = {
            ...(inquiry.payment?.toObject?.() || inquiry.payment || {}),
            provider: paymentCheck.provider,
            lastCheckedAt: new Date(),
        };

        if (paymentCheck.paid) {
            inquiry.payment.status = "paid";
            inquiry.payment.paidAt = paymentCheck.paidAt ? new Date(paymentCheck.paidAt) : new Date();
            if (paymentCheck.checkoutUrl) {
                inquiry.payment.checkoutUrl = paymentCheck.checkoutUrl;
            }
            await inquiry.save();
            await finalizeInquiryAgreementIfReady({ inquiry, req });
        } else if (paymentCheck.expired) {
            await markInquiryPaymentExpired(inquiry);
        } else {
            await inquiry.save();
        }

        res.json({
            payment: inquiry.payment,
            status: inquiry.status,
            finalAgreementPdfUrl: inquiry.finalAgreementPdfUrl,
        });
    } catch (err) {
        res.status(getPaymentErrorStatus(err)).json({ message: err.message });
    }
};

exports.handleBylWebhook = async (req, res) => {
    try {
        const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
        const signature = req.get("Byl-Signature");

        if (!verifyBylWebhookSignature({ rawBody, signature })) {
            return res.status(401).json({ message: "Invalid Byl webhook signature" });
        }

        const event = JSON.parse(rawBody.toString("utf8"));

        if (event?.type !== "checkout.completed") {
            return res.json({ received: true });
        }

        const checkout = event?.data?.object || {};
        const checkoutId = String(checkout?.id || "");
        const clientReferenceId = String(checkout?.client_reference_id || "");
        const inquiryIdFromReference = clientReferenceId.startsWith("inquiry:")
            ? clientReferenceId.replace("inquiry:", "")
            : "";
        const canQueryInquiryId = /^[0-9a-fA-F]{24}$/.test(inquiryIdFromReference);
        const lookupConditions = [
            ...(checkoutId
                ? [{ "payment.checkoutId": checkoutId }, { "payment.invoiceId": checkoutId }]
                : []),
            ...(clientReferenceId
                ? [{ "payment.clientReferenceId": clientReferenceId }]
                : []),
            ...(canQueryInquiryId ? [{ _id: inquiryIdFromReference }] : []),
        ];

        if (lookupConditions.length === 0) {
            return res.json({ received: true, matched: false });
        }

        const inquiry = await Inquiry.findOne({
            $or: lookupConditions,
        })
            .populate(
                "listing",
                "title owner location monthlyRent deposit leaseTemplateName leaseTemplateUrl leaseTemplateContent"
            )
            .populate("renter", "name email");

        if (!inquiry) {
            return res.json({ received: true, matched: false });
        }

        inquiry.payment = {
            ...(inquiry.payment?.toObject?.() || inquiry.payment || {}),
            provider: "byl",
            status: "paid",
            amount: Number(checkout?.amount_total || inquiry.payment?.amount || 0),
            invoiceId: checkoutId || inquiry.payment?.invoiceId || "",
            checkoutId: checkoutId || inquiry.payment?.checkoutId || "",
            checkoutUrl: String(checkout?.url || inquiry.payment?.checkoutUrl || ""),
            clientReferenceId,
            paidAt: checkout?.updated_at ? new Date(checkout.updated_at) : new Date(),
            lastCheckedAt: new Date(),
        };

        await inquiry.save();
        await finalizeInquiryAgreementIfReady({
            inquiry,
            req: buildRequestContext(req),
        });

        res.json({ received: true, matched: true });
    } catch (err) {
        console.error("Failed to handle Byl webhook", err);
        res.status(getPaymentErrorStatus(err)).json({ message: err.message });
    }
};

exports.updateInquiryStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({ message: "Invalid inquiry status" });
        }

        const inquiry = await Inquiry.findById(req.params.id).populate("listing");
        if (!inquiry) {
            return res.status(404).json({ message: "Inquiry not found" });
        }
        if (inquiry.listing.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this inquiry" });
        }

        inquiry.status = status;
        if (status === "Confirmed") {
            await enforceInquiryAvailability(inquiry);
        }
        await inquiry.save();

        if (status === "Declined") {
            await createNotification({
                recipient: inquiry.renter,
                inquiry: inquiry._id,
                listing: inquiry.listing?._id || inquiry.listing,
                title: "Your request was declined",
                message: `${inquiry.listing?.title || "Your request"} was declined by the owner.`,
            });
        }

        if (status === "Confirmed") {
            await createNotification({
                recipient: inquiry.renter,
                inquiry: inquiry._id,
                listing: inquiry.listing?._id || inquiry.listing,
                title: "Your request was confirmed",
                message: `${inquiry.listing?.title || "Your listing request"} is ready for agreement review.`,
            });
        }

        res.json({ message: "Inquiry status updated", status });
    } catch (err) {
        if (err.message === "Another renter is already confirmed for the selected dates") {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: err.message });
    }
};
