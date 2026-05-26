"use client";
import React, { Suspense } from "react";
import {
  ResourcesStatsSection,
  FeaturedResourcesSection,
  AllResourcesSection,
} from "../../../src/components/resources";
import Hero from "@/src/components/common/Hero";

const ResourcesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <Hero
        title="Resources"
        description="Discover insights, research, and expertise across whitepapers, articles, reports, interviews, and newsletters"
      />

      {/* Resources Statistics Section */}
      <ResourcesStatsSection />

      {/* Featured Resources Section */}
      <FeaturedResourcesSection />

      {/* All Resources Section - Needs Suspense for useSearchParams */}
      <Suspense fallback={<div></div>}>
        <AllResourcesSection />
      </Suspense>
    </div>
  );
};

export default ResourcesPage;
