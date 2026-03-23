const StatusBadge = ({status}) => {
    const statusConfig = {
        New: "bg-sky-100 text-sky-800",
        Contacted: "bg-amber-100 text-amber-800",
        Confirmed: "bg-emerald-100 text-emerald-800",
        Declined: "bg-rose-100 text-rose-800",
    };

    return (
        <span
            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                statusConfig[status] || "bg-gray-100 text-gray-800"
            }`}
        >
            {status}
        </span>
    )
}

export default StatusBadge
