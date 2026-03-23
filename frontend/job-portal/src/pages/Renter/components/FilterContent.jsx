import {
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { CATEGORIES, ROOM_TYPES } from "../../../utils/data";
import RentRangeSlider from "../../../components/Input/RentRangeSlider";

const FilterSection = ({ title, children, isExpanded, onToggle }) => (
    <div className="border-b border-gray-200 pb-4 mb-4 last:border-b-0">
        <button
            onClick={onToggle}
            className="flex items-center justify-between w-full text-left font-semibold text-gray-900 mb-3 hover:text-blue-600 transition-colors"
        >
            {title}
            {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
            ) : (
                <ChevronDown className="w-4 h-4" />
            )}
        </button>
        {isExpanded && children}
    </div>
);

const FilterContent = ({
    toggleSection,
    clearAllFilters,
    expandedSections,
    filters,
    handleFilterChange,
}) => {
    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={clearAllFilters}
                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                >
                    Clear All
                </button>
            </div>

            <FilterSection
                title="Room Type"
                isExpanded={expandedSections?.roomType}
                onToggle={() => toggleSection("roomType")}
            >
                <div className="space-y-3">
                    {ROOM_TYPES.map((type) => (
                        <label key={type.value} className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                checked={filters?.roomType === type.value}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "roomType",
                                        e.target.checked ? type.value : ""
                                    )
                                }
                            />
                            <span className="ml-3 text-gray-700 font-medium">{type.label}</span>
                        </label>
                    ))}
                </div>
            </FilterSection>

            <FilterSection
                title="Monthly Rent"
                isExpanded={expandedSections?.rent}
                onToggle={() => toggleSection("rent")}
            >
                <RentRangeSlider
                    filters={filters}
                    handleFilterChange={handleFilterChange}
                />
            </FilterSection>

            <FilterSection
                title="Category"
                isExpanded={expandedSections?.category}
                onToggle={() => toggleSection("category")}
            >
                <div className="space-y-3">
                    {CATEGORIES.map((category) => (
                        <label key={category.value} className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                checked={filters?.category === category.value}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "category",
                                        e.target.checked ? category.value : ""
                                    )
                                }
                            />
                            <span className="ml-3 text-gray-700 font-medium">
                                {category.label}
                            </span>
                        </label>
                    ))}
                </div>
            </FilterSection>
        </>
    );
};

export default FilterContent;
