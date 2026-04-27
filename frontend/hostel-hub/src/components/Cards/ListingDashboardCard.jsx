import { Building2 } from "lucide-react";
import moment from "moment";

const ListingDashboardCard = ({ listing, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors text-left"
    >
        <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600"/>
            </div>
            <div>
                <h4 className="text-[15px] font-medium text-gray-900">{listing.title}</h4>
                <p className="text-xs text-gray-500">
                    {listing.location} * {moment(listing.createdAt).format("Do MM YYYY")}
                </p>
            </div>
        </div>
        <div className="flex items-center space-x-3"> 
            <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                    !listing.isClosed
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                }`}
            >
                {listing.isClosed ? "Closed" : "Active"}
            </span>
        </div>
    </button>
  )
}

export default ListingDashboardCard; 
