const DEFAULT_TEMPLATE_FILENAME = "default-lease-template.docx";
const DEFAULT_TEMPLATE_NAME = "Default Template";

const buildUploadUrl = (req, filename) =>
    `/uploads/${filename}`;

const getDefaultLeaseTemplate = (req) => ({
    name: DEFAULT_TEMPLATE_NAME,
    url: buildUploadUrl(req, DEFAULT_TEMPLATE_FILENAME),
    content: "",
    isDefault: true,
});

const normalizeExistingLeaseTemplates = (user) => {
    const templates = Array.isArray(user?.leaseAgreementTemplates)
        ? user.leaseAgreementTemplates
        : [];

    if (templates.length > 0) {
        return templates
            .map((template) => ({
                _id: template._id,
                name: String(template.name || "").trim(),
                url: String(template.url || "").trim(),
                content: String(template.content || "").trim(),
                isDefault: Boolean(template.isDefault),
            }))
            .filter((template) => template.name && (template.url || template.content));
    }

    if (user?.leaseAgreementTemplate && user?.leaseAgreementTemplateName) {
        return [
            {
                name: String(user.leaseAgreementTemplateName).trim(),
                url: String(user.leaseAgreementTemplate).trim(),
                content: "",
                isDefault: false,
            },
        ];
    }

    return [];
};

const getOwnerLeaseTemplates = (user, req) => {
    const normalizedTemplates = normalizeExistingLeaseTemplates(user);

    if (normalizedTemplates.length > 0) {
        return normalizedTemplates;
    }

    return [getDefaultLeaseTemplate(req)];
};

module.exports = {
    DEFAULT_TEMPLATE_FILENAME,
    DEFAULT_TEMPLATE_NAME,
    buildUploadUrl,
    getDefaultLeaseTemplate,
    getOwnerLeaseTemplates,
    normalizeExistingLeaseTemplates,
};
