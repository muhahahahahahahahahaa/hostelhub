import { Bookmark, Building2, Calendar, Coins, MapPin, Users } from "lucide-react";
import moment from "moment";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../StatusBadge";
import { formatCompactCurrency } from "../../utils/helper";

const ListingCard = ({
    listing,
    onClick,
    onToggleSave,
    onInquire,
    saved = false,
    hideInquiryAction = false,
}) => {
    const {user} = useAuth();
    const hostelName =
        listing?.owner?.hostelName || listing?.owner?.name || "Hostel Owner";
    const cardImage = listing?.images?.[0] || listing?.owner?.hostelLogo || "";
    const canShowInquiryState =
        Boolean(onInquire) || Boolean(listing?.inquiryStatus) || listing?.isClosed;

  return (
    <div 
        className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:shadow-gray-200 transition-all duration-300 group relative overflow-hidden cursor-pointer"
        onClick={onClick}
    >
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
                {cardImage ? (
                    <img
                        src={cardImage}
                        alt={listing?.title || "Listing"}
                        className="w-14 h-14 object-cover rounded-2xl border-4 border-white/20 shadow-lg"
                    />
                ) : (
                    <div className="w-14 h-14 bg-gray-50 border-2 border-gray-200 rounded-2xl flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-gray-400" />
                    </div>
                )}

                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-base group-hover:text-blue-600 transition-colors leading-snug">
                        {listing?.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">{hostelName}</p>
                </div>
            </div>
            {user && user.role === "renter" && (
                <button
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleSave();
                    }}
                >
                    <Bookmark
                        className={`w-5 h-5 hover:text-blue-600 ${
                            listing?.isSaved || saved ? "text-blue-600" : "text-gray-400"
                        }`}
                    />
                </button>
            )}
        </div>

        <div className="mb-5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                    <MapPin className="w-3 h-3" />
                    {listing?.location}
                </span>
                <span className="px-3 py-1 rounded-full font-medium bg-blue-100 text-blue-800">
                    {listing?.roomType}
                </span>
                <span className="flex items-center gap-1.5 bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                    {listing?.category}
                </span>
                <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-medium">
                    <Users className="w-3 h-3" />
                    {listing?.availableBeds || 0} beds
                </span>
            </div>
        </div>

        <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-5 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {listing?.createdAt
                        ? moment(listing.createdAt).format("Do MMM YYYY")
                        : "N/A"
                    }
                </span>
            </div>
        </div>

        <div className="flex items-end justify-between gap-4">
            <div>
                <div className="text-blue-600 font-semibold text-lg flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    {formatCompactCurrency(listing?.monthlyRent)}/month
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    Deposit: {formatCompactCurrency(listing?.deposit)}
                </div>
            </div>
            {canShowInquiryState && (
                <div className="flex flex-col items-end gap-2">
                    {!listing?.isClosed && !hideInquiryAction && onInquire ? (
                        <button
                            className={`text-sm px-5 py-2.5 rounded-xl transition-all duration-200 font-semibold ${
                                listing?.inquiryStatus
                                    ? "bg-blue-100 text-blue-700 cursor-not-allowed"
                                    : "bg-gradient-to-r from-blue-50 to-blue-50 text-blue-700 hover:text-white hover:from-blue-500 hover:to-blue-600 transform hover:-translate-y-0.5"
                            }`}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!listing?.inquiryStatus) {
                                    onInquire();
                                }
                            }}
                            disabled={Boolean(listing?.inquiryStatus)}
                        >
                            {listing?.inquiryStatus
                                ? "Booking Request Sent"
                                : "Request Booking Now"}
                        </button>
                    ) : null}

                    {listing?.inquiryStatus ? (
                        <StatusBadge status={listing?.inquiryStatus} />
                    ) : listing?.isClosed ? (
                        <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                            Closed
                        </span>
                    ) : null}
                </div>
            )}
        </div>
    </div>
  )
}

export default ListingCard;
