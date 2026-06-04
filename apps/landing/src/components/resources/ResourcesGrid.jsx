import React from "react";
import { Icon } from "@iconify/react";
import ResourceCard from "./ResourceCard";
import Button from "../common/Button";

const ResourcesGrid = ({
  resources,
  totalResources,
  isLoading = false,
  onClearFilters,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
          >
            <div className="h-40 bg-gray-200"></div>
            <div className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
          <Icon
            icon="solar:document-bold"
            width={40}
            className="text-gray-400"
          />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No resources found
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          We couldn't find any resources matching your current filters. Try
          adjusting your search criteria or browse all resources.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            text="Clear Filters"
            type="secondary"
            onClick={onClearFilters}
          />
          <Button
            text="Browse All Resources"
            type="primary"
            link="/resources"
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Results Count */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-gray-600">
          Showing <span className="font-medium">{resources.length}</span> of{" "}
          <span className="font-medium">{totalResources}</span> resources
        </p>

        {/* Sort Options */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-brand-primary focus:border-transparent">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="popular">Most Popular</option>
            <option value="downloads">Most Downloads</option>
          </select>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} layout="grid" />
        ))}
      </div>

      {/* Load More Button (if needed) */}
      {resources.length >= 9 && (
        <div className="text-center mt-12">
          <Button text="Load More Resources" type="secondary" />
        </div>
      )}
    </div>
  );
};

export default ResourcesGrid;
