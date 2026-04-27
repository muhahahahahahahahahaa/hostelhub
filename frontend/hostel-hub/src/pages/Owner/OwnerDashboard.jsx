import { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  MessageSquare,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import moment from "moment";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import DashboardLayout from "../../components/layout/DashboardLayout";
import LoadingSpinner from "../../components/LoadingSpinner";
import ListingDashboardCard from "../../components/Cards/ListingDashboardCard";
import InquiryDashboardCard from "../../components/Cards/InquiryDashboardCard";
import ChatDashboardCard from "../../components/Cards/ChatDashboardCard";
import InquiryPreview from "../../components/Cards/InquiryPreview";
import { ROUTES } from "../../utils/routePaths";

const Card = ({ title, subtitle, headerActions, className = "", children }) => (
  <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}>
    {(title || headerActions) ? (
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle ? <p className="text-sm text-gray-500 mt-1">{subtitle}</p> : null}
        </div>
        {headerActions}
      </div>
    ) : null}
    <div className={title ? "px-6 pb-6" : "p-6"}>{children}</div>
  </div>
);

const StatCard = ({ title, value, icon, trendValue, color, helperText = "" }) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-emerald-500 to-emerald-600",
    purple: "from-violet-500 to-violet-600",
    orange: "from-orange-500 to-orange-600",
  };

  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color]} text-white border-0`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          <div className="flex items-center mt-2 text-sm">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="font-medium">{trendValue}%</span>
          </div>
          {helperText ? (
            <p className="mt-2 text-xs text-white/85">{helperText}</p>
          ) : null}
        </div>
        <div className="bg-white/10 p-3 rounded-xl">{icon}</div>
      </div>
    </Card>
  );
};

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchOverview = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get(API_PATHS.DASHBOARD.OVERVIEW);
        if (isMounted && response.status === 200) {
          setDashboardData(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch owner dashboard overview", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleViewInquiry = async (inquiryId) => {
    try {
      const response = await axiosInstance.get(API_PATHS.INQUIRIES.GET_BY_ID(inquiryId));
      setSelectedInquiry(response.data);
    } catch (error) {
      console.error("Failed to fetch inquiry preview", error);
      toast.error(error?.response?.data?.message || "Failed to open inquiry.");
    }
  };

  const openChatForInquiry = async (inquiry) => {
    try {
      const response = await axiosInstance.post(API_PATHS.CHATS.ACCESS, {
        listingId: inquiry?.listing?._id,
        renterId: inquiry?.renter?._id,
      });

      setSelectedInquiry(null);
      navigate(`${ROUTES.CHATS}?chatId=${response.data._id}`);
    } catch (error) {
      console.error("Failed to open inquiry chat", error);
      toast.error(error?.response?.data?.message || "Failed to open chat.");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout activeMenu="owner-dashboard">
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="owner-dashboard">
      <div className="max-w-7xl mx-auto space-y-8 mb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title="Active Listings"
            value={dashboardData?.counts?.totalActiveListings || 0}
            icon={<Building2 className="h-6 w-6" />}
            trendValue={dashboardData?.counts?.trends?.activeListings || 0}
            color="blue"
          />
          <StatCard
            title="Total Inquiries"
            value={dashboardData?.counts?.totalInquiries || 0}
            icon={<Users className="h-6 w-6" />}
            trendValue={dashboardData?.counts?.trends?.totalInquiries || 0}
            color="green"
          />
          <StatCard
            title="Confirmed Inquiries"
            value={dashboardData?.counts?.totalConfirmed || 0}
            icon={<CheckCircle2 className="h-6 w-6" />}
            trendValue={dashboardData?.counts?.trends?.totalConfirmed || 0}
            color="purple"
          />
          <StatCard
            title="Chat Threads"
            value={dashboardData?.counts?.totalChats || 0}
            icon={<MessageSquare className="h-6 w-6" />}
            trendValue={dashboardData?.counts?.trends?.totalChats || 0}
            helperText={`${dashboardData?.counts?.unreadChats || 0} unread`}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card
            title="Recent Listings"
            subtitle="Your newest hostel listings"
            headerActions={
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => navigate(ROUTES.MANAGE_LISTINGS)}
              >
                View all
              </button>
            }
          >
            <div className="space-y-3">
              {dashboardData?.data?.recentListings?.map((listing) => (
                <ListingDashboardCard
                  key={listing._id}
                  listing={listing}
                  onClick={() => navigate(ROUTES.OWNER_LISTING_DETAILS(listing._id))}
                />
              ))}
            </div>
          </Card>

          <Card
            title="Recent Inquiries"
            subtitle="Latest renter activity"
            headerActions={
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => navigate(ROUTES.INQUIRIES)}
              >
                View all
              </button>
            }
          >
            <div className="space-y-3">
              {dashboardData?.data?.recentInquiries?.map((item) => (
                <InquiryDashboardCard
                  key={item._id}
                  renter={item?.renter || null}
                  listingTitle={item?.listing?.title || ""}
                  time={moment(item?.updatedAt || item?.createdAt).fromNow()}
                  onClick={() => handleViewInquiry(item._id)}
                />
              ))}
            </div>
          </Card>
        </div>

        <Card
          title="Recent Chats"
          subtitle="See which renter messaged you and jump into the thread"
          headerActions={
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              onClick={() => navigate(ROUTES.CHATS)}
            >
              View all
            </button>
          }
        >
          <div className="space-y-3">
            {dashboardData?.data?.recentChats?.length ? (
              dashboardData.data.recentChats.slice(0, 4).map((chat) => (
                <ChatDashboardCard
                  key={chat._id}
                  chat={chat}
                  onClick={() => navigate(`${ROUTES.CHATS}?chatId=${chat._id}`)}
                />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                No renter chats yet.
              </div>
            )}
          </div>
        </Card>

        <Card
          title="Quick Actions"
          subtitle="Common owner tasks"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "Post Listing",
                icon: Plus,
                color: "bg-blue-50 text-blue-700",
                path: ROUTES.POST_LISTING,
              },
              {
                title: "Review Inquiries",
                icon: Users,
                color: "bg-green-50 text-green-700",
                path: ROUTES.INQUIRIES,
              },
              {
                title: "Open Chats",
                icon: MessageSquare,
                color: "bg-orange-50 text-orange-700",
                path: ROUTES.CHATS,
              },
              {
                title: "Hostel Profile",
                icon: Building2,
                color: "bg-orange-50 text-orange-700",
                path: ROUTES.OWNER_PROFILE,
              },
            ].map((action) => (
              <button
                key={action.title}
                type="button"
                className="flex items-center space-x-3 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200 text-left"
                onClick={() => navigate(action.path)}
              >
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="font-medium text-gray-900">{action.title}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
      {selectedInquiry ? (
        <InquiryPreview
          selectedInquiry={selectedInquiry}
          setSelectedInquiry={setSelectedInquiry}
          onOpenChat={openChatForInquiry}
          handleClose={() => setSelectedInquiry(null)}
        />
      ) : null}
    </DashboardLayout>
  );
};

export default OwnerDashboard;
