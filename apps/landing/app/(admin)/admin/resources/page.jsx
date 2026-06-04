"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import AdminLayout from "@/src/components/admin/AdminLayout";
import ProtectedRoute from "@/src/components/admin/ProtectedRoute";
import { resourceService } from "@/src/services/databaseService";
import { uploadImage } from "@/src/services/cloudinaryService";
import Button from "@/src/components/common/Button";

export default function ResourceManagement() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [bulkSelection, setBulkSelection] = useState([]);
  const [sortBy, setSortBy] = useState("publishedDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState("grid");

  const resourceTypes = [
    "All",
    "whitepaper",
    "article",
    "report",
    "interview",
    "newsletter",
  ];

  const resourceCategories = [
    "All",
    "Finance",
    "Technology",
    "Manufacturing",
    "Market Analysis",
    "Sustainability",
    "Regulatory",
    "Investment",
  ];

  const statusOptions = ["All", "published", "draft", "archived"];

  // Load resources
  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const resourcesData = await resourceService.getResources();
      setResources(resourcesData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort resources
  const filteredResources = resources
    .filter((resource) => {
      const matchesSearch =
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (resource.tags &&
          resource.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          ));
      const matchesType =
        selectedType === "All" || resource.type === selectedType;
      const matchesCategory =
        selectedCategory === "All" || resource.category === selectedCategory;
      const matchesStatus =
        selectedStatus === "All" ||
        (resource.status || "published") === selectedStatus;
      return matchesSearch && matchesType && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "type":
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case "category":
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case "author":
          aValue = a.author.toLowerCase();
          bValue = b.author.toLowerCase();
          break;
        case "publishedDate":
          aValue = new Date(a.publishedDate || 0);
          bValue = new Date(b.publishedDate || 0);
          break;
        case "createdAt":
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      // Handle Date objects with invalid date checking
      if (aValue instanceof Date && bValue instanceof Date) {
        if (isNaN(aValue.getTime()) && isNaN(bValue.getTime())) return 0;
        if (isNaN(aValue.getTime())) return sortOrder === "asc" ? 1 : -1;
        if (isNaN(bValue.getTime())) return sortOrder === "asc" ? -1 : 1;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Get resource statistics
  const getResourceStats = () => {
    const total = resources.length;
    const whitepapers = resources.filter((r) => r.type === "whitepaper").length;
    const articles = resources.filter((r) => r.type === "article").length;
    const reports = resources.filter((r) => r.type === "report").length;
    const published = resources.filter(
      (r) => (r.status || "published") === "published"
    ).length;
    const featured = resources.filter((r) => r.featured).length;
    const totalViews = resources.reduce((sum, r) => sum + (r.views || 0), 0);
    const totalDownloads = resources.reduce(
      (sum, r) => sum + (r.downloads || 0),
      0
    );

    return {
      total,
      whitepapers,
      articles,
      reports,
      published,
      featured,
      totalViews,
      totalDownloads,
    };
  };

  const stats = getResourceStats();

  // Handle bulk selection
  const handleBulkSelect = (resourceId) => {
    setBulkSelection((prev) =>
      prev.includes(resourceId)
        ? prev.filter((id) => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const handleSelectAll = () => {
    if (bulkSelection.length === filteredResources.length) {
      setBulkSelection([]);
    } else {
      setBulkSelection(filteredResources.map((r) => r.id));
    }
  };

  // Handle bulk actions
  const handleBulkDelete = async () => {
    if (
      confirm(
        `Are you sure you want to delete ${bulkSelection.length} resources?`
      )
    ) {
      try {
        await Promise.all(
          bulkSelection.map((id) => resourceService.delete(id))
        );
        setBulkSelection([]);
        loadResources();
      } catch (error) {
      }
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    try {
      await Promise.all(
        bulkSelection.map((id) => {
          return resourceService.update(id, { status: newStatus });
        })
      );
      setBulkSelection([]);
      loadResources();
    } catch (error) {
    }
  };

  const handleBulkFeaturedToggle = async (featured) => {
    try {
      await Promise.all(
        bulkSelection.map((id) => {
          return resourceService.update(id, { featured });
        })
      );
      setBulkSelection([]);
      loadResources();
    } catch (error) {
    }
  };

  // Handle individual resource actions
  const handleDelete = async (resourceId) => {
    if (confirm("Are you sure you want to delete this resource?")) {
      try {
        await resourceService.delete(resourceId);
        loadResources();
      } catch (error) {
      }
    }
  };

  const handleToggleFeatured = async (resource) => {
    try {
      await resourceService.update(resource.id, {
        featured: !resource.featured,
      });
      loadResources();
    } catch (error) {
    }
  };

  const handleDuplicate = async (resource) => {
    try {
      const duplicatedResource = {
        ...resource,
        title: `${resource.title} (Copy)`,
        slug: `${resource.slug}-copy`,
        id: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await resourceService.createResource(duplicatedResource);
      loadResources();
    } catch (error) {
    }
  };

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Resource Management
              </h1>
              <p className="text-gray-600">
                Manage your whitepapers, articles, and reports
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <Button
                text="Add Resource"
                type="primary"
                link="/admin/resources/new"
                icon="mdi:plus"
                className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg"
              />
            </div>
          </div>

          {/* Modern Statistics Dashboard */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Resource Overview
              </h3>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
              {/* Total Resources */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <Icon
                        icon="mdi:library-books"
                        width={20}
                        className="text-primary"
                      />
                    </div>
                    <div className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full">
                      Total
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {stats.total}
                    </p>
                    <p className="text-sm text-gray-600">Resources</p>
                  </div>
                </div>
              </div>

              {/* Whitepapers */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Icon
                        icon="mdi:file-document"
                        width={20}
                        className="text-blue-600"
                      />
                    </div>
                    <div className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full">
                      Papers
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-700 mb-1">
                      {stats.whitepapers}
                    </p>
                    <p className="text-sm text-blue-600">Whitepapers</p>
                  </div>
                </div>
              </div>

              {/* Articles */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-green-100 rounded-xl">
                      <Icon
                        icon="mdi:newspaper"
                        width={20}
                        className="text-green-600"
                      />
                    </div>
                    <div className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                      Articles
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-700 mb-1">
                      {stats.articles}
                    </p>
                    <p className="text-sm text-green-600">Articles</p>
                  </div>
                </div>
              </div>

              {/* Reports */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <Icon
                        icon="mdi:chart-bar"
                        width={20}
                        className="text-purple-600"
                      />
                    </div>
                    <div className="text-xs text-purple-600 font-medium bg-purple-100 px-2 py-1 rounded-full">
                      Reports
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-700 mb-1">
                      {stats.reports}
                    </p>
                    <p className="text-sm text-purple-600">Reports</p>
                  </div>
                </div>
              </div>

              {/* Total Views */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-orange-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-orange-100 rounded-xl">
                      <Icon
                        icon="mdi:eye"
                        width={20}
                        className="text-orange-600"
                      />
                    </div>
                    <div className="text-xs text-orange-600 font-medium bg-orange-100 px-2 py-1 rounded-full">
                      Views
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-700 mb-1">
                      {stats.totalViews.toLocaleString()}
                    </p>
                    <p className="text-sm text-orange-600">Total Views</p>
                  </div>
                </div>
              </div>

              {/* Total Downloads */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <Icon
                        icon="mdi:download"
                        width={20}
                        className="text-emerald-600"
                      />
                    </div>
                    <div className="text-xs text-emerald-600 font-medium bg-emerald-100 px-2 py-1 rounded-full">
                      Downloads
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-700 mb-1">
                      {stats.totalDownloads.toLocaleString()}
                    </p>
                    <p className="text-sm text-emerald-600">Downloads</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Icon
                      icon="mdi:chart-line"
                      width={24}
                      className="text-primary"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Content Performance
                    </h4>
                    <p className="text-sm text-gray-600">
                      {stats.featured > 0
                        ? `${stats.featured} featured resources driving engagement`
                        : stats.published > 0
                        ? `${stats.published} published resources available`
                        : "No content published yet"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {stats.total > 0 && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">
                        {Math.round((stats.published / stats.total) * 100)}%
                      </p>
                      <p className="text-xs text-gray-600">Published</p>
                    </div>
                  )}

                  {stats.totalViews > 0 && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-orange-600">
                        {Math.round(stats.totalViews / stats.total || 0)}
                      </p>
                      <p className="text-xs text-gray-600">Avg Views</p>
                    </div>
                  )}

                  {stats.totalDownloads > 0 && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-600">
                        {Math.round(stats.totalDownloads / stats.total || 0)}
                      </p>
                      <p className="text-xs text-gray-600">Avg Downloads</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Icon
                  icon="mdi:magnify"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  width={20}
                />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {resourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {resourceCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-");
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="createdAt-desc">Date (Newest)</option>
                <option value="createdAt-asc">Date (Oldest)</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
                <option value="type-asc">Type</option>
                <option value="category-asc">Category</option>
              </select>

              {/* View Mode */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 ${
                    viewMode === "grid"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700"
                  }`}
                >
                  <Icon icon="mdi:view-grid" width={20} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 ${
                    viewMode === "list"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700"
                  }`}
                >
                  <Icon icon="mdi:view-list" width={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Filtered Results Count */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {filteredResources.length}
                </span>{" "}
                {filteredResources.length === 1 ? "resource" : "resources"}
                {(() => {
                  const hasActiveFilters =
                    searchTerm ||
                    selectedType !== "All" ||
                    selectedCategory !== "All" ||
                    selectedStatus !== "All";
                  
                  if (hasActiveFilters) {
                    return (
                      <>
                        {" "}
                        (filtered from{" "}
                        <span className="font-semibold text-gray-900">
                          {resources.length}
                        </span>{" "}
                        total)
                      </>
                    );
                  }
                  return null;
                })()}
              </div>
              {(() => {
                const hasActiveFilters =
                  searchTerm ||
                  selectedType !== "All" ||
                  selectedCategory !== "All" ||
                  selectedStatus !== "All";
                
                if (hasActiveFilters) {
                  return (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedType("All");
                        setSelectedCategory("All");
                        setSelectedStatus("All");
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                      title="Clear all filters"
                    >
                      <Icon icon="mdi:close-circle" width={16} />
                      Clear filters
                    </button>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {/* Bulk Actions */}
          {bulkSelection.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-medium">
                  {bulkSelection.length} resource
                  {bulkSelection.length > 1 ? "s" : ""} selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkStatusUpdate("published")}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                  >
                    Publish
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate("draft")}
                    className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                  >
                    Draft
                  </button>
                  <button
                    onClick={() => handleBulkFeaturedToggle(true)}
                    className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
                  >
                    Feature
                  </button>
                  <button
                    onClick={() => handleBulkFeaturedToggle(false)}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    Unfeature
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setBulkSelection([])}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Resources Display */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-12">
              <Icon
                icon="mdi:library-books"
                width={64}
                className="text-gray-400 mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No resources found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onEdit={(resource) =>
                    window.open(`/admin/resources/edit/${resource.id}`, "_self")
                  }
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onToggleFeatured={handleToggleFeatured}
                  onSelect={handleBulkSelect}
                  selected={bulkSelection.includes(resource.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            bulkSelection.length === filteredResources.length
                          }
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resource
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Author
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stats
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredResources.map((resource) => (
                      <ResourceRow
                        key={resource.id}
                        resource={resource}
                        onEdit={(resource) =>
                          window.open(
                            `/admin/resources/edit/${resource.id}`,
                            "_self"
                          )
                        }
                        onDelete={handleDelete}
                        onDuplicate={handleDuplicate}
                        onToggleFeatured={handleToggleFeatured}
                        onSelect={handleBulkSelect}
                        selected={bulkSelection.includes(resource.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}

// Resource Card Component
function ResourceCard({
  resource,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFeatured,
  onSelect,
  selected,
}) {
  const getTypeColor = (type) => {
    switch (type) {
      case "whitepaper":
        return "bg-blue-100 text-blue-800";
      case "article":
        return "bg-green-100 text-green-800";
      case "report":
        return "bg-purple-100 text-purple-800";
      case "interview":
        return "bg-red-100 text-red-800";
      case "newsletter":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
        selected
          ? "border-primary bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="relative">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(resource.id)}
          className="absolute top-4 left-4 z-10 rounded border-gray-300 text-primary focus:ring-primary"
        />
        {resource.image && (
          <img
            src={resource.image}
            alt={resource.title}
            className="w-full h-48 object-cover rounded-t-xl"
          />
        )}
        <div className="absolute top-4 right-4 flex gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
              resource.type
            )}`}
          >
            {resource.type}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              resource.status || "published"
            )}`}
          >
            {resource.status || "published"}
          </span>
          {resource.featured && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-primary to-secondary text-white">
              Featured
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {resource.title}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {resource.description}
        </p>
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:account" width={16} />
            <span>{resource.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon icon="mdi:tag" width={16} />
            <span>{resource.category}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Icon icon="mdi:eye" width={16} />
              <span>{(resource.views || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon icon="mdi:download" width={16} />
              <span>{(resource.downloads || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(resource)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Icon icon="mdi:pencil" width={16} />
            Edit
          </button>
          <button
            onClick={() => onToggleFeatured(resource)}
            className={`px-3 py-2 rounded-lg transition-colors ${
              resource.featured
                ? "bg-yellow-500 text-white hover:bg-yellow-600"
                : "bg-gray-500 text-white hover:bg-gray-600"
            }`}
          >
            <Icon icon="mdi:star" width={16} />
          </button>
          <button
            onClick={() => onDuplicate(resource)}
            className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Icon icon="mdi:content-copy" width={16} />
          </button>
          <button
            onClick={() => onDelete(resource.id)}
            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Icon icon="mdi:delete" width={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Resource Row Component for List View
function ResourceRow({
  resource,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFeatured,
  onSelect,
  selected,
}) {
  const getTypeColor = (type) => {
    switch (type) {
      case "whitepaper":
        return "bg-blue-100 text-blue-800";
      case "article":
        return "bg-green-100 text-green-800";
      case "report":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  return (
    <tr className={selected ? "bg-blue-50" : "hover:bg-gray-50"}>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(resource.id)}
          className="rounded border-gray-300 text-primary focus:ring-primary"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {resource.image && (
            <img
              src={resource.image}
              alt={resource.title}
              className="w-12 h-12 rounded-lg object-cover mr-4"
            />
          )}
          <div>
            <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
              {resource.title}
            </div>
            <div className="text-sm text-gray-500 max-w-xs truncate">
              {resource.description}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
            resource.type
          )}`}
        >
          {resource.type}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {resource.category}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {resource.author}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              resource.status || "published"
            )}`}
          >
            {resource.status || "published"}
          </span>
          {resource.featured && (
            <Icon icon="mdi:star" width={16} className="text-yellow-500" />
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:eye" width={14} />
            <span>{(resource.views || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon icon="mdi:download" width={14} />
            <span>{(resource.downloads || 0).toLocaleString()}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(resource)}
            className="text-primary hover:text-blue-900"
          >
            <Icon icon="mdi:pencil" width={16} />
          </button>
          <button
            onClick={() => onToggleFeatured(resource)}
            className={resource.featured ? "text-yellow-500" : "text-gray-400"}
          >
            <Icon icon="mdi:star" width={16} />
          </button>
          <button
            onClick={() => onDuplicate(resource)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Icon icon="mdi:content-copy" width={16} />
          </button>
          <button
            onClick={() => onDelete(resource.id)}
            className="text-red-600 hover:text-red-900"
          >
            <Icon icon="mdi:delete" width={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}
