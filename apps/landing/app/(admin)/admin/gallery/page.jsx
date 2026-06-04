"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import AdminLayout from "@/src/components/admin/AdminLayout";
import ProtectedRoute from "@/src/components/admin/ProtectedRoute";
import { galleryService, eventService } from "@/src/services/databaseService";
import { uploadImage } from "@/src/services/cloudinaryService";
import Button from "@/src/components/common/Button";
import { commonToasts, toastUtils } from "@/src/utils/toast";

export default function GalleryManagement() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState("All");
  const [events, setEvents] = useState([]);
  const [bulkSelection, setBulkSelection] = useState([]);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState("grid");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);

  const categories = ["All", "events", "communities", "achievements", "team"];

  // Load gallery items and events
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [items, allEvents] = await Promise.all([
        galleryService.getGalleryItems(),
        eventService.getEvents(),
      ]);
      setGalleryItems(items);
      setEvents(allEvents);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const loadGalleryItems = async () => {
    try {
      setLoading(true);
      const items = await galleryService.getGalleryItems();
      setGalleryItems(items);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort items
  const filteredItems = galleryItems
    .filter((item) => {
      const matchesSearch =
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags?.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchesEvent =
        selectedEvent === "All" || item.eventId === selectedEvent;
      return matchesSearch && matchesCategory && matchesEvent;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "date":
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "category":
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Get gallery statistics
  const getGalleryStats = () => {
    const total = galleryItems.length;
    const events = galleryItems.filter(
      (item) => item.category === "events"
    ).length;
    const communities = galleryItems.filter(
      (item) => item.category === "communities"
    ).length;
    const achievements = galleryItems.filter(
      (item) => item.category === "achievements"
    ).length;
    const team = galleryItems.filter((item) => item.category === "team").length;
    const featured = galleryItems.filter((item) => item.featured).length;

    return { total, events, communities, achievements, team, featured };
  };

  const stats = getGalleryStats();

  // Handle bulk selection
  const handleBulkSelect = (itemId) => {
    setBulkSelection((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (bulkSelection.length === filteredItems.length) {
      setBulkSelection([]);
    } else {
      setBulkSelection(filteredItems.map((item) => item.id));
    }
  };

  // Handle bulk actions
  const handleBulkDelete = async () => {
    if (
      confirm(
        `Are you sure you want to delete ${bulkSelection.length} gallery items?`
      )
    ) {
      try {
        await Promise.all(
          bulkSelection.map((id) => galleryService.deleteGalleryItem(id))
        );
        setBulkSelection([]);
        loadGalleryItems();
      } catch (error) {
      }
    }
  };

  const handleBulkFeaturedUpdate = async (featured) => {
    try {
      await Promise.all(
        bulkSelection.map((id) => {
          const item = galleryItems.find((item) => item.id === id);
          return galleryService.updateGalleryItem(id, { ...item, featured });
        })
      );
      setBulkSelection([]);
      loadGalleryItems();
    } catch (error) {
    }
  };

  // Handle individual item actions
  const handleDelete = async (itemId) => {
    if (confirm("Are you sure you want to delete this gallery item?")) {
      const loadingToast = toastUtils.loading("Deleting gallery item...");

      try {
        await galleryService.deleteGalleryItem(itemId);
        loadGalleryItems();
        toastUtils.update(
          loadingToast,
          "success",
          "Gallery item deleted successfully!"
        );
      } catch (error) {
        toastUtils.update(
          loadingToast,
          "error",
          `Failed to delete gallery item: ${error.message}`
        );
      }
    }
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setIsEditModalOpen(true);
  };

  const handleDuplicate = async (item) => {
    const loadingToast = toastUtils.loading("Duplicating gallery item...");

    try {
      const duplicatedItem = {
        ...item,
        title: `${item.title} (Copy)`,
        id: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await galleryService.createGalleryItem(duplicatedItem);
      loadGalleryItems();
      toastUtils.update(
        loadingToast,
        "success",
        "Gallery item duplicated successfully!"
      );
    } catch (error) {
      toastUtils.update(
        loadingToast,
        "error",
        `Failed to duplicate gallery item: ${error.message}`
      );
    }
  };

  const handleToggleFeatured = async (item) => {
    const loadingToast = toastUtils.loading(
      `${item.featured ? "Removing from" : "Adding to"} featured...`
    );

    try {
      await galleryService.updateGalleryItem(item.id, {
        ...item,
        featured: !item.featured,
      });
      loadGalleryItems();
      toastUtils.update(
        loadingToast,
        "success",
        `Item ${
          item.featured ? "removed from" : "added to"
        } featured successfully!`
      );
    } catch (error) {
      toastUtils.update(
        loadingToast,
        "error",
        `Failed to update featured status: ${error.message}`
      );
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
                Gallery Management
              </h1>
              <p className="text-gray-600">
                Manage your gallery items and media content
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <Button
                text="Bulk Upload"
                type="secondary"
                onClick={() => setIsBulkUploadModalOpen(true)}
                icon="mdi:cloud-upload"
                className="hover:shadow-lg"
              />
              <Button
                text="Add Gallery Item"
                type="primary"
                link="/admin/gallery/new"
                icon="mdi:plus"
                className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg"
              />
            </div>
          </div>

          {/* Modern Statistics Dashboard */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Gallery Overview
              </h3>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
              {/* Total Items */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <Icon
                        icon="mdi:image-multiple"
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
                    <p className="text-sm text-gray-600">Gallery Items</p>
                  </div>
                </div>
              </div>

              {/* Events */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-green-100 rounded-xl">
                      <Icon
                        icon="mdi:calendar"
                        width={20}
                        className="text-green-600"
                      />
                    </div>
                    <div className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                      Events
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-700 mb-1">
                      {stats.events}
                    </p>
                    <p className="text-sm text-green-600">Event Photos</p>
                  </div>
                </div>
              </div>

              {/* Communities */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <Icon
                        icon="mdi:account-group"
                        width={20}
                        className="text-purple-600"
                      />
                    </div>
                    <div className="text-xs text-purple-600 font-medium bg-purple-100 px-2 py-1 rounded-full">
                      Communities
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-700 mb-1">
                      {stats.communities}
                    </p>
                    <p className="text-sm text-purple-600">Community</p>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-yellow-100 rounded-xl">
                      <Icon
                        icon="mdi:trophy"
                        width={20}
                        className="text-yellow-600"
                      />
                    </div>
                    <div className="text-xs text-yellow-600 font-medium bg-yellow-100 px-2 py-1 rounded-full">
                      Awards
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-700 mb-1">
                      {stats.achievements}
                    </p>
                    <p className="text-sm text-yellow-600">Achievements</p>
                  </div>
                </div>
              </div>

              {/* Team */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Icon
                        icon="mdi:account-multiple"
                        width={20}
                        className="text-blue-600"
                      />
                    </div>
                    <div className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full">
                      Team
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-700 mb-1">
                      {stats.team}
                    </p>
                    <p className="text-sm text-blue-600">Team Photos</p>
                  </div>
                </div>
              </div>

              {/* Featured */}
              <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-red-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-red-100 rounded-xl">
                      <Icon
                        icon="mdi:star"
                        width={20}
                        className="text-red-600"
                      />
                    </div>
                    <div className="text-xs text-red-600 font-medium bg-red-100 px-2 py-1 rounded-full">
                      Featured
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-700 mb-1">
                      {stats.featured}
                    </p>
                    <p className="text-sm text-red-600">Highlighted</p>
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
                      Quick Insights
                    </h4>
                    <p className="text-sm text-gray-600">
                      {stats.featured > 0
                        ? `${stats.featured} featured items highlighting your content`
                        : stats.total > 0
                        ? `${stats.total} gallery items across ${
                            categories.length - 1
                          } categories`
                        : "No gallery items uploaded yet"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {stats.total > 0 && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">
                        {Math.round((stats.featured / stats.total) * 100)}%
                      </p>
                      <p className="text-xs text-gray-600">Featured Rate</p>
                    </div>
                  )}

                  {stats.events > 0 && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">
                        {stats.events}
                      </p>
                      <p className="text-xs text-gray-600">Event Items</p>
                    </div>
                  )}

                  {categories.length > 1 && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-600">
                        {categories.length - 1}
                      </p>
                      <p className="text-xs text-gray-600">Categories</p>
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
                  placeholder="Search gallery items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              {/* Event Filter */}
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="All">All Events</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
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
                <option value="date-desc">Date (Newest)</option>
                <option value="date-asc">Date (Oldest)</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
                <option value="category-asc">Category (A-Z)</option>
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
                  {filteredItems.length}
                </span>{" "}
                {filteredItems.length === 1 ? "item" : "items"}
                {(() => {
                  const hasActiveFilters =
                    searchTerm ||
                    selectedCategory !== "All" ||
                    selectedEvent !== "All";
                  
                  if (hasActiveFilters) {
                    return (
                      <>
                        {" "}
                        (filtered from{" "}
                        <span className="font-semibold text-gray-900">
                          {galleryItems.length}
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
                  selectedCategory !== "All" ||
                  selectedEvent !== "All";
                
                if (hasActiveFilters) {
                  return (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("All");
                        setSelectedEvent("All");
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
                  {bulkSelection.length} item
                  {bulkSelection.length > 1 ? "s" : ""} selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkFeaturedUpdate(true)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                  >
                    Mark Featured
                  </button>
                  <button
                    onClick={() => handleBulkFeaturedUpdate(false)}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    Remove Featured
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Delete Selected
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

          {/* Gallery Display */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Icon
                icon="mdi:image-remove"
                width={64}
                className="text-gray-400 mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No gallery items found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onToggleFeatured={handleToggleFeatured}
                  onSelect={handleBulkSelect}
                  selected={bulkSelection.includes(item.id)}
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
                            bulkSelection.length === filteredItems.length
                          }
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Featured
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                      <GalleryRow
                        key={item.id}
                        item={item}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onDuplicate={handleDuplicate}
                        onToggleFeatured={handleToggleFeatured}
                        onSelect={handleBulkSelect}
                        selected={bulkSelection.includes(item.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && (
          <GalleryModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setCurrentItem(null);
            }}
            item={currentItem}
            events={events}
            onSave={loadGalleryItems}
          />
        )}

        {/* Bulk Upload Modal */}
        {isBulkUploadModalOpen && (
          <BulkUploadModal
            isOpen={isBulkUploadModalOpen}
            onClose={() => setIsBulkUploadModalOpen(false)}
            events={events}
            onSave={loadGalleryItems}
          />
        )}
      </AdminLayout>
    </ProtectedRoute>
  );
}

// Gallery Card Component
function GalleryCard({
  item,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFeatured,
  onSelect,
  selected,
}) {
  const getCategoryColor = (category) => {
    switch (category) {
      case "events":
        return "bg-blue-100 text-blue-800";
      case "communities":
        return "bg-green-100 text-green-800";
      case "achievements":
        return "bg-yellow-100 text-yellow-800";
      case "team":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
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
          onChange={() => onSelect(item.id)}
          className="absolute top-4 left-4 z-10 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <div className="h-48 relative rounded-t-xl overflow-hidden">
          <Image
            src={item.image || "/images/hero.png"}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
              item.category
            )}`}
          >
            {item.category}
          </span>
          {item.featured && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <Icon icon="mdi:star" width={12} className="inline mr-1" />
              Featured
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {item.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {item.description}
        </p>

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {item.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
              >
                #{tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                +{item.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(item)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Icon icon="mdi:pencil" width={16} />
            Edit
          </button>
          <button
            onClick={() => onToggleFeatured(item)}
            className={`px-3 py-2 rounded-lg transition-colors ${
              item.featured
                ? "bg-yellow-500 text-white hover:bg-yellow-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <Icon icon="mdi:star" width={16} />
          </button>
          <button
            onClick={() => onDuplicate(item)}
            className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Icon icon="mdi:content-copy" width={16} />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Icon icon="mdi:delete" width={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Gallery Row Component for List View
function GalleryRow({
  item,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFeatured,
  onSelect,
  selected,
}) {
  const getCategoryColor = (category) => {
    switch (category) {
      case "events":
        return "bg-blue-100 text-blue-800";
      case "communities":
        return "bg-green-100 text-green-800";
      case "achievements":
        return "bg-yellow-100 text-yellow-800";
      case "team":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <tr className={selected ? "bg-blue-50" : "hover:bg-gray-50"}>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(item.id)}
          className="rounded border-gray-300 text-primary focus:ring-primary"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <img
            src={item.image || "/images/hero.png"}
            alt={item.title}
            className="w-12 h-12 rounded-lg object-cover mr-4"
          />
          <div>
            <div className="text-sm font-medium text-gray-900">
              {item.title}
            </div>
            <div className="text-sm text-gray-500 line-clamp-1">
              {item.description}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
            item.category
          )}`}
        >
          {item.category}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {item.date ? new Date(item.date).toLocaleDateString() : ""}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {item.featured ? (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Icon icon="mdi:star" width={12} className="inline mr-1" />
            Featured
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(item)}
            className="text-primary hover:text-blue-900"
          >
            <Icon icon="mdi:pencil" width={16} />
          </button>
          <button
            onClick={() => onToggleFeatured(item)}
            className={
              item.featured
                ? "text-yellow-600 hover:text-yellow-900"
                : "text-gray-400 hover:text-gray-600"
            }
          >
            <Icon icon="mdi:star" width={16} />
          </button>
          <button
            onClick={() => onDuplicate(item)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Icon icon="mdi:content-copy" width={16} />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-red-600 hover:text-red-900"
          >
            <Icon icon="mdi:delete" width={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// Gallery Modal Component
function GalleryModal({ isOpen, onClose, item, onSave, events = [] }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    category: "events",
    eventId: "",
    date: new Date().toISOString().split("T")[0],
    tags: [],
    featured: false,
  });
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || "",
        description: item.description || "",
        image: item.image || "",
        category: item.category || "events",
        eventId: item.eventId || "",
        date: item.date
          ? new Date(item.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        tags: item.tags || [],
        featured: item.featured || false,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        image: "",
        category: "events",
        eventId: "",
        date: new Date().toISOString().split("T")[0],
        tags: [],
        featured: false,
      });
    }
  }, [item]);

  const categories = ["events", "communities", "achievements", "team"];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const result = await uploadImage(file, {
        folder: "gallery",
      });
      setFormData((prev) => ({
        ...prev,
        image: result.url,
      }));
    } catch (error) {
    } finally {
      setUploading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      const itemData = {
        ...formData,
        date: new Date(formData.date),
      };

      if (item) {
        await galleryService.updateGalleryItem(item.id, itemData);
        toastUtils.success("Gallery item updated successfully!");
      } else {
        await galleryService.createGalleryItem(itemData);
        toastUtils.success("Gallery item created successfully!");
      }
      onSave();
      onClose();
    } catch (error) {
      toastUtils.error(`Failed to save gallery item: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary px-6 py-4 text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/80 hover:text-white text-2xl"
          >
            ×
          </button>
          <h2 className="text-2xl font-bold">
            {item ? "Edit Gallery Item" : "Create New Gallery Item"}
          </h2>
          <p className="text-blue-100 mt-1">
            {item
              ? "Update gallery item information"
              : "Fill in the details to create a new gallery item"}
          </p>
        </div>

        {/* Content */}
        <div className="max-h-[calc(95vh-120px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter gallery item title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Event Selection - Only show when category is "events" */}
            {formData.category === "events" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Associated Event
                </label>
                <select
                  name="eventId"
                  value={formData.eventId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">No specific event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              {uploading && (
                <div className="flex items-center gap-2 mt-2 text-primary">
                  <Icon
                    icon="mdi:loading"
                    className="animate-spin"
                    width={16}
                  />
                  <span className="text-sm">Uploading...</span>
                </div>
              )}
              {formData.image && (
                <div className="mt-3">
                  <Image
                    src={formData.image}
                    alt="Preview"
                    width={200}
                    height={150}
                    className="rounded-lg object-cover border border-gray-200"
                  />
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), handleAddTag())
                  }
                  placeholder="Add a tag..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Icon icon="mdi:close" width={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Featured Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="featured"
                id="featured"
                checked={formData.featured}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label
                htmlFor="featured"
                className="ml-2 text-sm font-medium text-gray-700"
              >
                Mark as featured gallery item
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:loading"
                      className="animate-spin"
                      width={16}
                    />
                    Saving...
                  </div>
                ) : item ? (
                  "Update Gallery Item"
                ) : (
                  "Create Gallery Item"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Bulk Upload Modal Component
function BulkUploadModal({ isOpen, onClose, events, onSave }) {
  const [selectedEvent, setSelectedEvent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadResults, setUploadResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setShowResults(false);
    setUploadResults([]);
  };

  const handleBulkUpload = async () => {
    if (!selectedEvent || selectedFiles.length === 0) {
      alert("Please select an event and at least one image.");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadResults([]);

      const results = [];
      const totalFiles = selectedFiles.length;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const progress = ((i + 1) / totalFiles) * 100;
        setUploadProgress(progress);

        try {
          // Upload image to Cloudinary
          const uploadResult = await uploadImage(file, {
            folder: "gallery",
          });

          // Create gallery item
          const galleryData = {
            title: file.name.split(".").slice(0, -1).join("."), // Remove file extension
            description: `Uploaded from ${
              events.find((e) => e.id === selectedEvent)?.title ||
              "Unknown Event"
            }`,
            image: uploadResult.url,
            category: "events",
            eventId: selectedEvent,
            date: new Date(),
            tags: [],
            featured: false,
          };

          await galleryService.createGalleryItem(galleryData);

          results.push({
            filename: file.name,
            success: true,
            message: "Successfully uploaded",
          });
        } catch (error) {
          results.push({
            filename: file.name,
            success: false,
            message: error.message,
          });
        }
      }

      setUploadResults(results);
      setShowResults(true);
      setUploadProgress(100);

      // Refresh gallery items
      onSave();
    } catch (error) {
      alert("An error occurred during bulk upload. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedEvent("");
      setSelectedFiles([]);
      setUploadResults([]);
      setShowResults(false);
      setUploadProgress(0);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Bulk Upload Images
            </h2>
            <button
              onClick={handleClose}
              disabled={uploading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <Icon icon="mdi:close" width={24} />
            </button>
          </div>

          {!showResults ? (
            <>
              {/* Event Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Event *
                </label>
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  disabled={uploading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                  <option value="">Choose an event...</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Images *
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary hover:file:bg-primary/20 disabled:opacity-50"
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    {selectedFiles.length} file(s) selected
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Upload Progress
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round(uploadProgress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleClose}
                  disabled={uploading}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={
                    uploading || !selectedEvent || selectedFiles.length === 0
                  }
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Icon
                        icon="mdi:loading"
                        className="animate-spin"
                        width={16}
                      />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:cloud-upload" width={16} />
                      Upload Images
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Upload Results */
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Upload Results
              </h3>
              <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                {uploadResults.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      result.success
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-red-50 border-red-200 text-red-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        icon={
                          result.success
                            ? "mdi:check-circle"
                            : "mdi:alert-circle"
                        }
                        width={16}
                      />
                      <span className="font-medium">{result.filename}</span>
                    </div>
                    <span className="text-sm">{result.message}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
