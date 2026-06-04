"use client";
import { use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Hero from "@/src/components/common/Hero";
import GalleryGrid from "@/src/components/gallery/GalleryGrid";
import CTASection from "@/src/components/common/CTASection";
import { EventService } from "@/src/services/databaseService";

export default function EventGalleryPage({ params }) {
  const { slug } = use(params);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const eventService = new EventService();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const fetchedEvent = await eventService.getEventBySlug(slug);
        if (!fetchedEvent) {
          notFound();
          return;
        }
        setEvent(fetchedEvent);
      } catch (error) {
        console.error("Error fetching event:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event gallery...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero
        title={`${event.title} Gallery`}
        description={`Browse photos and memories from ${event.title}`}
        backgroundImage={event.background || "/images/hero.png"}
      />
      <GalleryGrid
        eventSlug={slug}
        title={`${event.title} Photos`}
        label="Event Gallery"
        showCategoryFilter={false}
      />
      <CTASection />
    </div>
  );
}
