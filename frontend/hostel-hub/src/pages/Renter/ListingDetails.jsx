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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
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

const ListingDetails = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const requestSectionRef = useRef(null);

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
      nextErrors.requestedFrom = "Please choose a start date";
    }

    if (!requestDates.requestedTo) {
      nextErrors.requestedTo = "Please choose an end date";
    }

    if (
      requestDates.requestedFrom &&
      requestDates.requestedTo &&
      requestDates.requestedFrom > requestDates.requestedTo
    ) {
      nextErrors.requestedTo = "End date must be the same as or after the start date";
    }

    if (
      requestDates.requestedFrom &&
      requestDates.requestedTo &&
      getStayLengthInDays(requestDates.requestedFrom, requestDates.requestedTo) < 1
    ) {
      nextErrors.requestedTo = "Booking dates must cover at least 1 night";
    }

    if (
      listingDetails?.availableFrom &&
      requestDates.requestedFrom &&
      requestDates.requestedFrom < String(listingDetails.availableFrom).slice(0, 10)
    ) {
      nextErrors.requestedFrom = "Start date is outside the listing availability";
    }

    if (
      listingDetails?.availableUntil &&
      requestDates.requestedTo &&
      requestDates.requestedTo > String(listingDetails.availableUntil).slice(0, 10)
    ) {
      nextErrors.requestedTo = "End date is outside the listing availability";
    }

    return nextErrors;
  };

  const createInquiry = async () => {
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }

    if (user.role !== "renter") {
      toast.error("Only renter accounts can send inquiries.");
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
      toast.success("Inquiry sent successfully.");

      const refreshed = await axiosInstance.get(
        API_PATHS.LISTINGS.GET_BY_ID(resolvedListingId),
        { params: { renterId: user._id } },
      );
      setListingDetails(refreshed.data);
      setSelectedImage(refreshed.data?.images?.[0] || "");
    } catch (error) {
      console.error("Error sending inquiry", error);
      toast.error(
        error?.response?.data?.message || "Failed to send inquiry.",
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
      toast.error("Only renter accounts can send inquiries.");
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
      toast.error("Only renter accounts can start listing chats.");
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
        toast.error("Failed to prepare template PDF.");
        return;
      }

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${listingDetails?.leaseTemplateName || "lease-template"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading template pdf", error);
      toast.error(error?.response?.data?.message || "Failed to download template PDF.");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen"><Navbar /></div>;
  }

  if (!listingDetails) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
        <Navbar />
        <div className="container mx-auto pt-28 px-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-600">
            Listing not found.
          </div>
        </div>
      </div>
    );
  }

  const categoryLabel =
    CATEGORIES.find((item) => item.value === listingDetails.category)?.label ||
    listingDetails.category;
  const roomTypeLabel =
    ROOM_TYPES.find((item) => item.value === listingDetails.roomType)?.label ||
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

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      <Navbar />

      <div className="container mx-auto pt-24 px-4 pb-10">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate(ROUTES.FIND_HOSTELS)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>View Listings</span>
          </button>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
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
                  <span>No listing images available</span>
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              <div className="flex items-center gap-4 flex-1">
                {listingDetails?.owner?.hostelLogo ? (
                  <img
                    src={listingDetails.owner.hostelLogo}
                    alt="Hostel Logo"
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
                        {listingDetails.availableBeds || 0} beds available
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
                        aria-label="Open chat"
                        title="Chat"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    ) : null}
                    <StatusBadge status={listingDetails.inquiryStatus} />
                  </>
                ) : listingDetails.isClosed ? (
                  <span className="inline-flex px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                    Listing Closed
                  </span>
                ) : canInquire ? (
                  <>
                    <button
                      type="button"
                      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 transition-all duration-200"
                      onClick={openChat}
                      aria-label="Open chat"
                      title="Chat"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex flex-1 min-w-[220px] items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={handleNext}
                    >
                      {user ? "Next" : "Log In to Continue"}
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
                      : "Now"}{" "}
                    -{" "}
                    {listingDetails.availableUntil
                      ? moment(listingDetails.availableUntil).format("Do MMM YYYY")
                      : "Open"}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center gap-1 px-4 py-2 bg-gray-50 text-sm text-gray-700 font-semibold rounded-full border border-gray-200">
                <Clock className="h-4 w-4" />
                <span>
                  {listingDetails.createdAt
                    ? moment(listingDetails.createdAt).format("Do MMM YYYY")
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-8 space-y-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Coins className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-semibold text-gray-900">Daily Rent</h3>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(listingDetails.dailyRent ?? listingDetails.monthlyRent)}
                </p>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Coins className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-900">Deposit</h3>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(listingDetails.deposit)}
                </p>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <BedDouble className="h-5 w-5 text-sky-600" />
                  <h3 className="font-semibold text-gray-900">Availability</h3>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {listingDetails.availableBeds || 0} beds
                </p>
                {listingDetails.availableFrom || listingDetails.availableUntil ? (
                  <p className="mt-2 text-sm text-sky-700">
                    {listingDetails.availableFrom
                      ? moment(listingDetails.availableFrom).format("Do MMM YYYY")
                      : "Now"}{" "}
                    -{" "}
                    {listingDetails.availableUntil
                      ? moment(listingDetails.availableUntil).format("Do MMM YYYY")
                      : "Open"}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Amenities</h3>
              <div className="flex flex-wrap gap-3">
                {amenities.length > 0 ? (
                  amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700"
                    >
                      {AMENITY_OPTIONS.find((item) => item.value === amenity)?.label ||
                        amenity}
                    </span>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">
                    No amenities listed.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Hostel Description</h3>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {listingDetails.description}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">House Rules</h3>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-6 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {listingDetails.houseRules}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Lease Agreement Template</h3>
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
                    No lease template attached to this listing.
                  </p>
                )}
              </div>
            </div>

            {showRequestSection && !listingDetails.inquiryStatus && !listingDetails.isClosed ? (
              <div
                ref={requestSectionRef}
                className="space-y-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Choose Your Booking Dates</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Pick the dates you want to stay, then send your request to the owner.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="requestedFrom" className="mb-2 block text-sm font-medium text-gray-700">
                      From
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
                      To
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
                    Stay length: {stayLengthInDays} night
                    {stayLengthInDays === 1 ? "" : "s"}
                  </p>
                ) : null}

                <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4">
                  <h4 className="text-sm font-semibold text-gray-900">Price Summary</h4>
                  <div className="mt-3 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between gap-4">
                      <span>Daily rent</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(dailyRentAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Nights selected</span>
                      <span className="font-medium text-gray-900">
                        {stayLengthInDays > 0 ? stayLengthInDays : 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Rent subtotal</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(rentSubtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Deposit</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(depositAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-emerald-100 pt-2 text-base">
                      <span className="font-semibold text-gray-900">Total</span>
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
                    Cancel
                  </button>
                    <button
                      type="button"
                      onClick={createInquiry}
                      disabled={!isRequestReady || isSubmittingInquiry}
                      className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                    {isSubmittingInquiry ? "Sending..." : "Send Request"}
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
