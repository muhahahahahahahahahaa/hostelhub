import { useState, useEffect, useCallback } from "react";
import { Filter, Grid, List, X } from "lucide-react";
import LoadingSpinner from "../../components/LoadingSpinner";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import FilterContent from "./components/FilterContent";
import SearchHeader from "./components/SearchHeader";
import Navbar from "../../components/layout/Navbar";
import ListingCard from "../../components/Cards/ListingCard";
import { ROUTES } from "../../utils/routePaths";

const BrowseListings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [filters, setFilters] = useState({
    keyword: "",
    location: "",
    category: "",
    roomType: "",
    minRent: "",
    maxRent: "",
  });
  const [expandedSections, setExpandedSections] = useState({
    roomType: true,
    rent: true,
    category: true,
  });

  const loadListings = useCallback(
    async (filterParams = {}) => {
      try {
        setLoading(true);
        setFetchError("");

        const params = {};
        if (filterParams.keyword) params.keyword = filterParams.keyword;
        if (filterParams.location) params.location = filterParams.location;
        if (filterParams.minRent) params.minRent = filterParams.minRent;
        if (filterParams.maxRent) params.maxRent = filterParams.maxRent;
        if (filterParams.roomType) params.roomType = filterParams.roomType;
        if (filterParams.category) params.category = filterParams.category;
        if (user?.role === "renter") params.renterId = user._id;

        const response = await axiosInstance.get(API_PATHS.LISTINGS.GET_ALL, {
          params,
        });
        const listingData = Array.isArray(response.data)
          ? response.data
          : response.data.listings || [];
        setListings(listingData);
      } catch (error) {
        console.error("Error fetching listings:", error);
        setFetchError("Failed to load listings. Please try again.");
        setListings([]);
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadListings(filters);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [filters, loadListings]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const clearAllFilters = () => {
    setFilters({
      keyword: "",
      location: "",
      category: "",
      roomType: "",
      minRent: "",
      maxRent: "",
    });
  };

  const toggleSaveListing = async (listingId, isSaved) => {
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }

    if (user.role !== "renter") {
      toast.error("Only renter accounts can save listings.");
      return;
    }

    try {
      if (isSaved) {
        await axiosInstance.delete(API_PATHS.SAVED_LISTINGS.UNSAVE(listingId));
        toast.success("Listing removed from saved items.");
      } else {
        await axiosInstance.post(API_PATHS.SAVED_LISTINGS.SAVE(listingId));
        toast.success("Listing saved.");
      }

      await loadListings(filters);
    } catch (error) {
      console.error("Error toggling saved listing:", error);
      toast.error("Failed to update saved listings.");
    }
  };

  const createInquiry = async (listingId) => {
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }

    if (user.role !== "renter") {
      toast.error("Only renter accounts can send inquiries.");
      return;
    }

    try {
      await axiosInstance.post(API_PATHS.INQUIRIES.CREATE(listingId));
      toast.success("Inquiry sent successfully.");
      await loadListings(filters);
    } catch (error) {
      console.error("Error sending inquiry:", error);
      toast.error(
        error?.response?.data?.message || "Failed to send inquiry.",
      );
    }
  };

  if (loading && listings.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />

      <div className="min-h-screen mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
          <SearchHeader
            filters={filters}
            handleFilterChange={handleFilterChange}
          />

          <div className="flex gap-6 lg:gap-8">
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 sticky top-20">
                <h3 className="font-bold text-gray-900 text-xl mb-6">
                  Listing filters
                </h3>
                <FilterContent
                  toggleSection={toggleSection}
                  clearAllFilters={clearAllFilters}
                  expandedSections={expandedSections}
                  filters={filters}
                  handleFilterChange={handleFilterChange}
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 lg:mb-8 gap-4">
                <div>
                  <p className="text-gray-600 text-sm lg:text-base">
                    Total{" "}
                    <span className="font-bold text-gray-900">{listings.length}</span>{" "}
                    listing{listings.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowMobileFilters(true)}
                    className="lg:hidden flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>

                  <div className="flex items-center gap-3 lg:gap-4">
                    <div className="flex items-center border border-gray-200 rounded-xl p-1 bg-white">
                      <button
                        type="button"
                        onClick={() => setViewMode("grid")}
                        className={`p-2 rounded-lg transition-colors ${
                          viewMode === "grid"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("list")}
                        className={`p-2 rounded-lg transition-colors ${
                          viewMode === "list"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {fetchError ? (
                <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {fetchError}
                </div>
              ) : null}

              {listings.length === 0 ? (
                <div className="text-center py-16 lg:py-20 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20">
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3">
                    No listings found
                  </h3>
                  <p className="text-gray-600">
                    Try adjusting your filters and searching again.
                  </p>
                </div>
              ) : (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4 lg:gap-6"
                      : "space-y-4 lg:space-y-6"
                  }
                >
                  {listings.map((listing) => (
                    <ListingCard
                      key={listing._id}
                      listing={listing}
                      onClick={() => navigate(ROUTES.LISTING_DETAILS(listing._id))}
                      onToggleSave={() => toggleSaveListing(listing._id, listing.isSaved)}
                      onInquire={() => createInquiry(listing._id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showMobileFilters ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 text-lg">Filters</h3>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto h-full pb-20">
              <FilterContent
                toggleSection={toggleSection}
                clearAllFilters={clearAllFilters}
                expandedSections={expandedSections}
                filters={filters}
                handleFilterChange={handleFilterChange}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default BrowseListings;
