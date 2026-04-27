const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const Listing = require("../models/Listing");
const Inquiry = require("../models/Inquiry");
const SavedListing = require("../models/SavedListing");
const Chat = require("../models/Chat");
const User = require("../models/User");
const { getOwnerLeaseTemplates } = require("../utils/leaseTemplates");
const execFileAsync = promisify(execFile);
const TEMPLATE_PREVIEW_DIR = path.join(__dirname, "..", "uploads", "template-previews");

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

const attachDailyRent = (listing = {}) => ({
    ...listing,
    dailyRent: listing.dailyRent ?? listing.monthlyRent ?? null,
});

const SECTION_HEADINGS = {
    4: ["Түрээслүүлэгчийн эрх, үүрэг", "Түрээслүүлэгчийн эрх үүрэг"],
    5: ["Түрээслэгчийн эрх, үүрэг", "Түрээслэгчийн эрх үүрэг"],
    6: ["Талуудын хүлээх хариуцлага.", "Талуудын хүлээх хариуцлага"],
    7: ["Гэрээ цуцлах"],
    8: ["Бусад"],
};

const TRAILING_BOUNDARY_HEADINGS = ["Талууд"];

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

const applyStaticDurationPlaceholderParagraphs = (paragraphs = []) =>
    paragraphs.map((paragraph) => {
        const normalizedText = normalizeHeadingText(extractParagraphText(paragraph));

        if (
            normalizedText.includes(normalizeHeadingText("энэхүү гэрээ нь")) &&
            normalizedText.includes(normalizeHeadingText("өдрөөс")) &&
            normalizedText.includes(normalizeHeadingText("хугацаатай"))
        ) {
            return buildParagraphFromTemplate(
                paragraph,
                "Энэхүү Гэрээ нь 202_ оны ___ дугаар сарын ___-ний өдрөөс ____ оны __ дугаар сарын __-ны өдрийг дуустал ___ өдөр хугацаатай байна."
            );
        }

        if (
            normalizedText.includes(normalizeHeadingText("түрээсийн төлбөр нь сарын")) &&
            normalizedText.includes(normalizeHeadingText("бодож авах"))
        ) {
            return buildParagraphFromTemplate(
                paragraph,
                "Түрээсийн төлбөр нь сарын ______________ төгрөг байна. Түрээсийн төлбөрийг __ өдөрөөр нь бодож авах ба Түрээслэгч нь нийт __________ (_______________) төгрөгийг төлнө. Түрээслэгч сар бүрийн ашиглалтыг төлбөрийг хариуцна."
            );
        }

        return paragraph;
    });

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

const buildSectionPreviewDocx = async ({ sourcePath, sections }) => {
    const previewId = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
    const workingDir = path.join(TEMPLATE_PREVIEW_DIR, `listing-docx-preview-${previewId}`);
    await fs.promises.mkdir(workingDir, { recursive: true });

    try {
        await execFileAsync("unzip", ["-q", sourcePath, "-d", workingDir]);

        const documentXmlPath = path.join(workingDir, "word", "document.xml");
        const originalXml = await fs.promises.readFile(documentXmlPath, "utf8");
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

        const updatedParagraphs = [...paragraphs];

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

        const normalizedParagraphs = applyStaticDurationPlaceholderParagraphs(updatedParagraphs);

        const updatedXml =
            originalXml.slice(0, bodyContentStart) +
            normalizedParagraphs.join("") +
            originalXml.slice(sectionPropertiesIndex);

        await fs.promises.writeFile(documentXmlPath, updatedXml, "utf8");

        const generatedDocxFilename = `listing-section-preview-${previewId}.docx`;
        const generatedDocxPath = path.join(TEMPLATE_PREVIEW_DIR, generatedDocxFilename);

        await execFileAsync("zip", ["-qr", generatedDocxPath, "."], { cwd: workingDir });

        return {
            generatedDocxPath,
            generatedPdfPath: path.join(
                TEMPLATE_PREVIEW_DIR,
                `listing-section-preview-${previewId}.pdf`
            ),
        };
    } finally {
        await fs.promises.rm(workingDir, { recursive: true, force: true });
    }
};

