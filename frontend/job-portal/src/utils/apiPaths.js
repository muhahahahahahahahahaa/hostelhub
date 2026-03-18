export const BASE_URL = "http://localhost:8000";

export const API_PATHS = {
    AUTH: {
        REGISTER: "/api/auth/register", //signup
        LOGIN: "/api/auth/login", //authenticate user && return jwt token
        GET_PROFILE: "/api/auth/profile", //get logged in user details
        UPDATE_PROFILE: "/api/user/profile", // update profile details
        DELETE_RESUME: "/api/user/resume", // delete resume details
    },

    DASHBOARD: {
        OVERVIEW: `/api/analytics/overview`,
    },

    JOBS: {
        GET_ALL_JOBS: '/api/jobs',
        GET_JOB_By_ID: (id) => `/api/jobs/${id}`,
        POST_JOB: "/api/jobs",
        GET_JOBS_EMPLOYER: "/api/jobs/get-jobs-employer",
        GET_JOB_BY_ID:(id) => `/api/jobs/${id}`,
        UPDATE_JOB:(id) => `/api/jobs/${id}`,
        TOGGLE_CLOSE: (id) => `/api/jobs/${id}/toggle-close`,
        DELETE_JOB:(id) => `/api/jobs/${id}`,

        SAVE_JOB: (id) => `/api/save-jobs/${id}`,  
        UNSAVE_JOB: (id) => `/api/save-jobs/${id}`, 
        GET_SAVED_JOB: '/api/save-jobs/my', 
    },

    APPLICATIONS: {
        APPLY_TO_JOB:(id) => `/api/applications/${id}`,
        GET_ALL_APPLICATIONS:(id) => `/api/applications/job/${id}`,
        UPDATE_STATUS: (id) => `/api/applications/${id}/status`,
    },

    IMAGE: {
        UPLOAD_IMAGE: "/api/auth/upload-image", //upload profile picture
    },
};