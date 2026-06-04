"use client";
import React from "react";
import Hero from "@/src/components/common/Hero";
import Stats from "@/src/components/about/Stats";
import Marquee from "@/src/components/common/Marquee";
import Purpose from "@/src/components/about/Purpose";
import MissionVision from "@/src/components/about/MissionVision";
import CodeOfConduct from "@/src/components/about/CodeOfConduct";
import Values from "@/src/components/about/Values";
import Companies from "@/src/components/about/Companies";
import Team from "@/src/components/about/Team";
import Slider from "@/src/components/about/Slider";
import FAQ from "@/src/components/about/FAQ";
import HowWeHelp from "@/src/components/about/HowWeHelp";
import CTASection from "@/src/components/common/CTASection";

export default function AboutPage() {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Hero
        title="About xtrawrkx"
        description="At xtrawrkx, we help you solve next-level challenges, smart wrkx style. We are a technology consulting and product development company specializing in automotive, manufacturing, and emerging technology sectors. From advisory to execution, we deliver innovative solutions for complex engineering challenges in electric vehicles, drones, IoT, and advanced manufacturing systems."
      />
      <Stats />
      <Purpose />
      <MissionVision />
      <CodeOfConduct />
      <Values />
      <Companies />
      <Team />
      {/* <Slider /> */}
      <HowWeHelp />
      <FAQ />
      <Marquee />
      <CTASection />
    </div>
  );
}
