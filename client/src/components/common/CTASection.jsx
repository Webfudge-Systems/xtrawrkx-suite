"use client";
import Section from "../layout/Section";
import Container from "../layout/Container";
import Button from "./Button";
import { useBookMeetModal } from "../../hooks/useBookMeetModal";

// Component for the Book A Meet button
const BookConsultationButton = () => {
  const { openModal } = useBookMeetModal();

  return (
    <Button
      text="Book Free Consultation"
      type="secondary"
      className="mx-auto w-full sm:w-auto"
      onClick={openModal}
    />
  );
};

const stats = [
  { value: "5000+", label: "Network of EV Companies" },
  { value: "85%", label: "Success Rate" },
  { value: "40+", label: "Projects Delivered" },
];

export default function CTASection() {
  return (
    <Section className="bg-gradient-to-b from-brand-secondary to-brand-primary py-12 md:py-16 text-center">
      <Container>
        <h2 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-4">
          Proven success.
        </h2>
        <p className="text-white/90 text-base sm:text-lg mb-8 md:mb-10 max-w-2xl mx-auto px-4 leading-relaxed">
          Ready to discuss your project? Schedule a free consultation call to
          explore how we can help you achieve your goals.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 md:gap-10 mb-8 md:mb-10 px-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center min-w-[120px] sm:min-w-[140px] md:min-w-[180px]"
            >
              <span className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal mb-1 md:mb-2">
                {stat.value}
              </span>
              <span className="text-white text-sm sm:text-base md:text-xl font-medium opacity-100">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
        <div className="px-4">
          <BookConsultationButton />
        </div>
      </Container>
    </Section>
  );
}
