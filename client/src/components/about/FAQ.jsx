import { useState } from "react";
import Section from "@/src/components/layout/Section";
import Container from "@/src/components/layout/Container";
import { faq } from "@/src/data/aboutData";

export default function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <Section className="py-24 bg-white">
      <Container>
        <h2 className="text-3xl md:text-4xl font-normal text-brand-foreground mb-14 text-center">
          Frequently asked questions
        </h2>
        <div className="max-w-2xl mx-auto divide-y divide-gray-300">
          {faq.map((faq, i) => (
            <div key={i}>
              <button
                className="w-full flex justify-between items-center py-6 text-lg md:text-xl font-normal text-brand-foreground focus:outline-none"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span>{faq.q}</span>
                <span className="text-2xl font-light">
                  {open === i ? "-" : "+"}
                </span>
              </button>
              {open === i && (
                <div className="pb-6 pl-1 pr-8 text-gray-500 text-base md:text-lg animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
