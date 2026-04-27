import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Edit,
  Eye,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import DashboardLayout from "../../components/layout/DashboardLayout";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { formatCompactCurrency } from "../../utils/helper";
import { ROUTES } from "../../utils/routePaths";

const ManageListings = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const [listings, setListings] = useState([]);

  const formatOwnerListings = useCallback(
    (items = []) =>
      items.map((listing) => ({
        id: listing._id,
        title: listing.title,
        hostelName:
          listing?.owner?.hostelName || listing?.owner?.name || "Hostel Owner",
        location: listing.location,
        category: listing.category,
        roomType: listing.roomType,
        rent: listing.dailyRent ?? listing.monthlyRent,
        deposit: listing.deposit,
        availableBeds: listing.availableBeds,
        status: listing.isClosed ? "Closed" : "Active",
        inquiries: listing.inquiryCount || 0,
        createdAt: listing.createdAt,
        logo: listing?.owner?.hostelLogo,
      })),
    []
  );

  const fetchListings = useCallback(
    async (shouldUpdateLoading = true) => {
      if (shouldUpdateLoading) {
        setIsLoading(true);
      }
      try {
        const response = await axiosInstance.get(API_PATHS.LISTINGS.GET_OWNER);
        setListings(formatOwnerListings(response.data || []));
      } catch (error) {
        console.error("Error fetching owner listings:", error);
      } finally {
        if (shouldUpdateLoading) {
          setIsLoading(false);
        }
      }
    },
    [formatOwnerListings]
  );

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesSearch =
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.hostelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || listing.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [listings, searchTerm, statusFilter]);

  const refreshListings = async () => {
    await fetchListings(false);
  };

  const handleStatusChange = async (listingId) => {
    try {
      await axiosInstance.put(API_PATHS.LISTINGS.TOGGLE_CLOSE(listingId));
      toast.success("Listing status updated.");
      await refreshListings();
    } catch (error) {
      console.error("Error toggling listing status:", error);
      toast.error("Failed to update listing status.");
    }
  };

  const handleDeleteListing = async (listingId) => {
    try {
      await axiosInstance.delete(API_PATHS.LISTINGS.DELETE(listingId));
      toast.success("Listing deleted successfully.");
      await refreshListings();
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error("Failed to delete listing.");
    }
  };

  return (
    <DashboardLayout activeMenu="manage-listings">
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Manage Listings
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Create, edit, close, and review inquiry performance for your hostel listings.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-sm text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25"
              onClick={() => navigate(ROUTES.POST_LISTING)}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Listing
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute inset-y-0 left-0 my-auto ml-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="block w-full pl-10 pr-4 py-4 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-0 transition-all duration-200 bg-gray-50/50"
                />
              </div>

              <div className="md:w-48">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="block w-full px-4 py-4 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="my-4 text-sm text-gray-600">
              Showing {filteredListings.length} listing{filteredListings.length === 1 ? "" : "s"}
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-500">
              Loading listings...
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
              <p className="text-gray-500">Try a different search or create a new listing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(ROUTES.OWNER_LISTING_DETAILS(listing.id))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(ROUTES.OWNER_LISTING_DETAILS(listing.id));
                    }
                  }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left transition-all duration-200 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {listing.logo ? (
                        <img
                          src={listing.logo}
                          alt={listing.hostelName}
                          className="w-16 h-16 rounded-2xl object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-blue-600" />
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-blue-600 font-medium">{listing.hostelName}</p>
                        <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {listing.location} * {listing.category} * {listing.roomType}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        listing.status === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {listing.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Daily Rent</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCompactCurrency(listing.rent)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Deposit</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCompactCurrency(listing.deposit)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Beds</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {listing.availableBeds || 0}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Inquiries</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {listing.inquiries}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-gray-500">
                    Posted {moment(listing.createdAt).format("Do MMM YYYY")}
                  </div>

                  <div className="flex flex-wrap gap-3 mt-6">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(ROUTES.INQUIRIES, { state: { listingId: listing.id } });
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      View Inquiries
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(ROUTES.POST_LISTING, { state: { listingId: listing.id } });
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleStatusChange(listing.id);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      {listing.status === "Active" ? "Close" : "Reopen"}
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteListing(listing.id);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageListings;
