import {
  ArrowLeft,
  Bookmark,
  Grid,
  List,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { useEffect, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import ListingCard from "../../components/Cards/ListingCard";
import toast from "react-hot-toast";
import { ROUTES } from "../../utils/routePaths";

const SavedListings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedListingList, setSavedListingList] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSavedListings = async () => {
      if (!user) {
        navigate(ROUTES.LOGIN);
        return;
      }

      try {
        setLoading(true);
        const response = await axiosInstance.get(API_PATHS.SAVED_LISTINGS.GET_MINE);
        if (isMounted) {
          setSavedListingList(response.data);
        }
      } catch (error) {
        console.error("Error fetching saved listings:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSavedListings();

    return () => {
      isMounted = false;
    };
  }, [navigate, user]);

  const handleUnsaveListing = async (listingId) => {
    try {
      await axiosInstance.delete(API_PATHS.SAVED_LISTINGS.UNSAVE(listingId));
      toast.success("Зарыг хадгалсан жагсаалтаас хаслаа.");

      const response = await axiosInstance.get(API_PATHS.SAVED_LISTINGS.GET_MINE);
      setSavedListingList(response.data);
    } catch (error) {
      console.error("Error removing saved listing:", error);
      toast.error("Хадгалсан заруудыг шинэчилж чадсангүй.");
    }
  };

  const handleCreateInquiry = async (listingId) => {
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }

    if (user.role !== "renter") {
      toast.error("Зөвхөн түрээслэгч бүртгэл хүсэлт илгээх боломжтой.");
      return;
    }

    try {
      await axiosInstance.post(API_PATHS.INQUIRIES.CREATE(listingId));
      toast.success("Хүсэлт амжилттай илгээгдлээ.");

      const response = await axiosInstance.get(API_PATHS.SAVED_LISTINGS.GET_MINE);
      setSavedListingList(response.data);
    } catch (error) {
      console.error("Error sending inquiry from saved listings:", error);
      toast.error(
        error?.response?.data?.message || "Хүсэлт илгээж чадсангүй.",
      );
    }
  };

  const handleOpenChat = (listingId) => {
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }

    if (user.role !== "renter") {
      toast.error("Зөвхөн түрээслэгч бүртгэл чат эхлүүлэх боломжтой.");
      return;
    }

    navigate(`${ROUTES.CHATS}?listingId=${listingId}`);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      <Navbar />

      <div className="container mx-auto pt-24 px-4 pb-10">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="group flex items-center space-x-2 px-3.5 py-2.5 text-sm font-medium text-gray-600 hover:text-white bg-white/50 hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 border border-gray-200 hover:border-transparent rounded-xl transition-all duration-300 shadow-lg shadow-gray-100 hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              </button>

              <h1 className="text-lg lg:text-xl font-semibold leading-tight text-gray-900">
                Хадгалсан зарууд
              </h1>
            </div>

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

          {loading ? (
            <div className="py-10 text-center text-gray-500">Ачаалж байна...</div>
          ) : savedListingList.length === 0 ? (
            <div className="text-center py-16 lg:py-20 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20">
              <div className="text-gray-300 mb-6">
                <Bookmark className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3">
                Та одоогоор зар хадгалаагүй байна
              </h3>
              <p className="text-gray-600 mb-6">
                Таалагдсан хостелуудаа хадгалж дараа нь дахин хараарай.
              </p>
              <button
                type="button"
                onClick={() => navigate(ROUTES.FIND_HOSTELS)}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Зар хайх
              </button>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6"
                  : "space-y-4 lg:space-y-6"
              }
            >
              {savedListingList
                .filter((savedListing) => savedListing?.listing)
                .map((savedListing) => (
                <ListingCard
                  key={savedListing._id}
                  listing={savedListing?.listing}
                  onClick={() =>
                    navigate(ROUTES.LISTING_DETAILS(savedListing?.listing._id))
                  }
                  onToggleSave={() => handleUnsaveListing(savedListing?.listing._id)}
                  onChat={() => handleOpenChat(savedListing?.listing._id)}
                  onInquire={() => handleCreateInquiry(savedListing?.listing._id)}
                  saved
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedListings;
