import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Eye,
  MapPin,
  MessageSquare,
  Users,
} from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { useLocation, useNavigate } from "react-router-dom";
import moment from "moment";
import toast from "react-hot-toast";
import { getInitials } from "../../utils/helper";
import DashboardLayout from "../../components/layout/DashboardLayout";
import InquiryPreview from "../../components/Cards/InquiryPreview";
import { ROUTES } from "../../utils/routePaths";

const STATUS_OPTIONS = ["New", "Contacted", "Confirmed", "Declined"];

const statusSelectClasses = {
  New: "border-sky-200 bg-sky-50 text-sky-800",
  Contacted: "border-amber-200 bg-amber-50 text-amber-800",
  Confirmed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Declined: "border-rose-200 bg-rose-50 text-rose-800",
};

const InquiryViewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedListingId = location.state?.listingId || location.state?.jobId || null;
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [updatingInquiryId, setUpdatingInquiryId] = useState(null);
  const [selectedStatuses, setSelectedStatuses] = useState(STATUS_OPTIONS);

  const loadInquiries = useCallback(async () => {
    try {
      setLoading(true);

      if (selectedListingId) {
        const response = await axiosInstance.get(
          API_PATHS.INQUIRIES.GET_FOR_LISTING(selectedListingId),
        );
        setInquiries(response.data || []);
        return;
      }

      const listingsResponse = await axiosInstance.get(API_PATHS.LISTINGS.GET_OWNER);
      const ownerListings = listingsResponse.data || [];

      const inquiryGroups = await Promise.all(
        ownerListings.map(async (listing) => {
          const response = await axiosInstance.get(
            API_PATHS.INQUIRIES.GET_FOR_LISTING(listing._id),
          );
          return response.data || [];
        }),
      );

      setInquiries(inquiryGroups.flat());
    } catch (error) {
      console.error("Failed to fetch inquiries", error);
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, [selectedListingId]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const openChatForInquiry = useCallback(
    async (inquiry) => {
      try {
        const response = await axiosInstance.post(API_PATHS.CHATS.ACCESS, {
          listingId: inquiry?.listing?._id,
          renterId: inquiry?.renter?._id,
        });

        navigate(`${ROUTES.CHATS}?chatId=${response.data._id}`);
      } catch (error) {
        console.error("Failed to open inquiry chat", error);
        toast.error(error?.response?.data?.message || "Failed to open chat.");
      }
    },
    [navigate]
  );

  const handleStatusChange = useCallback(
    async (inquiryId, status) => {
      const previousInquiry = inquiries.find((item) => item._id === inquiryId);
      if (!previousInquiry || previousInquiry.status === status) {
        return;
      }

      if (status === "Confirmed") {
        navigate(ROUTES.OWNER_INQUIRY_CONFIRM(inquiryId));
        return;
      }

      setUpdatingInquiryId(inquiryId);
      setInquiries((current) =>
        current.map((item) => (item._id === inquiryId ? { ...item, status } : item)),
      );

      if (selectedInquiry?._id === inquiryId) {
        setSelectedInquiry((current) => (current ? { ...current, status } : current));
      }

      try {
        await axiosInstance.put(API_PATHS.INQUIRIES.UPDATE_STATUS(inquiryId), { status });
        toast.success("Inquiry status updated");
      } catch (error) {
        console.error("Failed to update inquiry status", error);
        setInquiries((current) =>
          current.map((item) =>
            item._id === inquiryId ? { ...item, status: previousInquiry.status } : item,
          ),
        );

        if (selectedInquiry?._id === inquiryId) {
          setSelectedInquiry((current) =>
            current ? { ...current, status: previousInquiry.status } : current,
          );
        }

        toast.error(error?.response?.data?.message || "Failed to update inquiry status.");
      } finally {
        setUpdatingInquiryId(null);
      }
    },
    [inquiries, navigate, selectedInquiry],
  );

  const groupedInquiries = useMemo(() => {
    return inquiries.reduce((acc, inquiry) => {
      const listingId = inquiry.listing._id;

      if (!selectedStatuses.includes(inquiry.status)) {
        return acc;
      }

      if (!acc[listingId]) {
        acc[listingId] = {
          listing: inquiry.listing,
          inquiries: [],
        };
      }
      acc[listingId].inquiries.push(inquiry);
      return acc;
    }, {});
  }, [inquiries, selectedStatuses]);

  const toggleStatusFilter = (status) => {
    setSelectedStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status],
    );
  };

  const hasVisibleInquiries = Object.keys(groupedInquiries).length > 0;

  return (
    <DashboardLayout activeMenu="inquiries">
      {loading ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading inquiries...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-6 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate(ROUTES.MANAGE_LISTINGS)}
                className="group flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-white bg-white/50 hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 border border-gray-200 hover:border-transparent rounded-xl transition-all duration-300 shadow-lg shadow-gray-100 hover:shadow-xl"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                <span>Back</span>
              </button>

              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Inquiries Overview</h1>
                <p className="text-sm text-gray-500">
                  Review renter interest across your hostel listings.
                </p>
              </div>
            </div>

            <div className="self-start rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Status Filter</p>
                  <p className="text-xs text-gray-500">Show only selected inquiries</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {STATUS_OPTIONS.map((status) => {
                  const checked = selectedStatuses.includes(status);

                  return (
                    <label
                      key={status}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors hover:border-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStatusFilter(status)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{status}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {inquiries.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Users className="mx-auto h-24 w-24 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No inquiries available
              </h3>
              <p className="mt-2 text-gray-500">
                New renter inquiries will appear here as soon as they arrive.
              </p>
            </div>
          ) : !hasVisibleInquiries ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Users className="mx-auto h-24 w-24 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No inquiries match this filter
              </h3>
              <p className="mt-2 text-gray-500">
                Try turning on more statuses from the filter on the right.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.values(groupedInquiries).map(({ listing, inquiries: inquiryItems }) => (
                <div key={listing._id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-white">{listing.title}</h2>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-blue-100">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">{listing.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{listing.roomType}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{listing.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                        <span className="text-sm text-white font-medium">
                          {inquiryItems.length} inquiries
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {inquiryItems.map((inquiry) => (
                      <div
                        key={inquiry._id}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {inquiry.renter.avatar ? (
                              <img
                                src={inquiry.renter.avatar}
                                alt={inquiry.renter.name}
                                className="h-12 w-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-semibold">
                                  {getInitials(inquiry.renter.name)}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {inquiry.renter.name}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {inquiry.renter.email}
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-gray-500 text-xs">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Inquiry sent {moment(inquiry.createdAt).format("Do MMM YYYY")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="relative">
                            <select
                              value={inquiry.status}
                              disabled={updatingInquiryId === inquiry._id}
                              onChange={(event) =>
                                handleStatusChange(inquiry._id, event.target.value)
                              }
                              className={`min-w-[132px] appearance-none rounded-full border px-4 py-2 pr-8 text-sm font-medium outline-none transition-colors ${statusSelectClasses[inquiry.status] || "border-gray-200 bg-gray-50 text-gray-800"} ${updatingInquiryId === inquiry._id ? "cursor-wait opacity-70" : "cursor-pointer"}`}
                            >
                              {STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                              <ChevronDown className="h-4 w-4" />
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => openChatForInquiry(inquiry)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Chat
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedInquiry(inquiry)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            View Inquiry
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedInquiry ? (
        <InquiryPreview
          selectedInquiry={selectedInquiry}
          setSelectedInquiry={setSelectedInquiry}
          onOpenChat={openChatForInquiry}
          handleClose={() => {
            setSelectedInquiry(null);
            loadInquiries();
          }}
        />
      ) : null}
    </DashboardLayout>
  );
};

export default InquiryViewer;
