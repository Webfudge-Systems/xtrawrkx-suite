"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { footerNavLinks, footerBottomLinks } from "../../data/Navlinks";
import { EventService } from "../../services/databaseService";

export default function Footer() {
  const [expandedSections, setExpandedSections] = useState({});
  const [eventLinks, setEventLinks] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const toggleSection = (sectionTitle) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  // Fetch ongoing and upcoming events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoadingEvents(true);
        const eventService = new EventService();
        const allEvents = await eventService.getAll("date", "desc");

        // Filter for ongoing and upcoming events
        const activeEvents = allEvents.filter((event) => {
          const status = event.status?.toLowerCase();
          return status === "upcoming" || status === "ongoing";
        });

        // Limit to 5 most recent events and create links
        const events = activeEvents.slice(0, 5).map((event) => ({
          label: event.title,
          href: `/events/${event.slug}`,
        }));

        // Always include "All Events" as first link
        setEventLinks([
          { label: "All Events", href: "/events" },
          ...events,
        ]);
      } catch (error) {
        console.error("Error fetching events for footer:", error);
        // Fallback to static links if fetch fails
        setEventLinks([
          { label: "All Events", href: "/events" },
        ]);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <footer className="w-full mt-16 pb-10">
      {/* Top section */}
      <div className="max-w-7xl mx-auto px-4">
        {/* Mobile Layout */}
        <div className="block md:hidden">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex-shrink-0" aria-label="Home">
              <Image
                src="/logo_full.png"
                alt="xtrawrkx"
                width={100}
                height={100}
                className="w-20 h-20"
                priority
              />
            </Link>
          </div>

          {/* Collapsible sections */}
          <div className="space-y-4">
            {footerNavLinks.map((col) => (
              <div key={col.title} className="border-b border-gray-200 pb-4">
                <button
                  onClick={() => toggleSection(col.title)}
                  className="w-full flex items-center justify-between font-bold font-primary text-left text-lg py-2"
                  aria-expanded={expandedSections[col.title]}
                >
                  <span>{col.title}</span>
                  <Icon
                    icon={
                      expandedSections[col.title]
                        ? "mdi:chevron-up"
                        : "mdi:chevron-down"
                    }
                    width="20"
                    className="transition-transform duration-200"
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    expandedSections[col.title]
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <ul className="space-y-3 text-brand-dark font-primary pt-3">
                    {col.title === "Events" ? (
                      // Dynamic events links
                      loadingEvents ? (
                        <li className="text-gray-400">Loading events...</li>
                      ) : (
                        eventLinks.map((link) => (
                          <li key={link.label}>
                            <Link
                              href={link.href}
                              className="hover:text-brand-primary transition-colors block py-1"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))
                      )
                    ) : (
                      // Static links for other sections
                      col.links.map((link) => (
                        <li key={link.label}>
                          <Link
                            href={link.href}
                            className="hover:text-brand-primary transition-colors block py-1"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex flex-col lg:flex-row gap-10 lg:gap-0 justify-between items-start">
          {/* Columns */}
          <div className="flex flex-1 justify-between flex-wrap gap-8">
            {/* Logo */}
            <Link
              href="/"
              className="mb-8 lg:mb-0 flex-shrink-0"
              aria-label="Home"
            >
              <Image
                src="/logo_full.png"
                alt="xtrawrkx"
                width={100}
                height={100}
                className="w-20 h-20"
                priority
              />
            </Link>
            {/* Render columns from data */}
            {footerNavLinks.map((col) => (
              <div key={col.title}>
                <div className="font-bold mb-2 font-primary">{col.title}</div>
                <ul className="space-y-1 text-brand-dark font-primary">
                  {col.title === "Events" ? (
                    // Dynamic events links
                    loadingEvents ? (
                      <li className="text-gray-400">Loading events...</li>
                    ) : (
                      eventLinks.map((link) => (
                        <li key={link.label}>
                          <Link
                            href={link.href}
                            className="hover:text-brand-primary transition-colors"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))
                    )
                  ) : (
                    // Static links for other sections
                    col.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="hover:text-brand-primary transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Divider */}
      <div className="border-t border-brand-gray w-[90%] sm:w-[80%] mx-auto my-6 md:my-8" />

      {/* Bottom section */}
      <div className="max-w-7xl mx-auto px-4">
        {/* Mobile Layout */}
        <div className="block md:hidden space-y-6">
          {/* Social Media Icons */}
          <div className="flex justify-center gap-4">
            <a
              href="https://www.linkedin.com/company/xtrawrkx/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="rounded-full bg-brand-dark hover:bg-brand-gray/40 transition-colors w-10 h-10 flex items-center justify-center"
            >
              <Icon icon="mdi:linkedin" width="20" className="text-white" />
            </a>
            <a
              href="https://www.youtube.com/@xtrawrkx"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="rounded-full bg-brand-dark hover:bg-brand-gray/40 transition-colors w-10 h-10 flex items-center justify-center"
            >
              <Icon icon="mdi:youtube" width="20" className="text-white" />
            </a>
            <a
              href="https://x.com/xtrawrkx"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="rounded-full bg-brand-dark hover:bg-brand-gray/40 transition-colors w-10 h-10 flex items-center justify-center"
            >
              <Icon icon="mdi:twitter" width="20" className="text-white" />
            </a>
            <a
              href="https://www.instagram.com/xtrawrkx"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="rounded-full bg-brand-dark hover:bg-brand-gray/40 transition-colors w-10 h-10 flex items-center justify-center"
            >
              <Icon icon="mdi:instagram" width="20" className="text-white" />
            </a>
          </div>

          {/* Footer Links */}
          <div className="flex flex-col items-center gap-3 text-brand-dark font-primary text-sm">
            {footerBottomLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-brand-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Country/Language */}
          <div className="flex items-center justify-center gap-2 text-brand-dark font-primary text-sm">
            <Icon icon="mdi:earth" width="16" />
            <span>IND</span>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-brand-dark font-primary text-sm">
            <Icon icon="mdi:earth" width="18" />
            <span>IND</span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-6 text-brand-dark font-primary text-sm justify-center translate-x-19">
            {footerBottomLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-brand-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Socials */}
          <div className="flex gap-4">
            <a
              href="https://www.linkedin.com/company/xtrawrkx/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="rounded-full bg-brand-dark hover:bg-brand-gray/40 transition-colors w-10 h-10 flex items-center justify-center"
            >
              <Icon icon="mdi:linkedin" width="24" className="text-white" />
            </a>
            <a
              href="https://www.youtube.com/@xtrawrkx"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="rounded-full bg-brand-dark hover:bg-brand-gray/40 transition-colors w-10 h-10 flex items-center justify-center"
            >
              <Icon icon="mdi:youtube" width="24" className="text-white" />
            </a>
            <a
              href="https://x.com/xtrawrkx"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="rounded-full bg-brand-dark hover:bg-brand-gray/40 transition-colors w-10 h-10 flex items-center justify-center"
            >
              <Icon icon="mdi:twitter" width="24" className="text-white" />
            </a>
            <a
              href="https://www.instagram.com/xtrawrkx"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="rounded-full bg-brand-dark hover:bg-brand-gray/40 transition-colors w-10 h-10 flex items-center justify-center"
            >
              <Icon icon="mdi:instagram" width="24" className="text-white" />
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center text-xs sm:text-sm md:text-base text-gray-700 mt-8 md:mt-10 px-4">
        Copyright © 2025 xtrawrkx - All Rights Reserved.
      </div>
    </footer>
  );
}
