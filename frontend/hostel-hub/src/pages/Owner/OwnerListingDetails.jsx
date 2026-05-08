import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BedDouble,
  Building2,
  Coins,
  Clock,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  ImagePlus,
  MapPin,
  Star,
  Trash2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import moment from "moment";
import axiosInstance from "../../utils/axiosInstance";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { API_PATHS } from "../../utils/apiPaths";
import { AMENITY_OPTIONS, CATEGORIES, ROOM_TYPES } from "../../utils/data";
import { formatCurrency } from "../../utils/helper";
import { ROUTES } from "../../utils/routePaths";
import { usePreferences } from "../../context/PreferencesContext";

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

const OwnerListingDetails = () => {
  const { user } = useAuth();
  const { language, t } = usePreferences();
  const navigate = useNavigate();
  const { listingId } = useParams();
  const [listingDetails, setListingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchListingDetails = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(API_PATHS.LISTINGS.GET_BY_ID(listingId));

        if (!isMounted) return;

        const listingData = response.data;
        const ownerId = listingData?.owner?._id || listingData?.owner;

        if (ownerId && user?._id && ownerId !== user._id) {
          toast.error(language === "en" ? "You do not have access to this listing." : "Танд энэ зарт хандах эрх алга.");
          navigate(ROUTES.MANAGE_LISTINGS, { replace: true });
          return;
        }

        setListingDetails(listingData);
        setSelectedImage(listingData?.images?.[0] || "");
      } catch (error) {
        console.error("Error fetching owner listing details", error);
        toast.error(language === "en" ? "Failed to load listing details." : "Зарын мэдээлэл ачаалж чадсангүй.");
        if (isMounted) {
          setListingDetails(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (listingId) {
      fetchListingDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [language, listingId, navigate, user]);

  const handleToggleStatus = async () => {
    try {
      setUpdatingStatus(true);
      await axiosInstance.put(API_PATHS.LISTINGS.TOGGLE_CLOSE(listingId));

      setListingDetails((prev) =>
        prev
          ? {
              ...prev,
              isClosed: !prev.isClosed,
            }
          : prev
      );

      toast.success(
        listingDetails?.isClosed
          ? language === "en" ? "Listing reopened successfully." : "Зар амжилттай дахин нээгдлээ."
          : language === "en" ? "Listing closed successfully." : "Зар амжилттай хаагдлаа."
      );
    } catch (error) {
      console.error("Error toggling listing status", error);
      toast.error(language === "en" ? "Failed to update listing status." : "Зарын төлөв шинэчилж чадсангүй.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(language === "en" ? "Delete this listing? This action cannot be undone." : "Энэ зарыг устгах уу? Энэ үйлдлийг буцаах боломжгүй.")) {
      return;
    }

    try {
      setDeleting(true);
      await axiosInstance.delete(API_PATHS.LISTINGS.DELETE(listingId));
      toast.success(language === "en" ? "Listing deleted successfully." : "Зар амжилттай устлаа.");
      navigate(ROUTES.MANAGE_LISTINGS, { replace: true });
    } catch (error) {
      console.error("Error deleting listing", error);
      toast.error(language === "en" ? "Failed to delete listing." : "Зар устгаж чадсангүй.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadTemplatePdf = async () => {
    const availableTemplates = user?.leaseAgreementTemplates || [];
    const previewSourceTemplate =
      availableTemplates.find(
        (template) =>
          template.name === listingDetails?.leaseTemplateName && template.url,
      ) ||
      availableTemplates.find((template) => template.isDefault && template.url) ||
      availableTemplates.find((template) => template.url) ||
      null;

    if (!previewSourceTemplate?.url) {
      toast.error(language === "en" ? "Agreement source file is missing." : "Гэрээний эх файл алга.");
      return;
    }

    try {
      setDownloadingTemplate(true);
      const savedSections = parseTemplateContentToSections(listingDetails?.leaseTemplateContent);
      const response =
        savedSections.length > 0
          ? await axiosInstance.post(
              API_PATHS.USER.TEMPLATE_SECTION_PREVIEW(
                encodeURIComponent(previewSourceTemplate.name),
              ),
              { sections: savedSections },
            )
          : await axiosInstance.get(
              API_PATHS.USER.TEMPLATE_PREVIEW(
                encodeURIComponent(previewSourceTemplate.name),
              ),
            );

      const downloadUrl = response.data?.previewUrl;

      if (!downloadUrl) {
        toast.error(language === "en" ? "Failed to prepare agreement PDF." : "Гэрээний PDF бэлтгэж чадсангүй.");
        return;
      }

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${listingDetails?.leaseTemplateName || "gereenii-zagvar"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading template pdf", error);
      toast.error(error?.response?.data?.message || (language === "en" ? "Failed to download agreement PDF." : "Гэрээний PDF татаж чадсангүй."));
    } finally {
      setDownloadingTemplate(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout activeMenu="manage-listings">
        <div className="max-w-7xl mx-auto rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          {language === "en" ? "Loading listing details..." : "Зарын мэдээлэл ачаалж байна..."}
        </div>
      </DashboardLayout>
    );
  }

  if (!listingDetails) {
    return (
      <DashboardLayout activeMenu="manage-listings">
        <div className="max-w-7xl mx-auto rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          {language === "en" ? "Listing not found." : "Зар олдсонгүй."}
        </div>
      </DashboardLayout>
    );
  }

  const categoryLabel =
    CATEGORIES.find((item) => item.value === listingDetails.category)?.[language === "en" ? "labelEn" : "label"] ||
    listingDetails.category;
  const roomTypeLabel =
    ROOM_TYPES.find((item) => item.value === listingDetails.roomType)?.[language === "en" ? "labelEn" : "label"] ||
    listingDetails.roomType;
  const amenities = listingDetails.amenities || [];
  const images = listingDetails.images || [];
  const reviewSummary = listingDetails.reviewSummary || {};
  const averageRating = Number(reviewSummary.averageRating || 0);
  const reviewCount = Number(reviewSummary.reviewCount || 0);
  const completedRentalCount = Number(reviewSummary.completedRentalCount || 0);
  const reviews = Array.isArray(listingDetails.reviews) ? listingDetails.reviews : [];

  return (
    <DashboardLayout activeMenu="manage-listings">
      <div className="max-w-7xl mx-auto space-y-6 pb-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(ROUTES.OWNER_DASHBOARD)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("back")}
            </button>

            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {language === "en" ? "Listing details" : "Зарын дэлгэрэнгүй"}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {language === "en"
                  ? "Review this listing with owner controls."
                  : "Энэ зарыг түрээслэгчийн харах байдлаар, дээр нь эзэмшигчийн удирдлагатайгаар хянана."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(ROUTES.INQUIRIES, { state: { listingId } })}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              <Eye className="h-4 w-4" />
              {t("viewInquiries")}
            </button>
            <button
              type="button"
              onClick={() => navigate(ROUTES.POST_LISTING, { state: { listingId } })}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              <Edit className="h-4 w-4" />
              {t("edit")}
            </button>
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={updatingStatus}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60"
            >
              {listingDetails.isClosed ? t("reopen") : t("close")}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {t("delete")}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 dark:bg-gray-900">
          <div className="relative px-0 pb-8 border-b border-gray-100 dark:border-gray-800">
            {images.length > 0 ? (
              <div className="mb-6 space-y-3">
                <img
                  src={selectedImage || images[0]}
                  alt={listingDetails.title}
                  className="h-80 w-full rounded-2xl object-cover border border-gray-200"
                />
                {images.length > 1 ? (
                  <div className="grid grid-cols-4 gap-3">
                    {images.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => setSelectedImage(image)}
                        className={`overflow-hidden rounded-xl border ${
                          (selectedImage || images[0]) === image
                            ? "border-blue-500 ring-2 ring-blue-100"
                            : "border-gray-200"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${listingDetails.title} ${index + 1}`}
                          className="h-20 w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mb-6 flex h-40 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-gray-500">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ImagePlus className="h-4 w-4" />
                  <span>{language === "en" ? "No listing images available" : "Зарын зураг алга"}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              <div className="flex items-center gap-4 flex-1">
                {listingDetails?.owner?.hostelLogo ? (
                  <img
                    src={listingDetails.owner.hostelLogo}
                    alt={t("hostelLogo")}
                    className="h-20 w-20 object-cover rounded-2xl border-4 border-white/20 shadow-lg"
                  />
                ) : (
                  <div className="h-20 w-20 bg-gray-50 border-2 border-gray-200 rounded-2xl flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-gray-400" />
                  </div>
                )}

                <div className="flex-1">
                  <p className="text-sm text-blue-600 font-medium mb-2">
                    {listingDetails?.owner?.hostelName || listingDetails?.owner?.name}
                  </p>
                  <h1 className="text-2xl font-semibold leading-tight text-gray-900 dark:text-white">
                    {listingDetails.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-gray-600 mt-3 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm font-medium">{listingDetails.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {listingDetails.availableBeds || 0} {t("beds")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {listingDetails.isClosed ? (
                  <span className="inline-flex px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                    {language === "en" ? "Listing closed" : "Зар хаалттай"}
                  </span>
                ) : (
                  <span className="inline-flex px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
                    {language === "en" ? "Listing active" : "Зар идэвхтэй"}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <span className="px-4 py-2 bg-blue-50 text-sm text-blue-700 font-semibold rounded-full border border-blue-200">
                {categoryLabel}
              </span>
              <span className="px-4 py-2 text-sm bg-purple-50 text-purple-700 font-semibold rounded-full border border-purple-200">
                {roomTypeLabel}
              </span>
              {listingDetails.availableFrom || listingDetails.availableUntil ? (
                <div className="flex items-center gap-1 px-4 py-2 bg-amber-50 text-sm text-amber-700 font-semibold rounded-full border border-amber-200">
                  <Clock className="h-4 w-4" />
                  <span>
                    {listingDetails.availableFrom
                      ? moment(listingDetails.availableFrom).format("Do MMM YYYY")
                      : t("now")}{" "}
                    -{" "}
                    {listingDetails.availableUntil
                      ? moment(listingDetails.availableUntil).format("Do MMM YYYY")
                      : t("openEnded")}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center gap-1 px-4 py-2 bg-gray-50 text-sm text-gray-700 font-semibold rounded-full border border-gray-200">
                <Clock className="h-4 w-4" />
                <span>
                  {listingDetails.createdAt
                    ? moment(listingDetails.createdAt).format("Do MMM YYYY")
                    : t("noData")}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-8 space-y-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/40">
                <div className="flex items-center gap-3 mb-2">
                  <Coins className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t("dailyRent")}</h3>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(listingDetails.dailyRent ?? listingDetails.monthlyRent)}
                </p>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5 dark:border-orange-900/60 dark:bg-orange-950/40">
                <div className="flex items-center gap-3 mb-2">
                  <Coins className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t("deposit")}</h3>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(listingDetails.deposit)}
                </p>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5 dark:border-sky-900/60 dark:bg-sky-950/40">
                <div className="flex items-center gap-3 mb-2">
                  <BedDouble className="h-5 w-5 text-sky-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t("available")}</h3>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {listingDetails.availableBeds || 0} {t("beds")}
                </p>
                {listingDetails.availableFrom || listingDetails.availableUntil ? (
                  <p className="mt-2 text-sm text-sky-700">
                    {listingDetails.availableFrom
                      ? moment(listingDetails.availableFrom).format("Do MMM YYYY")
                      : t("now")}{" "}
                    -{" "}
                    {listingDetails.availableUntil
                      ? moment(listingDetails.availableUntil).format("Do MMM YYYY")
                      : t("openEnded")}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t("amenities")}</h3>
              <div className="flex flex-wrap gap-3">
                {amenities.length > 0 ? (
                  amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
                    >
                      {AMENITY_OPTIONS.find((item) => item.value === amenity)?.[language === "en" ? "labelEn" : "label"] ||
                        amenity}
                    </span>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {language === "en" ? "No amenities listed." : "Тохижилт бүртгээгүй байна."}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t("hostelDescription")}</h3>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200">
                {listingDetails.description}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t("houseRules")}</h3>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-6 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap dark:from-gray-950 dark:to-gray-900 dark:border-gray-700 dark:text-gray-200">
                {listingDetails.houseRules}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t("leaseTemplate")}</h3>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-6 dark:border-blue-900/60 dark:bg-blue-950/40">
                {listingDetails.leaseTemplateName &&
                (listingDetails.leaseTemplateUrl || listingDetails.leaseTemplateContent) ? (
                  <button
                    type="button"
                    onClick={handleDownloadTemplatePdf}
                    disabled={downloadingTemplate}
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-800 dark:bg-gray-950 dark:text-blue-200 dark:hover:bg-gray-900"
                  >
                    <FileText className="h-4 w-4" />
                    <span>{listingDetails.leaseTemplateName}</span>
                    {listingDetails.leaseTemplateUrl ? <ExternalLink className="h-4 w-4" /> : null}
                  </button>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {language === "en" ? "No lease template is attached to this listing." : "Энэ зарт гэрээний загвар хавсаргаагүй байна."}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {language === "en" ? "Renter reviews" : "Түрээслэгчдийн үнэлгээ"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {language === "en"
                      ? "All reviews for this listing are shown here."
                      : "Энэ зар дээр ирсэн бүх үнэлгээ owner-д энд харагдана."}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                  {averageRating > 0 ? averageRating.toFixed(1) : "0.0"} · {reviewCount} {t("reviews")}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-950">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {language === "en" ? "Average rating" : "Дундаж үнэлгээ"}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                    {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-950">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {language === "en" ? "Review count" : "Үнэлгээний тоо"}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                    {reviewCount}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-950">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {language === "en" ? "Completed rentals" : "Түрээсэлсэн тоо"}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                    {completedRentalCount}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div
                      key={review._id}
                      className="rounded-2xl border border-gray-100 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-950"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          {review?.renter?.avatar ? (
                            <img
                              src={review.renter.avatar}
                              alt={review?.renter?.name || t("renter")}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                              {(review?.renter?.name || t("renter")).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {review?.renter?.name || t("renter")}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {review.createdAt ? moment(review.createdAt).fromNow() : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 text-amber-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-sm font-semibold">{review.rating}</span>
                        </div>
                      </div>

                      {review.comment ? (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-200">
                          {review.comment}
                        </p>
                      ) : (
                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                          {language === "en" ? "No comment provided." : "Сэтгэгдэл бичээгүй."}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400">
                    {language === "en" ? "No reviews yet." : "Одоогоор үнэлгээ ирээгүй байна."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OwnerListingDetails;
