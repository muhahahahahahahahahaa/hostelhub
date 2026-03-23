import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Eye,
  MapPin,
  Users,
} from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { useLocation, useNavigate } from "react-router-dom";
import moment from "moment";
import { getInitials } from "../../utils/helper";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatusBadge from "../../components/StatusBadge";
import InquiryPreview from "../../components/Cards/InquiryPreview";
import { ROUTES } from "../../utils/routePaths";

const InquiryViewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedListingId = location.state?.listingId || location.state?.jobId || null;
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState(null);

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

  const groupedInquiries = useMemo(() => {
    return inquiries.reduce((acc, inquiry) => {
      const listingId = inquiry.listing._id;
      if (!acc[listingId]) {
        acc[listingId] = {
          listing: inquiry.listing,
          inquiries: [],
        };
      }
      acc[listingId].inquiries.push(inquiry);
      return acc;
    }, {});
  }, [inquiries]);

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
          </div>

          {Object.keys(groupedInquiries).length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Users className="mx-auto h-24 w-24 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No inquiries available
              </h3>
              <p className="mt-2 text-gray-500">
                New renter inquiries will appear here as soon as they arrive.
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

                        <div className="flex items-center gap-3">
                          <StatusBadge status={inquiry.status} />
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
