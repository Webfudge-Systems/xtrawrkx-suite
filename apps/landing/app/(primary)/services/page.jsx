"use client";
import React from "react";
import Marquee from "@/src/components/common/Marquee";
import OurServices from "@/src/components/services/OurServices";
import EngagementModels from "@/src/components/services/EngagementModels";
import FeatureTable from "@/src/components/services/FeatureTable";
import Hero from "@/src/components/common/Hero";
import CTASection from "@/src/components/common/CTASection";

const ServicesPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Hero
        title="Services"
        description="Bring to the table win-win survival strategies to ensure proactive domination. At the end of the day, going forward, a new normal that has evolved from generation X is on the runway heading towards a streamlined cloud solution. User generated content in real-time will have multiple touchpoints for offshoring."
        showButton={true}
        buttonText="Get Started"
        buttonLink="/contact-us"
      />
      <Marquee />
      <OurServices />
      {/* Engagement models section temporarily hidden
          <EngagementModels /> */}
      {/* Feature table section temporarily hidden
          <FeatureTable /> */}
      <CTASection />
    </div>
  );
};

export default ServicesPage;