const normalizeListingPayload = (payload = {}) => {
    const normalizeNumber = (value) => {
        if (value === "" || value === undefined || value === null) return undefined;
        const parsed = Number(value);
        return Number.isNaN(parsed) ? undefined : parsed;
    };

    const normalizeDate = (value) => {
        if (value === "" || value === undefined || value === null) return null;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    };

    const normalizeAmenities = (value) => {
        if (Array.isArray(value)) {
            return value.map((item) => String(item).trim()).filter(Boolean);
        }
        if (typeof value === "string") {
            return value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
        }
        return [];
    };

    const normalizeImages = (value) => {
        if (Array.isArray(value)) {
            return value.map((item) => String(item).trim()).filter(Boolean);
        }
        if (typeof value === "string") {
            return value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
        }
        return [];
    };

    return {
        title: payload.title?.trim(),
        description: payload.description?.trim(),
        houseRules: (payload.houseRules ?? payload.requirements)?.trim(),
        location: payload.location?.trim(),
        category: payload.category,
        roomType: payload.roomType ?? payload.type,
        monthlyRent: normalizeNumber(payload.dailyRent ?? payload.monthlyRent ?? payload.salaryMin),
        deposit: normalizeNumber(payload.deposit ?? payload.salaryMax),
        availableFrom: normalizeDate(payload.availableFrom),
        availableUntil: normalizeDate(payload.availableUntil),
        availableBeds: normalizeNumber(payload.availableBeds),
        amenities: normalizeAmenities(payload.amenities),
        ...(payload.images !== undefined ? { images: normalizeImages(payload.images) } : {}),
        leaseTemplateName: payload.leaseTemplateName?.trim(),
        leaseTemplateUrl: payload.leaseTemplateUrl?.trim(),
        leaseTemplateContent: payload.leaseTemplateContent?.trim(),
        ...(payload.isClosed !== undefined ? { isClosed: Boolean(payload.isClosed) } : {}),
    };
};

const getSelectedLeaseTemplate = (user, payload, req) => {
    const availableTemplates = getOwnerLeaseTemplates(user, req);
    const requestedName = String(payload?.leaseTemplateName || "").trim();
    const requestedUrl = String(payload?.leaseTemplateUrl || "").trim();
    const requestedContent = String(payload?.leaseTemplateContent || "").trim();
    const pickTemplateFields = (template = {}) => ({
        leaseTemplateName: String(template.name || "").trim(),
        leaseTemplateUrl: String(template.url || "").trim(),
        leaseTemplateContent: String(template.content || "").trim(),
    });

    if (!requestedName && !requestedUrl && !requestedContent) {
        return pickTemplateFields(availableTemplates[0]);
    }

    const matchedTemplate = availableTemplates.find(
        (template) =>
            template.name === requestedName &&
            template.url === requestedUrl &&
            String(template.content || "") === requestedContent
    );

    return pickTemplateFields(matchedTemplate || availableTemplates[0]);
};

