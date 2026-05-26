import React from "react";
import Image from "next/image";
import Section from "../layout/Section";
import Container from "../layout/Container";
import Button from "../common/Button";
import { Icon } from "@iconify/react";

const XevtgPage = ({ community }) => {
  const talentStats = [
    { label: "Active TPOs", value: "150+", icon: "mdi:school" },
    { label: "HR Professionals", value: "200+", icon: "mdi:account-tie" },
    { label: "Job Placements", value: "1000+", icon: "mdi:briefcase-check" },
    { label: "Training Programs", value: "50+", icon: "mdi:certificate" },
  ];

  const memberCategories = [
    {
      name: "Training & Placement Officers",
      count: "150+",
      description: "TPOs from premier engineering and business schools",
      institutions: ["IITs", "NITs", "IIMs", "Top Engineering Colleges"],
      icon: "mdi:school",
    },
    {
      name: "HR & Talent Acquisition",
      count: "200+",
      description: "HR teams from leading EV companies and startups",
      companies: ["OEMs", "Startups", "Tier-1 Suppliers", "Tech Companies"],
      icon: "mdi:account-tie",
    },
    {
      name: "Training Organizations",
      count: "80+",
      description: "Specialized training providers for EV skills",
      focus: ["Technical Skills", "Soft Skills", "Industry Certifications"],
      icon: "mdi:certificate",
    },
  ];

  const skillDomains = [
    { domain: "Electric Powertrain", level: "Advanced", openings: "250+" },
    { domain: "Battery Technology", level: "Expert", openings: "180+" },
    { domain: "Autonomous Driving", level: "Intermediate", openings: "120+" },
    { domain: "Charging Infrastructure", level: "Advanced", openings: "200+" },
    { domain: "Software Engineering", level: "All Levels", openings: "300+" },
    { domain: "Manufacturing", level: "Advanced", openings: "150+" },
  ];

  const trainingPrograms = [
    {
      program: "EV Fundamentals Bootcamp",
      duration: "4 weeks",
      target: "Fresh Graduates",
      placement: "85%",
      partners: "15+ companies",
    },
    {
      program: "Battery Technology Certification",
      duration: "8 weeks",
      target: "Mid-level Engineers",
      placement: "92%",
      partners: "12+ companies",
    },
    {
      program: "Leadership in EV Industry",
      duration: "6 weeks",
      target: "Senior Professionals",
      placement: "78%",
      partners: "20+ companies",
    },
  ];

  const upcomingEvents = [
    {
      title: "EV Career Fair 2024",
      date: "Dec 5-6",
      type: "Recruitment",
      companies: "50+",
    },
    {
      title: "Skills Assessment Drive",
      date: "Dec 10",
      type: "Evaluation",
      participants: "200+",
    },
    {
      title: "HR Connect Summit",
      date: "Dec 15",
      type: "Networking",
      attendees: "100+",
    },
    {
      title: "Training Partners Meet",
      date: "Dec 20",
      type: "B2B",
      organizations: "30+",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <Section className="relative w-full h-[90vh] min-h-[600px] md:h-[95vh] flex items-center justify-center overflow-hidden p-0">
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/images/hero_services.png"
            alt="XEVTG Network"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/90 via-green-800/80 to-green-700/90" />
        </div>

        <Container className="relative z-20 text-center text-white mt-16 md:mt-20 px-4">
          <div className="inline-flex items-center gap-2 md:gap-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 md:px-8 py-2 md:py-3 rounded-full text-sm md:text-lg font-semibold mb-4 md:mb-6 shadow-lg">
            <Icon icon="mdi:account-group" width={18} height={18} className="md:w-6 md:h-6" />
            <span className="text-xs md:text-base">EV Talent Group</span>
          </div>

          {/* XEVTG Logo Placeholder - Add logo when available */}
          <div className="mb-4 md:mb-6">
            <div className="inline-block bg-white/10 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl">
              <div className="w-[80px] h-[80px] md:w-[120px] md:h-[120px] bg-green-500/20 rounded-2xl flex items-center justify-center">
                <Icon
                  icon="mdi:account-group"
                  className="text-4xl md:text-6xl text-white/80"
                />
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 drop-shadow-lg px-4">
            XEVTG
          </h1>
          <p className="text-lg md:text-2xl text-white/90 max-w-4xl mx-auto mb-6 md:mb-4 drop-shadow px-4">
            Bridging the talent gap in EV industry through strategic
            partnerships between institutions and companies
          </p>
          <div className="flex justify-center px-4">
            <Button
              text="Join the Community"
              type="primary"
              className="text-sm md:text-lg w-full sm:w-auto"
              onClick={() => {
                window.open("https://forms.gle/feK3siB7oorSFzXr5", "_blank");
              }}
            />
          </div>
        </Container>
      </Section>

      {/* Talent Network Statistics */}
      <Section className="py-8 md:py-20 bg-gradient-to-br from-green-50 to-green-100">
        <Container className="px-4 md:px-0">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Talent Pipeline Impact
            </h2>
            <p className="text-base md:text-xl text-gray-600 px-4">
              Building the largest talent network for the EV ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8">
            {talentStats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl md:rounded-2xl p-4 md:p-8 shadow-lg text-center hover:shadow-xl transition-shadow"
              >
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Icon icon={stat.icon} className="text-2xl md:text-3xl text-white" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </h3>
                <p className="text-sm md:text-base text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Member Categories */}
      <Section className="py-8 md:py-20">
        <Container className="px-4 md:px-0">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Our Network
            </h2>
            <p className="text-base md:text-xl text-gray-600 px-4">
              Connecting institutions, companies, and training organizations
            </p>
          </div>

          <div className="space-y-6 md:space-y-12">
            {memberCategories.map((category, index) => (
              <div
                key={index}
                className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                <div className="p-4 md:p-8">
                  <div className="flex items-start gap-3 md:gap-6">
                    <div className="bg-green-100 rounded-xl md:rounded-2xl p-3 md:p-6 flex-shrink-0">
                      <Icon
                        icon={category.icon}
                        className="text-green-600 text-2xl md:text-4xl"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 md:mb-4">
                        <h3 className="text-lg md:text-2xl font-bold text-gray-900">
                          {category.name}
                        </h3>
                        <span className="bg-green-100 text-green-800 px-3 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-medium w-fit">
                          {category.count}
                        </span>
                      </div>
                      <p className="text-sm md:text-lg text-gray-600 mb-4 md:mb-6">
                        {category.description}
                      </p>
                      <div className="flex flex-wrap gap-2 md:gap-3">
                        {(
                          category.institutions ||
                          category.companies ||
                          category.focus
                        ).map((item, idx) => (
                          <span
                            key={idx}
                            className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Skills in Demand */}
      <Section className="py-8 md:py-20 bg-gradient-to-br from-slate-50 via-white to-green-50/30">
        <Container className="px-4 md:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
            <div>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-6">
                Skills in Demand
              </h2>
              <p className="text-sm md:text-lg text-gray-600 mb-6 md:mb-8">
                Current job market demands in the EV industry across different
                skill levels and domains.
              </p>

              <div className="space-y-3 md:space-y-4">
                {skillDomains.map((skill, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-gray-100"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-2 md:mb-3">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900">
                        {skill.domain}
                      </h3>
                      <span className="bg-green-100 text-green-800 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium w-fit">
                        {skill.openings} openings
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-green-600">
                      <Icon icon="mdi:chart-line" />
                      {skill.level} level positions
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-6">
                Training Programs
              </h2>
              <p className="text-sm md:text-lg text-gray-600 mb-6 md:mb-8">
                Specialized training programs designed to bridge the skill gap
                in EV industry.
              </p>

              <div className="space-y-4 md:space-y-6">
                {trainingPrograms.map((program, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl p-4 md:p-6 hover:border-green-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-2 md:mb-3">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900">
                        {program.program}
                      </h3>
                      <span className="bg-blue-100 text-blue-800 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium w-fit">
                        {program.duration}
                      </span>
                    </div>
                    <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">
                      Target: {program.target}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                      <div className="flex items-center gap-2 text-green-600">
                        <Icon icon="mdi:chart-line" />
                        {program.placement} placement rate
                      </div>
                      <div className="flex items-center gap-2 text-green-600">
                        <Icon icon="mdi:office-building" />
                        {program.partners} hiring partners
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 md:mt-8">
                <Button
                  text="Explore Training Programs"
                  type="primary"
                  className="w-full text-sm md:text-base"
                />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Upcoming Events */}
      <Section className="py-8 md:py-20">
        <Container className="px-4 md:px-0">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Upcoming Events
            </h2>
            <p className="text-base md:text-xl text-gray-600 px-4">
              Connect, recruit, and develop talent through our events
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {upcomingEvents.map((event, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl md:rounded-2xl p-4 md:p-8"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-3 md:mb-4">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                    {event.title}
                  </h3>
                  <span className="bg-white text-gray-800 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium w-fit">
                    {event.date}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-green-600 mb-3 md:mb-4">
                  <Icon icon="mdi:tag" />
                  {event.type}
                </div>
                <div className="text-sm md:text-base text-gray-600">
                  {event.companies &&
                    `${event.companies} companies participating`}
                  {event.participants &&
                    `${event.participants} participants expected`}
                  {event.attendees && `${event.attendees} HR professionals`}
                  {event.organizations &&
                    `${event.organizations} training organizations`}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8 md:mt-12">
            <Button
              text="Register for Events"
              type="primary"
              className="text-sm md:text-lg px-6 md:px-8 py-3 md:py-4 w-full sm:w-auto"
            />
          </div>
        </Container>
      </Section>

      {/* Success Metrics */}
      <Section className="py-8 md:py-20 bg-gradient-to-br from-slate-50 via-white to-green-50/30">
        <Container className="px-4 md:px-0">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Success Stories
            </h2>
            <p className="text-base md:text-xl text-gray-600 px-4">
              Measurable impact on EV talent development
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {[
              {
                metric: "Average Salary Increase",
                value: "40%",
                description:
                  "Post-training salary improvement for participants",
                icon: "mdi:trending-up",
              },
              {
                metric: "Placement Rate",
                value: "88%",
                description: "Successfully placed candidates within 3 months",
                icon: "mdi:briefcase-check",
              },
              {
                metric: "Company Satisfaction",
                value: "94%",
                description: "Hiring partners satisfied with candidate quality",
                icon: "mdi:thumb-up",
              },
            ].map((story, index) => (
              <div
                key={index}
                className="bg-white rounded-xl md:rounded-2xl p-4 md:p-8 shadow-lg text-center"
              >
                <div className="bg-green-100 rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <Icon icon={story.icon} className="text-green-600 text-2xl md:text-3xl" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {story.value}
                </h3>
                <h4 className="text-base md:text-lg font-semibold text-gray-800 mb-2 md:mb-3">
                  {story.metric}
                </h4>
                <p className="text-sm md:text-base text-gray-600">{story.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Call to Action */}
      <Section className="py-8 md:py-20 bg-gradient-to-r from-green-600 to-green-700">
        <Container className="text-center text-white px-4">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">
            Ready to Bridge the Talent Gap?
          </h2>
          <p className="text-base md:text-xl mb-6 md:mb-8 text-white/90 max-w-2xl mx-auto">
            Join 350+ TPOs, HR professionals, and training organizations shaping
            the future of EV talent
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Button
              text="Join XEVTG"
              type="primary"
              className="bg-white text-green-600 hover:bg-gray-100 text-sm md:text-lg w-full sm:w-auto"
            />
            <Button
              text="Schedule Demo"
              type="secondary"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-sm md:text-lg w-full sm:w-auto"
            />
          </div>
        </Container>
      </Section>
    </div>
  );
};

export default XevtgPage;
