import {
    BedDouble,
    MapPin,
    Coins,
    ArrowLeft,
    Building2,
    Clock,
    ImagePlus,
    Users,
} from "lucide-react";
import { AMENITY_OPTIONS, CATEGORIES, ROOM_TYPES } from "../../utils/data";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency } from "../../utils/helper";

const ListingPreview = ({ formData, setIsPreview }) => {
    const {user} = useAuth()
    const amenities = formData.amenities || [];
    const hostelName = user?.hostelName || "Hostel owner";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 py-8 px-4 sm:px-6 lg:px-80">
            <div className="max-w-4xl mx-auto">
                {/*header with glassmorphism effect */}
                <div className="mb-8 backdrop-blur-sm bg-white/80 border border-white/20 shadow-xl rounded-2xl px-6 pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                Listing Preview
                            </h2>
                        </div>
                        <button
                            onClick={() => setIsPreview(false)}
                            className="group flex items-center space-x-2 px-6 py-3 text-xs md:text-sm font-medium text-gray-600 hover:text-white bg-white/50 hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 border-gray-200 hover:border-transparent rounded-xl transition-all duration-300 shadow-lg shadow-gray-100 hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            <span>Back to Edit</span>
                        </button>
                    </div>
                    {/*Main content card */}
                    <div className="">
                        {/*Hero section with clean background */}
                        <div className="relative bg-white px-0 pb-8 mt-8 border-b border-gray-100">
                            <div className="relative z-10">
                                {formData.images?.length > 0 ? (
                                    <div className="mb-6 space-y-3">
                                        <img
                                            src={formData.images[0]}
                                            alt={formData.title || "Listing preview"}
                                            className="h-72 w-full rounded-2xl object-cover border border-gray-200"
                                        />
                                        {formData.images.length > 1 ? (
                                            <div className="grid grid-cols-4 gap-3">
                                                {formData.images.slice(1, 5).map((image, index) => (
                                                    <img
                                                        key={`${image}-${index}`}
                                                        src={image}
                                                        alt={`Listing preview ${index + 2}`}
                                                        className="h-20 w-full rounded-xl object-cover border border-gray-200"
                                                    />
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : (
                                    <div className="mb-6 flex h-40 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-gray-500">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <ImagePlus className="h-4 w-4" />
                                            <span>No listing images added yet</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start justify-between mb-0">
                                    <div className="flex-1">
                                        <h1 className="text-lg lg:text-xl font-semibold mb-2 leading-tight text-gray-900">
                                            {formData.title}
                                        </h1>
                                        <p className="text-sm text-gray-500 mb-2">{hostelName}</p>

                                        <div className="flex items-center space-x-4 text-gray-600">
                                            <div className="flex items-center space-x-2">
                                                <MapPin className="h-4 w-4" />
                                                <span className="text-sm font-medium">
                                                    {formData.location}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {user?.hostelLogo ? (
                                        <img
                                            src={user.hostelLogo}
                                            alt="Hostel Logo"
                                            className="h-16 md:h-20 w-16 md:w-20 object-cover rounded-2xl border-4 border-white/20 shadow-lg"
                                        />
                                    ) : (
                                        <div className="h-20 w-20 bg-gray-50 border-2 border-gray-200 rounded-2xl flex items-center justify-center">
                                            <Building2 className="h-8 w-8 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/*tags */}
                                <div className="flex flex-wrap gap-3 mt-6 md:mt-0">
                                    <span className="px-4 py-2 bg-blue-50 text-sm text-blue-700 font-semibold rounded-full border border-blue-200">
                                        {
                                            CATEGORIES.find((c) => c.value === formData.category)
                                                ?.label
                                        }
                                    </span>
                                    <span className="px-4 py-2 text-sm bg-purple-50 text-purple-700 font-semibold rounded-full border border-purple-200">
                                        {ROOM_TYPES.find((room) => room.value === formData.roomType)?.label}
                                    </span>
                                    <span className="px-4 py-2 text-sm bg-emerald-50 text-emerald-700 font-semibold rounded-full border border-emerald-200 inline-flex items-center gap-2">
                                        <BedDouble className="h-4 w-4" />
                                        {formData.availableBeds || 0} beds
                                    </span>
                                    <div className="flex items-center space-x-1 px-4 py-2 bg-gray-50 text-sm text-gray-700 font-semibold rounded-full border border-gray-200">
                                        <Clock className="h-4 w-4" />
                                        <span>Posted today</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/*content section */}
                        <div className="px-0 pb-8 space-y-8">
                            {/*salary section */}
                            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-6 rounded-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full -translate-y-16 translate-x-16"></div>
                                <div className="relative z-10">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                                                <Coins className="h-4 md:h-6 w-4 md:w-6 text-white"/>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                                    Monthly Rent
                                                </h3>
                                                <div className="text-sm md:text-lg font-bold text-gray-900">
                                                    {formatCurrency(formData.monthlyRent)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="hidden md:flex items-center space-x-2 text-sm text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full justify-center">
                                            <Users className="h-4 w-4"/>
                                            <span>{formData.availableBeds || 0} beds free</span>
                                        </div>
                                        <div className="md:text-right">
                                            <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                                Deposit
                                            </h3>
                                            <div className="text-sm md:text-lg font-bold text-gray-900">
                                                {formatCurrency(formData.deposit)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/*amenities */}
                            <div className="space-y-4">
                                <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                                    <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-cyan-600 rounded-full"></div>
                                    <span className="text-base md:text-lg">Amenities</span>
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {amenities.length > 0 ? amenities.map((amenity) => (
                                        <span
                                            key={amenity}
                                            className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 font-medium"
                                        >
                                            {AMENITY_OPTIONS.find((option) => option.value === amenity)?.label || amenity}
                                        </span>
                                    )) : (
                                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-sm text-gray-500">
                                            No amenities added yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* description */}
                            <div className="space-y-4">
                                <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                                    <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                                    <span className="text-base md:text-lg">Hostel Description</span>
                                </h3>
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-6">
                                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {formData.description}
                                    </div>
                                </div>
                            </div>
                            {/*requirements */}
                            <div className="space-y-4">
                                <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                                    <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
                                    <span className="text-base md:text-lg">House Rules</span>
                                </h3>
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-6">
                                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {formData.houseRules}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ListingPreview; 
