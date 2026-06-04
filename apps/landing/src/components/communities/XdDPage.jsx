import React from "react";
import Image from "next/image";
import Section from "../layout/Section";
import Container from "../layout/Container";
import Button from "../common/Button";
import { Icon } from "@iconify/react";

const XdDPage = ({ community }) => {
  const creativeStats = [
    { label: "Active Designers", value: "400+", icon: "mdi:palette" },
    { label: "Innovation Projects", value: "150+", icon: "mdi:lightbulb" },
    { label: "Design Challenges", value: "25+", icon: "mdi:trophy" },
    { label: "Prototypes Built", value: "300+", icon: "mdi:cube-outline" },
  ];

  const designDisciplines = [
    {
      name: "Product Designers",
      count: "150+",
      description: "EV exterior, interior, and component design specialists",
      focus: [
        "Exterior Design",
        "Interior Design",
        "Component Design",
        "Ergonomics",
      ],
      icon: "mdi:car",
    },
    {
      name: "UX/UI Designers",
      count: "120+",
      description: "Digital interface designers for EV software and apps",
      focus: [
        "Dashboard Design",
        "Mobile Apps",
        "Charging UI",
        "Fleet Management",
      ],
      icon: "mdi:monitor",
    },
    {
      name: "Development Engineers",
      count: "100+",
      description: "Software and hardware development professionals",
      focus: [
        "Embedded Systems",
        "IoT Development",
        "Mobile Development",
        "Web Platforms",
      ],
      icon: "mdi:code-braces",
    },
    {
      name: "Innovation Managers",
      count: "50+",
      description: "Product managers and innovation leads",
      focus: [
        "Product Strategy",
        "Innovation Labs",
        "R&D Management",
        "Design Thinking",
      ],
      icon: "mdi:brain",
    },
  ];

  const activeProjects = [
    {
      title: "EV Dashboard Reimagined",
      type: "UI/UX Design",
      participants: "25+",
      status: "In Progress",
      deadline: "Dec 2024",
    },
    {
      title: "Sustainable Materials Challenge",
      type: "Product Design",
      participants: "40+",
      status: "Prototype Phase",
      deadline: "Jan 2025",
    },
    {
      title: "Charging Station Experience",
      type: "Service Design",
      participants: "30+",
      status: "Research Phase",
      deadline: "Feb 2025",
    },
  ];

  const innovationChallenges = [
    {
      challenge: "Future of EV Interiors",
      prize: "₹2 Lac",
      deadline: "30 days",
      submissions: "45+",
      category: "Product Design",
    },
    {
      challenge: "Zero-Waste Manufacturing",
      prize: "₹1.5 Lac",
      deadline: "45 days",
      submissions: "32+",
      category: "Process Innovation",
    },
    {
      challenge: "Accessibility in EVs",
      prize: "₹1 Lac",
      deadline: "60 days",
      submissions: "28+",
      category: "Inclusive Design",
    },
  ];

  const designTools = [
    { tool: "Figma", usage: "UI/UX Design", popularity: "95%" },
    { tool: "SolidWorks", usage: "3D Modeling", popularity: "85%" },
    { tool: "Adobe Creative Suite", usage: "Visual Design", popularity: "90%" },
    { tool: "Sketch", usage: "Interface Design", popularity: "70%" },
    { tool: "Rhino 3D", usage: "Product Design", popularity: "65%" },
    { tool: "Principle", usage: "Prototyping", popularity: "60%" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <Section className="relative w-full h-[90vh] min-h-[600px] md:h-[95vh] flex items-center justify-center overflow-hidden p-0">
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/images/hero_services.png"
            alt="xD&D Network"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f5f37f]/95 via-[#f5f37f]/85 to-[#e6e06b]/90" />
        </div>

        <Container className="relative z-20 text-center text-white mt-16 md:mt-20 px-4">
          <div className="inline-flex items-center gap-2 md:gap-3 bg-gradient-to-r from-[#f5f37f] to-[#e6e06b] text-gray-900 px-4 md:px-8 py-2 md:py-3 rounded-full text-sm md:text-lg font-semibold mb-4 md:mb-6 shadow-lg">
            <Icon icon="mdi:palette" width={18} height={18} className="md:w-6 md:h-6" />
            <span className="text-xs md:text-base">Design & Development</span>
          </div>

          {/* xD&D Logo */}
          <div className="mb-4 md:mb-6">
            <div className="inline-block bg-gray-900/10 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl">
              <Image
                src="/images/xd&d.png"
                alt="xD&D Logo"
                width={80}
                height={80}
                className="md:w-[120px] md:h-[120px] mx-auto"
                priority
              />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 drop-shadow-lg px-4">
            xD&D
          </h1>
          <p className="text-lg md:text-2xl text-white/90 max-w-4xl mx-auto mb-6 md:mb-4 drop-shadow px-4">
            Where creativity meets innovation - designing the future of
            sustainable mobility
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
            <Button
              text="Join Community"
              type="primary"
              className="text-sm md:text-lg w-full sm:w-auto"
              onClick={() => {
                window.open("https://forms.gle/feK3siB7oorSFzXr5", "_blank");
              }}
            />
          </div>
        </Container>
      </Section>

      {/* Creative Statistics */}
      <Section className="py-8 md:py-20 bg-gradient-to-br from-[#f5f37f]/10 to-[#f5f37f]/20">
        <Container className="px-4 md:px-0">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Creative Impact
            </h2>
            <p className="text-base md:text-xl text-gray-600 px-4">
              Fostering innovation through design thinking and rapid prototyping
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8">
            {creativeStats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl md:rounded-2xl p-4 md:p-8 shadow-lg text-center hover:shadow-xl transition-shadow"
              >
                <div className="bg-gradient-to-br from-[#f5f37f] to-[#e6e06b] rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Icon icon={stat.icon} className="text-2xl md:text-3xl text-gray-900" />
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

      {/* Design Disciplines */}
      <Section className="py-8 md:py-20">
        <Container className="px-4 md:px-0">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Our Creative Community
            </h2>
            <p className="text-base md:text-xl text-gray-600 px-4">
              Diverse design and development professionals shaping EV innovation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {designDisciplines.map((discipline, index) => (
              <div
                key={index}
                className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-4 md:p-8"
              >
                <div className="flex items-start gap-3 md:gap-6">
                  <div className="bg-[#f5f37f]/20 rounded-xl md:rounded-2xl p-3 md:p-4 flex-shrink-0">
                    <Icon
                      icon={discipline.icon}
                      className="text-[#d4d054] text-2xl md:text-3xl"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 md:mb-3">
                      <h3 className="text-lg md:text-xl font-bold text-gray-900">
                        {discipline.name}
                      </h3>
                      <span className="bg-[#f5f37f]/20 text-[#d4d054] px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium w-fit">
                        {discipline.count}
                      </span>
                    </div>
                    <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">
                      {discipline.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {discipline.focus.map((area, idx) => (
                        <span
                          key={idx}
                          className="bg-gray-100 text-gray-700 px-2 md:px-3 py-1 rounded-lg text-xs md:text-sm"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Active Projects & Challenges */}
      <Section className="py-8 md:py-20 bg-gradient-to-br from-slate-50 via-white to-[#f5f37f]/5">
        <Container className="px-4 md:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
            <div>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-6">
                Active Projects
              </h2>
              <p className="text-sm md:text-lg text-gray-600 mb-6 md:mb-8">
                Collaborative design projects where community members work
                together on real-world challenges.
              </p>

              <div className="space-y-4 md:space-y-6">
                {activeProjects.map((project, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-gray-100"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-2 md:mb-3">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900">
                        {project.title}
                      </h3>
                      <span className="bg-blue-100 text-blue-800 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium w-fit">
                        {project.status}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-gray-600 mb-2 md:mb-3">
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:tag" />
                        {project.type}
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:account-group" />
                        {project.participants} participants
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-[#d4d054]">
                      <Icon icon="mdi:calendar" />
                      Due: {project.deadline}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 md:mt-8">
                <Button text="Join a Project" type="primary" className="w-full text-sm md:text-base" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-6">
                Innovation Challenges
              </h2>
              <p className="text-sm md:text-lg text-gray-600 mb-6 md:mb-8">
                Monthly design challenges with cash prizes and industry
                recognition.
              </p>

              <div className="space-y-4 md:space-y-6">
                {innovationChallenges.map((challenge, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-[#f5f37f]/10 to-[#f5f37f]/20 rounded-xl p-4 md:p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-2 md:mb-3">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900">
                        {challenge.challenge}
                      </h3>
                      <span className="bg-green-100 text-green-800 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium w-fit">
                        {challenge.prize}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-gray-600 mb-2 md:mb-3">
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:trophy" />
                        {challenge.category}
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:file-document" />
                        {challenge.submissions} submissions
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-[#d4d054]">
                      <Icon icon="mdi:clock" />
                      {challenge.deadline} left
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 md:mt-8">
                <Button
                  text="Submit Design"
                  type="secondary"
                  className="w-full text-sm md:text-base"
                />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Design Tools & Resources */}
      <Section className="py-8 md:py-20">
        <Container className="px-4 md:px-0">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Design Tools & Resources
            </h2>
            <p className="text-base md:text-xl text-gray-600 px-4">
              Popular tools and platforms used by our community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {designTools.map((tool, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-gray-100"
              >
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                  {tool.tool}
                </h3>
                <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">{tool.usage}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm text-gray-500">Community Usage</span>
                  <span className="bg-[#f5f37f]/20 text-[#d4d054] px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium">
                    {tool.popularity}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8 md:mt-12">
            <Button
              text="Access Tool Library"
              type="secondary"
              className="text-sm md:text-lg px-6 md:px-8 py-3 md:py-4 w-full sm:w-auto"
            />
          </div>
        </Container>
      </Section>

      {/* Portfolio Showcase */}
      <Section className="py-8 md:py-20 bg-gradient-to-br from-slate-50 via-white to-[#f5f37f]/5">
        <Container className="px-4 md:px-0">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Featured Work
            </h2>
            <p className="text-base md:text-xl text-gray-600 px-4">
              Outstanding designs from our community members
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {[
              {
                project: "EcoCharge Interface",
                designer: "Priya Sharma",
                category: "UI/UX Design",
                description: "Reimagined charging station user experience",
                likes: "234",
              },
              {
                project: "Sustainable Interior Concept",
                designer: "Arjun Patel",
                category: "Product Design",
                description: "Zero-waste EV interior using recycled materials",
                likes: "189",
              },
              {
                project: "Fleet Management Dashboard",
                designer: "Team Innovate",
                category: "Product Design",
                description: "Real-time fleet monitoring and optimization",
                likes: "312",
              },
            ].map((work, index) => (
              <div
                key={index}
                className="bg-white rounded-xl md:rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="h-32 md:h-48 bg-gradient-to-br from-[#f5f37f]/20 to-[#f5f37f]/30 flex items-center justify-center">
                  <Icon icon="mdi:image" className="text-4xl md:text-6xl text-[#d4d054]" />
                </div>
                <div className="p-4 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                    {work.project}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 mb-2">
                    by {work.designer}
                  </p>
                  <div className="flex items-center gap-2 mb-2 md:mb-3">
                    <span className="bg-[#f5f37f]/20 text-[#d4d054] px-2 py-1 rounded text-xs">
                      {work.category}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4">
                    {work.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500">
                      <Icon icon="mdi:heart" />
                      {work.likes} likes
                    </div>
                    <Button
                      text="View Details"
                      type="secondary"
                      className="text-xs md:text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Call to Action */}
      <Section className="py-8 md:py-20 bg-gradient-to-r from-[#f5f37f] to-[#e6e06b]">
        <Container className="text-center text-gray-900 px-4">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">
            Ready to Design the Future?
          </h2>
          <p className="text-base md:text-xl mb-6 md:mb-8 text-gray-800 max-w-2xl mx-auto">
            Join 400+ designers and developers creating innovative solutions for
            sustainable mobility
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Button
              text="Join xD&D"
              type="primary"
              className="bg-gray-900 text-white hover:bg-gray-800 text-sm md:text-lg w-full sm:w-auto"
            />
            <Button
              text="View Portfolio Guidelines"
              type="secondary"
              className="bg-gray-900/20 backdrop-blur-sm hover:bg-gray-900/30 text-gray-900 border border-gray-900 text-sm md:text-lg w-full sm:w-auto"
            />
          </div>
        </Container>
      </Section>
    </div>
  );
};

export default XdDPage;
