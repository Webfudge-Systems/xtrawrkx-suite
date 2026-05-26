import React from "react";
import { Icon } from "@iconify/react";

const ResourceFilter = ({
  selectedType,
  selectedCategory,
  searchQuery,
  onTypeChange,
  onCategoryChange,
  onSearchChange,
  resourceTypes = [],
  resourceCategories = [],
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200 ">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Resources
          </label>
          <div className="relative">
            <Icon
              icon="solar:magnifer-bold"
              width={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by title, author, or content..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resource Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          >
            {resourceTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          >
            {resourceCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        {selectedType !== "all" && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-brand-primary/10 text-brand-primary">
            Type: {resourceTypes.find((t) => t.value === selectedType)?.label}
            <button
              onClick={() => onTypeChange("all")}
              className="ml-2 hover:text-brand-primary/70"
            >
              <Icon icon="solar:close-circle-bold" width={16} />
            </button>
          </span>
        )}
        {selectedCategory !== "All" && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-brand-primary/10 text-brand-primary">
            Category: {selectedCategory}
            <button
              onClick={() => onCategoryChange("All")}
              className="ml-2 hover:text-brand-primary/70"
            >
              <Icon icon="solar:close-circle-bold" width={16} />
            </button>
          </span>
        )}
        {searchQuery && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-brand-primary/10 text-brand-primary">
            Search: "{searchQuery}"
            <button
              onClick={() => onSearchChange("")}
              className="ml-2 hover:text-brand-primary/70"
            >
              <Icon icon="solar:close-circle-bold" width={16} />
            </button>
          </span>
        )}
      </div>
    </div>
  );
};

export default ResourceFilter;
