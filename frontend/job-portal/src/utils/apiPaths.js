export const BASE_URL = "http://localhost:8000";

export const API_PATHS = {
    AUTH: {
        REGISTER: "/api/auth/register",
        LOGIN: "/api/auth/login",
        GET_PROFILE: "/api/auth/me",
        UPDATE_PROFILE: "/api/user/profile",
    },

    DASHBOARD: {
        OVERVIEW: "/api/analytics/overview",
    },

    LISTINGS: {
        GET_ALL: "/api/listings",
        GET_BY_ID: (id) => `/api/listings/${id}`,
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
        UPDATE_STATUS: (id) => `/api/inquiries/${id}/status`,
    },

    IMAGE: {
        UPLOAD_IMAGE: "/api/auth/upload-image",
    },

    FILE: {
        UPLOAD_FILE: "/api/auth/upload-file",
    },
};
