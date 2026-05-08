import DashboardLayout from "../../components/layout/DashboardLayout";
import { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  Coins,
  FileText,
  Eye,
  House,
  ImagePlus,
  MapPin,
  Shield,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { API_PATHS } from "../../utils/apiPaths";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AMENITY_OPTIONS, CATEGORIES, ROOM_TYPES } from "../../utils/data";
import toast from "react-hot-toast";
import InputField from "../../components/Input/InputField";
import SelectField from "../../components/Input/SelectField";
import TextareaField from "../../components/Input/TextareaField";
import ListingPreview from "../../components/Cards/ListingPreview";
import { ROUTES } from "../../utils/routePaths";
import uploadImage from "../../utils/uploadImage";
import { useAuth } from "../../context/AuthContext";
import { usePreferences } from "../../context/PreferencesContext";

const INITIAL_FORM = {
  title: "",
  location: "",
  category: "",
  roomType: "",
  description: "",
  houseRules: "",
  dailyRent: "",
  deposit: "",
  availableFrom: "",
  availableUntil: "",
  availableBeds: "",
  amenities: [],
  images: [],
  leaseTemplateName: "",
  leaseTemplateUrl: "",
  leaseTemplateContent: "",
};

const parseTemplateContentToSections = (content = "") => {
  const lines = String(content || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const sections = [];
  let currentSection = null;

  lines.forEach((line) => {
    const sectionMatch = line.match(/^(\d+)\.\s+(.+)$/);
    const clauseMatch = line.match(/^(\d+)\.1\.(\d+)\s+(.+)$/);

    if (sectionMatch && !clauseMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }

      currentSection = {
        sectionNumber: sectionMatch[1],
        title: sectionMatch[2],
        items: [],
      };
      return;
    }

    if (clauseMatch && currentSection && currentSection.sectionNumber === clauseMatch[1]) {
      currentSection.items.push(clauseMatch[3]);
    }
  });

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
};

