import {
  ArrowLeft,
  BedDouble,
  Building2,
  Coins,
  Clock,
  ExternalLink,
  FileText,
  ImagePlus,
  MessageSquare,
  MapPin,
  Star,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import moment from "moment";
import StatusBadge from "../../components/StatusBadge";
import toast from "react-hot-toast";
import { AMENITY_OPTIONS, CATEGORIES, ROOM_TYPES } from "../../utils/data";
import { formatCurrency } from "../../utils/helper";
import { ROUTES } from "../../utils/routePaths";
import { usePreferences } from "../../context/PreferencesContext";

const ListingDetails = () => {
  const { user } = useAuth();
  const { language, t } = usePreferences();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { listingId, jobId } = useParams();
  const resolvedListingId = listingId || jobId;
  const [listingDetails, setListingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [showRequestSection, setShowRequestSection] = useState(false);
  const [requestDates, setRequestDates] = useState({
    requestedFrom: "",
    requestedTo: "",
  });
  const [requestErrors, setRequestErrors] = useState({});
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [editingReviewId, setEditingReviewId] = useState("");
  const [editReviewForm, setEditReviewForm] = useState({ rating: 5, comment: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isUpdatingReview, setIsUpdatingReview] = useState(false);
  const requestSectionRef = useRef(null);
  const reviewSectionRef = useRef(null);

  const getDateOnlyUtcValue = (value) => {
    const date = new Date(value);
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  };

  const getStayLengthInDays = (from, to) => {
    if (!from || !to) {
      return 0;
    }

    return (getDateOnlyUtcValue(to) - getDateOnlyUtcValue(from)) / (1000 * 60 * 60 * 24);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchListingDetails = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(
          API_PATHS.LISTINGS.GET_BY_ID(resolvedListingId),
          {
            params: {
              renterId: user?.role === "renter" ? user?._id : null,
            },
          },
        );

        if (isMounted) {
          setListingDetails(response.data);
          setSelectedImage(response.data?.images?.[0] || "");
        }
      } catch (error) {
        console.error("Error fetching listing details", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (resolvedListingId) {
      fetchListingDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [resolvedListingId, user]);

  useEffect(() => {
    if (!showRequestSection || !requestSectionRef.current) {
      return;
    }

    requestSectionRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [showRequestSection]);

  useEffect(() => {
    if (!listingDetails || searchParams.get("review") !== "1" || !reviewSectionRef.current) {
      return;
    }

    reviewSectionRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [listingDetails, searchParams]);

  useEffect(() => {
    if (!listingDetails) {
      return;
    }

    setRequestDates({
      requestedFrom: listingDetails.availableFrom
        ? String(listingDetails.availableFrom).slice(0, 10)
        : "",
      requestedTo: listingDetails.availableUntil
        ? String(listingDetails.availableUntil).slice(0, 10)
        : "",
    });
  }, [listingDetails]);

  const validateRequestDates = () => {
    const nextErrors = {};

    if (!requestDates.requestedFrom) {
      nextErrors.requestedFrom = t("selectStartDateError");
    }

    if (!requestDates.requestedTo) {
      nextErrors.requestedTo = t("selectEndDateError");
    }

    if (
      requestDates.requestedFrom &&
      requestDates.requestedTo &&
      requestDates.requestedFrom > requestDates.requestedTo
    ) {
      nextErrors.requestedTo = t("endDateAfterStartError");
    }

    if (
      requestDates.requestedFrom &&
      requestDates.requestedTo &&
      getStayLengthInDays(requestDates.requestedFrom, requestDates.requestedTo) < 1
    ) {
      nextErrors.requestedTo = t("minimumOneNightError");
    }

    if (
      listingDetails?.availableFrom &&
      requestDates.requestedFrom &&
      requestDates.requestedFrom < String(listingDetails.availableFrom).slice(0, 10)
    ) {
      nextErrors.requestedFrom = t("startOutsideAvailabilityError");
    }

    if (
      listingDetails?.availableUntil &&
      requestDates.requestedTo &&
      requestDates.requestedTo > String(listingDetails.availableUntil).slice(0, 10)
    ) {
      nextErrors.requestedTo = t("endOutsideAvailabilityError");
    }

    return nextErrors;
  };

  const createInquiry = async () => {
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }

    if (user.role !== "renter") {
      toast.error(t("rentersOnlyInquiry"));
      return;
    }

    const validationErrors = validateRequestDates();
    if (Object.keys(validationErrors).length > 0) {
      setRequestErrors(validationErrors);
      return;
    }

    try {
      setIsSubmittingInquiry(true);
      await axiosInstance.post(API_PATHS.INQUIRIES.CREATE(resolvedListingId), requestDates);
      toast.success(t("inquirySentSuccess"));

      const refreshed = await axiosInstance.get(
        API_PATHS.LISTINGS.GET_BY_ID(resolvedListingId),
        { params: { renterId: user._id } },
      );
      setListingDetails(refreshed.data);
      setSelectedImage(refreshed.data?.images?.[0] || "");
    } catch (error) {
      console.error("Error sending inquiry", error);
      toast.error(
        error?.response?.data?.message || t("inquirySendFailed"),
      );
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  const handleNext = () => {
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }

    if (user.role !== "renter") {
      toast.error(t("rentersOnlyInquiry"));
      return;
    }

    setShowRequestSection(true);
  };

  const openChat = () => {
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }

    if (user.role !== "renter") {
      toast.error(t("rentersOnlyChat"));
      return;
    }

    navigate(`${ROUTES.CHATS}?listingId=${resolvedListingId}`);
  };

  const handleDownloadTemplatePdf = async () => {
    try {
      setDownloadingTemplate(true);
      const response = await axiosInstance.get(
        API_PATHS.LISTINGS.TEMPLATE_PREVIEW(resolvedListingId),
      );

      const downloadUrl = response.data?.previewUrl;

      if (!downloadUrl) {
        toast.error(t("agreementPdfPrepareFailed"));
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
      toast.error(error?.response?.data?.message || t("agreementPdfDownloadFailed"));
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const submitReview = async () => {
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }

    if (user.role !== "renter") {
      toast.error(t("rentersOnlyReview"));
      return;
    }

    try {
      setIsSubmittingReview(true);
      const response = await axiosInstance.post(
        API_PATHS.REVIEWS.CREATE(resolvedListingId),
        reviewForm,
      );

      toast.success(response.data?.message || t("reviewSubmitted"));
      setListingDetails((current) => ({
        ...current,
        reviewSummary: response.data?.reviewSummary || current?.reviewSummary,
        reviews: response.data?.reviews || current?.reviews || [],
        reviewEligibility: {
          ...(current?.reviewEligibility || {}),
          canReview: false,
          existingReview: response.data?.review || current?.reviewEligibility?.existingReview,
        },
      }));
      setReviewForm({ rating: 5, comment: "" });
    } catch (error) {
      console.error("Error submitting review", error);
      toast.error(error?.response?.data?.message || t("reviewSubmitFailed"));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const canEditReview = (review) => {
    if (!user || user.role !== "renter" || String(review?.renter?._id || "") !== String(user._id)) {
      return false;
    }

    const createdAt = new Date(review.createdAt).getTime();
    if (Number.isNaN(createdAt)) {
      return false;
    }

    return Date.now() - createdAt <= 7 * 24 * 60 * 60 * 1000;
  };

  const startEditReview = (review) => {
    setEditingReviewId(review._id);
    setEditReviewForm({
      rating: Number(review.rating || 5),
      comment: review.comment || "",
    });
  };

  const updateReview = async () => {
    if (!editingReviewId) {
      return;
    }

    try {
      setIsUpdatingReview(true);
      const response = await axiosInstance.put(
        API_PATHS.REVIEWS.UPDATE(editingReviewId),
        editReviewForm,
      );

      toast.success(response.data?.message || t("reviewUpdated"));
      setListingDetails((current) => ({
        ...current,
        reviewSummary: response.data?.reviewSummary || current?.reviewSummary,
        reviews: response.data?.reviews || current?.reviews || [],
        reviewEligibility: {
          ...(current?.reviewEligibility || {}),
          existingReview: response.data?.review || current?.reviewEligibility?.existingReview,
        },
      }));
      setEditingReviewId("");
    } catch (error) {
      console.error("Error updating review", error);
      toast.error(error?.response?.data?.message || t("reviewUpdateFailed"));
    } finally {
      setIsUpdatingReview(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-950"><Navbar /></div>;
  }

  if (!listingDetails) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
        <Navbar />
        <div className="container mx-auto pt-28 px-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            {t("noListingsFound")}
          </div>
        </div>
      </div>
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
  const canInquire = !user || user.role === "renter";
  const canChat = canInquire && (!listingDetails.isClosed || Boolean(listingDetails.inquiryStatus));
  const requestValidationErrors = validateRequestDates();
  const isRequestReady = Object.keys(requestValidationErrors).length === 0;
  const stayLengthInDays = getStayLengthInDays(
    requestDates.requestedFrom,
    requestDates.requestedTo,
  );
  const dailyRentAmount = Number(listingDetails.dailyRent ?? listingDetails.monthlyRent ?? 0);
  const depositAmount = Number(listingDetails.deposit ?? 0);
  const rentSubtotal = stayLengthInDays > 0 ? dailyRentAmount * stayLengthInDays : 0;
  const totalBookingAmount = rentSubtotal + depositAmount;
  const reviewSummary = listingDetails.reviewSummary || {};
  const averageRating = Number(reviewSummary.averageRating || 0);
  const reviewCount = Number(reviewSummary.reviewCount || 0);
  const completedRentalCount = Number(reviewSummary.completedRentalCount || 0);
  const canReviewListing = Boolean(listingDetails.reviewEligibility?.canReview);
  const reviews = Array.isArray(listingDetails.reviews) ? listingDetails.reviews : [];

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
      <Navbar />

      <div className="container mx-auto pt-24 px-4 pb-10">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate(ROUTES.FIND_HOSTELS)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t("viewListings")}</span>
          </button>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 dark:bg-gray-900">
          <div className="relative px-0 pb-8 border-b border-gray-100">
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
                  <span>{t("noListingImages")}</span>
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
                  <h1 className="text-2xl font-semibold leading-tight text-gray-900">
                    {listingDetails.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-gray-600 mt-3">
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
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium">
                        {averageRating > 0 ? averageRating.toFixed(1) : "0.0"} / 5
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {completedRentalCount} {t("rentedCount")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-start sm:justify-end gap-3 w-full sm:w-auto">
                {listingDetails.inquiryStatus ? (
                  <>
                    {canChat ? (
                      <button
                        type="button"
                        className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 transition-all duration-200"
                        onClick={openChat}
                        aria-label={t("openChatAction")}
                        title={t("chats")}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    ) : null}
                    <StatusBadge status={listingDetails.inquiryStatus} />
                  </>
                ) : listingDetails.isClosed ? (
                  <span className="inline-flex px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                    {t("listingClosed")}
                  </span>
                ) : canInquire ? (
                  <>
                    <button
                      type="button"
                      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 transition-all duration-200"
                      onClick={openChat}
                      aria-label={t("openChatAction")}
                      title={t("chats")}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex flex-1 min-w-[220px] items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={handleNext}
                    >
                      {user ? t("next") : t("loginToContinue")}
                    </button>
                  </>
                ) : null}
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
            <div className="grid gap-4 md:grid-cols-4">
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

              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 dark:border-amber-900/60 dark:bg-amber-950/40">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t("rating")}</h3>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {averageRating > 0 ? averageRating.toFixed(1) : "0.0"} / 5
                </p>
                <p className="mt-2 text-sm text-amber-700">
                  {reviewCount} {t("comments")} · {completedRentalCount} {t("rentedCount")}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">{t("amenities")}</h3>
              <div className="flex flex-wrap gap-3">
                {amenities.length > 0 ? (
                  amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700"
                    >
                      {AMENITY_OPTIONS.find((item) => item.value === amenity)?.[language === "en" ? "labelEn" : "label"] ||
                        amenity}
                    </span>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">
                    {language === "en" ? "No amenities listed." : "Тохижилт бүртгээгүй байна."}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">{t("hostelDescription")}</h3>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200">
                {listingDetails.description}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">{t("houseRules")}</h3>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-6 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap dark:from-gray-950 dark:to-gray-900 dark:border-gray-700 dark:text-gray-200">
                {listingDetails.houseRules}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">{t("leaseTemplate")}</h3>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-6">
                {listingDetails.leaseTemplateName &&
                (listingDetails.leaseTemplateUrl || listingDetails.leaseTemplateContent) ? (
                  <button
                    type="button"
                    onClick={handleDownloadTemplatePdf}
                    disabled={downloadingTemplate}
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FileText className="h-4 w-4" />
                    <span>{listingDetails.leaseTemplateName}</span>
                    {listingDetails.leaseTemplateUrl ? <ExternalLink className="h-4 w-4" /> : null}
                  </button>
                ) : (
                  <p className="text-sm text-gray-500">
                    {language === "en" ? "No lease template is attached to this listing." : "Энэ зарт гэрээний загвар хавсаргаагүй байна."}
                  </p>
                )}
              </div>
            </div>

            <div ref={reviewSectionRef} className="space-y-4 scroll-mt-24">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t("reviewsAndComments")}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {t("previousRenterReviews")}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                  {averageRating > 0 ? averageRating.toFixed(1) : "0.0"} · {reviewCount} {t("comments")}
                </div>
              </div>

              {canReviewListing ? (
                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5 dark:border-amber-900/70 dark:bg-amber-950/30">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t("canReviewAfterRental")}
                  </h4>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {[1, 2, 3, 4, 5].map((ratingValue) => (
                      <button
                        key={ratingValue}
                        type="button"
                        onClick={() =>
                          setReviewForm((current) => ({
                            ...current,
                            rating: ratingValue,
                          }))
                        }
                        className="rounded-lg p-1 transition hover:bg-amber-100 dark:hover:bg-amber-900/50"
                        aria-label={`${ratingValue} ${t("rating")}`}
                      >
                        <Star
                          className={`h-7 w-7 ${
                            ratingValue <= reviewForm.rating
                              ? "fill-amber-400 text-amber-500"
                              : "text-amber-200"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(event) =>
                      setReviewForm((current) => ({
                        ...current,
                        comment: event.target.value,
                      }))
                    }
                    maxLength={1000}
                    rows={4}
                    placeholder={t("writeComment")}
                    className="mt-4 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-amber-900/70 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={submitReview}
                      disabled={isSubmittingReview}
                      className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmittingReview ? t("submitting") : t("submitReview")}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                {reviews.length > 0 ? (
                  reviews.map((review) => {
                    const isEditing = editingReviewId === review._id;
                    const editable = canEditReview(review);
                    const isMine = String(review?.renter?._id || "") === String(user?._id || "");

                    return (
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
                              <p className="text-xs text-gray-500">
                                {review.createdAt ? moment(review.createdAt).fromNow() : ""}
                                {isMine ? ` · ${t("yourReview")}` : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <div className="flex items-center gap-1 text-amber-500">
                              <Star className="h-4 w-4 fill-current" />
                              <span className="text-sm font-semibold">{review.rating}</span>
                            </div>
                            {editable && !isEditing ? (
                              <button
                                type="button"
                                onClick={() => startEditReview(review)}
                                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-white dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
                              >
                                {t("edit")}
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="mt-4 rounded-2xl border border-amber-100 bg-white p-4 dark:border-amber-900/70 dark:bg-gray-900">
                            <div className="flex flex-wrap items-center gap-2">
                              {[1, 2, 3, 4, 5].map((ratingValue) => (
                                <button
                                  key={ratingValue}
                                  type="button"
                                  onClick={() =>
                                    setEditReviewForm((current) => ({
                                      ...current,
                                      rating: ratingValue,
                                    }))
                                  }
                                  className="rounded-lg p-1 transition hover:bg-amber-100 dark:hover:bg-amber-900/50"
                                  aria-label={`${ratingValue} ${t("rating")}`}
                                >
                                  <Star
                                    className={`h-6 w-6 ${
                                      ratingValue <= editReviewForm.rating
                                        ? "fill-amber-400 text-amber-500"
                                        : "text-amber-200"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                            <textarea
                              value={editReviewForm.comment}
                              onChange={(event) =>
                                setEditReviewForm((current) => ({
                                  ...current,
                                  comment: event.target.value,
                                }))
                              }
                              maxLength={1000}
                              rows={3}
                              className="mt-3 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-amber-900/70 dark:bg-gray-950 dark:text-white"
                            />
                            <div className="mt-3 flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingReviewId("")}
                                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                              >
                                {t("cancel")}
                              </button>
                              <button
                                type="button"
                                onClick={updateReview}
                                disabled={isUpdatingReview}
                                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isUpdatingReview ? t("saving") : t("save")}
                              </button>
                            </div>
                          </div>
                        ) : review.comment ? (
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-200">
                            {review.comment}
                          </p>
                        ) : null}

                        {isMine && !editable ? (
                          <p className="mt-3 text-xs text-gray-500">
                            {t("reviewEditExpired")}
                          </p>
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400">
                    {t("noReviews")}
                  </div>
                )}
              </div>
            </div>

            {showRequestSection && !listingDetails.inquiryStatus && !listingDetails.isClosed ? (
              <div
                ref={requestSectionRef}
                className="space-y-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 dark:border-blue-900/60 dark:from-blue-950/40 dark:to-cyan-950/30"
              >
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t("selectStayDates")}</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {t("selectStayDatesSubtitle")}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="requestedFrom" className="mb-2 block text-sm font-medium text-gray-700">
                      {t("startDate")}
                    </label>
                    <input
                      id="requestedFrom"
                      type="date"
                      value={requestDates.requestedFrom}
                      min={listingDetails.availableFrom ? String(listingDetails.availableFrom).slice(0, 10) : undefined}
                      max={listingDetails.availableUntil ? String(listingDetails.availableUntil).slice(0, 10) : undefined}
                      onChange={(event) => {
                        setRequestDates((current) => ({
                          ...current,
                          requestedFrom: event.target.value,
                        }));
                        setRequestErrors((current) => ({
                          ...current,
                          requestedFrom: "",
                        }));
                      }}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    {requestErrors.requestedFrom ? (
                      <p className="mt-2 text-sm text-red-600">{requestErrors.requestedFrom}</p>
                    ) : null}
                  </div>

                  <div>
                    <label htmlFor="requestedTo" className="mb-2 block text-sm font-medium text-gray-700">
                      {t("endDate")}
                    </label>
                    <input
                      id="requestedTo"
                      type="date"
                      value={requestDates.requestedTo}
                      min={requestDates.requestedFrom || (listingDetails.availableFrom ? String(listingDetails.availableFrom).slice(0, 10) : undefined)}
                      max={listingDetails.availableUntil ? String(listingDetails.availableUntil).slice(0, 10) : undefined}
                      onChange={(event) => {
                        setRequestDates((current) => ({
                          ...current,
                          requestedTo: event.target.value,
                        }));
                        setRequestErrors((current) => ({
                          ...current,
                          requestedTo: "",
                        }));
                      }}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    {requestErrors.requestedTo ? (
                      <p className="mt-2 text-sm text-red-600">{requestErrors.requestedTo}</p>
                    ) : null}
                  </div>
                </div>

                {requestDates.requestedFrom && requestDates.requestedTo ? (
                  <p className="text-sm text-gray-600">
                    {t("stayLength")}: {stayLengthInDays} {t("nights")}
                  </p>
                ) : null}

                <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4">
                  <h4 className="text-sm font-semibold text-gray-900">{t("priceSummary")}</h4>
                  <div className="mt-3 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between gap-4">
                      <span>{t("dailyRent")}</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(dailyRentAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>{t("selectedNights")}</span>
                      <span className="font-medium text-gray-900">
                        {stayLengthInDays > 0 ? stayLengthInDays : 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>{t("rentSubtotal")}</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(rentSubtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>{t("deposit")}</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(depositAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-emerald-100 pt-2 text-base">
                      <span className="font-semibold text-gray-900">{t("totalAmount")}</span>
                      <span className="font-bold text-emerald-700">
                        {formatCurrency(totalBookingAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowRequestSection(false)}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    {t("cancel")}
                  </button>
                    <button
                      type="button"
                      onClick={createInquiry}
                      disabled={!isRequestReady || isSubmittingInquiry}
                      className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                    {isSubmittingInquiry ? t("submitting") : t("sendInquiryButton")}
                  </button>
                </div>
              </div>
            ) : null}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetails;
