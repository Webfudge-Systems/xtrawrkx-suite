"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  Users,
  Ticket,
  Eye,
  Filter,
  Search,
  ChevronDown,
  XCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import EventCard from "@/components/events/EventCard";
import RegistrationDetails from "@/components/events/RegistrationDetails";
import VirtualTicket from "@/components/events/VirtualTicket";
import EventGalleryModal from "@/components/events/EventGalleryModal";
import { fetchWebsiteEventsCatalogWithRegistrations } from "@/lib/websiteEventsService";
import { useSession } from "@/lib/auth";

const filterOptions = [
  { value: "all", label: "All Events" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "conference", label: "Conferences" },
  { value: "workshop", label: "Workshops" },
  { value: "meetup", label: "Meetups" },
];

const categoryTabs = [
  { key: "my-events", label: "My Events", icon: Ticket },
  { key: "all-events", label: "All Events", icon: Users },
  { key: "past-events", label: "Past Events", icon: Clock },
];

export default function EventsPage() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email || "";

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [eventCategoryTab, setEventCategoryTab] = useState("all-events");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryEvent, setGalleryEvent] = useState(null);

  const loadEvents = useCallback(
    async (email) => {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const data = await fetchWebsiteEventsCatalogWithRegistrations(email);
        setEvents(data);
      } catch (e) {
        setEventsError(e.message || "Could not load events from the website.");
        setEvents([]);
      } finally {
        setEventsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadEvents(userEmail);
  }, [loadEvents, userEmail]);

  const myEventsCount = useMemo(
    () =>
      events.filter(
        (e) =>
          e.registrationStatus === "confirmed" ||
          e.registrationStatus === "attended"
      ).length,
    [events]
  );

  const eventStats = useMemo(() => {
    const upcoming = events.filter((e) => e.status === "upcoming").length;
    const completed = events.filter((e) => e.status === "completed").length;
    return {
      total: events.length,
      myRegistrations: myEventsCount,
      upcoming,
      completed,
    };
  }, [events, myEventsCount]);

  const statusStats = [
    {
      label: "Total Events",
      count: eventStats.total,
      color: "bg-xtrawrkx-50",
      borderColor: "border-xtrawrkx-200",
      iconColor: "text-xtrawrkx-600",
      icon: Calendar,
      hint: "Across all listings",
    },
    {
      label: "My registrations",
      count: eventStats.myRegistrations,
      color: "bg-purple-50",
      borderColor: "border-purple-200",
      iconColor: "text-purple-600",
      icon: Ticket,
      hint: "Confirmed or attended",
    },
    {
      label: "Upcoming",
      count: eventStats.upcoming,
      color: "bg-yellow-50",
      borderColor: "border-yellow-200",
      iconColor: "text-yellow-600",
      icon: Clock,
      hint: "Scheduled ahead",
    },
    {
      label: "Completed",
      count: eventStats.completed,
      color: "bg-green-50",
      borderColor: "border-green-200",
      iconColor: "text-green-600",
      icon: CheckCircle2,
      hint: "Past events",
    },
  ];

  const tabBadges = useMemo(
    () => ({
      "my-events": myEventsCount,
      "all-events": events.length,
      "past-events": events.filter((e) => e.status === "completed").length,
    }),
    [myEventsCount, events]
  );

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesCategoryTab = true;
      if (eventCategoryTab === "my-events") {
        matchesCategoryTab =
          event.registrationStatus === "confirmed" ||
          event.registrationStatus === "attended";
      } else if (eventCategoryTab === "all-events") {
        matchesCategoryTab = true;
      } else if (eventCategoryTab === "past-events") {
        matchesCategoryTab = event.status === "completed";
      }

      const matchesFilter =
        filterStatus === "all" ||
        event.status === filterStatus ||
        event.category.toLowerCase() === filterStatus;

      return matchesSearch && matchesCategoryTab && matchesFilter;
    });
  }, [events, eventCategoryTab, searchTerm, filterStatus]);

  const listSectionTitle =
    eventCategoryTab === "my-events"
      ? "My Events"
      : eventCategoryTab === "all-events"
        ? "All Events"
        : "Past Events";

  const listSectionSubtitle =
    eventCategoryTab === "my-events"
      ? "Events you are registered for"
      : eventCategoryTab === "all-events"
        ? "Browse and register for events"
        : "Events you have attended";

  const handleOpenGallery = (event) => {
    setGalleryEvent(event);
    setShowGalleryModal(true);
  };

  const pageSubtitle =
    "Events are loaded from the xtrawrkx website catalog (Firebase). Register on the site; portal shows the same listings.";

  const hasActiveFilters =
    filterStatus !== "all" || searchTerm.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 pt-4">
        <PageHeader
          title="Events"
          subtitle={pageSubtitle}
          breadcrumb={[]}
          showActions
          onFilterClick={() => setShowFilters((v) => !v)}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      <div className="px-3 mt-6">
        <div className="space-y-4">
          {eventsError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex flex-wrap items-center justify-between gap-2">
              <span>{eventsError}</span>
              <button
                type="button"
                onClick={() => loadEvents(userEmail)}
                className="font-semibold text-amber-950 underline"
              >
                Retry
              </button>
            </div>
          ) : null}

          {/* KPI row — matches Projects / Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statusStats.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 mb-1 font-medium truncate">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-black text-gray-800">
                        {stat.count}
                      </p>
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <span
                          className={`w-2 h-2 rounded-full mr-2 shrink-0 ${stat.color.replace("-50", "-500")}`}
                        />
                        <span className="truncate">{stat.hint}</span>
                      </div>
                    </div>
                    <div
                      className={`w-16 h-16 shrink-0 ${stat.color} backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border ${stat.borderColor}`}
                    >
                      <IconComponent className={`w-8 h-8 ${stat.iconColor}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabs + search + filter — single toolbar like Projects / Tasks */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl p-3">
            <div className="flex items-center gap-2 flex-1 overflow-x-auto min-w-0">
              {categoryTabs.map((tab) => {
                const Icon = tab.icon;
                const active = eventCategoryTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setEventCategoryTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                      active
                        ? "bg-xtrawrkx-500 text-white shadow-lg"
                        : "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 border border-white/40"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                    <span
                      className={`ml-1 px-2 py-0.5 text-xs font-bold rounded-full ${
                        active
                          ? "bg-white/30 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {tabBadges[tab.key]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/30 focus:border-xtrawrkx-500 focus:bg-white/90 transition-all duration-300 placeholder:text-gray-500 shadow-sm"
                  aria-label="Search events"
                />
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                    aria-label="Clear search"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                ) : null}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFilters((v) => !v)}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-300 shadow-sm ${
                    showFilters || filterStatus !== "all"
                      ? "bg-xtrawrkx-500 text-white border-xtrawrkx-500/50"
                      : "bg-white/80 text-gray-700 border-white/40 hover:bg-white/90"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filter
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
                  />
                </button>
                {showFilters ? (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setFilterStatus(option.value);
                          setShowFilters(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                          filterStatus === option.value
                            ? "bg-xtrawrkx-50 text-xtrawrkx-700 font-medium"
                            : "text-gray-800"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Main: list + detail — one surface per column, no nested mega-cards */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
            <section className="xl:col-span-2 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200/60 bg-white/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {listSectionTitle}
                  </h2>
                  <p className="text-sm text-gray-500">{listSectionSubtitle}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-xtrawrkx-50 text-xtrawrkx-800 border border-xtrawrkx-100">
                    {filteredEvents.filter((e) => e.status === "upcoming").length}{" "}
                    upcoming
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-green-50 text-green-800 border border-green-100">
                    {filteredEvents.filter((e) => e.status === "completed").length}{" "}
                    completed
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {eventsLoading ? (
                  <div className="text-center py-14 flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 text-xtrawrkx-500 animate-spin" />
                    <p className="text-sm text-gray-600">Loading events from xtrawrkx.com…</p>
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="text-center py-14">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {eventCategoryTab === "my-events" && "No registered events"}
                      {eventCategoryTab === "all-events" && "No events match"}
                      {eventCategoryTab === "past-events" && "No past events"}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      {eventCategoryTab === "my-events" &&
                        "You have not registered for any events yet, or try another search."}
                      {eventCategoryTab === "all-events" &&
                        "Try clearing filters or searching with different keywords."}
                      {eventCategoryTab === "past-events" &&
                        "Completed events you attended will show here."}
                    </p>
                  </div>
                ) : (
                  filteredEvents.map((event) => (
                    <EventCard
                      key={String(event.id)}
                      event={event}
                      selected={selectedEvent?.id === event.id}
                      onClick={() => {
                        setSelectedEvent(event);
                        setActiveTab("details");
                      }}
                      onViewWebsite={() =>
                        window.open(event.websiteUrl, "_blank")
                      }
                      onOpenGallery={handleOpenGallery}
                    />
                  ))
                )}
              </div>
            </section>

            <aside className="xl:col-span-1 xl:sticky xl:top-6">
              {selectedEvent ? (
                <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-200/60 bg-white/50 flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-gray-900 truncate pr-2">
                      Event details
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(null)}
                      className="text-gray-400 hover:text-gray-700 text-2xl leading-none px-2 py-1 rounded-lg hover:bg-gray-100/80 transition-colors"
                      aria-label="Close details"
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-4 space-y-4">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {selectedEvent.title}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab("details")}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          activeTab === "details"
                            ? "bg-xtrawrkx-500 text-white shadow-md"
                            : "bg-white/80 text-gray-700 border border-white/40 hover:bg-white"
                        }`}
                      >
                        {selectedEvent.registrationStatus === "not_registered"
                          ? "Registration"
                          : "Registration details"}
                      </button>
                      {selectedEvent.registrationStatus !==
                        "not_registered" && (
                        <button
                          type="button"
                          onClick={() => setActiveTab("ticket")}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            activeTab === "ticket"
                              ? "bg-xtrawrkx-500 text-white shadow-md"
                              : "bg-white/80 text-gray-700 border border-white/40 hover:bg-white"
                          }`}
                        >
                          Ticket
                        </button>
                      )}
                    </div>
                    <div className="rounded-2xl border border-white/40 bg-white/40 p-3">
                      {activeTab === "details" && (
                        <RegistrationDetails
                          event={selectedEvent}
                          onEdit={() => {}}
                        />
                      )}
                      {activeTab === "ticket" &&
                        selectedEvent.registrationStatus !==
                          "not_registered" && (
                          <VirtualTicket
                            event={selectedEvent}
                            onDownload={() => {}}
                          />
                        )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm p-10 text-center">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select an event
                  </h3>
                  <p className="text-sm text-gray-500">
                    Click a row on the left to view registration details and
                    your virtual ticket.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>

      <EventGalleryModal
        event={galleryEvent}
        isOpen={showGalleryModal}
        onClose={() => {
          setShowGalleryModal(false);
          setGalleryEvent(null);
        }}
      />
    </div>
  );
}
