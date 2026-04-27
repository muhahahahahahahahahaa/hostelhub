import { CalendarDays, MapPin, Search } from "lucide-react"

const SearchHeader = ({filters, handleFilterChange }) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2x shadow-xl shadow-gray-200 border border-white/20 p-4 lg:p-8 mb-6 lg:mb-8">
        <div className="flex flex-col gap-4 lg:gap-6">
            <div className="text-center lg:text-left">
                <h1 className="text-2xl lg:text-2xl font-semibold text-gray-900 mb-2">
                    Browse Hostels
                </h1>
                <p className="text-gray-600 text-sm lg:text-base">
                    Filter listings by location, room type, and budget
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-[1]"/>
                    <input
                        type="text"
                        placeholder="Hostel name, amenity, or keyword"
                        className="w-full pl-12 pr-4 py-2 lg:py-2.5 border border-gray-200 rounded-xl lg:rounded-xl outline-0 text-base bg-white/50 backdrop-blur-sm"
                        value={filters.keyword}
                        onChange={(e) => handleFilterChange("keyword", e.target.value)}
                    />
                </div>

                <div className="relative min-w-0 lg:min-w-[200px]">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-[1]"/>
                    <input
                        type="text"
                        placeholder="Location"
                        className="w-full pl-12 pr-4 py-2 lg:py-2.5 border border-gray-200 rounded-xl lg:rounded-xl outline-0 text-base bg-white/50 backdrop-blur-sm"
                        value={filters.location}
                        onChange={(e) => handleFilterChange("location", e.target.value)}
                    />
                </div>

                <button type="button" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 lg:px-10 py-3 lg:py-2.5 rounded-xl lg:rounded-xl hover:from-blue-700 hover:to-blue-700 transition-all duration-200 font-semibold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    Search Hostels
                </button>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
                <div>
                    <p className="mb-2 text-sm font-medium text-gray-500">From</p>
                    <div className="relative">
                        <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-[1]" />
                        <input
                            type="date"
                            className="w-full pl-12 pr-4 py-2 lg:py-2.5 border border-gray-200 rounded-xl outline-0 text-base bg-white/50 backdrop-blur-sm"
                            value={filters.requestedFrom || ""}
                            max={filters.requestedTo || undefined}
                            onChange={(e) => handleFilterChange("requestedFrom", e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <p className="mb-2 text-sm font-medium text-gray-500">To</p>
                    <div className="relative">
                        <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-[1]" />
                        <input
                            type="date"
                            className="w-full pl-12 pr-4 py-2 lg:py-2.5 border border-gray-200 rounded-xl outline-0 text-base bg-white/50 backdrop-blur-sm"
                            value={filters.requestedTo || ""}
                            min={filters.requestedFrom || undefined}
                            onChange={(e) => handleFilterChange("requestedTo", e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default SearchHeader
