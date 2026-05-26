"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import Section from "../layout/Section";
import Container from "../layout/Container";
import SectionHeader from "../common/SectionHeader";
import SimpleGalleryItem from "./SimpleGalleryItem";
import { galleryService, eventService } from "../../services/databaseService";

const EventGallerySection = () => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedEvents, setExpandedEvents] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");

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

  // Group gallery items by event
  const galleryByEvents = useMemo(() => {
    // Filter gallery items by search query first
    let filteredItems = galleryItems;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredItems = galleryItems.filter(
        (item) =>
          item.title?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          (item.tags &&
            item.tags.some((tag) => tag.toLowerCase().includes(query)))
      );
    }

    // Group by events
    const grouped = {};
    const unassignedImages = [];

    filteredItems.forEach((item) => {
      if (item.eventId) {
        if (!grouped[item.eventId]) {
          grouped[item.eventId] = [];
        }
        grouped[item.eventId].push(item);
      } else {
        unassignedImages.push(item);
      }
    });

    // Create result array with event details
    const result = [];

    // Add events with images
    events.forEach((event) => {
      if (grouped[event.id]) {
        result.push({
          event: event,
          images: grouped[event.id],
          isEvent: true,
        });
      }
    });

    // Add unassigned images if any
    if (unassignedImages.length > 0) {
      result.push({
        event: {
          id: "unassigned",
          title: "Other Images",
          description: "Images not associated with any specific event",
        },
        images: unassignedImages,
        isEvent: false,
      });
    }

    // Sort event groups by event date (latest first). Keep non-event groups (like "Other Images") at the end.
    const eventGroups = result.filter((g) => g.isEvent);
    const otherGroups = result.filter((g) => !g.isEvent);

    const getEventTime = (e) => {
      if (!e) return 0;
      const d = e.date ? (e.date instanceof Date ? e.date : new Date(e.date)) : e.createdAt ? (e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt)) : null;
      return d && !isNaN(d.getTime()) ? d.getTime() : 0;
    };

    eventGroups.sort((a, b) => getEventTime(b.event) - getEventTime(a.event));

    return [...eventGroups, ...otherGroups];
  }, [galleryItems, events, searchQuery]);

  const toggleEventExpanded = (eventId) => {
    setExpandedEvents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const toggleAllEvents = () => {
    if (expandedEvents.size === galleryByEvents.length) {
      // All expanded, collapse all
      setExpandedEvents(new Set());
    } else {
      // Some or none expanded, expand all
      setExpandedEvents(
        new Set(galleryByEvents.map((group) => group.event.id))
      );
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Section className="bg-white py-16">
        <Container>
          <SectionHeader
            title="Event Gallery"
            label="Images"
            description="Browse images organized by events"
            className="mb-12"
          />
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading gallery...</p>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  if (error) {
    return (
      <Section className="bg-white py-16">
        <Container>
          <SectionHeader
            title="Event Gallery"
            label="Images"
            description="Browse images organized by events"
            className="mb-12"
          />
          <div className="text-center py-12">
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
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </Container>
      </Section>
    );
  }

  const totalImages = galleryByEvents.reduce(
    (sum, group) => sum + group.images.length,
    0
  );

  return (
    <Section className="bg-white py-16">
      <Container>
        <SectionHeader
          title="Event Gallery"
          label="Images"
          description="Browse images organized by events"
          className="mb-12"
        />

        {/* Search and Controls */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Icon
                icon="mdi:magnify"
                width={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>

            {/* Toggle All Button */}
            <button
              onClick={toggleAllEvents}
              className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors flex items-center gap-2"
            >
              <Icon
                icon={
                  expandedEvents.size === galleryByEvents.length
                    ? "mdi:collapse-all"
                    : "mdi:expand-all"
                }
                width={20}
              />
              {expandedEvents.size === galleryByEvents.length
                ? "Collapse All"
                : "Expand All"}
            </button>
          </div>

          {/* Stats */}
          <div className="mt-4 text-sm text-gray-600">
            <span className="font-medium">{totalImages}</span> images across{" "}
            <span className="font-medium">{galleryByEvents.length}</span> events
            {searchQuery && (
              <span className="ml-2 text-brand-primary">
                (filtered by "{searchQuery}")
              </span>
            )}
          </div>
        </div>

        {/* Events Gallery */}
        {galleryByEvents.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
              <Icon icon="mdi:image-off" width={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No images found
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchQuery
                ? `No images match your search for "${searchQuery}". Try a different search term.`
                : "No gallery images available at the moment."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {galleryByEvents.map((group) => {
              const isExpanded = expandedEvents.has(group.event.id);
              const { event, images } = group;

              return (
                <div
                  key={event.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Event Header */}
                  <button
                    onClick={() => toggleEventExpanded(event.id)}
                    className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                          <Icon
                            icon={
                              group.isEvent
                                ? "mdi:calendar-check"
                                : "mdi:image-multiple"
                            }
                            width={20}
                            className="text-brand-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {event.date && (
                            <span className="flex items-center gap-1">
                              <Icon icon="mdi:calendar" width={16} />
                              {formatDate(event.date)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Icon icon="mdi:image" width={16} />
                            {images.length}{" "}
                            {images.length === 1 ? "image" : "images"}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Icon
                      icon={isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"}
                      width={24}
                      className="text-gray-400"
                    />
                  </button>

                  {/* Event Images */}
                  {isExpanded && (
                    <div className="p-6 bg-white">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {images.map((item) => (
                          <SimpleGalleryItem key={item.id} item={item} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </Section>
  );
};

export default EventGallerySection;
