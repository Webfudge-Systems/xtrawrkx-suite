import Section from "../layout/Section";
import Container from "../layout/Container";
import EventCard from "../common/EventCard";
import Button from "../common/Button";
import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import { EventService } from "../../services/databaseService";
import {
  formatEventDate,
  convertFirestoreTimestampToDate,
} from "../../utils/dateUtils";

export default function PastEvents({ initialCategoryFilter }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategoryFilter
      ? initialCategoryFilter.charAt(0).toUpperCase() +
          initialCategoryFilter.slice(1)
      : "All"
  );
  const [sortBy, setSortBy] = useState("date-desc");
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = ["All", "Summit", "Workshop", "Conference", "Networking"];

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

  // Fetch past events from Firebase
  useEffect(() => {
    const fetchPastEvents = async () => {
      try {
        setLoading(true);
        // Fetch all events and filter for past events
        const allEvents = await eventService.getAll("date", "desc");
        const now = new Date();
        const past = allEvents.filter((event) => {
          return event.status && event.status.toLowerCase() === "completed";
        });

        setPastEvents(past);
        setError(null);
      } catch (err) {
        setError("Failed to load past events");
        setPastEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPastEvents();
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
  const filteredAndSortedEvents = pastEvents
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
    <Section className="py-20 bg-gradient-to-br from-slate-100 via-gray-50 to-blue-50/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-15">
        <div className="absolute top-20 right-10 w-80 h-80 bg-gradient-to-br from-slate-400 to-gray-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full blur-3xl"></div>
      </div>

      <Container className="relative z-10">
        {/* Modern Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-600 to-gray-700 text-white px-6 py-2 rounded-full text-sm font-semibold mb-6">
            <Icon icon="mdi:calendar-check" width={20} />
            Event Archive
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Past{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-gray-700">
              Events
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Take a look at our successful past events and workshops. See what
            you missed and get inspired for future participation.
          </p>
        </div>

        {/* Search, Filter and Sort Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-12 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50">
          <div className="relative flex-1">
            <Icon
              icon="mdi:magnify"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              width={20}
            />
            <input
              type="text"
              placeholder="Search past events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
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
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent appearance-none bg-white cursor-pointer"
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
                    ? "bg-gradient-to-r from-slate-600 to-gray-700 text-white shadow-lg"
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
              className="text-slate-600 mx-auto mb-4 animate-spin"
              width={64}
            />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Loading past events...
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
                  <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-slate-600 to-gray-700 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {event.category}
                  </div>
                  {/* Completed badge */}
                  <div className="absolute top-4 right-4 z-20 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Icon icon="mdi:check-circle" width={14} />
                    Completed
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
              No past events found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Statistics Section */}
        <div className="mt-16 p-8 bg-gradient-to-r from-slate-50 to-gray-100 rounded-2xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold text-slate-700 mb-2">
                {pastEvents.length}
              </div>
              <div className="text-gray-600 font-medium">Total Events</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold text-slate-700 mb-2">
                5000+
              </div>
              <div className="text-gray-600 font-medium">Attendees</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold text-slate-700 mb-2">15+</div>
              <div className="text-gray-600 font-medium">Cities</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold text-slate-700 mb-2">98%</div>
              <div className="text-gray-600 font-medium">Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <Button
            text="View Event Gallery"
            type="primary"
            link="/gallery?category=events"
            className="text-lg px-8 py-4 w-fit mx-auto bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800"
          />
        </div>
      </Container>
    </Section>
  );
}
