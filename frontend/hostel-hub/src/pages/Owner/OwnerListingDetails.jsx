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
          toast.error("You do not have access to that listing.");
          navigate(ROUTES.MANAGE_LISTINGS, { replace: true });
          return;
        }

        setListingDetails(listingData);
        setSelectedImage(listingData?.images?.[0] || "");
      } catch (error) {
        console.error("Error fetching owner listing details", error);
        toast.error("Failed to load listing details.");
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
  }, [listingId, navigate, user]);

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
        listingDetails?.isClosed ? "Listing reopened successfully." : "Listing closed successfully."
      );
    } catch (error) {
      console.error("Error toggling listing status", error);
      toast.error("Failed to update listing status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this listing? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleting(true);
      await axiosInstance.delete(API_PATHS.LISTINGS.DELETE(listingId));
      toast.success("Listing deleted successfully.");
      navigate(ROUTES.MANAGE_LISTINGS, { replace: true });
    } catch (error) {
      console.error("Error deleting listing", error);
      toast.error("Failed to delete listing.");
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
      toast.error("No template source file is available.");
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
    return (
      <DashboardLayout activeMenu="manage-listings">
        <div className="max-w-7xl mx-auto rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-500">
          Loading listing details...
        </div>
      </DashboardLayout>
    );
  }

  if (!listingDetails) {
    return (
      <DashboardLayout activeMenu="manage-listings">
        <div className="max-w-7xl mx-auto rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-500">
          Listing not found.
        </div>
      </DashboardLayout>
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
              Back
            </button>

            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Listing Details</h1>
              <p className="text-sm text-gray-500">
                Review this listing the same way renters do, with owner controls on top.
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
              View Inquiries
            </button>
            <button
              type="button"
              onClick={() => navigate(ROUTES.POST_LISTING, { state: { listingId } })}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={updatingStatus}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60"
            >
              {listingDetails.isClosed ? "Reopen" : "Close"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
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

              <div className="flex items-center gap-3">
                {listingDetails.isClosed ? (
                  <span className="inline-flex px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                    Listing Closed
                  </span>
                ) : (
                  <span className="inline-flex px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
                    Listing Active
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
                  <div className="text-sm text-gray-500">No amenities listed.</div>
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OwnerListingDetails;
