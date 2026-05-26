"use client";
import { notFound } from "next/navigation";
import { use, useState, useEffect } from "react";
import Image from "next/image";
import Section from "@/src/components/layout/Section";
import Container from "@/src/components/layout/Container";
import Button from "@/src/components/common/Button";
import { Icon } from "@iconify/react";
import { EventService, galleryService } from "@/src/services/databaseService";
import { formatEventDate } from "@/src/utils/dateUtils";

export default function EventPage({ params }) {
  const { slug } = use(params);
  const [event, setEvent] = useState(null);
  const [eventGallery, setEventGallery] = useState([]);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [seasonEvents, setSeasonEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const eventService = new EventService();

  // Function to check if event is completed (past date)
  const isEventCompleted = (eventDate) => {
    if (!eventDate) return false;

    const now = new Date();
    const eventDateTime =
      eventDate instanceof Date ? eventDate : new Date(eventDate);

    // Set both dates to start of day for comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDay = new Date(
      eventDateTime.getFullYear(),
      eventDateTime.getMonth(),
      eventDateTime.getDate()
    );

    return eventDay < today;
  };

  // Auto-scroll effect for speakers
  useEffect(() => {
    if (event?.speakers && event.speakers.length > 2) {
      // Add a small delay to ensure DOM is ready
      const initializeScroll = () => {
        const container = document.getElementById("speakers-container");
        if (!container) {
          console.log("Container not found, retrying...");
          setTimeout(initializeScroll, 100);
          return;
        }

        let isPaused = false;
        let animationId;
        let scrollSpeed = 0.5; // Slower speed for better visibility

        const autoScroll = () => {
          if (isPaused) {
            animationId = requestAnimationFrame(autoScroll);
            return;
          }

          const scrollWidth = container.scrollWidth;
          const clientWidth = container.clientWidth;
          const halfScrollWidth = scrollWidth / 2; // Since we duplicated content
          const currentScroll = container.scrollLeft;

          console.log(
            "Scrolling:",
            currentScroll,
            "Half width:",
            halfScrollWidth
          );

          // If we've scrolled past the first set, reset to beginning for seamless loop
          if (currentScroll >= halfScrollWidth - 10) {
            container.scrollLeft = 0;
            console.log("Reset scroll position");
          } else {
            // Smooth continuous scroll to the right
            container.scrollLeft += scrollSpeed;
          }

          animationId = requestAnimationFrame(autoScroll);
        };

        const handleMouseEnter = () => {
          isPaused = true;
          console.log("Scroll paused");
        };

        const handleMouseLeave = () => {
          isPaused = false;
          console.log("Scroll resumed");
        };

        // Start auto-scrolling after a brief delay
        setTimeout(() => {
          console.log("Starting auto-scroll");
          autoScroll();
        }, 1000);

        // Pause on hover only
        container.addEventListener("mouseenter", handleMouseEnter);
        container.addEventListener("mouseleave", handleMouseLeave);

        // Store cleanup function
        const cleanup = () => {
          if (animationId) {
            cancelAnimationFrame(animationId);
          }
          container.removeEventListener("mouseenter", handleMouseEnter);
          container.removeEventListener("mouseleave", handleMouseLeave);
        };

        // Return cleanup function
        return cleanup;
      };

      const cleanup = initializeScroll();
      return cleanup;
    }
  }, [event?.speakers]);

  // Fetch event by slug from Firebase
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        console.log("Fetching event with slug:", slug);

        const fetchedEvent = await eventService.getEventBySlug(slug);
        console.log("Fetched event:", fetchedEvent);

        if (!fetchedEvent) {
          console.log("Event not found in Firebase");
          setError("Event not found");
          setLoading(false);
          return;
        }

        setEvent(fetchedEvent);

        // Fetch gallery items for this event
        try {
          const galleryItems = await galleryService.getGalleryItemsByEventSlug(
            slug
          );
          setEventGallery(galleryItems);
        } catch (galleryErr) {
          console.warn("Error fetching event gallery:", galleryErr);
          setEventGallery([]);
        }

        // Fetch events from the same season
        try {
          if (fetchedEvent.season) {
            const seasonEventsData = await eventService.getEventsBySeason(
              fetchedEvent.season
            );
            const otherSeasonEvents = seasonEventsData.filter(
              (e) => e.slug !== slug
            );
            setSeasonEvents(otherSeasonEvents);
          }
        } catch (seasonErr) {
          console.warn("Error fetching season events:", seasonErr);
          setSeasonEvents([]);
        }

        // Fetch related events from the same category
        try {
          const allEvents = await eventService.getAll();
          const related = allEvents
            .filter(
              (e) => e.slug !== slug && e.category === fetchedEvent.category
            )
            .slice(0, 3);
          setRelatedEvents(related);
        } catch (relatedErr) {
          console.warn("Error fetching related events:", relatedErr);
          // Don't fail the whole page if related events fail
          setRelatedEvents([]);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching event:", err);
        setError("Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Icon
            icon="mdi:loading"
            className="text-brand-primary mx-auto mb-4 animate-spin"
            width={64}
          />
          <h3 className="text-xl font-semibold text-gray-600">
            Loading event...
          </h3>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Icon
            icon="mdi:alert-circle"
            className="text-red-500 mx-auto mb-4"
            width={64}
          />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {error || "Event not found"}
          </h3>
          <p className="text-gray-500 mb-4">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Button text="Back to Events" type="primary" link="/events" />
        </div>
      </div>
    );
  }

  const eventCompleted = isEventCompleted(event.date);

  const registerLink =
    event.season === "individual"
      ? `/events/${slug}/register`
      : `/events/season/${event.season || "current"}/register?from=${slug}`;

  console.log(
    "Event:",
    event.speakers.length === 0 ? "No speakers" : "Speakers"
  );
  return (
    <>
      {/* Custom styles for hiding scrollbar */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Sticky mobile Register CTA */}
      {!eventCompleted && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md lg:hidden">
          <a
            href={registerLink}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary px-5 py-3.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 active:scale-[0.98]"
          >
            <Icon icon="solar:ticket-bold" width={18} />
            Event Registration
          </a>
        </div>
      )}

      <div className={`min-h-screen bg-white${!eventCompleted ? " pb-20 lg:pb-0" : ""}`}>
        {/* Hero Section */}
        <Section className="relative w-full h-[90vh] min-h-[600px] md:h-[70vh] md:min-h-[500px] flex items-center justify-center overflow-hidden p-0">
          {/* Background image */}
          <div className="absolute inset-0 w-full h-full">
            <Image
              src={event.background || "/images/hero.png"}
              alt={event.title}
              fill
              className="object-cover object-center"
              priority
            />
            {/* Overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60" />
          </div>

          {/* Event Info Overlay */}
          <Container className="relative z-20 text-center text-white pt-8 md:pt-0">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-6 py-2 rounded-full text-sm font-semibold">
                <Icon
                  icon={
                    eventCompleted ? "mdi:calendar-check" : "mdi:calendar-star"
                  }
                  width={20}
                />
                {eventCompleted ? "Completed Event" : event.category}
              </div>
              {event.season && (
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-semibold border border-white/30">
                  <Icon icon="mdi:calendar-range" width={20} />
                  Season {event.season}
                </div>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">
              {event.title}
            </h1>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-lg mb-8">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:calendar-month-outline" width={24} />
                <span>{formatEventDate(event.date) || event.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon="mdi:map-marker-outline" width={24} />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon="mdi:clock-outline" width={24} />
                <span>{event.time}</span>
              </div>
            </div>

            {/* Action buttons - conditional based on event status */}
            {!eventCompleted && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  text="Event Registration"
                  type="primary"
                  link={registerLink}
                  className="bg-gradient-to-r from-brand-primary to-brand-secondary"
                />
                <Button
                  text="Add to Calendar"
                  type="secondary"
                  className="bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
                  onClick={() => {
                    try {
                      // Handle Date object from Firebase or string from static data
                      let eventDate;
                      if (event.date instanceof Date) {
                        eventDate = new Date(event.date);
                      } else {
                        // Parse the event date - remove ordinal indicators (st, nd, rd, th)
                        const cleanDateString = event.date.replace(
                          /(\d+)(st|nd|rd|th)/,
                          "$1"
                        );
                        eventDate = new Date(cleanDateString);
                      }

                      // Check if date is valid
                      if (isNaN(eventDate.getTime())) {
                        console.error("Invalid date format:", event.date);
                        alert("Unable to add to calendar: Invalid date format");
                        return;
                      }

                      // Parse event time if available, otherwise default to 9 AM
                      const startDate = new Date(eventDate);
                      if (event.time) {
                        // Try to parse the time (e.g., "6:00 PM - 9:00 PM" or "9:00 AM - 6:00 PM")
                        const timeMatch = event.time.match(
                          /(\d{1,2}):(\d{2})\s*(AM|PM)/i
                        );
                        if (timeMatch) {
                          let hours = parseInt(timeMatch[1]);
                          const minutes = parseInt(timeMatch[2]);
                          const period = timeMatch[3].toUpperCase();

                          if (period === "PM" && hours !== 12) {
                            hours += 12;
                          } else if (period === "AM" && hours === 12) {
                            hours = 0;
                          }

                          startDate.setHours(hours, minutes, 0, 0);
                        } else {
                          startDate.setHours(9, 0, 0, 0); // Default to 9 AM
                        }
                      } else {
                        startDate.setHours(9, 0, 0, 0); // Default to 9 AM
                      }

                      // Set end time based on event time or default to 2 hours later
                      const endDate = new Date(startDate);
                      if (event.time && event.time.includes(" - ")) {
                        // Try to parse end time
                        const endTimeMatch = event.time.match(
                          /- (\d{1,2}):(\d{2})\s*(AM|PM)/i
                        );
                        if (endTimeMatch) {
                          let endHours = parseInt(endTimeMatch[1]);
                          const endMinutes = parseInt(endTimeMatch[2]);
                          const endPeriod = endTimeMatch[3].toUpperCase();

                          if (endPeriod === "PM" && endHours !== 12) {
                            endHours += 12;
                          } else if (endPeriod === "AM" && endHours === 12) {
                            endHours = 0;
                          }

                          endDate.setHours(endHours, endMinutes, 0, 0);
                        } else {
                          endDate.setTime(
                            startDate.getTime() + 2 * 60 * 60 * 1000
                          ); // 2 hours later
                        }
                      } else {
                        endDate.setTime(
                          startDate.getTime() + 2 * 60 * 60 * 1000
                        ); // 2 hours later
                      }

                      // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
                      const formatDate = (date) => {
                        return (
                          date
                            .toISOString()
                            .replace(/[-:]/g, "")
                            .split(".")[0] + "Z"
                        );
                      };

                      const calendarEvent = {
                        title: event.title,
                        start: formatDate(startDate),
                        end: formatDate(endDate),
                        description: event.description || "",
                        location: event.location || "",
                      };

                      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                        calendarEvent.title
                      )}&dates=${calendarEvent.start}/${
                        calendarEvent.end
                      }&details=${encodeURIComponent(
                        calendarEvent.description
                      )}&location=${encodeURIComponent(
                        calendarEvent.location
                      )}`;

                      window.open(googleCalendarUrl, "_blank");
                    } catch (error) {
                      console.error("Error creating calendar event:", error);
                      alert("Unable to add to calendar. Please try again.");
                    }
                  }}
                />
              </div>
            )}

            {/* Show event status message for completed events */}
            {eventCompleted && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center gap-2 justify-center text-white">
                  <Icon icon="mdi:check-circle" width={24} />
                  <span className="font-medium">
                    This event has been completed
                  </span>
                </div>
              </div>
            )}
          </Container>
        </Section>

        {/* Event Details Section */}
        <Section className="py-8 md:py-20">
          <Container className="w-[95%] md:w-[90%]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* About Event */}
                <div className="mb-8 md:mb-12">
                  <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50/30 rounded-2xl p-3 md:p-8 border border-gray-100">
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center">
                        <Icon
                          icon="mdi:information-outline"
                          width={20}
                          height={20}
                          className="md:w-6 md:h-6 text-white"
                        />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                        About This Event
                      </h2>
                    </div>

                    {/* Main Description */}
                    <div className="mb-6 md:mb-8">
                      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-brand-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <Icon
                              icon="mdi:text"
                              width={16}
                              className="text-brand-primary"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">
                              Event Overview
                            </h3>
                            <p className="text-sm md:text-lg text-gray-700 leading-relaxed">
                              {event.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Long Description with structured content */}
                    {event.longDescription && (
                      <div className="space-y-4 md:space-y-6">
                        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-brand-secondary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                              <Icon
                                icon="mdi:format-list-bulleted"
                                width={16}
                                className="text-brand-secondary"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">
                                Event Details
                              </h3>
                              <div className="prose prose-gray text-sm max-w-none">
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: event.longDescription,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Key Highlights Section */}
                    <div className="mt-6 md:mt-8">
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                        <Icon
                          icon="mdi:star-outline"
                          width={20}
                          height={20}
                          className="md:w-6 md:h-6 text-brand-primary"
                        />
                        Event Highlights
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div className="bg-white rounded-lg p-3 md:p-4 border border-gray-100 hover:border-brand-primary/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <Icon
                                icon="mdi:handshake"
                                width={20}
                                className="text-green-600"
                              />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Startup-Investor Connections
                              </p>
                              <p className="text-sm text-gray-600">
                                Connect EV startups with potential investors
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-brand-primary/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Icon
                                icon="mdi:car-electric"
                                width={20}
                                className="text-blue-600"
                              />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                EV Industry Insights
                              </p>
                              <p className="text-sm text-gray-600">
                                Latest trends in electric vehicle ecosystem
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-brand-primary/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Icon
                                icon="mdi:currency-usd"
                                width={20}
                                className="text-orange-600"
                              />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Funding Opportunities
                              </p>
                              <p className="text-sm text-gray-600">
                                Access to investment opportunities and funding
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-brand-primary/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Icon
                                icon="mdi:presentation"
                                width={20}
                                className="text-purple-600"
                              />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Pitch Sessions
                              </p>
                              <p className="text-sm text-gray-600">
                                Present your startup to potential investors
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-brand-primary/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                              <Icon
                                icon="mdi:account-tie"
                                width={20}
                                className="text-teal-600"
                              />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Mentorship
                              </p>
                              <p className="text-sm text-gray-600">
                                Guidance from experienced entrepreneurs
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-brand-primary/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                              <Icon
                                icon="mdi:chart-line"
                                width={20}
                                className="text-red-600"
                              />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Market Analysis
                              </p>
                              <p className="text-sm text-gray-600">
                                In-depth EV market research and forecasts
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-brand-primary/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <Icon
                                icon="mdi:rocket-launch"
                                width={20}
                                className="text-indigo-600"
                              />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Demo Showcase
                              </p>
                              <p className="text-sm text-gray-600">
                                Live demonstrations of EV innovations
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-brand-primary/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                              <Icon
                                icon="mdi:forum"
                                width={20}
                                className="text-pink-600"
                              />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Panel Discussions
                              </p>
                              <p className="text-sm text-gray-600">
                                Expert insights on EV industry challenges
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* What You'll Learn/Gain Section */}
                    <div className="mt-6 md:mt-8">
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                        <Icon
                          icon="mdi:trophy-outline"
                          width={20}
                          height={20}
                          className="md:w-6 md:h-6 text-brand-primary"
                        />
                        What You'll Gain
                      </h3>
                      <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-100">
                        <ul className="space-y-2 md:space-y-3">
                          <li className="flex items-start gap-2 md:gap-3">
                            <Icon
                              icon="mdi:check-circle"
                              width={18}
                              height={18}
                              className="md:w-5 md:h-5 text-green-500 flex-shrink-0 mt-0.5"
                            />
                            <span className="text-sm md:text-base text-gray-700">
                              Deep understanding of EV market trends and
                              investment opportunities
                            </span>
                          </li>
                          <li className="flex items-start gap-2 md:gap-3">
                            <Icon
                              icon="mdi:check-circle"
                              width={18}
                              height={18}
                              className="md:w-5 md:h-5 text-green-500 flex-shrink-0 mt-0.5"
                            />
                            <span className="text-sm md:text-base text-gray-700">
                              Direct access to potential investors and funding
                              partners
                            </span>
                          </li>

                          <li className="flex items-start gap-2 md:gap-3">
                            <Icon
                              icon="mdi:check-circle"
                              width={18}
                              height={18}
                              className="md:w-5 md:h-5 text-green-500 flex-shrink-0 mt-0.5"
                            />
                            <span className="text-sm md:text-base text-gray-700">
                              Strategic partnerships with established EV
                              companies
                            </span>
                          </li>
                          <li className="flex items-start gap-2 md:gap-3">
                            <Icon
                              icon="mdi:check-circle"
                              width={18}
                              height={18}
                              className="md:w-5 md:h-5 text-green-500 flex-shrink-0 mt-0.5"
                            />
                            <span className="text-sm md:text-base text-gray-700">
                              Actionable insights to accelerate your startup
                              growth
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Gallery - Only show for completed events */}
                {eventCompleted && eventGallery && eventGallery.length > 0 && (
                  <div className="mb-8 md:mb-12">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 md:mb-6">
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                        Event Gallery
                      </h2>
                      <Button
                        text="View All Photos"
                        type="secondary"
                        link={`/events/${slug}/gallery`}
                        icon="mdi:arrow-right"
                        className="text-xs md:text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                      {eventGallery.slice(0, 6).map((galleryItem, index) => (
                        <div
                          key={galleryItem.id}
                          className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                          onClick={() => {
                            // You can add a lightbox/modal here later
                            window.open(galleryItem.image, "_blank");
                          }}
                        >
                          <Image
                            src={galleryItem.image}
                            alt={
                              galleryItem.title || `Event photo ${index + 1}`
                            }
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Icon
                              icon="mdi:fullscreen"
                              width={24}
                              className="text-white"
                            />
                          </div>
                          {galleryItem.title && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              {galleryItem.title}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Agenda - Hide for completed events unless specifically needed */}
                {!eventCompleted && event.agenda && event.agenda.length > 0 && (
                  <div className="mb-8 md:mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">
                      Event Agenda
                    </h2>
                    <div className="max-h-[500px] md:max-h-[600px] overflow-y-auto space-y-3 md:space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {event.agenda.map((item, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-lg p-4 md:p-6 border-l-4 border-brand-primary"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                              {item.title}
                            </h3>
                            <span className="text-brand-primary font-medium text-sm md:text-base">
                              {item.time}
                            </span>
                          </div>
                          <p className="text-sm md:text-base text-gray-600">
                            {item.description}
                          </p>
                          {item.speaker && (
                            <p className="text-xs md:text-sm text-gray-500 mt-2">
                              Speaker: {item.speaker}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Speakers */}
                {event.speakers && event.speakers.length > 0 && (
                  <div className="mb-6 md:mb-8 -mx-4 md:mx-0">
                    <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-2xl p-4 md:p-6 shadow-lg border border-indigo-100">
                      <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 md:mb-4 text-center">
                        {eventCompleted
                          ? "Event Speakers"
                          : "Featured Speakers"}
                      </h2>
                      <div className="relative overflow-hidden">
                        {/* Horizontal scroll container */}
                        <div
                          id="speakers-container"
                          className="overflow-x-auto pb-4 pt-2 scrollbar-hide"
                          style={{
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                          }}
                        >
                          <div className="flex gap-3 md:gap-4 min-w-max px-2 md:px-4 py-2">
                            {/* First set of speakers */}
                            {event.speakers.map((speaker, index) => (
                              <div
                                key={`speaker-${index}`}
                                className="bg-white rounded-xl p-4 shadow-lg border border-white/50 backdrop-blur-sm min-w-[350px] max-w-[400px] flex-shrink-0 hover:shadow-xl transition-all duration-300 hover:scale-105"
                              >
                                <div className="flex flex-col items-center text-center h-full">
                                  {speaker.image ? (
                                    <div className="w-16 h-16 relative rounded-full overflow-hidden mb-3 ring-3 ring-white shadow-lg">
                                      <Image
                                        src={speaker.image}
                                        alt={speaker.name}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-16 h-16 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full flex items-center justify-center text-white font-bold text-xl mb-3 ring-3 ring-white shadow-lg">
                                      {speaker.name.charAt(0)}
                                    </div>
                                  )}
                                  <div className="flex-1 flex flex-col">
                                    <h3 className="font-bold text-gray-900 text-base mb-1">
                                      {speaker.name}
                                    </h3>
                                    <p className="text-brand-primary font-semibold mb-1 text-sm">
                                      {speaker.title}
                                    </p>
                                    <p className="text-xs text-gray-500 mb-2">
                                      {speaker.company}
                                    </p>
                                    {speaker.bio && (
                                      <div className="flex-1 flex items-start">
                                        <p className="text-gray-600 text-xs leading-relaxed overflow-hidden">
                                          {speaker.bio}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {/* Duplicate set for seamless infinite scroll */}
                            {event.speakers.map((speaker, index) => (
                              <div
                                key={`speaker-duplicate-${index}`}
                                className="bg-white rounded-xl p-4 shadow-lg border border-white/50 backdrop-blur-sm min-w-[350px] max-w-[400px] flex-shrink-0 hover:shadow-xl transition-all duration-300 hover:scale-105"
                              >
                                <div className="flex flex-col items-center text-center h-full">
                                  {speaker.image ? (
                                    <div className="w-16 h-16 relative rounded-full overflow-hidden mb-3 ring-3 ring-white shadow-lg">
                                      <Image
                                        src={speaker.image}
                                        alt={speaker.name}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-16 h-16 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full flex items-center justify-center text-white font-bold text-xl mb-3 ring-3 ring-white shadow-lg">
                                      {speaker.name.charAt(0)}
                                    </div>
                                  )}
                                  <div className="flex-1 flex flex-col">
                                    <h3 className="font-bold text-gray-900 text-base mb-1">
                                      {speaker.name}
                                    </h3>
                                    <p className="text-brand-primary font-semibold mb-1 text-sm">
                                      {speaker.title}
                                    </p>
                                    <p className="text-xs text-gray-500 mb-2">
                                      {speaker.company}
                                    </p>
                                    {speaker.bio && (
                                      <div className="flex-1 flex items-start">
                                        <p className="text-gray-600 text-xs leading-relaxed overflow-hidden">
                                          {speaker.bio}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Gradient fade indicators */}
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-indigo-50 to-transparent pointer-events-none"></div>
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-indigo-50 to-transparent pointer-events-none"></div>
                      </div>

                      {/* Auto-scroll instruction */}
                      <div className="flex items-center justify-center mt-2 md:mt-3 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <Icon
                            icon="mdi:gesture-swipe-horizontal"
                            width={14}
                            height={14}
                            className="md:w-4 md:h-4 text-indigo-400"
                          />
                          <span className="text-xs">
                            Auto-scrolling • Hover to pause
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                {/* Event Info Card */}
                <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl p-4 md:p-6 mb-6 md:mb-8 lg:sticky lg:top-8">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">
                    Event Information
                  </h3>

                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <Icon
                        icon="mdi:calendar-month-outline"
                        className="text-brand-primary md:w-6 md:h-6"
                        width={20}
                        height={20}
                      />
                      <div>
                        <p className="text-sm md:text-base font-medium text-gray-900">
                          Date
                        </p>
                        <p className="text-xs md:text-sm text-gray-600">
                          {formatEventDate(event.date) || event.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                      <Icon
                        icon="mdi:clock-outline"
                        className="text-brand-primary md:w-6 md:h-6"
                        width={20}
                        height={20}
                      />
                      <div>
                        <p className="text-sm md:text-base font-medium text-gray-900">
                          Time
                        </p>
                        <p className="text-xs md:text-sm text-gray-600">
                          {event.time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                      <Icon
                        icon="mdi:map-marker-outline"
                        className="text-brand-primary md:w-6 md:h-6"
                        width={20}
                        height={20}
                      />
                      <div>
                        <p className="text-sm md:text-base font-medium text-gray-900">
                          Location
                        </p>
                        <p className="text-xs md:text-sm text-gray-600">
                          {event.location}
                        </p>
                        {event.venue && (
                          <p className="text-xs text-gray-500">{event.venue}</p>
                        )}
                      </div>
                    </div>

                    {event.price && (
                      <div className="flex items-center gap-2 md:gap-3">
                        <Icon
                          icon="mdi:currency-inr"
                          className="text-brand-primary md:w-6 md:h-6"
                          width={20}
                          height={20}
                        />
                        <div>
                          <p className="text-sm md:text-base font-medium text-gray-900">
                            Price
                          </p>
                          <p className="text-xs md:text-sm text-gray-600">
                            {event.price} for all events
                          </p>
                        </div>
                      </div>
                    )}

                    {event.capacity && (
                      <div className="flex items-center gap-2 md:gap-3">
                        <Icon
                          icon="mdi:account-group"
                          className="text-brand-primary md:w-6 md:h-6"
                          width={20}
                          height={20}
                        />
                        <div>
                          <p className="text-sm md:text-base font-medium text-gray-900">
                            Capacity
                          </p>
                          <p className="text-xs md:text-sm text-gray-600">
                            {event.capacity} attendees
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons - conditional based on event status */}
                  <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200">
                    {!eventCompleted ? (
                      <>
                        <Button
                          text="Event Registration"
                          type="primary"
                          className="w-full mb-3"
                          link={registerLink}
                        />
                        {/* <Button
                        text="Share Event"
                        type="secondary"
                        className="w-full"
                      /> */}
                      </>
                    ) : (
                      <>
                        {event.gallery && event.gallery.length > 0 && (
                          <Button
                            text="View Full Gallery"
                            type="primary"
                            className="w-full mb-3"
                            onClick={() => {
                              document
                                .querySelector('h2:has-text("Event Gallery")')
                                ?.scrollIntoView({ behavior: "smooth" });
                            }}
                          />
                        )}
                        {/* <Button
                        text="Share Event"
                        type="secondary"
                        className="w-full"
                      /> */}
                      </>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">
                    Need Help?
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">
                    Have questions about this event? Get in touch with our team.
                  </p>
                  <Button
                    text="Contact Us"
                    type="secondary"
                    link="/contact-us"
                    className="w-full text-sm md:text-base"
                  />
                </div>
              </div>
            </div>
          </Container>
        </Section>

        {/* Season Events */}
        {event.season && seasonEvents.length > 0 && (
          <Section className="py-8 md:py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50/30">
            <Container>
              <div className="text-center mb-8 md:mb-12">
                <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
                  Other Events in Season {event.season}
                </h2>
                <p className="text-base md:text-xl text-gray-600 px-4">
                  Register once for the entire season and choose which events to
                  attend
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                {seasonEvents.map((seasonEvent, index) => (
                  <div
                    key={seasonEvent.id || index}
                    className="group transform transition-all duration-300 hover:scale-105"
                  >
                    <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-transparent hover:border-brand-primary/20">
                      <div className="relative h-48">
                        <Image
                          src={seasonEvent.background || "/images/hero.png"}
                          alt={seasonEvent.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-4 left-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-3 py-1 rounded-full text-xs font-semibold">
                          {seasonEvent.category}
                        </div>
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">
                          Season {seasonEvent.season}
                        </div>
                      </div>
                      <div className="p-4 md:p-6">
                        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">
                          {seasonEvent.title}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                          <div className="flex items-center gap-1">
                            <Icon
                              icon="mdi:calendar"
                              width={14}
                              height={14}
                              className="md:w-4 md:h-4"
                            />
                            <span>
                              {formatEventDate(seasonEvent.date) ||
                                seasonEvent.date}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Icon
                              icon="mdi:map-marker"
                              width={14}
                              height={14}
                              className="md:w-4 md:h-4"
                            />
                            <span>{seasonEvent.location}</span>
                          </div>
                        </div>
                        <Button
                          text="View Details"
                          type="secondary"
                          link={`/events/${seasonEvent.slug}`}
                          className="w-full text-xs md:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 md:mt-6">
                <Button
                  text={`Register for Season ${event.season}`}
                  type="primary"
                  link={`/events/season/${event.season}/register?from=${slug}`}
                  className="bg-gradient-to-r from-brand-primary to-brand-secondary w-full md:w-[30%] mx-auto text-sm md:text-base"
                />
              </div>
            </Container>
          </Section>
        )}

        {/* Related Events */}
        <Section className="py-8 md:py-20 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
          <Container>
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
                Related Events
              </h2>
              <p className="text-base md:text-xl text-gray-600 px-4">
                Discover more events you might be interested in
              </p>
            </div>

            {relatedEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                {relatedEvents.map((relatedEvent, index) => (
                  <div
                    key={relatedEvent.id || index}
                    className="group transform transition-all duration-300 hover:scale-105"
                  >
                    <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden">
                      <div className="relative h-48">
                        <Image
                          src={relatedEvent.background || "/images/hero.png"}
                          alt={relatedEvent.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-4 left-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-3 py-1 rounded-full text-xs font-semibold">
                          {relatedEvent.category}
                        </div>
                      </div>
                      <div className="p-4 md:p-6">
                        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">
                          {relatedEvent.title}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                          <div className="flex items-center gap-1">
                            <Icon
                              icon="mdi:calendar"
                              width={14}
                              height={14}
                              className="md:w-4 md:h-4"
                            />
                            <span>
                              {formatEventDate(relatedEvent.date) ||
                                relatedEvent.date}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Icon
                              icon="mdi:map-marker"
                              width={14}
                              height={14}
                              className="md:w-4 md:h-4"
                            />
                            <span>{relatedEvent.location}</span>
                          </div>
                        </div>
                        <Button
                          text="View Details"
                          type="secondary"
                          link={`/events/${relatedEvent.slug}`}
                          className="w-full text-xs md:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 md:py-12">
                <Icon
                  icon="mdi:calendar-blank"
                  className="text-gray-400 mx-auto mb-3 md:mb-4 md:w-16 md:h-16"
                  width={48}
                  height={48}
                />
                <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2">
                  No related events found
                </h3>
                <p className="text-sm md:text-base text-gray-500 px-4">
                  Check back later for more events in this category
                </p>
              </div>
            )}
          </Container>
        </Section>
      </div>
    </>
  );
}
