import React from "react";
import { Icon } from "@iconify/react";
import { galleryCategories } from "../../data/GalleryData";

const GalleryFilter = ({
  selectedCategory,
  searchQuery,
  onCategoryChange,
  onSearchChange,
  onClearFilters,
  showCategoryFilter = true,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div
        className={
          showCategoryFilter
            ? "grid grid-cols-1 md:grid-cols-2 gap-6"
            : "grid grid-cols-1 gap-6"
        }
      >
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Gallery
          </label>
          <div className="relative">
            <Icon
              icon="solar:magnifer-bold"
              width={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by title, description, or tags..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Filter - Only show if showCategoryFilter is true */}
        {showCategoryFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {galleryCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Active Filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        {showCategoryFilter && selectedCategory !== "all" && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
            Category:{" "}
            {galleryCategories.find((c) => c.value === selectedCategory)?.label}
            <button
              onClick={() => onCategoryChange("all")}
              className="ml-2 hover:text-blue-600"
            >
              <Icon icon="solar:close-circle-bold" width={16} />
            </button>
          </span>
        )}
        {searchQuery && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
            Search: "{searchQuery}"
            <button
              onClick={() => onSearchChange("")}
              className="ml-2 hover:text-blue-600"
            >
              <Icon icon="solar:close-circle-bold" width={16} />
            </button>
          </span>
        )}
        {((showCategoryFilter && selectedCategory !== "all") ||
          searchQuery) && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Clear All Filters
            <Icon icon="solar:close-circle-bold" width={16} className="ml-1" />
          </button>
        )}
      </div>
    </div>
  );
};

export default GalleryFilter;
