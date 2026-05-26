"use client";
import React from "react";
import Hero from "@/src/components/common/Hero";
import TeamSection from "@/src/components/teams/TeamSection";
import CTASection from "@/src/components/common/CTASection";
import Marquee from "@/src/components/common/Marquee";

export default function TeamsPage() {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Hero
        title="Our Team"
        description="Meet the talented individuals who drive xtrawrkx forward. From our core leadership team to our dedicated employees, we bring together diverse expertise to solve next-level challenges in automotive and manufacturing industries."
      />
      <Marquee />
      <TeamSection />
      <CTASection />
    </div>
  );
}
