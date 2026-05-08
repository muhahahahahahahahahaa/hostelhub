import { ChevronDown, Save, Trash2, X } from "lucide-react"
import { Link } from "react-router-dom";
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getInitials } from "../../utils/helper";
import { ROUTES } from "../../utils/routePaths";
import { usePreferences } from "../../context/PreferencesContext";


const EditOwnerProfile = ({
  formData,
  handleImageChange,
  handleInputChange,
  handleRemoveTemplate,
  handleSave,
  handleCancel,
  saving,
  uploading,
}) => {
  const { t } = usePreferences();

  return (
    <DashboardLayout activeMenu='owner-profile'>
      {formData && 
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/*header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
                <h1 className="text-lg md:text-xl font-medium text-white">{t("editOwnerProfile")}</h1>
              </div>
              
              {/*edit form */}
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/*personal information */}
                  <div className="space-y-6">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2">
                      {t("personalInfo")}
                    </h2>

                    {/*Avatar Upload */}
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {formData?.avatar ? (
                          <img
                            src={formData?.avatar}
                            alt={t("profileImage")}
                            className="w-20 h-20 rounded-full object-cover border-4 border-gray-200"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full border-4 border-gray-200 bg-blue-100 flex items-center justify-center">
                            <span className="text-lg font-semibold text-blue-700">
                              {getInitials(formData?.name || t("ownerFallback"))}
                            </span>
                          </div>
                        )}
                        {uploading?.avatar && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block">
                          <span className="sr-only">{t("profileImage")}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, "avatar")}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                          />
                        </label>
                      </div>
                    </div>

                    {/*name input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("fullName")}
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder={t("fullName")}
                      />
                    </div>

                    {/*email (read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("emailAddress")}
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>

                    <details className="rounded-xl border border-gray-200 bg-white">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-gray-700">
                        <span>{t("savedTemplates")}</span>
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      </summary>
                      <div className="border-t border-gray-200 px-4 py-4">
                        {formData.leaseAgreementTemplates?.length ? (
                          <div className="space-y-3">
                            {formData.leaseAgreementTemplates.map((template, index) => (
                              <div
                                key={`${template.url || template.content || template.name}-${index}`}
                                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-gray-900">
                                    {template.name}
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <Link
                                    to={ROUTES.OWNER_TEMPLATE_CLAUSES(encodeURIComponent(template.name))}
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-white transition-colors"
                                  >
                                    {t("editTemplate")}
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      handleRemoveTemplate(index);
                                    }}
                                    disabled={(formData.leaseAgreementTemplates || []).length <= 1}
                                    aria-label={`Delete ${template.name}`}
                                    className="rounded-lg border border-rose-200 p-2 text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            {t("noTemplatesYet")}
                          </p>
                        )}
                      </div>
                    </details>
                  </div>

                  {/*company information */}
                  <div className="space-y-6">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2">
                      {t("hostelInfo")}
                    </h2>

                    {/*hostel logo upload */}
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {formData.hostelLogo ? (
                          <img
                            src={formData.hostelLogo}
                            alt={t("hostelLogo")}
                            className="w-20 h-20 rounded-lg object-cover border-4 border-gray-200"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-lg border-4 border-gray-200 bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-700">{t("listing")}</span>
                          </div>
                        )}
                        {uploading.logo && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block">
                          <span className="sr-only">{t("hostelLogo")}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, "logo")}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition-colors"
                          />
                        </label>
                      </div>
                    </div>

                    {/*hostel name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("hostelName")}
                      </label>
                      <input
                        type="text"
                        value={formData.hostelName}
                        onChange={(e) =>
                          handleInputChange("hostelName", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder={t("hostelName")}
                      />
                    </div>

                    {/*hostel description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("hostelDescription")}
                      </label>
                      <textarea
                        value={formData.hostelDescription}
                        onChange={(e) =>
                          handleInputChange(
                            "hostelDescription",
                            e.target.value
                          )
                        }
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        placeholder={t("hostelDescription")}
                      />
                    </div>

                    <Link
                      to={ROUTES.OWNER_TEMPLATE_NEW}
                      className="inline-flex w-fit rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                      {t("addNewTemplate")}
                    </Link>

                  </div>
                </div>

                {/*action buttons */}
                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>{t("cancel")}</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || uploading.avatar || uploading.logo}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{saving ? t("saving") : t("saveChanges")}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </DashboardLayout>
  )
}

export default EditOwnerProfile; 
