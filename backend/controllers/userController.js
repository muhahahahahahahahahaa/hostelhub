const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const User = require("../models/User");
const { getOwnerLeaseTemplates } = require("../utils/leaseTemplates");
const execFileAsync = promisify(execFile);

const TEMPLATE_PREVIEW_DIR = path.join(__dirname, "..", "uploads", "template-previews");

const ensureTemplatePreviewDir = async () => {
    await fs.promises.mkdir(TEMPLATE_PREVIEW_DIR, { recursive: true });
};

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

const normalizeHeadingText = (value = "") =>
    String(value)
        .toLowerCase()
        .replace(/[.,:;!?]/g, "")
        .replace(/\s+/g, " ")
        .trim();

const escapeHtml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

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

const buildSectionPreviewDocx = async ({ sourcePath, sections }) => {
    const previewId = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
    const workingDir = path.join(TEMPLATE_PREVIEW_DIR, `docx-preview-${previewId}`);
    await fs.promises.mkdir(workingDir, { recursive: true });

    try {
        await execFileAsync("unzip", ["-q", sourcePath, "-d", workingDir]);

        const documentXmlPath = path.join(workingDir, "word", "document.xml");
        const originalXml = await fs.promises.readFile(documentXmlPath, "utf8");
        const sectionPropertiesIndex = originalXml.lastIndexOf("<w:sectPr");

        if (sectionPropertiesIndex === -1) {
            throw new Error("Template structure is invalid");
        }

        const bodyOpenTag = "<w:body>";
        const bodyStartIndex = originalXml.indexOf(bodyOpenTag);

        if (bodyStartIndex === -1) {
            throw new Error("Template body was not found");
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

        if (headingIndexes.length === 0) {
            throw new Error("The editable sections were not found in the template");
        }

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

        const generatedDocxFilename = `section-preview-${previewId}.docx`;
        const generatedDocxPath = path.join(TEMPLATE_PREVIEW_DIR, generatedDocxFilename);

        await execFileAsync("zip", ["-qr", generatedDocxPath, "."], { cwd: workingDir });

        return {
            previewId,
            generatedDocxPath,
            generatedPdfPath: path.join(TEMPLATE_PREVIEW_DIR, `section-preview-${previewId}.pdf`),
        };
    } finally {
        await fs.promises.rm(workingDir, { recursive: true, force: true });
    }
};

const buildDraftPreviewHtml = (title, content) => {
    const htmlLines = String(content || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join("");

    return `<!doctype html>
<html lang="mn">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      @page { size: A4; margin: 28mm 22mm; }
      body {
        font-family: Arial, sans-serif;
        color: #111827;
        font-size: 13pt;
        line-height: 1.65;
      }
      h1 {
        text-align: center;
        margin: 0 0 24px;
        font-size: 18pt;
        letter-spacing: 0.08em;
      }
      p {
        margin: 0 0 10px;
        text-align: justify;
      }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    ${htmlLines}
  </body>
</html>`;
};

exports.updateProfile = async (req, res) => {
    try {
        const {
            name,
            avatar,
            backgroundCheckDocument,
            leaseAgreementTemplates,
            hostelName,
            hostelDescription,
            hostelLogo,
        } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.name = name || user.name;
        user.avatar = avatar || user.avatar;

        if (user.role === "renter") {
            user.backgroundCheckDocument =
                backgroundCheckDocument || user.backgroundCheckDocument;
        }

        if (user.role === "owner") {
            user.hostelName = hostelName || user.hostelName;
            user.hostelDescription = hostelDescription || user.hostelDescription;
            user.hostelLogo = hostelLogo || user.hostelLogo;

            if (Array.isArray(leaseAgreementTemplates)) {
                const sanitizedTemplates = leaseAgreementTemplates.map((template) => ({
                    name: String(template?.name || "").trim(),
                    url: String(template?.url || "").trim(),
                    content: String(template?.content || "").trim(),
                    isDefault: Boolean(template?.isDefault),
                }));

                if (sanitizedTemplates.length === 0) {
                    return res.status(400).json({
                        message: "At least one template is required",
                    });
                }

                const hasInvalidTemplate = sanitizedTemplates.some(
                    (template) => !template.name || (!template.url && !template.content)
                );

                if (hasInvalidTemplate) {
                    return res.status(400).json({
                        message:
                            "Each template must have a name and either a file or contract clauses",
                    });
                }

                const normalizedNames = sanitizedTemplates.map((template) =>
                    template.name.toLowerCase()
                );
                const hasDuplicateNames = normalizedNames.length !== new Set(normalizedNames).size;

                if (hasDuplicateNames) {
                    return res.status(400).json({
                        message: "Template names must be unique",
                    });
                }

                user.leaseAgreementTemplates = sanitizedTemplates;
                user.leaseAgreementTemplate = sanitizedTemplates[0]?.url || "";
                user.leaseAgreementTemplateName = sanitizedTemplates[0]?.name || "";
            }
        }

        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            backgroundCheckDocument: user.backgroundCheckDocument || "",
            leaseAgreementTemplates: getOwnerLeaseTemplates(user, req),
            hostelName: user.hostelName || "",
            hostelDescription: user.hostelDescription || "",
            hostelLogo: user.hostelLogo || "",
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getPublicProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getTemplatePreview = async (req, res) => {
    try {
        if (req.user?.role !== "owner") {
            return res.status(403).json({ message: "Only owners can preview templates" });
        }

        const templateName = decodeURIComponent(req.params.templateName || "");
        const templates = getOwnerLeaseTemplates(req.user, req);
        const selectedTemplate = templates.find((template) => template.name === templateName);

        if (!selectedTemplate?.url) {
            return res.status(404).json({ message: "Template file not found" });
        }

        const uploadFilename = getUploadFilenameFromUrl(selectedTemplate.url, req);

        if (!uploadFilename) {
            return res.status(400).json({ message: "Template file URL is invalid" });
        }

        const sourcePath = path.join(__dirname, "..", "uploads", uploadFilename);
        const sourceExists = await fs.promises
            .access(sourcePath, fs.constants.F_OK)
            .then(() => true)
            .catch(() => false);

        if (!sourceExists) {
            return res.status(404).json({ message: "Source template file does not exist" });
        }

        await ensureTemplatePreviewDir();

        const safePreviewBaseName = `${req.user._id}-${templateName}`
            .replace(/[^a-zA-Z0-9-_]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
            .toLowerCase();
        const previewFilename = `${safePreviewBaseName || "template-preview"}.pdf`;
        const previewPath = path.join(TEMPLATE_PREVIEW_DIR, previewFilename);

        const [sourceStat, previewStat] = await Promise.all([
            fs.promises.stat(sourcePath),
            fs.promises.stat(previewPath).catch(() => null),
        ]);

        const shouldRegenerate =
            !previewStat || sourceStat.mtimeMs > previewStat.mtimeMs;

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
    } catch (err) {
        return res.status(500).json({ message: err.message || "Failed to preview template" });
    }
};

exports.getDraftTemplatePreview = async (req, res) => {
    try {
        if (req.user?.role !== "owner") {
            return res.status(403).json({ message: "Only owners can preview templates" });
        }

        const title = String(req.body?.title || "").trim() || "Lease Agreement Template";
        const content = String(req.body?.content || "").trim();

        if (!content) {
            return res.status(400).json({ message: "Preview content is required" });
        }

        await ensureTemplatePreviewDir();

        const safePreviewBaseName = `${req.user._id}-${title}-draft`
            .replace(/[^a-zA-Z0-9-_]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
            .toLowerCase();
        const htmlFilename = `${safePreviewBaseName || "template-draft"}.html`;
        const pdfFilename = `${safePreviewBaseName || "template-draft"}.pdf`;
        const htmlPath = path.join(TEMPLATE_PREVIEW_DIR, htmlFilename);
        const pdfPath = path.join(TEMPLATE_PREVIEW_DIR, pdfFilename);

        await fs.promises.writeFile(htmlPath, buildDraftPreviewHtml(title, content), "utf8");

        await execFileAsync("libreoffice", [
            "--headless",
            "--convert-to",
            "pdf",
            "--outdir",
            TEMPLATE_PREVIEW_DIR,
            htmlPath,
        ]);

        const generatedPreviewPath = path.join(
            TEMPLATE_PREVIEW_DIR,
            `${path.parse(htmlPath).name}.pdf`
        );

        if (generatedPreviewPath !== pdfPath) {
            await fs.promises.rename(generatedPreviewPath, pdfPath);
        }

        return res.json({
            previewUrl: buildTemplatePreviewUrl(req, pdfFilename),
        });
    } catch (err) {
        return res.status(500).json({ message: err.message || "Failed to generate preview" });
    }
};

exports.getSectionTemplatePreview = async (req, res) => {
    try {
        if (req.user?.role !== "owner") {
            return res.status(403).json({ message: "Only owners can preview templates" });
        }

        const templateName = decodeURIComponent(req.params.templateName || "");
        const templates = getOwnerLeaseTemplates(req.user, req);
        const selectedTemplate = templates.find((template) => template.name === templateName);

        if (!selectedTemplate?.url) {
            return res.status(400).json({ message: "This template does not have a source file" });
        }

        const sections = Array.isArray(req.body?.sections) ? req.body.sections : [];

        if (sections.length === 0) {
            return res.status(400).json({ message: "Preview sections are required" });
        }

        const uploadFilename = getUploadFilenameFromUrl(selectedTemplate.url, req);

        if (!uploadFilename) {
            return res.status(400).json({ message: "Template file URL is invalid" });
        }

        const sourcePath = path.join(__dirname, "..", "uploads", uploadFilename);
        await fs.promises.access(sourcePath, fs.constants.F_OK);
        await ensureTemplatePreviewDir();

        const { generatedDocxPath, generatedPdfPath, previewId } = await buildSectionPreviewDocx({
            sourcePath,
            sections,
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
                previewId,
            });
        } finally {
            await fs.promises.rm(generatedDocxPath, { force: true });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message || "Failed to generate preview" });
    }
};
