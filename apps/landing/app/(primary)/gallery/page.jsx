"use client";
import React, { Suspense } from "react";
import Hero from "@/src/components/common/Hero";
import {
  GalleryStatsSection,
  FeaturedGallerySection,
} from "@/src/components/gallery";
import EventGallerySection from "@/src/components/gallery/EventGallerySection";
import Marquee from "@/src/components/common/Marquee";

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <Hero
        title="Gallery"
        description="Explore our collection of moments, achievements, and milestones organized by events."
      />

      {/* Gallery Statistics Section */}
      <GalleryStatsSection />

      {/* Event-wise Gallery Section */}
      <Suspense
        fallback={
          <div className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading gallery...</p>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <EventGallerySection />
      </Suspense>

      {/* Marquee */}
      <Marquee />
    </div>
  );
}
