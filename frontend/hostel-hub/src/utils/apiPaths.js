const normalizeBaseUrl = (value = "") => String(value || "").trim().replace(/\/+$/, "");

export const BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || "");

export const API_PATHS = {
    AUTH: {
        REGISTER: "/api/auth/register",
        LOGIN: "/api/auth/login",
        GET_PROFILE: "/api/auth/me",
        UPDATE_PROFILE: "/api/user/profile",
    },

    USER: {
        TEMPLATE_PREVIEW: (templateName) =>
            `/api/user/templates/${templateName}/preview`,
        TEMPLATE_DRAFT_PREVIEW: "/api/user/templates/preview-draft",
        TEMPLATE_SECTION_PREVIEW: (templateName) =>
            `/api/user/templates/${templateName}/section-preview`,
    },

    DASHBOARD: {
        OVERVIEW: "/api/analytics/overview",
        WITHDRAW: "/api/analytics/wallet/withdraw",
    },

    LISTINGS: {
        GET_ALL: "/api/listings",
        GET_BY_ID: (id) => `/api/listings/${id}`,
        TEMPLATE_PREVIEW: (id) => `/api/listings/${id}/template-preview`,
        CREATE: "/api/listings",
        GET_OWNER: "/api/listings/owner",
        UPDATE: (id) => `/api/listings/${id}`,
        TOGGLE_CLOSE: (id) => `/api/listings/${id}/toggle-close`,
        DELETE: (id) => `/api/listings/${id}`,
    },

    SAVED_LISTINGS: {
        SAVE: (id) => `/api/saved-listings/${id}`,
        UNSAVE: (id) => `/api/saved-listings/${id}`,
        GET_MINE: "/api/saved-listings/my",
    },

    INQUIRIES: {
        CREATE: (id) => `/api/inquiries/${id}`,
        GET_MINE: "/api/inquiries/my",
        GET_FOR_LISTING: (id) => `/api/inquiries/listing/${id}`,
        GET_BY_ID: (id) => `/api/inquiries/${id}`,
        AGREEMENT_PREVIEW: (id) => `/api/inquiries/${id}/agreement-preview`,
        ACCEPT_AGREEMENT: (id) => `/api/inquiries/${id}/accept-agreement`,
        CONFIRM_WITH_AGREEMENT: (id) => `/api/inquiries/${id}/confirm-with-agreement`,
        PAYMENT_INITIATE: (id) => `/api/inquiries/${id}/payment/initiate`,
        PAYMENT_STATUS: (id) => `/api/inquiries/${id}/payment/status`,
        UPDATE_STATUS: (id) => `/api/inquiries/${id}/status`,
    },

    CHATS: {
        GET_MINE: "/api/chats",
        ACCESS: "/api/chats/access",
        GET_BY_ID: (id) => `/api/chats/${id}`,
        SEND_FOR_LISTING: (id) => `/api/chats/listing/${id}/messages`,
        SEND_MESSAGE: (id) => `/api/chats/${id}/messages`,
    },

    NOTIFICATIONS: {
        GET_MINE: "/api/notifications",
        MARK_READ: (id) => `/api/notifications/${id}/read`,
        MARK_ALL_READ: "/api/notifications/read-all",
    },

    REVIEWS: {
        GET_FOR_LISTING: (id) => `/api/reviews/listing/${id}`,
        CREATE: (id) => `/api/reviews/listing/${id}`,
        UPDATE: (id) => `/api/reviews/${id}`,
    },

    IMAGE: {
        UPLOAD_IMAGE: "/api/auth/upload-image",
    },

    FILE: {
        UPLOAD_FILE: "/api/auth/upload-file",
    },
};
