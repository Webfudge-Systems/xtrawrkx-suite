"use client";
import Section from "@/src/components/layout/Section";
import Container from "@/src/components/layout/Container";
import { Icon } from "@iconify/react";
import { useState, useEffect, useRef } from "react";
import { awards } from "@/src/data/aboutData";

export default function Slider() {
  const [start, setStart] = useState(0);
  const visible = 4;
  const canPrev = start > 0;
  const canNext = start + visible < awards.length;
  const showAwards = awards.slice(start, start + visible);
  const intervalRef = useRef();
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (hovered) return;
    intervalRef.current = setInterval(() => {
      setStart((prev) => {
        if (prev + visible >= awards.length) return 0;
        return prev + 1;
      });
    }, 2500);
    return () => clearInterval(intervalRef.current);
  }, [hovered]);

  return (
    <Section className="!py-32 bg-brand-gray-light/40">
      <Container>
        <h2 className="text-3xl md:text-4xl font-normal text-brand-foreground mb-18 text-center">
          Innovation, reliability, customer service. A tick, <br /> gold medal,
          five stars.
        </h2>
        <div
          className="flex items-center justify-center gap-6"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <button
            className="text-3xl text-gray-700 hover:text-pink-500 transition disabled:opacity-30"
            onClick={() => setStart((s) => Math.max(0, s - 1))}
            disabled={!canPrev}
            aria-label="Previous"
          >
            <Icon icon="mdi:chevron-left" />
          </button>
          <div className="flex gap-12 items-center">
            {showAwards.map((award, i) => (
              <img
                key={i}
                src={award.img}
                alt={award.alt}
                className="h-28 w-auto object-contain"
                draggable={false}
              />
            ))}
          </div>
          <button
            className="text-3xl text-gray-700 hover:text-pink-500 transition disabled:opacity-30"
            onClick={() =>
              setStart((s) => Math.min(awards.length - visible, s + 1))
            }
            disabled={!canNext}
            aria-label="Next"
          >
            <Icon icon="mdi:chevron-right" />
          </button>
        </div>
      </Container>
    </Section>
  );
}
