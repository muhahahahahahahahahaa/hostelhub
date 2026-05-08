import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  Banknote,
  Building2,
  CheckCircle2,
  MessageSquare,
  Plus,
  TrendingUp,
  Users,
  Wallet,
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
import { formatCurrency } from "../../utils/helper";
import { usePreferences } from "../../context/PreferencesContext";

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
  const { t } = usePreferences();
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
      toast.error(error?.response?.data?.message || t("failedOpenInquiry"));
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
      toast.error(error?.response?.data?.message || t("failedOpenChat"));
    }
  };

  const handleWithdraw = async () => {
    const availableBalance = Number(dashboardData?.wallet?.availableBalance || 0);
    if (availableBalance <= 0) {
      toast.error(t("noRevenue"));
      return;
    }

    try {
      const response = await axiosInstance.post(API_PATHS.DASHBOARD.WITHDRAW, {
        amount: availableBalance,
      });

      setDashboardData((current) => ({
        ...current,
        wallet: {
          ...(current?.wallet || {}),
          ...(response.data?.wallet || {}),
          canWithdraw: Number(response.data?.wallet?.availableBalance || 0) > 0,
          withdrawalRequests: [
            response.data?.withdrawal,
            ...((current?.wallet?.withdrawalRequests || []).filter(Boolean)),
          ].filter(Boolean),
        },
      }));

      toast.success(response.data?.message || t("withdrawRequested"));
    } catch (error) {
      toast.error(error?.response?.data?.message || t("noRevenue"));
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
            title={t("activeListings")}
            value={dashboardData?.counts?.totalActiveListings || 0}
            icon={<Building2 className="h-6 w-6" />}
            trendValue={dashboardData?.counts?.trends?.activeListings || 0}
            color="blue"
          />
          <StatCard
            title={t("totalInquiries")}
            value={dashboardData?.counts?.totalInquiries || 0}
            icon={<Users className="h-6 w-6" />}
            trendValue={dashboardData?.counts?.trends?.totalInquiries || 0}
            color="green"
          />
          <StatCard
            title={t("confirmedInquiries")}
            value={dashboardData?.counts?.totalConfirmed || 0}
            icon={<CheckCircle2 className="h-6 w-6" />}
            trendValue={dashboardData?.counts?.trends?.totalConfirmed || 0}
            color="purple"
          />
          <StatCard
            title={t("chatConversations")}
            value={dashboardData?.counts?.totalChats || 0}
            icon={<MessageSquare className="h-6 w-6" />}
            trendValue={dashboardData?.counts?.trends?.totalChats || 0}
            helperText={`${dashboardData?.counts?.unreadChats || 0} ${t("unread")}`}
            color="orange"
          />
        </div>

        <Card>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg dark:border-blue-900/70">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white/90">
                    <Wallet className="h-4 w-4" />
                    {t("wallet")}
                  </div>
                  <h2 className="mt-5 text-2xl font-bold">{t("rentalRevenue")}</h2>
                  <p className="mt-2 max-w-xl text-sm text-white/80">
                    {t("availableToWithdraw")}
                  </p>
                  <p className="mt-4 text-4xl font-bold">
                    {formatCurrency(dashboardData?.wallet?.availableBalance || 0)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleWithdraw}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-950 dark:text-blue-200 dark:hover:bg-gray-900"
                  disabled={!dashboardData?.wallet?.canWithdraw}
                >
                  <ArrowDownToLine className="h-4 w-4" />
                  {t("withdraw")}
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                  <p className="text-sm text-white/75">{t("pendingRevenue")}</p>
                  <p className="mt-2 text-xl font-bold">
                    {formatCurrency(dashboardData?.wallet?.pendingBalance || 0)}
                  </p>
                  <p className="mt-1 text-xs text-white/70">
                    {dashboardData?.wallet?.pendingCount || 0} {t("pendingBookings")}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                  <p className="text-sm text-white/75">{t("totalRevenue")}</p>
                  <p className="mt-2 text-xl font-bold">
                    {formatCurrency(dashboardData?.wallet?.totalRevenue || 0)}
                  </p>
                  <p className="mt-1 text-xs text-white/70">
                    {dashboardData?.wallet?.paidCount || 0} {t("paidBookings")}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-950">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t("recentPayments")}</h3>
                  <p className="text-sm text-gray-500">{t("rentalRevenue")}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <Banknote className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-3">
                {dashboardData?.wallet?.recentPayments?.length ? (
                  dashboardData.wallet.recentPayments.map((payment) => (
                    <div
                      key={payment._id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {payment?.listing?.title || t("rentalRevenue")}
                        </p>
                        <p className="mt-1 truncate text-xs text-gray-500">
                          {payment?.renter?.name || ""} · {payment?.paidAt ? moment(payment.paidAt).fromNow() : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                    {t("noRevenue")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card
            title={t("recentListings")}
            subtitle={t("recentListingsSubtitle")}
            headerActions={
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => navigate(ROUTES.MANAGE_LISTINGS)}
              >
                {t("viewAll")}
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
            title={t("recentInquiries")}
            subtitle={t("recentInquiriesSubtitle")}
            headerActions={
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => navigate(ROUTES.INQUIRIES)}
              >
                {t("viewAll")}
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
          title={t("recentChats")}
          subtitle={t("recentChatsSubtitle")}
          headerActions={
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              onClick={() => navigate(ROUTES.CHATS)}
            >
              {t("viewAll")}
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
                {t("noRenterChats")}
              </div>
            )}
          </div>
        </Card>

        <Card
          title={t("quickActions")}
          subtitle={t("ownerCommonTasks")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: t("postListing"),
                icon: Plus,
                color: "bg-blue-50 text-blue-700",
                path: ROUTES.POST_LISTING,
              },
              {
                title: t("viewInquiries"),
                icon: Users,
                color: "bg-green-50 text-green-700",
                path: ROUTES.INQUIRIES,
              },
              {
                title: t("openChatAction"),
                icon: MessageSquare,
                color: "bg-orange-50 text-orange-700",
                path: ROUTES.CHATS,
              },
              {
                title: t("ownerProfile"),
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
