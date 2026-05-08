import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  MapPin,
  MessageSquare,
  Search,
  SendHorizontal,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import moment from "moment";
import toast from "react-hot-toast";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/layout/Navbar";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { ROUTES } from "../../utils/routePaths";
import { translateStatus } from "../../utils/locale";
import { getInitials } from "../../utils/helper";
import { usePreferences } from "../../context/PreferencesContext";

const getParticipantName = (participant, t) =>
  participant?.hostelName || participant?.name || t("unknownUser");

const getParticipantImage = (participant) =>
  participant?.avatar || participant?.hostelLogo || "";

const getThreadParticipant = (thread) =>
  thread?.otherParticipant || thread?.owner || thread?.renter || null;

const getThreadPreview = (thread, language, t) => {
  if (thread?.lastMessage) return thread.lastMessage;
  const listingTitle = thread?.listing?.title || t("thisListing");
  return language === "en"
    ? `Start a chat about ${listingTitle}`
    : `${listingTitle}-ын талаар чат эхлүүлэх`;
};

const hasAttachment = (message) => Boolean(message?.attachmentUrl);

const formatTimelineLabel = (date) =>
  moment(date).calendar(null, {
    sameDay: "[Today]",
    lastDay: "[Yesterday]",
    lastWeek: "dddd",
    sameElse: "MMM D, YYYY",
  });

const buildTimelineItems = (messages = []) => {
  const items = [];
  let lastDividerKey = "";

  messages.forEach((message) => {
    const dividerKey = moment(message.createdAt).format("YYYY-MM-DD");

    if (dividerKey !== lastDividerKey) {
      items.push({
        type: "divider",
        key: `divider-${dividerKey}`,
        label: formatTimelineLabel(message.createdAt),
      });
      lastDividerKey = dividerKey;
    }

    items.push({
      type: "message",
      key: message._id,
      message,
    });
  });

  return items;
};

const SCROLL_BOTTOM_THRESHOLD = 96;
const INQUIRY_STATUS_OPTIONS = ["New", "Contacted", "Confirmed", "Declined"];
const inquiryStatusSelectClasses = {
  New: "border-sky-200 bg-sky-50 text-sky-800",
  Contacted: "border-amber-200 bg-amber-50 text-amber-800",
  Confirmed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Declined: "border-rose-200 bg-rose-50 text-rose-800",
};

