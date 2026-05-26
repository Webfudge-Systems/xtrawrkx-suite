import Section from "@/src/components/layout/Section";
import Container from "@/src/components/layout/Container";
import { purpose } from "@/src/data/aboutData";

export default function Purpose() {
  return (
    <Section className="py-12 bg-white">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* Left: Heading + short paragraph */}
          <div>
            <h2 className="text-2xl md:text-3xl font-medium text-brand-foreground mb-4">
              {purpose.heading}
            </h2>
            <p className="text-base md:text-lg text-brand-foreground font-medium">
              {purpose.left}
            </p>
          </div>
          {/* Right: Two stacked paragraphs */}
          <div className="flex flex-col gap-6">
            {purpose.right.map((para, i) => (
              <p
                key={i}
                className="text-base md:text-lg text-brand-foreground font-normal text-justify"
              >
                {para}
              </p>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
