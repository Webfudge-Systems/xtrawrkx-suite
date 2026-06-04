"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import Section from "@/src/components/layout/Section";
import Container from "@/src/components/layout/Container";
import Hero from "@/src/components/common/Hero";
import {
  eventService,
  resourceService,
  serviceService,
} from "@/src/services/databaseService";
import { communitiesData } from "@/src/data/CommunityData";

export default function SitemapPage() {
  const [services, setServices] = useState([]);
  const [events, setEvents] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [servicesData, eventsData, resourcesData] = await Promise.all([
          serviceService.getAll().catch(() => []),
          eventService.getAll().catch(() => []),
          resourceService.getAll().catch(() => []),
        ]);

        setServices(servicesData);
        setEvents(eventsData);
        setResources(resourcesData);
      } catch (error) {
        setError(error.message);

        // Keep empty arrays if Firebase fails
        setServices([]);
        setEvents([]);
        setResources([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const mainPages = [
    {
      title: "Home",
      href: "/",
      description:
        "Welcome to Xtrawrkx - Your professional development platform",
      icon: "solar:home-bold",
    },
    {
      title: "About Us",
      href: "/about",
      description: "Learn about our mission, values, team, and company story",
      icon: "solar:users-group-rounded-bold",
    },
    {
      title: "Teams",
      href: "/teams",
      description: "Meet our talented team members and leadership",
      icon: "solar:users-group-rounded-bold",
    },
    {
      title: "Contact Us",
      href: "/contact-us",
      description: "Get in touch with us for inquiries and support",
      icon: "solar:phone-bold",
    },
    {
      title: "Gallery",
      href: "/gallery",
      description: "Explore our collection of moments and achievements",
      icon: "solar:gallery-bold",
    },
  ];

  const servicePages = [
    {
      title: "Services Overview",
      href: "/services",
      description: "Discover our comprehensive range of professional services",
      icon: "solar:case-minimalistic-bold",
    },
    ...services.map((service) => ({
      title: service.name || service.title,
      href: `/services/${service.slug}`,
      description: service.description,
      icon: "solar:document-bold",
      category: service.category,
      subCompany: service.subCompany,
    })),
  ];

  const communityPages = [
    {
      title: "Communities Overview",
      href: "/communities",
      description: "Join our professional communities and networks",
      icon: "solar:users-group-rounded-bold",
    },
    ...communitiesData.map((community) => ({
      title: community.name,
      href: `/communities/${community.slug}`,
      description: community.description,
      icon: "solar:users-group-two-rounded-bold",
      category: community.category,
    })),
  ];

  const eventPages = [
    {
      title: "Events Overview",
      href: "/events",
      description:
        "Discover upcoming events, workshops, and networking opportunities",
      icon: "solar:calendar-bold",
    },
    ...events.slice(0, 10).map((event) => ({
      title: event.title,
      href: `/events/${event.slug}`,
      description: event.description,
      icon: "solar:calendar-date-bold",
      date: event.date ? new Date(event.date).toLocaleDateString() : null,
    })),
  ];

  const resourcePages = [
    {
      title: "Resources Overview",
      href: "/resources",
      description: "Access our library of whitepapers, articles, and reports",
      icon: "solar:book-bold",
    },
    ...resources.slice(0, 10).map((resource) => ({
      title: resource.title,
      href: `/resources/${resource.slug}`,
      description: resource.description,
      icon: "solar:document-text-bold",
      type: resource.type,
    })),
  ];

  const engagementPages = [
    {
      title: "Engagement Models",
      href: "/modals",
      description:
        "Choose the perfect engagement model for your business needs",
      icon: "solar:handshake-bold",
    },
  ];

  const legalPages = [
    {
      title: "Privacy Policy",
      href: "/privacy-policy",
      description: "Our commitment to protecting your privacy and data",
      icon: "solar:shield-check-bold",
    },
    {
      title: "Terms of Service",
      href: "/terms-of-service",
      description: "Terms and conditions for using our services",
      icon: "solar:document-bold",
    },
  ];

  const SitemapSection = ({ title, pages, icon, description }) => (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center">
          <Icon icon={icon} width={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {description && (
            <p className="text-gray-600 text-sm">{description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((page, index) => (
          <Link
            key={index}
            href={page.href}
            className="group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-brand-primary transition-all duration-200"
          >
            <div className="flex items-start gap-3">
              <Icon
                icon={page.icon}
                width={20}
                className="text-brand-primary mt-1 group-hover:scale-110 transition-transform"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-brand-primary transition-colors truncate">
                  {page.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                  {page.description}
                </p>
                {(page.category ||
                  page.subCompany ||
                  page.type ||
                  page.date) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {page.category && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {page.category}
                      </span>
                    )}
                    {page.subCompany && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        {page.subCompany}
                      </span>
                    )}
                    {page.type && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        {page.type}
                      </span>
                    )}
                    {page.date && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                        {page.date}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero
        title="Sitemap"
        description="Navigate through all pages and sections of our website. Find everything you need quickly and easily."
      />

      <Section className="py-16">
        <Container>
          <div className="max-w-6xl mx-auto">
            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                <div className="flex items-center">
                  <Icon
                    icon="solar:danger-triangle-bold"
                    width={20}
                    className="text-yellow-600 mr-2"
                  />
                  <p className="text-sm text-yellow-800">
                    Unable to load latest data. Showing cached information.
                  </p>
                </div>
              </div>
            )}

            {!loading && (
              <>
                {/* Overview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                  <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-200">
                    <div className="text-2xl font-bold text-brand-primary mb-2">
                      {mainPages.length}
                    </div>
                    <div className="text-sm text-gray-600">Main Pages</div>
                  </div>
                  <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-200">
                    <div className="text-2xl font-bold text-brand-primary mb-2">
                      {servicePages.length}
                    </div>
                    <div className="text-sm text-gray-600">Service Pages</div>
                  </div>
                  <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-200">
                    <div className="text-2xl font-bold text-brand-primary mb-2">
                      {communityPages.length}
                    </div>
                    <div className="text-sm text-gray-600">Community Pages</div>
                  </div>
                  <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-200">
                    <div className="text-2xl font-bold text-brand-primary mb-2">
                      {eventPages.length + resourcePages.length}
                    </div>
                    <div className="text-sm text-gray-600">Content Pages</div>
                  </div>
                </div>

                {/* Main Pages */}
                <SitemapSection
                  title="Main Pages"
                  pages={mainPages}
                  icon="solar:home-bold"
                  description="Core pages and primary navigation"
                />

                {/* Services */}
                <SitemapSection
                  title="Services"
                  pages={servicePages}
                  icon="solar:case-minimalistic-bold"
                  description="Our comprehensive service offerings and solutions"
                />

                {/* Communities */}
                <SitemapSection
                  title="Communities"
                  pages={communityPages}
                  icon="solar:users-group-rounded-bold"
                  description="Professional networks and community platforms"
                />

                {/* Events */}
                <SitemapSection
                  title="Events"
                  pages={eventPages}
                  icon="solar:calendar-bold"
                  description="Upcoming events, workshops, and networking opportunities"
                />

                {/* Resources */}
                <SitemapSection
                  title="Resources"
                  pages={resourcePages}
                  icon="solar:book-bold"
                  description="Knowledge base, whitepapers, and educational content"
                />

                {/* Engagement Models */}
                <SitemapSection
                  title="Engagement Models"
                  pages={engagementPages}
                  icon="solar:handshake-bold"
                  description="Partnership and collaboration frameworks"
                />

                {/* Legal Pages */}
                <SitemapSection
                  title="Legal & Policies"
                  pages={legalPages}
                  icon="solar:shield-check-bold"
                  description="Terms, privacy policy, and legal information"
                />

                {/* Quick Navigation */}
                <div className="bg-gradient-to-r from-brand-primary to-brand-secondary rounded-xl p-8 text-white text-center">
                  <h2 className="text-2xl font-bold mb-4">Quick Navigation</h2>
                  <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                    Looking for something specific? Use our search or browse by
                    category to find exactly what you need.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/contact-us"
                      className="bg-white text-brand-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                    >
                      Contact Support
                    </Link>
                    <Link
                      href="/"
                      className="bg-white/20 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors"
                    >
                      Back to Home
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </Container>
      </Section>
    </div>
  );
}