const ChatInbox = () => {
  const { language, t } = usePreferences();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedChatId = searchParams.get("chatId");
  const selectedListingId = searchParams.get("listingId");

  const [threads, setThreads] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [listingContext, setListingContext] = useState(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingListing, setLoadingListing] = useState(false);
  const [sending, setSending] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [updatingInquiryStatus, setUpdatingInquiryStatus] = useState(false);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const messageEndRef = useRef(null);
  const conversationScrollRef = useRef(null);

  const resolvedChatId = useMemo(() => {
    if (selectedChatId) {
      return selectedChatId;
    }

    if (selectedListingId) {
      return (
        threads.find((thread) => thread?.listing?._id === selectedListingId)?._id || null
      );
    }

    return threads[0]?._id || null;
  }, [selectedChatId, selectedListingId, threads]);

  const loadThreads = useCallback(async () => {
    try {
      setLoadingThreads(true);
      const response = await axiosInstance.get(API_PATHS.CHATS.GET_MINE);
      setThreads(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to load chats", error);
      setThreads([]);
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    let isMounted = true;

    const loadSelectedChat = async () => {
      if (!resolvedChatId) {
        if (isMounted) {
          setActiveChat(null);
        }
        return;
      }

      try {
        setLoadingChat(true);
        const response = await axiosInstance.get(API_PATHS.CHATS.GET_BY_ID(resolvedChatId));
        if (!isMounted) return;

        setActiveChat(response.data);
        setThreads((prev) =>
          prev.map((thread) =>
            thread._id === response.data._id
              ? { ...thread, ...response.data, unreadCount: 0 }
              : thread
          )
        );
      } catch (error) {
        console.error("Failed to load selected chat", error);
        if (isMounted) {
          setActiveChat(null);
        }
      } finally {
        if (isMounted) {
          setLoadingChat(false);
        }
      }
    };

    loadSelectedChat();

    return () => {
      isMounted = false;
    };
  }, [resolvedChatId]);

  useEffect(() => {
    let isMounted = true;

    const loadListingContext = async () => {
      if (!selectedListingId || user?.role !== "renter") {
        setListingContext(null);
        return;
      }

      try {
        setLoadingListing(true);
        const response = await axiosInstance.get(
          API_PATHS.LISTINGS.GET_BY_ID(selectedListingId),
          {
            params: {
              renterId: user?._id,
            },
          }
        );

        if (isMounted) {
          setListingContext(response.data);
        }
      } catch (error) {
        console.error("Failed to load listing context for chat", error);
        if (isMounted) {
          setListingContext(null);
        }
      } finally {
        if (isMounted) {
          setLoadingListing(false);
        }
      }
    };

    loadListingContext();

    return () => {
      isMounted = false;
    };
  }, [selectedListingId, user]);

  const currentThread = activeChat || null;
  const currentListing = currentThread?.listing || listingContext || null;

  const filteredThreads = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    if (!query) {
      return threads;
    }

    return threads.filter((thread) => {
      const participantName = getParticipantName(getThreadParticipant(thread), t);
      const haystack = [
        participantName,
        thread?.listing?.title || "",
        thread?.listing?.location || "",
        getThreadPreview(thread, language, t),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [deferredSearchQuery, language, t, threads]);

  const timelineItems = useMemo(
    () => buildTimelineItems(currentThread?.messages || []),
    [currentThread]
  );

  const updateScrollButtonVisibility = useCallback(() => {
    const scrollContainer = conversationScrollRef.current;

    if (!scrollContainer) {
      setShowScrollToBottom(false);
      return;
    }

    const distanceFromBottom =
      scrollContainer.scrollHeight -
      scrollContainer.scrollTop -
      scrollContainer.clientHeight;

    setShowScrollToBottom(distanceFromBottom > SCROLL_BOTTOM_THRESHOLD);
  }, []);

  const scrollToConversationBottom = useCallback((behavior = "smooth") => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({
        behavior,
        block: "end",
      });
    }
  }, []);

  useEffect(() => {
    scrollToConversationBottom(timelineItems.length > 3 ? "smooth" : "auto");

    const frameId = window.requestAnimationFrame(() => {
      updateScrollButtonVisibility();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [
    resolvedChatId,
    scrollToConversationBottom,
    timelineItems.length,
    updateScrollButtonVisibility,
  ]);

  useEffect(() => {
    if (!currentThread) {
      setShowScrollToBottom(false);
    }
  }, [currentThread]);

  const handleOpenThread = (chatId) => {
    setSearchParams({ chatId });
  };

  const handleOpenListing = () => {
    const listingId = currentThread?.listing?._id || selectedListingId;
    if (listingId) {
      navigate(ROUTES.LISTING_DETAILS(listingId));
    }
  };

  const handleBackToThreadList = () => {
    setSearchParams({});
  };

  const handleInquiryStatusChange = async (status) => {
    const inquiryId = currentThread?.inquiry?._id;
    const previousStatus = currentThread?.inquiry?.status;

    if (!inquiryId || !previousStatus || previousStatus === status) {
      return;
    }

    if (status === "Confirmed" && user?.role === "owner") {
      navigate(ROUTES.OWNER_INQUIRY_CONFIRM(inquiryId));
      return;
    }

    setUpdatingInquiryStatus(true);
    setActiveChat((current) =>
      current
        ? {
            ...current,
            inquiry: {
              ...current.inquiry,
              status,
            },
          }
        : current
    );
    setThreads((current) =>
      current.map((thread) =>
        thread._id === resolvedChatId
          ? {
              ...thread,
              inquiry: thread?.inquiry
                ? {
                    ...thread.inquiry,
                    status,
                  }
                : thread.inquiry,
            }
          : thread
      )
    );

    try {
      await axiosInstance.put(API_PATHS.INQUIRIES.UPDATE_STATUS(inquiryId), { status });
      toast.success(t("statusUpdated"));
    } catch (error) {
      console.error("Failed to update inquiry status from chat", error);
      setActiveChat((current) =>
        current
          ? {
              ...current,
              inquiry: {
                ...current.inquiry,
                status: previousStatus,
              },
            }
          : current
      );
      setThreads((current) =>
        current.map((thread) =>
          thread._id === resolvedChatId
            ? {
                ...thread,
                inquiry: thread?.inquiry
                  ? {
                      ...thread.inquiry,
                      status: previousStatus,
                    }
                  : thread.inquiry,
              }
            : thread
        )
      );
      toast.error(error?.response?.data?.message || t("statusUpdateFailed"));
    } finally {
      setUpdatingInquiryStatus(false);
    }
  };

  const handleSendMessage = async () => {
    const message = draftMessage.trim();

    if (!message) {
      return;
    }

    if (!resolvedChatId && !selectedListingId) {
      toast.error(t("selectChatFirst"));
      return;
    }

    try {
      setSending(true);

      const response = resolvedChatId
        ? await axiosInstance.post(API_PATHS.CHATS.SEND_MESSAGE(resolvedChatId), {
            message,
          })
        : await axiosInstance.post(API_PATHS.CHATS.SEND_FOR_LISTING(selectedListingId), {
            message,
          });

      setDraftMessage("");
      setActiveChat(response.data);

      if (!resolvedChatId) {
        setSearchParams({ chatId: response.data._id });
      }

      await loadThreads();
    } catch (error) {
      console.error("Failed to send chat message", error);
      toast.error(error?.response?.data?.message || t("messageSendFailed"));
    } finally {
      setSending(false);
    }
  };

  const renderThreadList = () => {
    if (loadingThreads) {
      return (
        <div className="space-y-3 px-3 py-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`thread-skeleton-${index}`}
              className="flex items-center gap-3 rounded-3xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800"
            >
              <div className="h-14 w-14 animate-pulse rounded-full bg-slate-200" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (filteredThreads.length === 0) {
      return (
        <div className="px-6 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:ring-slate-800">
            <MessageSquare className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
            {threads.length === 0 ? t("noConversations") : t("noMatchingChats")}
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {threads.length === 0
              ? user?.role === "owner"
                ? t("ownerChatEmpty")
                : t("renterChatEmpty")
              : t("chatSearchEmpty")}
          </p>
        </div>
      );
    }

    return filteredThreads.map((thread) => {
      const participant = getThreadParticipant(thread);
      const participantName = getParticipantName(participant, t);
      const participantImage = getParticipantImage(participant);
      const isActive = thread._id === resolvedChatId;

      return (
        <button
          key={thread._id}
          type="button"
          onClick={() => handleOpenThread(thread._id)}
          className={`group w-full rounded-[28px] px-4 py-3 text-left transition-all duration-200 ${
            isActive
              ? "bg-blue-50 shadow-sm ring-1 ring-blue-100 dark:bg-blue-950/50 dark:ring-blue-800/70"
              : "hover:bg-white hover:shadow-sm dark:hover:bg-slate-800/80"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              {participantImage ? (
                <img
                  src={participantImage}
                  alt={participantName}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {getInitials(participantName)}
                </div>
              )}
              {thread.unreadCount > 0 ? (
                <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-[#f8fafd] bg-blue-600 dark:border-slate-950" />
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p
                  className={`truncate text-[15px] ${
                    thread.unreadCount > 0 || isActive
                      ? "font-semibold text-slate-900 dark:text-white"
                      : "font-medium text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {participantName}
                </p>
                <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                  {moment(thread.lastMessageAt || thread.updatedAt).fromNow()}
                </span>
              </div>

              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                {thread?.listing?.title || t("hostelListing")}
              </p>

              <div className="mt-1 flex items-center gap-2">
                <p
                  className={`truncate text-sm ${
                    thread.unreadCount > 0 ? "font-medium text-slate-700 dark:text-slate-200" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {getThreadPreview(thread, language, t)}
                </p>
                {thread.unreadCount > 0 ? (
                  <span className="inline-flex min-w-5 justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {thread.unreadCount}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </button>
      );
    });
  };

  const renderComposer = (disabled = false) => (
    <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
      <div className="flex w-full items-end gap-3">
        <div className="flex min-h-14 flex-1 items-end rounded-[30px] border border-slate-200 bg-slate-50 px-4 py-2 shadow-inner dark:border-slate-700 dark:bg-slate-900">
          <textarea
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (!sending) {
                  handleSendMessage();
                }
              }
            }}
            rows={1}
            maxLength={1000}
            placeholder={
              disabled
                ? t("chooseListingOrConversation")
                : t("typeMessage")
            }
            className="max-h-32 min-h-8 w-full resize-none bg-transparent py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:text-slate-400 dark:text-white dark:placeholder:text-slate-500 dark:disabled:text-slate-500"
            disabled={disabled || sending}
          />
        </div>

        <button
          type="button"
          onClick={handleSendMessage}
          disabled={disabled || sending || !draftMessage.trim()}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none dark:shadow-none dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const renderThreadHeader = ({ participant, listing, showBackButton = false }) => {
    const participantName = getParticipantName(participant, t);
    const participantImage = getParticipantImage(participant);
    const inquiryStatus = currentThread?.inquiry?.status;
    const canUpdateInquiryStatus = user?.role === "owner" && Boolean(currentThread?.inquiry?._id);

    return (
      <div className="border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {showBackButton ? (
              <button
                type="button"
                onClick={handleBackToThreadList}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
                aria-label={t("backToChats")}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : null}

            {participantImage ? (
              <img
                src={participantImage}
                alt={participantName}
                className="h-12 w-12 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {getInitials(participantName)}
              </div>
            )}

            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-slate-900 dark:text-white">
                {participantName}
              </h2>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                {user?.role === "owner" ? t("renter") : t("hostelOwner")}
                {listing?.title ? ` • ${listing.title}` : ""}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {canUpdateInquiryStatus ? (
              <div className="relative">
                <select
                  value={inquiryStatus}
                  disabled={updatingInquiryStatus}
                  onChange={(event) => handleInquiryStatusChange(event.target.value)}
                  className={`appearance-none rounded-full border px-4 py-2 pr-10 text-sm font-medium shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70 ${
                    inquiryStatusSelectClasses[inquiryStatus] ||
                    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  {INQUIRY_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                    {translateStatus(status, language)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-current opacity-70" />
              </div>
            ) : null}

            {listing?._id ? (
              <button
                type="button"
                onClick={handleOpenListing}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t("viewListing")}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const renderChatPanel = () => {
    if (loadingChat || loadingListing) {
      return (
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#f4f7fb] dark:bg-slate-950">
          <div className="border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
            <div className="flex w-full items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-full bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
              <div className="h-10 w-24 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_30%),linear-gradient(180deg,_#f6f9fd_0%,_#eff4fb_100%)] px-4 py-6 dark:bg-slate-950 dark:bg-none sm:px-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t("loadingConversation")}</p>
              </div>
            </div>
          </div>

          {renderComposer(true)}
        </div>
      );
    }

    if (currentThread) {
      const participant = getThreadParticipant(currentThread);
      const participantName = getParticipantName(participant, t);
      const participantImage = getParticipantImage(participant);

      return (
        <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#f4f7fb] dark:bg-slate-950">
          {renderThreadHeader({
            participant,
            listing: currentThread?.listing,
            showBackButton: true,
          })}

          <div
            ref={conversationScrollRef}
            onScroll={updateScrollButtonVisibility}
            className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_30%),linear-gradient(180deg,_#f6f9fd_0%,_#eff4fb_100%)] px-4 py-6 dark:bg-slate-950 dark:bg-none sm:px-6"
          >
            <div className="flex w-full flex-col">
              <div className="mb-8 flex flex-col items-center text-center">
                {participantImage ? (
                  <img
                    src={participantImage}
                    alt={participantName}
                    className="h-20 w-20 rounded-full object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
                    {getInitials(participantName)}
                  </div>
                )}
                <h3 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">
                  {participantName}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {currentThread?.listing?.title || t("chats")}
                </p>
                {currentThread?.listing?.location ? (
                  <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-400 dark:text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {currentThread.listing.location}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                {timelineItems.map((item) => {
                  if (item.type === "divider") {
                    return (
                      <div key={item.key} className="flex justify-center py-2">
                        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">
                          {item.label}
                        </span>
                      </div>
                    );
                  }

                  const { message } = item;
                  const mine = message?.sender?._id === user?._id;
                  const senderName = getParticipantName(message?.sender, t);
                  const senderImage = getParticipantImage(message?.sender);

                  return (
                    <div
                      key={item.key}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex max-w-[72%] items-end gap-2 xl:max-w-[68%] ${
                          mine ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        {!mine ? (
                          senderImage ? (
                            <img
                              src={senderImage}
                              alt={senderName}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              {getInitials(senderName)}
                            </div>
                          )
                        ) : (
                          <div className="h-8 w-8 shrink-0" />
                        )}

                        <div
                          className={`rounded-[24px] px-4 py-3 shadow-sm ${
                            mine
                              ? "rounded-br-md bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                              : "rounded-bl-md bg-white text-slate-900 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
                          }`}
                        >
                          {!mine ? (
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                              {senderName}
                            </p>
                          ) : null}
                          {message?.text ? (
                            <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>
                          ) : null}
                          {hasAttachment(message) ? (
                            <a
                              href={message.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`mt-3 flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-sm transition ${
                                mine
                                  ? "border-white/25 bg-white/10 text-white hover:bg-white/15"
                                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                              }`}
                            >
                              <span className="truncate font-medium">
                                {message.attachmentName || t("leasePdf")}
                              </span>
                              <span
                                className={`shrink-0 text-[11px] font-semibold ${
                                  mine ? "text-blue-100" : "text-blue-600"
                                }`}
                              >
                                {t("openPdf")}
                              </span>
                            </a>
                          ) : null}
                          <p
                            className={`mt-2 text-[11px] ${
                              mine ? "text-blue-100" : "text-slate-400 dark:text-slate-500"
                            }`}
                          >
                            {moment(message.createdAt).format("HH:mm")}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messageEndRef} />
              </div>
            </div>
          </div>

          {showScrollToBottom ? (
            <button
              type="button"
              onClick={() => scrollToConversationBottom()}
              className="absolute bottom-24 left-1/2 z-10 inline-flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-lg shadow-slate-200 transition-all duration-200 hover:bg-white hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-300 dark:shadow-none dark:hover:bg-slate-800 dark:hover:text-blue-300"
              aria-label={t("jumpToLatest")}
              title={t("jumpToLatest")}
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          ) : null}

          {renderComposer(false)}
        </div>
      );
    }

    if (currentListing && user?.role === "renter") {
      const owner = currentListing?.owner || null;
      const ownerName = getParticipantName(owner, t);
      const ownerImage = getParticipantImage(owner);

      return (
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#f4f7fb] dark:bg-slate-950">
          {renderThreadHeader({
            participant: owner,
            listing: currentListing,
            showBackButton: true,
          })}

          <div className="min-h-0 flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_30%),linear-gradient(180deg,_#f6f9fd_0%,_#eff4fb_100%)] px-6 py-10 dark:bg-slate-950 dark:bg-none">
            <div className="flex w-full flex-col items-center text-center">
              {ownerImage ? (
                <img
                  src={ownerImage}
                  alt={ownerName}
                  className="h-24 w-24 rounded-full object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-200 text-xl font-semibold text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
                  {getInitials(ownerName)}
                </div>
              )}

              <h3 className="mt-6 text-3xl font-semibold text-slate-900 dark:text-white">{ownerName}</h3>
              <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
                {currentListing?.title || t("hostelListing")}
              </p>
              {currentListing?.location ? (
                <p className="mt-2 inline-flex items-center gap-1 text-sm text-slate-400 dark:text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {currentListing.location}
                </p>
              ) : null}
              <p className="mt-6 max-w-lg text-sm leading-7 text-slate-500 dark:text-slate-400">
                {t("initialMessageHint")}
              </p>
            </div>
          </div>

          {renderComposer(false)}
        </div>
      );
    }

    return (
      <div className="hidden h-full items-center justify-center bg-[linear-gradient(180deg,_#f7faff_0%,_#eff5fb_100%)] dark:bg-slate-950 dark:bg-none lg:flex">
        <div className="max-w-md px-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:ring-slate-800">
            <Building2 className="h-9 w-9" />
          </div>
          <h3 className="mt-5 text-2xl font-semibold text-slate-900 dark:text-white">{t("selectConversation")}</h3>
          <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
            {t("selectConversationHint")}
          </p>
        </div>
      </div>
    );
  };

  const content = (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t("chats")}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {selectedListingId ? (
            <button
              type="button"
              onClick={handleOpenListing}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("back")}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() =>
              navigate(user?.role === "owner" ? ROUTES.INQUIRIES : ROUTES.FIND_HOSTELS)
            }
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {user?.role === "owner" ? t("viewInquiries") : t("findHostels")}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_-36px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
        <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[370px_minmax(0,1fr)]">
          <aside
            className={`min-h-0 flex flex-col bg-[#f8fafd] dark:bg-slate-950 ${
              currentThread || currentListing ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t("chats")}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {threads.length} {t("conversationCount")}
                  </p>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-blue-300 dark:ring-slate-800">
                  Inbox
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-[22px] bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t("searchChats")}
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              <div className="space-y-2">{renderThreadList()}</div>
            </div>
          </aside>

          <section
            className={`min-h-0 min-w-0 ${
              !currentThread && !currentListing ? "hidden lg:flex" : "flex"
            }`}
          >
            {renderChatPanel()}
          </section>
        </div>
      </div>
    </div>
  );

  if (user?.role === "owner") {
    return (
      <DashboardLayout
        activeMenu="chats"
        mainClassName="overflow-hidden p-6"
      >
        {content}
      </DashboardLayout>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-blue-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <Navbar />
      <div className="flex h-full w-full flex-col px-4 pb-6 pt-20 sm:px-6">
        {content}
      </div>
    </div>
  );
};

export default ChatInbox;
