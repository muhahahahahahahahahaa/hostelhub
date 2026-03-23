import { Coins, ExternalLink, FileText, MapPin, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getInitials } from "../../utils/helper";
import moment from "moment";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";

import StatusBadge from "../StatusBadge";
import { formatCurrency } from "../../utils/helper";

const statusOptions = ["New", "Contacted", "Confirmed", "Declined"];

const InquiryPreview = ({
    selectedInquiry,
    setSelectedInquiry,
    handleClose,
}) => {
    const [currentStatus, setCurrentStatus] = useState(selectedInquiry.status)
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setCurrentStatus(selectedInquiry.status);
    }, [selectedInquiry]);

    const onChangeStatus = async (e) => {
        const newStatus = e.target.value;
        setCurrentStatus(newStatus);
        setLoading(true);

        try {
            const response = await axiosInstance.put(
                API_PATHS.INQUIRIES.UPDATE_STATUS(selectedInquiry._id),
                {status: newStatus}
            );
            if (response.status === 200) {
                setSelectedInquiry({ ...selectedInquiry, status: newStatus });
                toast.success("Inquiry status updated successfully")
            }
        } catch (err) {
            console.error ("Error updating status:", err);
            setCurrentStatus(selectedInquiry.status);
        } finally {
            setLoading(false);
        }
    }
    return (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.2)] bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/*modal header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Renter Inquiry
                    </h3>
                    <button
                        onClick={() => handleClose()}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/*modal content */}
                <div className="p-6">
                    <div className="text-center mb-6">
                        {selectedInquiry.renter.avatar ? (
                            <img 
                                src={selectedInquiry.renter.avatar}
                                alt={selectedInquiry.renter.name}
                                className="h-20 w-20 rounded-full object-cover mx-auto"
                            />
                        ) : (
                            <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                                <span className="text-blue-600 font-semibold text-xl">
                                    {getInitials(selectedInquiry.renter.name)}
                                </span>
                            </div>
                        )}
                        <h4 className="mt-4 text-xl font-semibold text-gray-900">
                            {selectedInquiry.renter.name}
                        </h4>
                        <p className="text-gray-600">{selectedInquiry.renter.email}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">
                                Listing
                            </h5>
                            <p className="text-gray-700">{selectedInquiry.listing.title}</p>
                            <div className="mt-2 space-y-1 text-gray-600 text-sm">
                                <p className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {selectedInquiry.listing.location}
                                </p>
                                <p className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    {selectedInquiry.listing.roomType} * {selectedInquiry.listing.availableBeds || 0} beds
                                </p>
                                <p className="flex items-center gap-2">
                                    <Coins className="h-4 w-4" />
                                    {formatCurrency(selectedInquiry.listing.monthlyRent)}/month
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">
                                Background Check Document
                            </h5>
                            {selectedInquiry.renter.backgroundCheckDocument ? (
                                <a
                                    href={selectedInquiry.renter.backgroundCheckDocument}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                                >
                                    <FileText className="h-4 w-4" />
                                    <span>Open uploaded document</span>
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            ) : (
                                <p className="text-sm text-gray-500">No document uploaded.</p>
                            )}
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">
                                Inquiry Details
                            </h5>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Status:</span>
                                    <StatusBadge status={currentStatus} />
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Inquiry date:</span>
                                    <span className="text-gray-900">
                                        {moment(selectedInquiry.createdAt)?.format("Do MM YYYY")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/*status dropdown */}
                        <div className="mt-4">
                            <label className="block mb-1 text-sm text-gray-700 font-medium">
                                Change Inquiry Status
                            </label>
                            <select
                                value={currentStatus}
                                onChange={onChangeStatus}
                                disabled={loading}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {statusOptions.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                            {loading && (
                                <p className="text-xs text-gray-500 mt-1">Updating status...</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default InquiryPreview;
