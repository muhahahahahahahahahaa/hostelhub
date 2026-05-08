import { useState } from 'react';
import { Building2, FileText, Mail, Edit3, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';
import uploadImage from '../../utils/uploadImage';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EditOwnerProfile from './EditOwnerProfile';
import { getInitials } from '../../utils/helper';
import { ROUTES } from '../../utils/routePaths';
import { usePreferences } from '../../context/PreferencesContext';

const normalizeTemplateName = (value) => value.trim().toLowerCase();

const OwnerProfilePage = () => {

  const { user, updateUser } = useAuth();
  const { t, language } = usePreferences();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    avatar: user?.avatar || "",
    hostelName: user?.hostelName || "",
    hostelDescription: user?.hostelDescription || "",
    hostelLogo: user?.hostelLogo || "",
    leaseAgreementTemplates: user?.leaseAgreementTemplates || [],
  });

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ ...profileData});
  const [uploading, setUploading] = useState({ avatar:false, logo: false });
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRemoveTemplate = (templateIndex) => {
    setFormData((prev) => {
      const currentTemplates = prev.leaseAgreementTemplates || [];

      if (currentTemplates.length <= 1) {
        toast.error(language === "en" ? "At least one lease template is required." : "Дор хаяж нэг гэрээний загвар шаардлагатай.");
        return prev;
      }

      return {
        ...prev,
        leaseAgreementTemplates: currentTemplates.filter(
          (_, currentIndex) => currentIndex !== templateIndex,
        ),
      };
    });
  };

  const handleImageUpload = async (file, type) => {
    setUploading((prev) => ({ ...prev, [type]: true}));

    try {
      const imgUploadRes = await uploadImage(file);
      const avatarUrl = imgUploadRes.imageUrl || "";

      const field = type === "avatar" ? "avatar" : "hostelLogo";
      handleInputChange(field, avatarUrl);
    } catch (error) {
      console.error("Image upload failed:", error)
    } finally {
      setUploading((prev) => ({...prev, [type]: false}))
    }
  };

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file){
      const previewUrl = URL.createObjectURL(file);
      const field = type === "avatar" ? "avatar" : "hostelLogo"
      handleInputChange(field, previewUrl);

      handleImageUpload(file, type);
    }
  };

  const handleSave = async () => {
    if ((formData.leaseAgreementTemplates || []).length === 0) {
      toast.error(language === "en" ? "At least one lease template is required." : "Дор хаяж нэг гэрээний загвар шаардлагатай.");
      return;
    }

    const hasBlankTemplateName = (formData.leaseAgreementTemplates || []).some(
      (template) => !template.name?.trim() || (!template.url && !template.content?.trim()),
    );

    if (hasBlankTemplateName) {
      toast.error(language === "en" ? "Each lease template must have a name and either a file or clauses." : "Гэрээний загвар бүр нэртэй, мөн файл эсвэл гэрээний заалттай байх ёстой.");
      return;
    }

    const normalizedNames = (formData.leaseAgreementTemplates || [])
      .map((template) => normalizeTemplateName(template.name || ""))
      .filter(Boolean);

    if (normalizedNames.length !== new Set(normalizedNames).size) {
      toast.error(language === "en" ? "Lease template names must be unique." : "Гэрээний загварын нэр давхцахгүй байх ёстой.");
      return;
    }

    setSaving(true);

    try {
      const response = await axiosInstance.put(
        API_PATHS.AUTH.UPDATE_PROFILE,
        formData
      );
      if (response.status === 200){
        toast.success(language === "en" ? "Profile updated successfully." : "Профайлын мэдээлэл амжилттай шинэчлэгдлээ")
        setProfileData(response.data);
        updateUser(response.data)
        setEditMode(false);
      }
    } catch (error) {
      console.error("profile update failed", error);
    } finally {
      setSaving(false)
    }
  };

  const handleCancel = () => {
    setFormData({ ...profileData});
    setEditMode(false);
  };

  if (editMode) {
    return (
      <EditOwnerProfile
        formData={formData}
        handleImageChange={handleImageChange}
        handleInputChange={handleInputChange}
        handleRemoveTemplate={handleRemoveTemplate}
        handleSave = {handleSave}
        handleCancel={handleCancel}
        saving={saving}
        uploading={uploading}
      />
    )
  }
  return (
    <DashboardLayout activeMenu='owner-profile'>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/*header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6 flex justify-between items-center">
                <h1 className="text-xl font-medium text-white">
                {t("ownerProfileTitle")}
              </h1>
              <button
                onClick={() => setEditMode(true)}
                className="bg-white/10 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>{t("editProfile")}</span>
              </button>
            </div>

            {/*profile content */}
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/*personal information */}
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    {t("personalInfo")}
                  </h2>

                  {/*avatar and name  */}
                  <div className="flex items-center space-x-4">
                    {profileData.avatar ? (
                      <img
                        src={profileData.avatar}
                        alt={t("profileImage")}
                        className="w-20 h-20 rounded-full object-cover border-4 border-blue-50"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full border-4 border-blue-50 bg-blue-100 flex items-center justify-center">
                        <span className="text-lg font-semibold text-blue-700">
                          {getInitials(profileData.name || t("ownerFallback"))}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {profileData.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Mail className="w-4 h-4 mr-2" />
                        <span>{profileData.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/*company information */}
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    {t("hostelInfo")}
                  </h2>

                  {/*hostel logo and name */}
                  <div className="flex items-center space-x-4">
                    {profileData.hostelLogo ? (
                      <img
                        src={profileData.hostelLogo}
                        alt={t("hostelLogo")}
                        className="w-20 h-20 rounded-lg object-cover border-4 border-blue-50"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg border-4 border-blue-50 bg-blue-100 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-blue-700" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {profileData.hostelName || t("hostelName")}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Building2 className="w-4 h-4 mr-2" />
                        <span>{t("hostelIntro")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/*hostel description */}
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-6">
                  {t("aboutHostel")}
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-lg">
                  {profileData.hostelDescription || t("noHostelDescription")}
                </p>
              </div>

              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-6">
                  {t("leaseTemplates")}
                </h2>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                  {profileData.leaseAgreementTemplates?.length ? (
                    <div className="space-y-4">
                      {profileData.leaseAgreementTemplates.map((template, index) => (
                        <div
                          key={`${template.url || template.content || template.name}-${index}`}
                          className="rounded-lg border border-gray-200 bg-white px-4 py-3"
                        >
                          <p className="text-sm font-semibold text-gray-900">{template.name}</p>
                          {template.url ? (
                            <a
                              href={template.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                              <FileText className="h-4 w-4" />
                              <span>{t("openDocxTemplate")}</span>
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() =>
                              navigate(ROUTES.OWNER_TEMPLATE_VIEW(encodeURIComponent(template.name)))
                            }
                            className="mt-3 inline-flex rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            {t("viewTemplate")}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {t("noLeaseTemplates")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default OwnerProfilePage; 
