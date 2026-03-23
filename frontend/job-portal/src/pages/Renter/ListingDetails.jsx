import {
  BedDouble,
  Building2,
  Coins,
  Clock,
  ImagePlus,
  MapPin,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { useEffect, useState } from "react";
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

  const createInquiry = async () => {
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }

    if (user.role !== "renter") {
      toast.error("Only renter accounts can send inquiries.");
      return;
    }

    try {
      await axiosInstance.post(API_PATHS.INQUIRIES.CREATE(resolvedListingId));
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

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      <Navbar />

      <div className="container mx-auto pt-24 px-4 pb-10">
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
                {listingDetails.inquiryStatus ? (
                  <StatusBadge status={listingDetails.inquiryStatus} />
                ) : listingDetails.isClosed ? (
                  <span className="inline-flex px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                    Listing Closed
                  </span>
                ) : canInquire ? (
                  <button
                    type="button"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold"
                    onClick={createInquiry}
                  >
                    {user ? "Send Inquiry" : "Log In to Send Inquiry"}
                  </button>
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
                  <h3 className="font-semibold text-gray-900">Monthly Rent</h3>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(listingDetails.monthlyRent)}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetails;
