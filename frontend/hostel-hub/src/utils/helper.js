
export const validateEmail = (email) =>{
    if (!email.trim()) return "Please enter your email address.";
    const emailRedex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRedex.test(email)) return "Please enter a valid email address.";
    return "";
};
export const validatePassword = (password) =>{
    if (!password) return "Please enter your password.";
    if (password.length < 8) return "Password must be at least 8 characters long.";
    if (!/(?=.*[a-z])/.test(password))
        return "Password must include at least one lowercase letter.";
    if (!/(?=.*[A-Z])/.test(password))
        return "Password must include at least one uppercase letter.";
    if (!/(?=.*\d)/.test(password))
        return "Password must include at least one number.";
    return "";
};
export const validateAvatar = (file) =>{
    if (!file) return"";// avatar is optional
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)){
        return "Avatar must be a JPEG or PNG image.";
    }
    const maxSizeInBytes = 5 * 1024 * 1024; //5MB
    if (file.size > maxSizeInBytes){
        return "Avatar must be smaller than 5MB.";
    }
    return "";
}

export const validateBackgroundDocument = (file) => {
    if (!file) return "";

    const allowedTypes = ["application/pdf", "image/png"];
    if (!allowedTypes.includes(file.type)) {
        return "Document must be a PDF or PNG file.";
    }

    const maxSizeInBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
        return "Document must be smaller than 10MB.";
    }
    return "";
}

export const validateLeaseAgreementTemplate = (file) => {
    if (!file) return "";

    const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
        return "Document must be a DOCX file.";
    }

    const maxSizeInBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
        return "Document must be smaller than 10MB.";
    }

    return "";
};

export const getInitials = (name)=> {
    return name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2)
}

export const formatCurrency = (value) => {
    if (value === undefined || value === null || value === "") {
        return "Negotiable";
    }

    return `${Number(value).toLocaleString()}₮`;
};

export const formatCompactCurrency = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "Negotiable";
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(amount >= 10000000 ? 0 : 1)}M₮`;
    }
    if (amount >= 1000) {
        return `${(amount / 1000).toFixed(amount >= 100000 ? 0 : 1)}k₮`;
    }
    return `${amount}₮`;
};

export const getRoleLabel = (role) => (
    role === "owner" ? "Owner" : "Renter"
);

export const resolveAssetUrl = (value) => {
    const normalizedValue = String(value || "").trim();
    if (!normalizedValue) return "";

    if (normalizedValue.startsWith("/uploads/")) {
        return normalizedValue;
    }

    try {
        const parsedUrl = new URL(normalizedValue);
        if (parsedUrl.pathname.startsWith("/uploads/")) {
            return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
        }
    } catch {
        return normalizedValue;
    }

    return normalizedValue;
};

export const normalizeAssetUrls = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => normalizeAssetUrls(item));
    }

    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value).map(([key, itemValue]) => [key, normalizeAssetUrls(itemValue)])
        );
    }

    if (typeof value === "string") {
        return resolveAssetUrl(value);
    }

    return value;
};