const ListingForm = () => {
  const { user } = useAuth();
  const { language, t } = usePreferences();
  const navigate = useNavigate();
  const location = useLocation();
  const listingId = location.state?.listingId || location.state?.jobId || null;
  const availableTemplates = useMemo(() => user?.leaseAgreementTemplates || [], [user]);

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isFetching, setIsFetching] = useState(Boolean(listingId));
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [templatePreviewUrl, setTemplatePreviewUrl] = useState("");
  const [isTemplatePreviewLoading, setIsTemplatePreviewLoading] = useState(false);
  const templatePreviewSource = useMemo(
    () =>
      availableTemplates.find(
        (template) => template.name === formData.leaseTemplateName && template.url,
      ) ||
      availableTemplates.find((template) => template.isDefault && template.url) ||
      availableTemplates.find((template) => template.url) ||
      null,
    [availableTemplates, formData.leaseTemplateName],
  );

  useEffect(() => {
    let isMounted = true;

    const fetchListingDetails = async () => {
      if (!listingId) {
        setIsFetching(false);
        return;
      }

      try {
        const response = await axiosInstance.get(API_PATHS.LISTINGS.GET_BY_ID(listingId));
        const listingData = response.data;

        if (isMounted && listingData) {
          setFormData({
            title: listingData.title || "",
            location: listingData.location || "",
            category: listingData.category || "",
            roomType: listingData.roomType || "",
            description: listingData.description || "",
            houseRules: listingData.houseRules || "",
            dailyRent: listingData.dailyRent || listingData.monthlyRent || "",
            deposit: listingData.deposit || "",
            availableFrom: listingData.availableFrom
              ? String(listingData.availableFrom).slice(0, 10)
              : "",
            availableUntil: listingData.availableUntil
              ? String(listingData.availableUntil).slice(0, 10)
              : "",
            availableBeds: listingData.availableBeds || "",
            amenities: listingData.amenities || [],
            images: listingData.images || [],
            leaseTemplateName: listingData.leaseTemplateName || "",
            leaseTemplateUrl: listingData.leaseTemplateUrl || "",
            leaseTemplateContent: listingData.leaseTemplateContent || "",
          });
        }
      } catch (error) {
        console.error("Error fetching listing details", error);
        toast.error(language === "en" ? "Failed to load listing details." : "Зарын мэдээлэл ачаалж чадсангүй.");
      } finally {
        if (isMounted) {
          setIsFetching(false);
        }
      }
    };

    fetchListingDetails();

    return () => {
      isMounted = false;
    };
  }, [language, listingId]);

  useEffect(() => {
    if (listingId || formData.leaseTemplateName || formData.leaseTemplateUrl) {
      return;
    }

    const defaultTemplate = availableTemplates[0];
    if (!defaultTemplate) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      leaseTemplateName: defaultTemplate.name,
      leaseTemplateUrl: defaultTemplate.url,
      leaseTemplateContent: defaultTemplate.content || "",
    }));
  }, [availableTemplates, formData.leaseTemplateName, formData.leaseTemplateUrl, listingId]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleTemplatePreviewToggle = async () => {
    if (showTemplatePreview) {
      setShowTemplatePreview(false);
      return;
    }

    if (!templatePreviewSource?.url) {
      toast.error(language === "en" ? "No agreement source file is available for preview." : "Урьдчилж харах гэрээний эх файл алга.");
      return;
    }

    setIsTemplatePreviewLoading(true);

    try {
      const selectedSections = parseTemplateContentToSections(formData.leaseTemplateContent);
      const response =
        selectedSections.length > 0
          ? await axiosInstance.post(
              API_PATHS.USER.TEMPLATE_SECTION_PREVIEW(
                encodeURIComponent(templatePreviewSource.name),
              ),
              {
                sections: selectedSections,
              },
            )
          : await axiosInstance.get(
              API_PATHS.USER.TEMPLATE_PREVIEW(
                encodeURIComponent(templatePreviewSource.name),
              ),
            );

      setTemplatePreviewUrl(response.data?.previewUrl || "");
      setShowTemplatePreview(true);
    } catch (error) {
      console.error("Template preview failed", error);
      toast.error(error?.response?.data?.message || (language === "en" ? "Failed to load agreement preview." : "Гэрээний урьдчилсан харагдац ачаалж чадсангүй."));
    } finally {
      setIsTemplatePreviewLoading(false);
    }
  };

  const toggleAmenity = (amenity) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((item) => item !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsUploadingImages(true);

    try {
      const uploadResponses = await Promise.all(files.map((file) => uploadImage(file)));
      const uploadedUrls = uploadResponses
        .map((response) => response.imageUrl)
        .filter(Boolean);

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls].slice(0, 6),
      }));

      toast.success(
        uploadedUrls.length === 1
          ? language === "en" ? "Listing image uploaded." : "Зарын зураг оруулагдлаа."
          : language === "en" ? `${uploadedUrls.length} listing images uploaded.` : `${uploadedUrls.length} зарын зураг оруулагдлаа.`,
      );
    } catch (error) {
      console.error("Error uploading listing images", error);
      toast.error(language === "en" ? "Failed to upload listing images." : "Зарын зураг оруулж чадсангүй.");
    } finally {
      setIsUploadingImages(false);
      event.target.value = "";
    }
  };

  const removeImage = (imageIndex) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== imageIndex),
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.title.trim()) nextErrors.title = language === "en" ? "Listing title is required" : "Зарын гарчиг шаардлагатай";
    if (!formData.location.trim()) nextErrors.location = language === "en" ? "Location is required" : "Байршил шаардлагатай";
    if (!formData.category) nextErrors.category = language === "en" ? "Select a hostel category" : "Хостелийн ангилал сонгоно уу";
    if (!formData.roomType) nextErrors.roomType = language === "en" ? "Select a room type" : "Өрөөний төрөл сонгоно уу";
    if (!formData.description.trim()) nextErrors.description = language === "en" ? "Description is required" : "Тайлбар шаардлагатай";
    if (!formData.houseRules.trim()) nextErrors.houseRules = language === "en" ? "House rules are required" : "Дотоод дүрэм шаардлагатай";
    if (!formData.dailyRent) nextErrors.dailyRent = language === "en" ? "Daily rent is required" : "Өдрийн түрээс шаардлагатай";
    if (!formData.deposit) nextErrors.deposit = language === "en" ? "Deposit is required" : "Барьцаа шаардлагатай";
    if (!formData.availableBeds || Number(formData.availableBeds) < 1) {
      nextErrors.availableBeds = language === "en" ? "Available beds must be at least 1" : "Сул ор дор хаяж 1 байх ёстой";
    }
    if (Number(formData.dailyRent) < 0 || Number(formData.deposit) < 0) {
      nextErrors.deposit = language === "en" ? "Rent and deposit must be positive numbers" : "Түрээс болон барьцаа эерэг тоо байх ёстой";
    }
    if (
      formData.availableFrom &&
      formData.availableUntil &&
      formData.availableFrom > formData.availableUntil
    ) {
      nextErrors.availableUntil = language === "en" ? "End date must be on or after the start date" : "Дуусах өдөр эхлэх өдрөөс хойш эсвэл ижил өдөр байх ёстой";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    const listingPayload = {
      title: formData.title,
      description: formData.description,
      houseRules: formData.houseRules,
      location: formData.location,
      category: formData.category,
      roomType: formData.roomType,
      dailyRent: formData.dailyRent,
      deposit: formData.deposit,
      availableFrom: formData.availableFrom || null,
      availableUntil: formData.availableUntil || null,
      availableBeds: formData.availableBeds,
      amenities: formData.amenities,
      images: formData.images,
      leaseTemplateName: formData.leaseTemplateName,
      leaseTemplateUrl: formData.leaseTemplateUrl,
      leaseTemplateContent: formData.leaseTemplateContent,
    };

    try {
      const response = listingId
        ? await axiosInstance.put(API_PATHS.LISTINGS.UPDATE(listingId), listingPayload)
        : await axiosInstance.post(API_PATHS.LISTINGS.CREATE, listingPayload);

      if (response.status === 200 || response.status === 201) {
        toast.success(listingId
          ? language === "en" ? "Listing updated successfully." : "Зар амжилттай шинэчлэгдлээ."
          : language === "en" ? "Listing published successfully." : "Зар амжилттай нийтлэгдлээ.");
        setFormData(INITIAL_FORM);
        navigate(ROUTES.OWNER_DASHBOARD);
      }
      } catch (error) {
      console.error("Unexpected listing submit error", error);
      toast.error(
        error?.response?.data?.message || (language === "en" ? "Failed to save listing." : "Зар хадгалж чадсангүй."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPreview) {
    return (
      <DashboardLayout activeMenu="post-listing">
        <ListingPreview formData={formData} setIsPreview={setIsPreview} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="post-listing">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow rounded-2xl p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  {listingId ? t("editHostelListing") : t("postNewListing")}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {t("listingFormIntro")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPreview(true)}
                disabled={isFetching || Object.keys(validateForm()).length > 0}
                className="group flex items-center space-x-2 px-6 py-3 text-sm font-medium text-gray-600 hover:text-white bg-white/50 hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 border border-gray-200 hover:border-transparent rounded-xl transition-all duration-300 shadow-lg shadow-gray-100 hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                <span>{t("preview")}</span>
              </button>
            </div>

            {isFetching ? (
              <div className="py-10 text-center text-gray-500">{t("loadingListing")}</div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <InputField
                  label={t("listingTitle")}
                  id="title"
                  placeholder={language === "en" ? "e.g. Clean shared room near the university" : "жишээ: Их сургуулийн ойролцоо цэвэр хамтын өрөө"}
                  value={formData.title}
                  onChange={(event) => handleInputChange("title", event.target.value)}
                  error={errors.title}
                  required
                  icon={House}
                />

                <InputField
                  label={t("location")}
                  id="location"
                  placeholder={language === "en" ? "e.g. Ulaanbaatar, 3rd khoroo" : "жишээ: Улаанбаатар, 3-р хороо"}
                  value={formData.location}
                  onChange={(event) => handleInputChange("location", event.target.value)}
                  error={errors.location}
                  required
                  icon={MapPin}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField
                    label={t("category")}
                    id="category"
                    value={formData.category}
                    onChange={(event) => handleInputChange("category", event.target.value)}
                    options={CATEGORIES.map((option) => ({ ...option, label: language === "en" ? option.labelEn : option.label }))}
                    placeholder={t("selectCategory")}
                    error={errors.category}
                    required
                  />
                  <SelectField
                    label={t("roomType")}
                    id="roomType"
                    value={formData.roomType}
                    onChange={(event) => handleInputChange("roomType", event.target.value)}
                    options={ROOM_TYPES.map((option) => ({ ...option, label: language === "en" ? option.labelEn : option.label }))}
                    placeholder={t("selectRoomType")}
                    error={errors.roomType}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <InputField
                    label={t("dailyRent")}
                    id="dailyRent"
                    type="number"
                    placeholder={language === "en" ? "e.g. 35000" : "жишээ: 35000"}
                    value={formData.dailyRent}
                    onChange={(event) => handleInputChange("dailyRent", event.target.value)}
                    error={errors.dailyRent}
                    helperText={t("dailyRentHelper")}
                    required
                    icon={Coins}
                  />
                  <InputField
                    label={t("deposit")}
                    id="deposit"
                    type="number"
                    placeholder={language === "en" ? "e.g. 600000" : "жишээ: 600000"}
                    value={formData.deposit}
                    onChange={(event) => handleInputChange("deposit", event.target.value)}
                    error={errors.deposit}
                    required
                    icon={Coins}
                  />
                  <InputField
                    label={t("startDate")}
                    id="availableFrom"
                    type="date"
                    value={formData.availableFrom}
                    onChange={(event) => handleInputChange("availableFrom", event.target.value)}
                    helperText={t("optionalStartDate")}
                    error={errors.availableFrom}
                  />
                  <InputField
                    label={t("endDate")}
                    id="availableUntil"
                    type="date"
                    value={formData.availableUntil}
                    onChange={(event) => handleInputChange("availableUntil", event.target.value)}
                    helperText={t("optionalEndDate")}
                    error={errors.availableUntil}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <InputField
                    label={t("availableBeds")}
                    id="availableBeds"
                    type="number"
                    placeholder={language === "en" ? "e.g. 4" : "жишээ: 4"}
                    value={formData.availableBeds}
                    onChange={(event) => handleInputChange("availableBeds", event.target.value)}
                    error={errors.availableBeds}
                    required
                    icon={Users}
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("leaseTemplate")}
                  </label>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                      <div className="pt-1">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                          <select
                            value={formData.leaseTemplateName}
                            onChange={(event) => {
                              const selectedTemplate = availableTemplates.find(
                                (template) => template.name === event.target.value,
                              );
                              handleInputChange(
                                "leaseTemplateName",
                                selectedTemplate?.name || "",
                              );
                              handleInputChange(
                                "leaseTemplateUrl",
                                selectedTemplate?.url || "",
                              );
                              handleInputChange(
                                "leaseTemplateContent",
                                selectedTemplate?.content || "",
                              );
                              setShowTemplatePreview(false);
                              setTemplatePreviewUrl("");
                            }}
                            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          >
                            {availableTemplates.map((template) => (
                              <option key={`${template.name}-${template.url}`} value={template.name}>
                                {template.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleTemplatePreviewToggle}
                            disabled={isTemplatePreviewLoading}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Eye className="h-4 w-4" />
                            {isTemplatePreviewLoading
                              ? t("loadingPreview")
                              : showTemplatePreview
                                ? t("closePreview")
                                : t("previewAgreement")}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          {t("chooseLeaseTemplate")}
                        </p>
                        <div className="grid gap-3">
                          {showTemplatePreview && templatePreviewUrl ? (
                            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-neutral-700/80 p-3">
                              <iframe
                                title={`${formData.leaseTemplateName || t("leaseTemplate")} ${t("preview")}`}
                                src={templatePreviewUrl}
                                className="h-[720px] w-full rounded-xl border-0 bg-white"
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-sm font-medium text-gray-700">
                      {t("listingImages")}
                    </label>
                    <span className="text-xs text-gray-500">
                      {t("imageLimitText")}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
                    <div className="flex flex-col gap-4">
                      <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                        <ImagePlus className="h-4 w-4" />
                        <span>{isUploadingImages ? t("uploading") : t("uploadImage")}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploadingImages || formData.images.length >= 6}
                        />
                      </label>

                      {formData.images.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {formData.images.map((image, index) => (
                            <div
                              key={`${image}-${index}`}
                              className="relative overflow-hidden rounded-xl border border-gray-200 bg-white"
                            >
                              <img
                                src={image}
                                alt={`${t("listingImageAlt")} ${index + 1}`}
                                className="h-28 w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          {t("addListingPhotosHint")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("amenities")}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {AMENITY_OPTIONS.map((amenity) => {
                      const isActive = formData.amenities.includes(amenity.value);
                      return (
                        <button
                          key={amenity.value}
                          type="button"
                          onClick={() => toggleAmenity(amenity.value)}
                          className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                            isActive
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          {language === "en" ? amenity.labelEn : amenity.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <TextareaField
                  label={t("hostelDescription")}
                  id="description"
                  placeholder={language === "en" ? "Describe the room, environment, cleanliness, transport access, and who it suits." : "Өрөө, орчин, цэвэрлэгээ, тээврийн хүртээмж, ямар хүнд тохиромжтойг тайлбарлана уу."}
                  value={formData.description}
                  onChange={(event) => handleInputChange("description", event.target.value)}
                  error={errors.description}
                  required
                />

                <TextareaField
                  label={t("houseRules")}
                  id="houseRules"
                  placeholder={language === "en" ? "e.g. No smoking, quiet after 23:00, deposit before move-in." : "жишээ: Тамхи татахгүй, 23:00 цагаас хойш чимээгүй, нүүхээс өмнө барьцаа төлнө."}
                  value={formData.houseRules}
                  onChange={(event) => handleInputChange("houseRules", event.target.value)}
                  error={errors.houseRules}
                  required
                />

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 mt-0.5" />
                    <div>
                      <p className="font-semibold">{t("listingQualityTip")}</p>
                      <p className="mt-1">
                        {t("listingQualityTipBody")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.MANAGE_LISTINGS)}
                    className="px-5 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Shield className="h-4 w-4 animate-pulse" />
                        {t("saving")}
                      </>
                    ) : (
                      <>
                        <BedDouble className="h-4 w-4" />
                        {listingId ? t("updateListing") : t("publishListing")}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ListingForm;
