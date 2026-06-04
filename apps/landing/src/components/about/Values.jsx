import Section from "@/src/components/layout/Section";
import Container from "@/src/components/layout/Container";
import { Icon } from "@iconify/react";
import { values } from "@/src/data/aboutData";

export default function Values() {
  return (
    <Section
      className="!py-24"
      style={{
        background:
          "radial-gradient(circle at top right, #ec4899 0%, #f9a8d4 60%, #fde68a 100%)",
      }}
    >
      <Container>
        <div className="max-w-5xl mb-10">
          <h2 className="text-3xl md:text-4xl font-medium text-brand-foreground mb-4 text-left">
            Our Values
          </h2>
          <p className="text-lg text-brand-foreground font-normal text-left mb-8">
            These core values define how we approach every engineering challenge
            and guide our commitment to delivering exceptional solutions that
            make a real difference in the world.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-12 max-w-6xl mx-auto">
          {values.map((val, i) => (
            <div key={i} className="flex flex-col items-start text-left">
              <Icon icon={val.icon} className="text-5xl text-pink-500 mb-4" />
              <div className="font-bold text-lg mb-2 text-brand-foreground">
                {val.title}
              </div>
              <div className="text-gray-600 text-base leading-relaxed">
                {val.text}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
