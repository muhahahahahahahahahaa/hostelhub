import axios from "axios";
import { BASE_URL } from "./apiPaths";
import { normalizeAssetUrls } from "./helper";

const axiosInstance = axios.create({
    baseURL: BASE_URL || undefined,
    timeout: 80000,
    headers:{
        "Content-type":"application/json",
        Accept: "application/json",
    },
});

//request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem("token");
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// response interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        if (response?.data) {
            response.data = normalizeAssetUrls(response.data);
        }
        return response;
    },
    (error) => {
        // handle common errors globally
        if(error.response){
            const responseMessage = String(
                error.response.data?.message || error.response.data?.error || ""
            ).toLowerCase();

            const isAuthTokenError =
                error.response.status === 401 &&
                (responseMessage.includes("token failed") ||
                    responseMessage.includes("not authorized, no token") ||
                    responseMessage.includes("jwt"));

            if(isAuthTokenError){
                // redirect to login page only for actual auth/session failures
                window.location.href = "/";
            } else if ( error.response.status === 500) {
                console.error("server error. please try again later");
            }
        } else if (error.code === "ECONNABORTED"){
            console.error("Request timeout. please try again");
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
