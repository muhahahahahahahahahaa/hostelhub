import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import toast from "react-hot-toast";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { ROUTES } from "../../utils/routePaths";
import { useAuth } from "../../context/AuthContext";

const NotificationBell = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const seenNotificationIdsRef = useRef(new Set());
  const firstLoadRef = useRef(true);

  const loadNotifications = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const response = await axiosInstance.get(API_PATHS.NOTIFICATIONS.GET_MINE);
      const nextNotifications = Array.isArray(response.data?.notifications)
        ? response.data.notifications
        : [];
      const nextUnreadCount = Number(response.data?.unreadCount || 0);

      setNotifications(nextNotifications);
      setUnreadCount(nextUnreadCount);

      const previousIds = seenNotificationIdsRef.current;
      const unreadNotifications = nextNotifications.filter((item) => !item.isRead);

      if (!firstLoadRef.current) {
        unreadNotifications.forEach((notification) => {
          if (previousIds.has(notification._id)) {
            return;
          }

          toast(notification.title, {
            icon: "🔔",
          });

          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(notification.title, {
              body: notification.message,
            });
          }
        });
      }

      seenNotificationIdsRef.current = new Set(nextNotifications.map((item) => item._id));
      firstLoadRef.current = false;
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadNotifications();

    const intervalId = window.setInterval(() => {
      loadNotifications({ silent: true });
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const sortedNotifications = useMemo(
    () => [...notifications].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
    [notifications],
  );

  const openNotification = async (notification) => {
    try {
      if (!notification.isRead) {
        await axiosInstance.put(API_PATHS.NOTIFICATIONS.MARK_READ(notification._id));
      }
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    } finally {
      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id ? { ...item, isRead: true, readAt: new Date() } : item,
        ),
      );
      setUnreadCount((current) => Math.max(0, current - (notification.isRead ? 0 : 1)));
    }

    setIsOpen(false);
    if (user?.role === "renter") {
      if (notification?.type === "reminder") {
        navigate(ROUTES.RENTER_PROFILE);
        return;
      }

      if (notification?.inquiry?._id) {
        navigate(ROUTES.RENTER_AGREEMENT_REVIEW(notification.inquiry._id));
        return;
      }

      navigate(ROUTES.RENTER_PROFILE);
      return;
    }

    if (notification?.type === "reminder") {
      navigate(ROUTES.INQUIRIES);
      return;
    }

    navigate(ROUTES.INQUIRIES);
  };

  const markAllAsRead = async () => {
    try {
      await axiosInstance.put(API_PATHS.NOTIFICATIONS.MARK_ALL_READ);
      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || new Date(),
        })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
      toast.error("Failed to mark notifications as read.");
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative rounded-xl p-2 text-gray-500 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-700"
        aria-label="Open notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-5 justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="fixed inset-x-3 top-[4.5rem] z-[70] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl sm:absolute sm:right-0 sm:top-12 sm:z-50 sm:w-[360px] sm:max-w-[360px] sm:inset-x-auto">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              <p className="text-xs text-gray-500">
                {user?.role === "renter" ? "Latest renter updates" : "Latest owner updates"}
              </p>
            </div>

            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </div>

          <div className="max-h-[min(65vh,420px)] overflow-y-auto sm:max-h-[420px]">
            {loading ? (
              <div className="px-4 py-6 text-sm text-gray-500">Loading notifications...</div>
            ) : sortedNotifications.length > 0 ? (
              sortedNotifications.map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => openNotification(notification)}
                  className={`w-full border-b border-gray-100 px-4 py-4 text-left transition-colors hover:bg-gray-50 ${
                    notification.isRead ? "bg-white" : "bg-blue-50/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs text-gray-400">
                        {moment(notification.createdAt).fromNow()}
                      </p>
                    </div>

                    {!notification.isRead ? (
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                    ) : null}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-sm text-gray-500">No notifications yet.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default NotificationBell;
