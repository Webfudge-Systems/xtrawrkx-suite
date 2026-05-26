import Section from "@/src/components/layout/Section";
import Container from "@/src/components/layout/Container";
import { stats } from "@/src/data/aboutData";

export default function Stats() {
  return (
    <Section className="py-12 bg-white">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="text-3xl md:text-4xl font-extrabold text-[#262626] mb-2">
                {stat.value}
              </div>
              <div className="text-base md:text-lg text-gray-600 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
