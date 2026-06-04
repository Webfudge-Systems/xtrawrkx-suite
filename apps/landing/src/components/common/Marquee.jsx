"use client";
import React from "react";
import Section from "../layout/Section";
import Container from "../layout/Container";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

const marqueeText = "connect";
const repeatCount = 10; // Adjust for smoothness/length

export default function Marquee() {
  const router = useRouter();
  return (
    <Section className="!overflow-hidden !py-3 md:!py-4 bg-gradient-to-b from-secondary to-primary">
      <div
        className="flex w-max animate-marquee cursor-pointer transition-opacity hover:opacity-80"
        style={{ animation: "marquee 18s linear infinite" }}
        onClick={() => router.push("/contact-us")}
        title="Contact Us"
      >
        {Array.from({ length: repeatCount }).map((_, i) => (
          <span
            className="text-white text-2xl sm:text-3xl md:text-4xl !font-light font-[Montserrat,Arial,sans-serif] mx-6 sm:mx-8 md:mx-10 whitespace-nowrap tracking-wide flex items-center gap-2 sm:gap-3"
            key={i}
          >
            {marqueeText}
            <Icon
              icon="solar:arrow-right-up-linear"
              width="24"
              height="24"
              className="sm:w-8 sm:h-8 md:w-9 md:h-9"
            />
          </span>
        ))}
        {/* Duplicate for seamless looping */}
        {Array.from({ length: repeatCount }).map((_, i) => (
          <span
            className="text-white text-2xl sm:text-3xl md:text-4xl !font-light font-[Montserrat,Arial,sans-serif] mx-6 sm:mx-8 md:mx-10 whitespace-nowrap tracking-wide flex items-center gap-2 sm:gap-3"
            key={i + repeatCount}
          >
            {marqueeText}
            <Icon
              icon="solar:arrow-right-up-linear"
              width="24"
              height="24"
              className="sm:w-8 sm:h-8 md:w-9 md:h-9"
            />
          </span>
        ))}
      </div>
      <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
    </Section>
  );
}
