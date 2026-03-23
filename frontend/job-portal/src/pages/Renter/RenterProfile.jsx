import { useState } from "react";
import { FileText, Save, Upload, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import uploadImage from "../../utils/uploadImage";
import uploadFile from "../../utils/uploadFile";
import Navbar from "../../components/layout/Navbar";
import { Link, Navigate } from "react-router-dom";
import { ROUTES } from "../../utils/routePaths";
import { getInitials, validateBackgroundDocument } from "../../utils/helper";

const RenterProfile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    avatar: user?.avatar || "",
    backgroundCheckDocument: user?.backgroundCheckDocument || "",
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [saving, setSaving] = useState(false);
  const isUploading = uploadingAvatar || uploadingDocument;

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    handleInputChange("avatar", previewUrl);
    setUploadingAvatar(true);

    try {
      const imageUploadResponse = await uploadImage(file);
      handleInputChange("avatar", imageUploadResponse.imageUrl || previewUrl);
    } catch (error) {
      console.error("Image upload failed", error);
      toast.error("Failed to upload avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDocumentChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateBackgroundDocument(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploadingDocument(true);

    try {
      const fileUploadResponse = await uploadFile(file);
      handleInputChange("backgroundCheckDocument", fileUploadResponse.fileUrl || "");
      toast.success("Background check document uploaded.");
    } catch (error) {
      console.error("Document upload failed", error);
      toast.error("Failed to upload background check document.");
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await axiosInstance.put(
        API_PATHS.AUTH.UPDATE_PROFILE,
        formData,
      );

      if (response.status === 200) {
        updateUser(response.data);
        toast.success("Profile updated successfully.");
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      <Navbar />

      <div className="bg-gray-50 py-8 px-4 mt-16 lg:m-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6 flex justify-between items-center">
              <h1 className="text-xl font-medium text-white">Renter Profile</h1>
            </div>

            <div className="p-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {formData.avatar ? (
                      <img
                        src={formData.avatar}
                        alt="Avatar"
                        className="w-20 h-20 rounded-full object-cover border-4 border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full border-4 border-gray-200 bg-blue-100 flex items-center justify-center">
                        <span className="text-lg font-semibold text-blue-700">
                          {getInitials(formData.name || user?.name || "Renter")}
                        </span>
                      </div>
                    )}
                    {uploadingAvatar ? (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <label className="block">
                      <span className="sr-only">Choose avatar</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) => handleInputChange("name", event.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">
                        Background Check Document
                      </h2>
                      <p className="mt-1 text-sm text-gray-600">
                        Upload proof that you have no criminal record. Accepted formats: PDF or PNG.
                      </p>
                    </div>
                    {uploadingDocument ? (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mt-1"></div>
                    ) : (
                      <FileText className="w-5 h-5 text-slate-500 mt-1" />
                    )}
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Upload Document</span>
                      <input
                        type="file"
                        accept=".pdf,.png"
                        onChange={handleDocumentChange}
                        className="hidden"
                      />
                    </label>

                    {formData.backgroundCheckDocument ? (
                      <a
                        href={formData.backgroundCheckDocument}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        View uploaded document
                      </a>
                    ) : (
                      <span className="text-sm text-gray-500">No document uploaded yet.</span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Owners will see this profile information, including your uploaded background check document, when you send an inquiry.
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
                <Link
                  to={ROUTES.FIND_HOSTELS}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </Link>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || isUploading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{saving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenterProfile;
