import { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import DashboardLayout from "../../components/layout/DashboardLayout";
import LoadingSpinner from "../../components/LoadingSpinner";
import ListingDashboardCard from "../../components/Cards/ListingDashboardCard";
import InquiryDashboardCard from "../../components/Cards/InquiryDashboardCard";
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

const StatCard = ({ title, value, icon, trendValue, color }) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-emerald-500 to-emerald-600",
    purple: "from-violet-500 to-violet-600",
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              {dashboardData?.data?.recentListings?.slice(0, 3)?.map((listing) => (
                <ListingDashboardCard key={listing._id} listing={listing} />
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
              {dashboardData?.data?.recentInquiries?.slice(0, 3)?.map((item) => (
                <InquiryDashboardCard
                  key={item._id}
                  renter={item?.renter || null}
                  listingTitle={item?.listing?.title || ""}
                  time={moment(item?.updatedAt || item?.createdAt).fromNow()}
                />
              ))}
            </div>
          </Card>
        </div>

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
    </DashboardLayout>
  );
};

export default OwnerDashboard;
