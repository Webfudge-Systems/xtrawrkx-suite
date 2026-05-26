import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import Section from "../layout/Section";
import Container from "../layout/Container";
import SectionHeader from "../common/SectionHeader";
import GalleryFilter from "./GalleryFilter";
import GalleryItem from "./GalleryItem";
import Button from "../common/Button";
import { galleryService, eventService } from "../../services/databaseService";

// Gallery categories for filtering
const galleryCategories = [
  { value: "all", label: "All Categories" },
  { value: "events", label: "Events" },
  { value: "communities", label: "Communities" },
  { value: "achievements", label: "Achievements" },
  { value: "team", label: "Team" },
];

// Sort options
const sortOptions = [
  { value: "date-desc", label: "Latest First" },
  { value: "date-asc", label: "Oldest First" },
  { value: "title-asc", label: "Title A-Z" },
  { value: "title-desc", label: "Title Z-A" },
];

const GalleryItemSkeleton = () => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
    <div className="h-64 bg-gray-200"></div>
    <div className="p-6">
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded mb-3"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
);

const AllGallerySection = () => {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState("grid");
  const [galleryItems, setGalleryItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load gallery items and events
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [galleryData, eventsData] = await Promise.all([
          galleryService.getGalleryItems(),
          eventService.getEvents(),
        ]);
        setGalleryItems(galleryData);
        setEvents(eventsData);
      } catch (error) {
        setError("Failed to load gallery");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle URL parameters for filtering
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    const eventParam = searchParams.get("event");
    const searchParam = searchParams.get("search");

    if (
      categoryParam &&
      ["events", "communities", "achievements", "team"].includes(categoryParam)
    ) {
      setSelectedCategory(categoryParam);
    }
    if (eventParam) {
      setSelectedEvent(eventParam);
    }
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  // Filter and sort gallery items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = galleryItems;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Filter by event
    if (selectedEvent !== "all") {
      filtered = filtered.filter((item) => item.eventId === selectedEvent);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          (item.tags &&
            item.tags.some((tag) => tag.toLowerCase().includes(query)))
      );
    }

    // Sort items
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "date":
          aValue = new Date(a.date || a.createdAt);
          bValue = new Date(b.date || b.createdAt);
          break;
        case "title":
          aValue = a.title?.toLowerCase() || "";
          bValue = b.title?.toLowerCase() || "";
          break;
        default:
          aValue = new Date(a.date || a.createdAt);
          bValue = new Date(b.date || b.createdAt);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [
    galleryItems,
    selectedCategory,
    selectedEvent,
    searchQuery,
    sortBy,
    sortOrder,
  ]);

  const handleClearFilters = () => {
    setSelectedCategory("all");
    setSelectedEvent("all");
    setSearchQuery("");
  };

  const handleSortChange = (value) => {
    const [field, order] = value.split("-");
    setSortBy(field);
    setSortOrder(order);
  };

  return (
    <Section className="bg-white py-16">
      <Container>
        <SectionHeader
          title="All Gallery Items"
          label="Collection"
          description="Browse our complete collection of visual moments"
          className="mb-12"
        />

        {/* Enhanced Filters */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Gallery
              </label>
              <div className="relative">
                <Icon
                  icon="mdi:magnify"
                  width={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search by title, description, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                {galleryCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event
              </label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                <option value="all">All Events</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Sort Options */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Sort by:
                </label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  View:
                </label>
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-2 ${
                      viewMode === "grid"
                        ? "bg-brand-primary text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    } transition-colors`}
                  >
                    <Icon icon="mdi:view-grid" width={16} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-3 py-2 ${
                      viewMode === "list"
                        ? "bg-brand-primary text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    } transition-colors`}
                  >
                    <Icon icon="mdi:view-list" width={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            {(selectedCategory !== "all" ||
              selectedEvent !== "all" ||
              searchQuery) && (
              <Button
                text="Clear Filters"
                type="secondary"
                onClick={handleClearFilters}
                icon="mdi:filter-off"
              />
            )}
          </div>

          {/* Active Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedCategory !== "all" && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-brand-primary/10 text-brand-primary">
                Category:{" "}
                {
                  galleryCategories.find((c) => c.value === selectedCategory)
                    ?.label
                }
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="ml-2 hover:text-brand-primary/70"
                >
                  <Icon icon="mdi:close" width={14} />
                </button>
              </span>
            )}
            {selectedEvent !== "all" && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-brand-primary/10 text-brand-primary">
                Event: {events.find((e) => e.id === selectedEvent)?.title}
                <button
                  onClick={() => setSelectedEvent("all")}
                  className="ml-2 hover:text-brand-primary/70"
                >
                  <Icon icon="mdi:close" width={14} />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-brand-primary/10 text-brand-primary">
                Search: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery("")}
                  className="ml-2 hover:text-brand-primary/70"
                >
                  <Icon icon="mdi:close" width={14} />
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Results Count */}
        {!loading && !error && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
              Showing{" "}
              <span className="font-medium">
                {filteredAndSortedItems.length}
              </span>{" "}
              of <span className="font-medium">{galleryItems.length}</span>{" "}
              gallery items
            </p>
          </div>
        )}

        {/* Gallery Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, index) => (
              <GalleryItemSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
              <Icon
                icon="mdi:alert-circle"
                width={40}
                className="text-red-500"
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to load gallery
            </h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <Button
              text="Try Again"
              type="primary"
              onClick={() => window.location.reload()}
            />
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
              <Icon icon="mdi:image-off" width={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No gallery items found
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              We couldn't find any gallery items matching your current filters.
              Try adjusting your search criteria or browse all items.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                text="Clear Filters"
                type="secondary"
                onClick={handleClearFilters}
              />
              <Button text="Browse All Items" type="primary" link="/gallery" />
            </div>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredAndSortedItems.map((item) => (
              <GalleryItem key={item.id} item={item} viewMode={viewMode} />
            ))}
          </div>
        )}

        {/* Load More Button (if needed) */}
        {!loading && !error && filteredAndSortedItems.length >= 12 && (
          <div className="text-center mt-12">
            <Button text="Load More Gallery Items" type="secondary" />
          </div>
        )}
      </Container>
    </Section>
  );
};

export default AllGallerySection;
