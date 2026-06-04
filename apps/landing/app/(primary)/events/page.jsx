"use client";
import Hero from "@/src/components/common/Hero";
import Marquee from "@/src/components/common/Marquee";
import UpcomingEvents from "@/src/components/events/UpcomingEvents";
import PastEvents from "@/src/components/events/PastEvents";
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Separate component that uses useSearchParams
const EventsContent = () => {
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category");

  return (
    <>
      <UpcomingEvents initialCategoryFilter={categoryFilter} />
      <PastEvents initialCategoryFilter={categoryFilter} />
    </>
  );
};

export default function page() {
  return (
    <div className="min-h-screen bg-white">
      <Hero
        title="Our Events"
        description="Discover and participate in our latest events, workshops, and community gatherings. Stay updated and connect with like-minded professionals to grow, learn, and collaborate."
      />
      <Suspense>
        <EventsContent />
      </Suspense>
      <Marquee />
    </div>
  );
}
