import { Clock } from "lucide-react";

const InquiryDashboardCard = ({ renter, listingTitle, time, onClick }) => {
  if (!renter) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border border-gray-100 p-4 text-left transition-colors hover:border-gray-200 hover:bg-gray-50"
    >
        <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                    {renter.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                </span>
            </div>
            <div>
                <h4 className="text-[15px] font-medium text-gray-900">
                    {renter.name}
                </h4>
                <p className="text-sm text-gray-500">
                    Inquiry for {listingTitle}
                </p>
            </div>
        </div>
        <div className="flex items-center space-x-3">
            <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                {time}
            </div>
        </div>
    </button>
  );
};

export default InquiryDashboardCard;
