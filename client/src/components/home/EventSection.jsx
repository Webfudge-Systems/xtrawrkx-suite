"use client";
import Section from "../layout/Section";
import Container from "../layout/Container";
import EventCard from "../common/EventCard";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import SectionHeader from "../common/SectionHeader";
import { eventService } from "@/src/services/databaseService";

export default function EventSection() {
  const [current, setCurrent] = useState(0); // Start with first card
  const [isHovered, setIsHovered] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch upcoming events
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        setLoading(true);
        // Get upcoming events by filtering for status === "upcoming"

        const events = await eventService.getAll("date", "desc");

        // Filter for upcoming events
        const upcoming = events.filter((event) => {
          return event.status && event.status.toLowerCase() === "upcoming";
        });

        // Get only next 3 upcoming events
        const nextThreeEvents = upcoming.slice(0, 3);
        setEvents(nextThreeEvents);

        // If we have events, start with the middle one (index 1) if there are 3 events
        if (nextThreeEvents.length >= 3) {
          setCurrent(1);
        } else if (nextThreeEvents.length > 0) {
          setCurrent(0);
        }
      } catch (err) {
        setError("Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingEvents();
  }, []);

  const prev = () => setCurrent((c) => (c === 0 ? events.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === events.length - 1 ? 0 : c + 1));

  // Auto-advance carousel
  useEffect(() => {
    if (events.length > 1) {
      const interval = setInterval(() => {
        if (!isHovered) {
          setCurrent((c) => (c === events.length - 1 ? 0 : c + 1));
        }
      }, 4000); // Change slide every 4 seconds

      return () => clearInterval(interval);
    }
  }, [isHovered, events.length]);

  // Animation helpers for desktop
  const getCardStyle = (idx) => {
    if (idx === current) {
      return {
        transform: "translateX(-50%) scale(1) translateY(0)",
        zIndex: 20,
        opacity: 1,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      };
    } else if (idx === (current + events.length - 1) % events.length) {
      return {
        transform: "translateX(-120%) scale(0.7) translateY(60px)",
        zIndex: 5,
        opacity: 1,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      };
    } else if (idx === (current + 1) % events.length) {
      return {
        transform: "translateX(20%) scale(0.7) translateY(60px)",
        zIndex: 5,
        opacity: 1,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      };
    } else {
      return {
        transform: "translateX(-50%) scale(0.7) translateY(60px)",
        zIndex: 0,
        opacity: 0,
        pointerEvents: "none",
      };
    }
  };

  // Mobile card style - simple left/right positioning
  const getMobileCardStyle = (idx) => {
    if (idx === current) {
      return {
        transform: "translateX(0)",
        opacity: 1,
        zIndex: 10,
      };
    } else {
      return {
        transform: idx < current ? "translateX(-100%)" : "translateX(100%)",
        opacity: 0,
        zIndex: 0,
      };
    }
  };

  // Loading state
  if (loading) {
    return (
      <Section className="relative py-12 md:py-16">
        <Container>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
            <SectionHeader
              label="FEATURED EVENTS"
              title="Our Events"
              className="mb-0 !w-full sm:!w-[60%] md:!w-[40%]"
            />
            <button className="bg-gray-200 cursor-pointer text-gray-700 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium hover:bg-gray-300 transition flex items-center gap-2 self-start sm:self-auto">
              All Events
              <span>
                <Icon
                  icon="solar:arrow-right-up-linear"
                  width={16}
                  height={16}
                  className="md:w-[18px] md:h-[18px]"
                />
              </span>
            </button>
          </div>

          <div className="flex items-center justify-center h-[300px] md:h-[520px]">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span>Loading upcoming events...</span>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  // Error state
  if (error) {
    return (
      <Section className="relative py-12 md:py-16">
        <Container>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
            <SectionHeader
              label="FEATURED EVENTS"
              title="Our Events"
              className="mb-0 !w-full sm:!w-[60%] md:!w-[40%]"
            />
            <button
              className="bg-gray-200 cursor-pointer text-gray-700 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium hover:bg-gray-300 transition flex items-center gap-2 self-start sm:self-auto"
              onClick={() => {
                window.location.href = "/events";
              }}
            >
              All Events
              <span>
                <Icon
                  icon="solar:arrow-right-up-linear"
                  width={16}
                  height={16}
                  className="md:w-[18px] md:h-[18px]"
                />
              </span>
            </button>
          </div>

          <div className="flex items-center justify-center h-[300px] md:h-[520px]">
            <div className="text-center text-red-600">
              <Icon
                icon="mdi:alert-circle"
                width={48}
                height={48}
                className="mx-auto mb-2"
              />
              <p>{error}</p>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  // No events state
  if (events.length === 0) {
    return (
      <Section className="relative py-12 md:py-16">
        <Container>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
            <SectionHeader
              label="FEATURED EVENTS"
              title="Our Events"
              className="mb-0 !w-full sm:!w-[60%] md:!w-[40%]"
            />
            <button className="bg-gray-200 cursor-pointer text-gray-700 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium hover:bg-gray-300 transition flex items-center gap-2 self-start sm:self-auto">
              All Events
              <span>
                <Icon
                  icon="solar:arrow-right-up-linear"
                  width={16}
                  height={16}
                  className="md:w-[18px] md:h-[18px]"
                />
              </span>
            </button>
          </div>

          <div className="flex items-center justify-center h-[300px] md:h-[520px]">
            <div className="text-center text-gray-600">
              <Icon
                icon="mdi:calendar"
                width={48}
                height={48}
                className="mx-auto mb-2"
              />
              <p>No upcoming events found</p>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section className="relative py-12 md:py-16">
      <Container>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
          <SectionHeader
            label="FEATURED EVENTS"
            title="Our Events"
            className="mb-0 !w-full sm:!w-[60%] md:!w-[40%]"
          />
          <button
            className="bg-gray-200 cursor-pointer text-gray-700 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium hover:bg-gray-300 transition flex items-center gap-2 self-start sm:self-auto"
            onClick={() => {
              window.location.href = "/events";
            }}
          >
            All Events
            <span>
              <Icon
                icon="solar:arrow-right-up-linear"
                width={16}
                height={16}
                className="md:w-[18px] md:h-[18px]"
              />
            </span>
          </button>
        </div>

        {/* Desktop Carousel */}
        <div
          className="hidden md:flex relative items-center justify-center min-h-[420px] h-[520px]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Cards with animation */}
          <div className="relative flex items-center justify-center w-full h-full">
            {events.map((event, idx) => (
              <div
                key={event.id || idx}
                className="absolute left-1/2 top-0 w-full max-w-[520px] h-[100px] transition-all duration-500 ease-in-out"
                style={{
                  ...getCardStyle(idx),
                  transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)",
                  transformOrigin: "center bottom",
                  pointerEvents: idx === current ? "auto" : "none",
                }}
              >
                <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-3 py-1 rounded-full text-xs font-semibold">
                  {event.category}
                </div>
                <EventCard
                  background={event.heroImage || "/images/hero.png"}
                  title={event.title}
                  date={
                    event.date
                      ? new Date(event.date).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                        })
                      : "TBD"
                  }
                  location={event.location}
                  slug={event.slug}
                  season={event.season}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Carousel */}
        <div
          className="md:hidden relative overflow-visible h-[400px] sm:h-[450px]"
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setIsHovered(false)}
        >
          <div className="relative w-full h-full">
            {events.map((event, idx) => (
              <div
                key={event.id || idx}
                className="absolute inset-0 transition-all duration-500 ease-in-out px-0 pb-4"
                style={getMobileCardStyle(idx)}
              >
                <EventCard
                  background={
                    event.heroImage || event.background || "/images/hero.png"
                  }
                  title={event.title || event.name}
                  date={
                    event.date
                      ? new Date(event.date).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                        })
                      : "TBD"
                  }
                  location={event.location}
                  slug={event.slug}
                  category={event.category}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Navigation arrows below cards - Only show if more than 1 event */}
        {events.length > 1 && (
          <div className="flex items-center justify-center gap-4 md:gap-6 -mt-4 md:mt-8">
            <button
              className="bg-white border cursor-pointer border-gray-300 rounded-full w-10 h-10 md:w-10 md:h-10 flex items-center justify-center shadow hover:bg-gray-100 transition"
              onClick={prev}
              aria-label="Previous"
            >
              <span className="text-lg md:text-2xl">
                <Icon
                  icon="mdi:arrow-left"
                  width={20}
                  height={20}
                  className="md:w-6 md:h-6"
                />
              </span>
            </button>
            {/* Dots */}
            <div className="flex items-center justify-center gap-2">
              {events.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-200 ${
                    idx === current ? "bg-pink-500" : "bg-gray-300"
                  }`}
                  onClick={() => setCurrent(idx)}
                  aria-label={`Go to event ${idx + 1}`}
                />
              ))}
            </div>
            <button
              className="bg-white cursor-pointer border border-gray-300 rounded-full w-10 h-10 md:w-10 md:h-10 flex items-center justify-center shadow hover:bg-gray-100 transition"
              onClick={next}
              aria-label="Next"
            >
              <span className="text-lg md:text-2xl">
                <Icon
                  icon="mdi:arrow-right"
                  width={20}
                  height={20}
                  className="md:w-6 md:h-6"
                />
              </span>
            </button>
          </div>
        )}
      </Container>
    </Section>
  );
}
