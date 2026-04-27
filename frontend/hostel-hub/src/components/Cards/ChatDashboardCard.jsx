import { Clock, MessageSquare } from "lucide-react";
import moment from "moment";
import { getInitials } from "../../utils/helper";

const ChatDashboardCard = ({ chat, onClick }) => {
  if (!chat?.renter) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-4 min-w-0">
        {chat?.renter?.avatar ? (
          <img
            src={chat.renter.avatar}
            alt={chat.renter.name}
            className="h-10 w-10 rounded-xl object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
            {getInitials(chat.renter.name)}
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-medium text-gray-900 truncate">
              {chat.renter.name}
            </p>
            {chat.ownerUnreadCount > 0 ? (
              <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                {chat.ownerUnreadCount} new
              </span>
            ) : null}
          </div>
          <p className="text-sm text-gray-500 truncate">
            Chat from {chat?.listing?.title || "listing"}
          </p>
          <p className="mt-1 text-sm text-gray-700 truncate">
            {chat.lastMessage || "No messages yet"}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 text-xs text-gray-500 shrink-0">
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          Chat
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {moment(chat.lastMessageAt || chat.updatedAt).fromNow()}
        </span>
      </div>
    </button>
  );
};

export default ChatDashboardCard;
