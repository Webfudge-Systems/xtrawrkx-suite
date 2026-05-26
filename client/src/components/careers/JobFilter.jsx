import React from "react";
import { Icon } from "@iconify/react";
import {
  departments,
  locations,
  experienceLevels,
  jobTypes,
} from "@/src/data/CareersData";

const JobFilter = ({
  selectedDepartment,
  selectedLocation,
  selectedExperience,
  selectedType,
  searchQuery,
  onDepartmentChange,
  onLocationChange,
  onExperienceChange,
  onTypeChange,
  onSearchChange,
  onClearFilters,
  showFilters,
  toggleFilters,
}) => {
  const hasActiveFilters =
    selectedDepartment !== "All Departments" ||
    selectedLocation !== "All Locations" ||
    selectedExperience !== "All Experience Levels" ||
    selectedType !== "All Types" ||
    searchQuery.length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Filter Header */}
      <div className="bg-gradient-to-r from-[#377ecc] to-[#2c63a3] text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon icon="mdi:filter-variant" width={24} />
            <h3 className="text-xl font-semibold">Filter Jobs</h3>
          </div>
          <button
            onClick={toggleFilters}
            className="lg:hidden bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
          >
            <Icon
              icon={showFilters ? "mdi:chevron-up" : "mdi:chevron-down"}
              width={20}
            />
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <input
            type="text"
            placeholder="Search jobs by title, skills, or description..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white/20 border border-white/30 rounded-lg py-3 px-4 pl-12 text-white placeholder-white/70 focus:bg-white/30 focus:outline-none transition-colors"
          />
          <Icon
            icon="mdi:magnify"
            width={20}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
            >
              <Icon icon="mdi:close" width={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Options */}
      <div
        className={`p-6 space-y-6 ${showFilters ? "block" : "hidden lg:block"}`}
      >
        {/* Department Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            <Icon
              icon="mdi:office-building"
              className="inline mr-2"
              width={16}
            />
            Department
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-[#377ecc] focus:border-transparent outline-none"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            <Icon icon="mdi:map-marker" className="inline mr-2" width={16} />
            Location
          </label>
          <select
            value={selectedLocation}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-[#377ecc] focus:border-transparent outline-none"
          >
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        {/* Experience Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            <Icon icon="mdi:account-check" className="inline mr-2" width={16} />
            Experience Level
          </label>
          <select
            value={selectedExperience}
            onChange={(e) => onExperienceChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-[#377ecc] focus:border-transparent outline-none"
          >
            {experienceLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        {/* Job Type Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            <Icon icon="mdi:clock-outline" className="inline mr-2" width={16} />
            Job Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-[#377ecc] focus:border-transparent outline-none"
          >
            {jobTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Icon icon="mdi:filter-off" width={16} />
            Clear All Filters
          </button>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="bg-[#377ecc]/5 border border-[#377ecc]/20 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Icon
                icon="mdi:filter-check"
                width={16}
                className="text-[#377ecc]"
              />
              Active Filters
            </h4>
            <div className="space-y-1 text-xs text-gray-600">
              {selectedDepartment !== "All Departments" && (
                <div>
                  Department:{" "}
                  <span className="font-medium">{selectedDepartment}</span>
                </div>
              )}
              {selectedLocation !== "All Locations" && (
                <div>
                  Location:{" "}
                  <span className="font-medium">{selectedLocation}</span>
                </div>
              )}
              {selectedExperience !== "All Experience Levels" && (
                <div>
                  Experience:{" "}
                  <span className="font-medium">{selectedExperience}</span>
                </div>
              )}
              {selectedType !== "All Types" && (
                <div>
                  Type: <span className="font-medium">{selectedType}</span>
                </div>
              )}
              {searchQuery && (
                <div>
                  Search: <span className="font-medium">"{searchQuery}"</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobFilter;
