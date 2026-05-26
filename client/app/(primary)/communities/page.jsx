"use client";
import React from "react";
import Hero from "@/src/components/common/Hero";
import Marquee from "@/src/components/common/Marquee";
import CommunitiesSection from "@/src/components/communities/CommunitiesSection";
import CTASection from "@/src/components/common/CTASection";

const CommunitiesPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Hero
        title="Communities"
        description="Connect with like-minded professionals, entrepreneurs, and innovators in our thriving EV ecosystem. Join specialized communities designed to foster collaboration, learning, and growth."
      />
      <Marquee />
      <CommunitiesSection />
      <CTASection />
    </div>
  );
};

export default CommunitiesPage;
