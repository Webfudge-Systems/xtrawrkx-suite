"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Section from "../layout/Section";
import Container from "../layout/Container";
import SectionHeader from "../common/SectionHeader";
import GalleryFilter from "./GalleryFilter";
import GalleryItem from "./GalleryItem";
import { galleryService } from "../../services/databaseService";

const GalleryGrid = ({
  eventSlug = null,
  eventId = null,
  title = "Our Gallery",
  label = "Moments",
  showCategoryFilter = true,
}) => {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Handle URL parameters for filtering
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (
      categoryParam &&
      ["events", "communities", "achievements", "team"].includes(categoryParam)
    ) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  // Load gallery items from Firebase
  useEffect(() => {
    loadGalleryItems();
  }, [eventSlug, eventId]);

  const loadGalleryItems = async () => {
    try {
      setLoading(true);
      setError(null);
      let items;

      if (eventSlug) {
        // Load gallery items for specific event by slug
        items = await galleryService.getGalleryItemsByEventSlug(eventSlug);
      } else if (eventId) {
        // Load gallery items for specific event by ID
        items = await galleryService.getGalleryItemsByEvent(eventId);
      } else {
        // Load all gallery items (original behavior)
        items = await galleryService.getGalleryItems();
      }

      setGalleryItems(items);
    } catch (error) {
      setError("Failed to load gallery items. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Filter gallery items based on selected category and search query,
  // then sort by date (latest first) to ensure newest images appear on top.
  const filteredItems = useMemo(() => {
    const filtered = galleryItems.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.tags &&
          item.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          ));

      return matchesCategory && matchesSearch;
    });

    // Sort by date descending (latest first). Use `date` if available, otherwise fallback to `createdAt`.
    filtered.sort((a, b) => {
      const getTime = (obj) => {
        const d = obj && (obj.date || obj.createdAt) ? (obj.date instanceof Date ? obj.date : new Date(obj.date || obj.createdAt)) : new Date(0);
        return isNaN(d.getTime()) ? 0 : d.getTime();
      };

      return getTime(b) - getTime(a);
    });

    return filtered;
  }, [selectedCategory, searchQuery, galleryItems]);

  const handleClearFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
  };

  if (loading) {
    return (
      <Section className="bg-white">
        <Container>
          <SectionHeader title={title} label={label} className="mb-6" />
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading gallery items...</p>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  if (error) {
    return (
      <Section className="bg-white">
        <Container>
          <SectionHeader title={title} label={label} className="mb-6" />
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <svg
                className="w-16 h-16 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Unable to load gallery
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={loadGalleryItems}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section className="bg-white">
      <Container>
        <SectionHeader title={title} label={label} className="mb-6" />

        <GalleryFilter
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onCategoryChange={setSelectedCategory}
          onSearchChange={setSearchQuery}
          onClearFilters={handleClearFilters}
          showCategoryFilter={showCategoryFilter}
        />

        {/* Results Count */}
        <div className="mb-8 flex items-center justify-between">
          <p className="text-gray-600">
            Showing <span className="font-medium">{filteredItems.length}</span>{" "}
            of <span className="font-medium">{galleryItems.length}</span> items
          </p>
        </div>

        {/* Gallery Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <GalleryItem key={item.id} item={item} />
            ))}
          </div>
        ) : galleryItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No gallery items yet
            </h3>
            <p className="text-gray-600">
              Check back later for new gallery content.
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No items match your criteria
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filter criteria.
            </p>
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </Container>
    </Section>
  );
};

export default GalleryGrid;