exports.createListing = async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Only owners can post listings" });
        }

        const listing = await Listing.create({
            ...normalizeListingPayload(req.body),
            ...getSelectedLeaseTemplate(req.user, req.body, req),
            owner: req.user._id,
        });

        res.status(201).json(attachDailyRent(listing.toObject()));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getListings = async (req, res) => {
    const {
        keyword,
        location,
        category,
        roomType,
        type,
        minRent,
        maxRent,
        minSalary,
        maxSalary,
        requestedFrom,
        requestedTo,
        renterId,
        userId,
    } = req.query;

    const selectedRoomType = roomType || type;
    const selectedMinRent = minRent || minSalary;
    const selectedMaxRent = maxRent || maxSalary;
    const currentRenterId = renterId || userId;

    const query = { isClosed: false };
    const andConditions = [];

    if (keyword) {
        query.$or = [
            { title: { $regex: keyword, $options: "i" } },
            { description: { $regex: keyword, $options: "i" } },
            { amenities: { $regex: keyword, $options: "i" } },
        ];
    }

    if (location) {
        query.location = { $regex: location, $options: "i" };
    }

    if (category) {
        query.category = category;
    }
    if (selectedRoomType) {
        query.roomType = selectedRoomType;
    }

    if (selectedMinRent || selectedMaxRent) {
        query.monthlyRent = {};

        if (selectedMinRent) {
            query.monthlyRent.$gte = Number(selectedMinRent);
        }
        if (selectedMaxRent) {
            query.monthlyRent.$lte = Number(selectedMaxRent);
        }
        if (Object.keys(query.monthlyRent).length === 0) {
            delete query.monthlyRent;
        }
    }

    if (requestedFrom) {
        const parsedRequestedFrom = new Date(requestedFrom);
        if (!Number.isNaN(parsedRequestedFrom.getTime())) {
            andConditions.push({
                $or: [
                    { availableFrom: null },
                    { availableFrom: { $exists: false } },
                    { availableFrom: { $lte: parsedRequestedFrom } },
                ],
            });
        }
    }

    if (requestedTo) {
        const parsedRequestedTo = new Date(requestedTo);
        if (!Number.isNaN(parsedRequestedTo.getTime())) {
            andConditions.push({
                $or: [
                    { availableUntil: null },
                    { availableUntil: { $exists: false } },
                    { availableUntil: { $gte: parsedRequestedTo } },
                ],
            });
        }
    }

    if (andConditions.length > 0) {
        query.$and = andConditions;
    }

    try {
        const listings = await Listing.find(query).populate(
            "owner",
            "name hostelName hostelLogo"
        );

        let savedListingIds = [];
        let inquiryStatusMap = {};

        if (currentRenterId) {
            const savedListings = await SavedListing.find({
                renter: currentRenterId,
            }).select("listing");
            savedListingIds = savedListings.map((item) => String(item.listing));

            const inquiries = await Inquiry.find({
                renter: currentRenterId,
            }).select("listing status");
            inquiries.forEach((inquiry) => {
                inquiryStatusMap[String(inquiry.listing)] = inquiry.status;
            });
        }

        const listingsWithExtras = listings.map((listing) => {
            const listingId = String(listing._id);
            return attachDailyRent({
                ...listing.toObject(),
                isSaved: savedListingIds.includes(listingId),
                inquiryStatus: inquiryStatusMap[listingId] || null,
            });
        });

        res.json(listingsWithExtras);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getOwnerListings = async (req, res) => {
    try {
        const userId = req.user._id;
        const { role } = req.user;
        if (role !== "owner") {
            return res.status(403).json({ message: "Access denied" });
        }

        const listings = await Listing.find({ owner: userId })
            .populate("owner", "name hostelName hostelLogo")
            .lean();

        const listingsWithInquiryCounts = await Promise.all(
            listings.map(async (listing) => {
                const inquiryCount = await Inquiry.countDocuments({
                    listing: listing._id,
                });
                return {
                    ...listing,
                    dailyRent: listing.monthlyRent ?? null,
                    inquiryCount,
                };
            })
        );

        res.json(listingsWithInquiryCounts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getListingById = async (req, res) => {
    try {
        const currentRenterId = req.query.renterId || req.query.userId;
        const listing = await Listing.findById(req.params.id).populate(
            "owner",
            "name hostelName hostelLogo"
        );

        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        let inquiryStatus = null;

        if (currentRenterId) {
            const inquiry = await Inquiry.findOne({
                listing: listing._id,
                renter: currentRenterId,
            }).select("status");

            if (inquiry) {
                inquiryStatus = inquiry.status;
            }
        }

        res.json(attachDailyRent({
            ...listing.toObject(),
            inquiryStatus,
        }));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getListingTemplatePreview = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id).select(
            "owner leaseTemplateName leaseTemplateUrl leaseTemplateContent"
        );

        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        const owner = await User.findById(listing.owner);
        const availableTemplates = owner ? getOwnerLeaseTemplates(owner, req) : [];
        const previewSourceTemplate =
            availableTemplates.find(
                (template) =>
                    template.name === listing.leaseTemplateName && template.url
            ) ||
            availableTemplates.find((template) => template.isDefault && template.url) ||
            availableTemplates.find((template) => template.url) ||
            null;

        if (!previewSourceTemplate?.url) {
            return res.status(404).json({ message: "Template source file not found" });
        }

        const uploadFilename = getUploadFilenameFromUrl(previewSourceTemplate.url, req);

        if (!uploadFilename) {
            return res.status(400).json({ message: "Template source file URL is invalid" });
        }

        const sourcePath = path.join(__dirname, "..", "uploads", uploadFilename);
        await fs.promises.access(sourcePath, fs.constants.F_OK);
        await ensureTemplatePreviewDir();

        const savedSections = parseTemplateContentToSections(listing.leaseTemplateContent);

        if (savedSections.length === 0) {
            const previewFilename = `listing-template-${listing._id}.pdf`;
            const previewPath = path.join(TEMPLATE_PREVIEW_DIR, previewFilename);
            const [sourceStat, previewStat] = await Promise.all([
                fs.promises.stat(sourcePath),
                fs.promises.stat(previewPath).catch(() => null),
            ]);

            const shouldRegenerate = !previewStat || sourceStat.mtimeMs > previewStat.mtimeMs;

            if (shouldRegenerate) {
                await execFileAsync("libreoffice", [
                    "--headless",
                    "--convert-to",
                    "pdf",
                    "--outdir",
                    TEMPLATE_PREVIEW_DIR,
                    sourcePath,
                ]);

                const generatedPreviewPath = path.join(
                    TEMPLATE_PREVIEW_DIR,
                    `${path.parse(sourcePath).name}.pdf`
                );

                if (generatedPreviewPath !== previewPath) {
                    await fs.promises.rename(generatedPreviewPath, previewPath);
                }
            }

            return res.json({
                previewUrl: buildTemplatePreviewUrl(req, previewFilename),
            });
        }

        const { generatedDocxPath, generatedPdfPath } = await buildSectionPreviewDocx({
            sourcePath,
            sections: savedSections,
        });

        try {
            await execFileAsync("libreoffice", [
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                TEMPLATE_PREVIEW_DIR,
                generatedDocxPath,
            ]);

            return res.json({
                previewUrl: buildTemplatePreviewUrl(req, path.basename(generatedPdfPath)),
            });
        } finally {
            await fs.promises.rm(generatedDocxPath, { force: true });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message || "Failed to preview template" });
    }
};

exports.updateListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        if (listing.owner.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: "Not authorized to update this listing" });
        }

        Object.assign(listing, normalizeListingPayload(req.body));
        Object.assign(listing, getSelectedLeaseTemplate(req.user, req.body, req));
        const updated = await listing.save();
        res.json(attachDailyRent(updated.toObject()));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        if (listing.owner.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: "Not authorized to delete this listing" });
        }

        await Inquiry.deleteMany({ listing: listing._id });
        await SavedListing.deleteMany({ listing: listing._id });
        await Chat.deleteMany({ listing: listing._id });
        await listing.deleteOne();

        res.json({ message: "Listing deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.toggleListingStatus = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        if (listing.owner.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: "Not authorized to update this listing" });
        }

        listing.isClosed = !listing.isClosed;
        await listing.save();

        res.json({
            message: listing.isClosed ? "Listing closed" : "Listing reopened",
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
