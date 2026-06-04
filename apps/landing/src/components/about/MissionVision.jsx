import Section from "@/src/components/layout/Section";
import Container from "@/src/components/layout/Container";
import { Icon } from "@iconify/react";
import { missionVision } from "@/src/data/aboutData";

export default function MissionVision() {
  return (
    <Section className="py-16">
      <Container>
        <div className="max-w-6xl">
          <div className=" mb-12">
            <h2 className="text-3xl md:text-4xl font-medium text-brand-foreground mb-4">
              Mission & Vision
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl">
              Our mission and vision guide every decision we make and every
              solution we create.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Mission */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mr-4">
                  <Icon icon="mdi:target" className="text-2xl text-pink-500" />
                </div>
                <h3 className="text-2xl font-semibold text-brand-foreground">
                  {missionVision.mission.title}
                </h3>
              </div>
              <p className="text-base text-gray-700 leading-relaxed">
                {missionVision.mission.content}
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Icon icon="mdi:eye" className="text-2xl text-blue-500" />
                </div>
                <h3 className="text-2xl font-semibold text-brand-foreground">
                  {missionVision.vision.title}
                </h3>
              </div>
              <p className="text-base text-gray-700 leading-relaxed">
                {missionVision.vision.content}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
