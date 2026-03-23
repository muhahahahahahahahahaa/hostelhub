import { API_PATHS } from "./apiPaths";
import axiosInstance from "./axiosInstance";

const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await axiosInstance.post(API_PATHS.FILE.UPLOAD_FILE, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error uploading the file:", error);
        throw error;
    }
};

export default uploadFile;
