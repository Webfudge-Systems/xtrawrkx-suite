"use client";
import Section from "@/src/components/layout/Section";
import Container from "@/src/components/layout/Container";
import Button from "@/src/components/common/Button";
import { useState } from "react";
import { Icon } from "@iconify/react";
import { howWeHelp } from "@/src/data/aboutData";

export default function HowWeHelp() {
  const [open, setOpen] = useState(null);
  return (
    <Section className="!py-24 bg-black">
      <Container>
        <div className="flex flex-col md:flex-row items-center justify-between gap-16">
          {/* Left column */}
          <div className="flex-1 min-w-[320px]">
            <h2 className="text-4xl md:text-4xl font-medium text-white mb-6 leading-tight">
              {howWeHelp.heading.split("\n").map((line, i) => (
                <span key={i}>
                  {line}
                  <br />
                </span>
              ))}
            </h2>
            <p className="text-lg text-white/70 mb-8">{howWeHelp.subtext}</p>
            <Button
              text={howWeHelp.button}
              type="primary"
              onClick={() => {
                window.location.href = "/contact-us";
              }}
            />
          </div>
          {/* Right column: Steps/Accordion */}
          <div className="flex-1 w-full max-w-xl">
            {howWeHelp.steps.map((step, i) => (
              <div key={i}>
                <button
                  className="w-full flex items-center justify-between py-6 text-lg md:text-base text-white border-t border-white/30 focus:outline-none"
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-white/70 text-lg">{i + 1}.</span>
                    {step.title}
                  </span>
                  <span className="text-base font-light flex items-center">
                    {open === i ? (
                      <Icon icon="mdi:minus" />
                    ) : (
                      <Icon icon="mdi:chevron-down" />
                    )}
                  </span>
                </button>
                {open === i && (
                  <div className="pb-6 pl-10 pr-8 text-white/80 text-base md:text-base animate-fade-in">
                    {step.content}
                  </div>
                )}
              </div>
            ))}
            <div className="border-t border-white/30" />
          </div>
        </div>
      </Container>
    </Section>
  );
}
