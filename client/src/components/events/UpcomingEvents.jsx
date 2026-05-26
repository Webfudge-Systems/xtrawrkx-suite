import Section from "../layout/Section";
import Container from "../layout/Container";
import EventCard from "../common/EventCard";
import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import { EventService } from "../../services/databaseService";
import {
  formatEventDate,
  convertFirestoreTimestampToDate,
} from "../../utils/dateUtils";

export default function UpcomingEvents({ initialCategoryFilter }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategoryFilter
      ? initialCategoryFilter.charAt(0).toUpperCase() +
          initialCategoryFilter.slice(1)
      : "All"
  );
  const [sortBy, setSortBy] = useState("date-desc");
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = [
    "All",
    "Summit",
    "Workshop",
    "Conference",
    "Competition",
    "Networking",
  ];

  const sortOptions = [
    {
      value: "date-desc",
      label: "Date: Newest First",
      icon: "mdi:calendar-arrow-left",
    },
    {
      value: "date-asc",
      label: "Date: Oldest First",
      icon: "mdi:calendar-arrow-right",
    },
    {
      value: "title-asc",
      label: "Alphabetic: A-Z",
      icon: "mdi:sort-alphabetical-ascending",
    },
    {
      value: "title-desc",
      label: "Alphabetic: Z-A",
      icon: "mdi:sort-alphabetical-descending",
    },
  ];

  const eventService = new EventService();

  // Fetch upcoming events from Firebase
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        setLoading(true);
        const events = await eventService.getAll("date", "desc");

        // Filter for upcoming events
        const upcoming = events.filter((event) => {
          return event.status && event.status.toLowerCase() === "upcoming";
        });

        // If no upcoming events found, show the 6 most recent events as fallback
        if (upcoming.length > 0) {
          setUpcomingEvents(upcoming);
        } else {
          // setUpcomingEvents(events.slice(0, 6)); // Show first 6 events
        }

        setError(null);
      } catch (err) {
        setError("Failed to load events");
        setUpcomingEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingEvents();
  }, []);

  // Update selected category when initialCategoryFilter changes
  useEffect(() => {
    if (initialCategoryFilter) {
      const formattedCategory =
        initialCategoryFilter.charAt(0).toUpperCase() +
        initialCategoryFilter.slice(1);
      if (categories.includes(formattedCategory)) {
        setSelectedCategory(formattedCategory);
      }
    }
  }, [initialCategoryFilter]);

  // Filter and sort events
  const filteredAndSortedEvents = upcomingEvents
    .filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || event.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date) - new Date(a.date);
        case "date-asc":
          return new Date(a.date) - new Date(b.date);
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

  return (
    <Section className="py-20 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20">
        <div className="absolute top-20 left-10 w-[40%] h-[30%] bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-blue-300 to-cyan-300 rounded-full blur-3xl"></div>
      </div>

      <Container className="relative z-10">
        {/* Modern Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-6 py-2 rounded-full text-sm font-semibold mb-6">
            <Icon icon="mdi:calendar-star" width={20} />
            Featured Events
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Upcoming{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
              Events
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join us for exciting upcoming events and workshops. Don't miss out
            on these opportunities to learn, network, and grow.
          </p>
        </div>

        {/* Search, Filter and Sort Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-12 p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
          <div className="relative flex-1">
            <Icon
              icon="mdi:magnify"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              width={20}
            />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative min-w-[200px]">
            <Icon
              icon="mdi:sort"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              width={20}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent appearance-none bg-white cursor-pointer"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Icon
              icon="mdi:chevron-down"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
              width={20}
            />
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-16">
            <Icon
              icon="mdi:loading"
              className="text-brand-primary mx-auto mb-4 animate-spin"
              width={64}
            />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Loading events...
            </h3>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <Icon
              icon="mdi:alert-circle"
              className="text-red-500 mx-auto mb-4"
              width={64}
            />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {error}
            </h3>
            <p className="text-gray-500">Please try again later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedEvents.map((event, index) => (
              <div
                key={event.id || index}
                className="group transform transition-all duration-300 hover:scale-105 hover:-translate-y-2"
              >
                <div className="relative">
                  {/* Category badge */}
                  <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {event.category}
                  </div>
                  <EventCard
                    background={event.heroImage || "/images/hero.png"}
                    title={event.title}
                    date={formatEventDate(event.date) || event.date}
                    location={event.location}
                    slug={event.slug}
                    season={event.season}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show message if no events found */}
        {!loading && !error && filteredAndSortedEvents.length === 0 && (
          <div className="text-center py-16">
            <Icon
              icon="mdi:calendar-remove"
              className="text-gray-400 mx-auto mb-4"
              width={64}
            />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No events found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </Container>
    </Section>
  );
}
