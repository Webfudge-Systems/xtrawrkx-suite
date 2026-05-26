"use client";
import Image from "next/image";
import Button from "../../src/components/common/Button";
import HomeHero from "../../src/components/home/HomeHero";
import ServiceCard from "../../src/components/common/ServiceCard";
import CTASection from "@/src/components/common/CTASection";
import Marquee from "@/src/components/common/Marquee";
import EventSection from "@/src/components/home/EventSection";
import AboutHomeSection from "../../src/components/home/AboutHomeSection";
import CommunitySection from "../../src/components/home/CommunitySection";
import VerticalsSection from "../../src/components/home/VerticalsSection";
import CompaniesMarquee from "../../src/components/home/CompaniesMarquee";

export default function Home() {
  return (
    <>
      <HomeHero />
      <AboutHomeSection />
      <CompaniesMarquee />
      <VerticalsSection />
      <Marquee />
      <EventSection />
      <CommunitySection />
      <CTASection />
      <CompaniesMarquee />
    </>
  );
}
