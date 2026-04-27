const RentRangeSlider = ({ filters, handleFilterChange }) => {
    const minRent = filters?.minRent || "";
    const maxRent = filters?.maxRent || "";

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Daily Rent
                </label>
                <input
                    type="number"
                    placeholder="0"
                    min="0"
                    step="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    value={minRent}
                    onChange={({ target }) =>
                        handleFilterChange(
                            "minRent",
                            target.value ? parseInt(target.value, 10) : ""
                        )
                    }
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Daily Rent
                </label>
                <input
                    type="number"
                    placeholder="No limit"
                    min="0"
                    step="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    value={maxRent}
                    onChange={({ target }) =>
                        handleFilterChange(
                            "maxRent",
                            target.value ? parseInt(target.value, 10) : ""
                        )
                    }
                />
            </div>
        </div>
        {/*Display current range */}
        {(minRent || maxRent) ? (
            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                Rent: {minRent ? `${Number(minRent).toLocaleString()}₮` : "0₮"} -{" "}
                {maxRent ? `${Number(maxRent).toLocaleString()}₮` : "No limit"}
            </div>
        ) : null}
    </div>
  )
}

export default RentRangeSlider;
