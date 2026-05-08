
export const validateEmail = (email) =>{
    if (!email.trim()) return "Имэйл хаягаа оруулна уу.";
    const emailRedex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRedex.test(email)) return "Зөв имэйл хаяг оруулна уу.";
    return "";
};
export const validatePassword = (password) =>{
    if (!password) return "Нууц үгээ оруулна уу.";
    if (password.length < 8) return "Нууц үг дор хаяж 8 тэмдэгттэй байх ёстой.";
    if (!/(?=.*[a-z])/.test(password))
        return "Нууц үг дор хаяж нэг жижиг үсэг агуулсан байх ёстой.";
    if (!/(?=.*[A-Z])/.test(password))
        return "Нууц үг дор хаяж нэг том үсэг агуулсан байх ёстой.";
    if (!/(?=.*\d)/.test(password))
        return "Нууц үг дор хаяж нэг тоо агуулсан байх ёстой.";
    return "";
};
export const validateAvatar = (file) =>{
    if (!file) return"";// avatar is optional
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)){
        return "Профайл зураг JPEG эсвэл PNG байх ёстой.";
    }
    const maxSizeInBytes = 5 * 1024 * 1024; //5MB
    if (file.size > maxSizeInBytes){
        return "Профайл зураг 5MB-аас бага байх ёстой.";
    }
    return "";
}

export const validateBackgroundDocument = (file) => {
    if (!file) return "";

    const allowedTypes = ["application/pdf", "image/png"];
    if (!allowedTypes.includes(file.type)) {
        return "Баримт PDF эсвэл PNG файл байх ёстой.";
    }

    const maxSizeInBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
        return "Баримт 10MB-аас бага байх ёстой.";
    }
    return "";
}

export const validateLeaseAgreementTemplate = (file) => {
    if (!file) return "";

    const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
        return "Баримт DOCX файл байх ёстой.";
    }

    const maxSizeInBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
        return "Баримт 10MB-аас бага байх ёстой.";
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
        return "Тохиролцоно";
    }

    return `${Number(value).toLocaleString()}₮`;
};

export const formatCompactCurrency = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "Тохиролцоно";
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(amount >= 10000000 ? 0 : 1)}M₮`;
    }
    if (amount >= 1000) {
        return `${(amount / 1000).toFixed(amount >= 100000 ? 0 : 1)}k₮`;
    }
    return `${amount}₮`;
};

export const getRoleLabel = (role) => (
    role === "owner" ? "Эзэмшигч" : "Түрээслэгч"
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
