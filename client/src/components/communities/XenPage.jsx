import React from "react";
import Image from "next/image";
import Section from "../layout/Section";
import Container from "../layout/Container";
import Button from "../common/Button";
import { Icon } from "@iconify/react";
import { useBookMeetModal } from "../../hooks/useBookMeetModal";

const XenPage = ({ community }) => {
  const { openModal } = useBookMeetModal();
  const coreStats = [
    {
      label: "Experienced Consultants",
      value: "40+",
      icon: "mdi:account-supervisor",
    },
    { label: "Advisory Services", value: "7", icon: "mdi:briefcase-variant" },
    { label: "Membership Tiers", value: "6", icon: "mdi:trophy-variant" },
    { label: "Max Monthly Hours", value: "112", icon: "mdi:clock" },
  ];

  const hardwareChallenges = [
    {
      challenge: "Not everyone understands hardware",
      description:
        "While many mentors and startup gurus exist, few have experience with building hardware or manufacturing businesses. A self-learning community — 'By the founders, For the founders' — is essential.",
      icon: "mdi:chip",
    },
    {
      challenge: "Lack of supplier and partnership support",
      description:
        "Industry bodies provide poor support for deeptech and manufacturing startups.",
      icon: "mdi:factory",
    },
    {
      challenge: "High cost and risk",
      description:
        "Hardware startups not only require heavy financial investment, but also significant time commitment. Without proper guidance, founders risk both money and valuable time.",
      icon: "mdi:currency-usd",
    },
    {
      challenge: "Funding challenges",
      description:
        "Capital expenditure (CapEx) investments are complex. Traditional funding institutions are software-centric, so hardware startups must innovate through shared resources and collaborative leverage.",
      icon: "mdi:bank",
    },
  ];

  const xenSolutions = [
    {
      solution: "Digital Support",
      description:
        "40+ experienced consultants provide remote, all-around support to XEN members.",
      icon: "mdi:laptop",
    },
    {
      solution: "Access to Resources",
      description:
        "Mentorship, funding via XEV.FiN, legal assistance — all offered to ease startup challenges.",
      icon: "mdi:toolbox",
    },
    {
      solution: "Curated Help",
      description:
        "Members get personalized services and expert guidance tailored to their needs.",
      icon: "mdi:account-heart",
    },
    {
      solution: "Matchmaking",
      description:
        "Entrepreneurs can discover clients and partners organically within the XEN community.",
      icon: "mdi:handshake",
    },
  ];

  const membershipTiers = [
    {
      tier: "X0",
      name: "WA Member",
      description:
        "Anyone interested in hardware startups; WhatsApp group only",
      price3Month: "Free",
      price12Month: "Free",
      totalHours: "4",
      color: "gray",
    },
    {
      tier: "X1",
      name: "Future Founders",
      description:
        "Students or early-stage individuals with stable income sources",
      price3Month: "₹25,000",
      price12Month: "₹75,000",
      totalHours: "7",
      color: "blue",
    },
    {
      tier: "X2",
      name: "Early Stage Startup",
      description: "No revenue, no investment, bootstrapped",
      price3Month: "₹1,00,000",
      price12Month: "₹3,00,000",
      totalHours: "14",
      color: "blue",
    },
    {
      tier: "X3",
      name: "Mature Startups & SMEs",
      description: "Revenue < $1M ARR, early funding stage",
      price3Month: "₹2,00,000",
      price12Month: "₹6,00,000",
      totalHours: "28",
      color: "orange",
    },
    {
      tier: "X4",
      name: "Large Corporates",
      description: "Revenue: $1M–$10M",
      price3Month: "₹4,00,000",
      price12Month: "₹12,00,000",
      totalHours: "56",
      color: "orange",
    },
    {
      tier: "X5",
      name: "MNCs",
      description: "Revenue > $10M, global presence",
      price3Month: "₹8,00,000",
      price12Month: "₹24,00,000",
      totalHours: "112",
      color: "orange",
    },
  ];

  const advisoryServices = [
    {
      service: "Business Development Support",
      description:
        "Enabling leadership connects with partners (Clients / Customers). 2 hr = Min 1 meeting",
      hours: [0, 1, 2, 4, 8, 16],
    },
    {
      service: "Investor & Financier introductions via XEV.FiN community",
      description:
        "a) 1 hr = Min 1 introduction b) Guidance on financial instruments, fundraise strategy etc",
      hours: [0, 1, 2, 4, 8, 16],
    },
    {
      service: "Networking Mixers & Summits",
      description:
        "a) Events can be online and in-person. b) Free Active Support Pass (ASP) for Summit (worth Rs 60k) for Annual XEN members X2 & above. c) Special & exclusive discounts for partner events",
      hours: [4, 1, 2, 4, 8, 16],
      highlight: "Free ASP worth ₹60k for X2+ annual members",
    },
    {
      service: "Marketing Support",
      description:
        "a) Interview in XEN events, b) Whitepaper / reports participation, c) General advice on presentations, brand etc",
      hours: [0, 1, 2, 4, 8, 16],
    },
    {
      service: "Trainings & Masterclasses / Mentoring session",
      description:
        "a) Each session is to be 1 hr. Total hr calculated in multiple of experts present in same session. b) Custom mentoring session based on expert availability",
      hours: [0, 1, 2, 4, 8, 16],
    },
    {
      service: "Sourcing & supply chain support",
      description:
        "a) BOM Analysis b) 1 hr = Min 2 supplier introductions c) Strategic sourcing guidance d) DFM advisory",
      hours: [0, 1, 2, 4, 8, 16],
    },
    {
      service: "Hiring & organisational development",
      description:
        "a) 4 Hr = 1 Vacancy b) Organisational size benchmarking c) Project management efficiency review",
      hours: [0, 1, 2, 4, 8, 16],
    },
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      gray: "from-gray-500 to-gray-600 border-gray-300",
      blue: "from-[#377ecc] to-[#2c63a3] border-[#377ecc]",
      orange: "from-[#cc9b37] to-[#b8862f] border-[#cc9b37]",
    };
    return colorMap[color] || colorMap.gray;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <Section className="relative w-full h-[90vh] min-h-[600px] md:h-[95vh] flex items-center justify-center overflow-hidden p-0">
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/images/hero_services.png"
            alt="XEN Network"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#377ecc]/95 via-[#377ecc]/85 to-[#2c63a3]/90" />
        </div>

        <Container className="relative z-20 text-center text-white mt-16 md:mt-20 px-4">
          <div className="inline-flex items-center gap-2 md:gap-3 bg-gradient-to-r from-[#377ecc] to-[#2c63a3] text-white px-4 md:px-8 py-2 md:py-3 rounded-full text-sm md:text-lg font-semibold mb-4 md:mb-6 shadow-lg">
            <Icon
              icon="mdi:factory"
              width={18}
              height={18}
              className="md:w-6 md:h-6"
            />
            <span className="text-xs md:text-base">
              Xtrawrkx Entrepreneurship Network
            </span>
          </div>

          {/* XEN Logo */}
          <div className="mb-4 md:mb-6">
            <div className="inline-block bg-white/10 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl">
              <Image
                src="/images/xen.png"
                alt="XEN Logo"
                width={80}
                height={80}
                className="md:w-[120px] md:h-[120px] mx-auto"
                priority
              />
            </div>
          </div>

          <h1 className="text-5xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 drop-shadow-lg px-4">
            XEN
          </h1>
          <p className="text-lg md:text-2xl text-white/95 max-w-3xl mx-auto mb-3 md:mb-4 drop-shadow font-semibold mt-2 md:mt-4 px-4">
            By the founders, for the founders
          </p>
          <p className="text-base md:text-xl text-white/85 max-w-4xl mx-auto mb-6 md:mb-8 drop-shadow px-4">
            The only community specifically designed for automotive and hardware
            startups
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
            <Button
              text="Join XEN Community"
              type="primary"
              onClick={() => {
                window.open("https://forms.gle/feK3siB7oorSFzXr5", "_blank");
              }}
              className="text-sm md:text-lg bg-gradient-to-r from-[#cc9b37] to-[#b8862f] hover:from-[#b8862f] hover:to-[#a3752a] w-full sm:w-auto"
            />
            <Button
              text="View Membership Plans"
              type="secondary"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-sm border border-white/30 w-full sm:w-auto"
              onClick={() => {
                document.getElementById("xen-membership")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            />
          </div>
        </Container>
      </Section>

      {/* Core Statistics */}
      <Section className="py-8 md:py-20 bg-gradient-to-br from-[#377ecc]/10 to-[#cc9b37]/10">
        <Container className="px-4 md:px-0">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Why XEN Exists
            </h2>
            <p className="text-base md:text-xl text-gray-600 px-4">
              Built specifically for hardware and automotive startups
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8">
            {coreStats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl md:rounded-2xl p-4 md:p-8 shadow-lg text-center hover:shadow-xl transition-shadow border border-[#377ecc]/20"
              >
                <div className="bg-gradient-to-br from-[#377ecc] to-[#2c63a3] rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Icon
                    icon={stat.icon}
                    className="text-2xl md:text-3xl text-white"
                  />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </h3>
                <p className="text-sm md:text-base text-gray-600">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Hardware Startup Challenges */}
      <Section className="py-8 md:py-20">
        <Container className="px-4 md:px-0">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Why We Need This Community
            </h2>
            <p className="text-base md:text-xl text-gray-600 px-4">
              Unique challenges faced by automotive and hardware startups
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {hardwareChallenges.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-4 md:p-8 hover:border-[#cc9b37]/30 transition-colors"
              >
                <div className="flex items-start gap-3 md:gap-6">
                  <div className="bg-[#cc9b37]/10 rounded-xl md:rounded-2xl p-3 md:p-4 flex-shrink-0">
                    <Icon
                      icon={item.icon}
                      className="text-[#cc9b37] text-2xl md:text-3xl"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">
                      {item.challenge}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* How XEN Helps */}
      <Section className="py-8 md:py-20 bg-gradient-to-br from-slate-50 via-white to-[#377ecc]/5">
        <Container className="px-4 md:px-0">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              How XEN Helps
            </h2>
            <p className="text-base md:text-xl text-gray-600 px-4">
              Comprehensive support designed for hardware entrepreneurs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {xenSolutions.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-4 md:p-8 hover:border-[#377ecc]/30 transition-colors"
              >
                <div className="flex items-start gap-3 md:gap-6">
                  <div className="bg-[#377ecc]/10 rounded-xl md:rounded-2xl p-3 md:p-4 flex-shrink-0">
                    <Icon
                      icon={item.icon}
                      className="text-[#377ecc] text-2xl md:text-3xl"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">
                      {item.solution}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Complete Membership Tier System */}
      <Section className="py-8 md:py-20" id="membership">
        <Container className="px-4 md:px-0">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Complete Membership Tier System
            </h2>
            <p className="text-base md:text-xl text-gray-600 mb-4 md:mb-6 px-4">
              6 tiers designed to match your startup journey - from idea to
              enterprise
            </p>
            <div className="bg-[#377ecc]/5 border border-[#377ecc]/20 rounded-lg p-3 md:p-4 max-w-3xl mx-auto">
              <p className="text-xs md:text-sm text-gray-700">
                <Icon
                  icon="mdi:information"
                  className="inline mr-2 text-[#377ecc] w-4 h-4 md:w-5 md:h-5"
                />
                All pricing includes access to 40+ expert consultants and 7
                specialized advisory service areas
              </p>
            </div>
          </div>

          {/* Tier Comparison Table */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8 md:mb-12">
            <div className="bg-gradient-to-r from-[#377ecc] to-[#2c63a3] text-white p-4 md:p-6">
              <h3 className="text-lg md:text-2xl font-bold text-center">
                Membership Pricing Overview
              </h3>
              <p className="text-center text-white/90 mt-1 md:mt-2 text-sm md:text-base">
                Compare all 6 tiers at a glance
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-900">
                      Tier
                    </th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-900">
                      3 Months
                    </th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-900">
                      12 Months
                    </th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-900">
                      Monthly Hours
                    </th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-900">
                      Best For
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {membershipTiers.map((tier, index) => (
                    <tr
                      key={tier.tier}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <div
                          className={`inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r ${getColorClasses(
                            tier.color
                          )
                            .split(" ")
                            .slice(0, 2)
                            .join(
                              " "
                            )} text-white text-xs md:text-sm font-bold`}
                        >
                          {tier.tier}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <div className="text-xs md:text-sm font-medium text-gray-900">
                          {tier.name}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <div className="text-xs md:text-sm font-semibold text-gray-900">
                          {tier.price3Month}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <div className="text-xs md:text-sm font-semibold text-[#377ecc]">
                          {tier.price12Month}
                        </div>
                        {tier.price12Month !== tier.price3Month && (
                          <div className="text-xs text-green-600">
                            25% savings
                          </div>
                        )}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <div className="text-xs md:text-sm font-semibold text-gray-900">
                          {tier.totalHours}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <div className="text-xs text-gray-600">
                          {tier.description}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Tier Cards */}
          <div className="mb-8 md:mb-12" id="xen-membership">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8 text-center">
              Choose Your Membership
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {membershipTiers.map((tier, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-xl md:rounded-2xl shadow-lg border-2 ${
                    getColorClasses(tier.color).split(" ")[2]
                  } p-4 md:p-8 relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
                >
                  <div
                    className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${getColorClasses(
                      tier.color
                    )
                      .split(" ")
                      .slice(0, 2)
                      .join(" ")}`}
                  ></div>

                  <div className="text-center mb-4 md:mb-6">
                    <div
                      className={`inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-r ${getColorClasses(
                        tier.color
                      )
                        .split(" ")
                        .slice(0, 2)
                        .join(
                          " "
                        )} text-white text-xl md:text-2xl font-bold mb-3 md:mb-4`}
                    >
                      {tier.tier}
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                      {tier.name}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                      {tier.description}
                    </p>
                  </div>

                  <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                        {tier.price3Month}
                      </div>
                      <div className="text-xs md:text-sm text-gray-500">
                        3 Months
                      </div>
                    </div>

                    {tier.price12Month !== tier.price3Month && (
                      <div className="text-center bg-green-50 rounded-lg p-2 md:p-3">
                        <div className="text-xl md:text-2xl font-semibold text-[#377ecc] mb-1">
                          {tier.price12Month}
                        </div>
                        <div className="text-xs md:text-sm text-green-600 font-medium">
                          12 Months • Save 25%
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-center">
                      <div className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                        {tier.totalHours}
                      </div>
                      <div className="text-xs md:text-sm text-gray-600">
                        Monthly Advisory Hours
                      </div>
                    </div>

                    {/* What's Included */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-900">
                        What's Included:
                      </h4>
                      <div className="space-y-1">
                        {[
                          "Digital Support Access",
                          "Business Development",
                          "Investor Support",
                          tier.totalHours > 4
                            ? "Mentoring Sessions"
                            : "WhatsApp Group Only",
                          tier.totalHours > 14 ? "Supply Chain Support" : null,
                          tier.totalHours > 28 ? "Hiring Support" : null,
                        ]
                          .filter(Boolean)
                          .map((feature, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-xs text-gray-600"
                            >
                              <Icon
                                icon="mdi:check"
                                className="text-green-500 flex-shrink-0"
                                width={14}
                              />
                              {feature}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    text={tier.tier === "X0" ? "Join Free" : "Choose Plan"}
                    type="secondary"
                    className={`w-full border-[#377ecc] text-[#377ecc] hover:bg-[#377ecc] hover:text-white`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-gradient-to-r from-slate-50 to-[#377ecc]/5 rounded-xl md:rounded-2xl p-4 md:p-8 text-center">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">
              Need Help Choosing?
            </h3>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 max-w-2xl mx-auto px-4">
              Not sure which tier is right for you? Our team can help you find
              the perfect membership level based on your startup stage and
              needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Button
                text="Schedule Consultation"
                type="primary"
                className="bg-gradient-to-r from-[#377ecc] to-[#2c63a3] text-sm md:text-base w-full sm:w-auto"
                onClick={openModal}
              />
              <Button
                text="View FAQ"
                type="secondary"
                className="border-[#377ecc] text-[#377ecc] hover:bg-[#377ecc] hover:text-white text-sm md:text-base w-full sm:w-auto"
                onClick={() => {
                  document.getElementById("xen-faq")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* Advisory Services - Detailed Breakdown */}
      <Section className="py-8 md:py-20 bg-gradient-to-br from-slate-50 via-white to-[#377ecc]/5">
        <Container className="px-4 md:px-0">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Advisory Services Breakdown
            </h2>
            <p className="text-base md:text-xl text-gray-600 mb-4 md:mb-6 px-4">
              Detailed hour allocation across all 7 service areas for each
              membership tier
            </p>
            <div className="bg-[#377ecc]/5 border border-[#377ecc]/20 rounded-lg p-3 md:p-4 max-w-4xl mx-auto">
              <p className="text-xs md:text-sm text-gray-700">
                <Icon
                  icon="mdi:information"
                  className="inline mr-2 text-[#377ecc] w-4 h-4 md:w-5 md:h-5"
                />
                All hours are allocated monthly. Examples: 2 hr Business
                Development = Min 1 meeting • 4 hr Hiring = 1 vacancy filled
              </p>
            </div>
          </div>

          {/* Complete Advisory Services Table */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#377ecc] to-[#2c63a3] text-white p-4 md:p-6">
              <h3 className="text-lg md:text-2xl font-bold text-center">
                XEN Advisory Services Matrix
              </h3>
              <p className="text-center text-white/90 mt-1 md:mt-2 text-sm md:text-base">
                Member type and hours of support rendered per month
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-gray-900 w-1/4">
                      Advisory Services
                    </th>
                    <th className="px-2 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-gray-900 w-1/2">
                      Details
                    </th>
                    <th className="px-2 md:px-3 py-3 md:py-4 text-center text-xs md:text-sm font-bold text-gray-900 bg-gray-200">
                      X0
                    </th>
                    <th className="px-2 md:px-3 py-3 md:py-4 text-center text-xs md:text-sm font-bold text-gray-900 bg-blue-50">
                      X1
                    </th>
                    <th className="px-2 md:px-3 py-3 md:py-4 text-center text-xs md:text-sm font-bold text-gray-900 bg-blue-50">
                      X2
                    </th>
                    <th className="px-2 md:px-3 py-3 md:py-4 text-center text-xs md:text-sm font-bold text-gray-900 bg-orange-50">
                      X3
                    </th>
                    <th className="px-2 md:px-3 py-3 md:py-4 text-center text-xs md:text-sm font-bold text-gray-900 bg-orange-50">
                      X4
                    </th>
                    <th className="px-2 md:px-3 py-3 md:py-4 text-center text-xs md:text-sm font-bold text-gray-900 bg-orange-50">
                      X5
                    </th>
                  </tr>
                  <tr className="bg-[#377ecc]/10">
                    <td className="px-2 md:px-4 py-2 text-xs md:text-sm font-semibold text-gray-900">
                      Total Hours =
                    </td>
                    <td className="px-2 md:px-4 py-2"></td>
                    <td className="px-2 md:px-3 py-2 text-center text-xs md:text-sm font-bold text-gray-900">
                      4
                    </td>
                    <td className="px-2 md:px-3 py-2 text-center text-xs md:text-sm font-bold text-gray-900">
                      7
                    </td>
                    <td className="px-2 md:px-3 py-2 text-center text-xs md:text-sm font-bold text-gray-900">
                      14
                    </td>
                    <td className="px-2 md:px-3 py-2 text-center text-xs md:text-sm font-bold text-gray-900">
                      28
                    </td>
                    <td className="px-2 md:px-3 py-2 text-center text-xs md:text-sm font-bold text-gray-900">
                      56
                    </td>
                    <td className="px-2 md:px-3 py-2 text-center text-xs md:text-sm font-bold text-gray-900">
                      112
                    </td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {advisoryServices.map((service, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-2 md:px-4 py-3 md:py-4 bg-[#377ecc]/5">
                        <div className="text-xs md:text-sm font-semibold text-gray-900 leading-tight">
                          {service.service}
                        </div>
                      </td>
                      <td className="px-2 md:px-4 py-3 md:py-4">
                        <div className="text-xs text-gray-700 leading-relaxed">
                          {service.description}
                          {service.highlight && (
                            <div className="mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded inline-block">
                              {service.highlight}
                            </div>
                          )}
                        </div>
                      </td>
                      {service.hours.map((hours, tierIndex) => (
                        <td
                          key={tierIndex}
                          className="px-2 md:px-3 py-3 md:py-4 text-center"
                        >
                          <div
                            className={`text-xs md:text-sm font-bold ${
                              hours > 0 ? "text-gray-900" : "text-gray-400"
                            }`}
                          >
                            {hours}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 p-4 md:p-6 border-t">
              <div className="text-center">
                <p className="text-xs text-gray-600 italic">
                  XEN Introduction v2.5 | All rights reserved 2025
                </p>
              </div>
            </div>
          </div>

          {/* Key Service Examples */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-8 md:mt-12">
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border-l-4 border-[#377ecc]">
              <h4 className="text-sm md:text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Icon
                  icon="mdi:handshake"
                  className="text-[#377ecc] w-[18px] h-[18px] md:w-5 md:h-5"
                />
                Business Development
              </h4>
              <p className="text-xs md:text-sm text-gray-600 mb-2">
                2 hours = minimum 1 meeting with potential partners or clients
              </p>
              <div className="text-xs text-gray-500">
                Leadership connects with strategic partners
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border-l-4 border-[#cc9b37]">
              <h4 className="text-sm md:text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Icon
                  icon="mdi:account-plus"
                  className="text-[#cc9b37] w-[18px] h-[18px] md:w-5 md:h-5"
                />
                Hiring Support
              </h4>
              <p className="text-xs md:text-sm text-gray-600 mb-2">
                4 hours = 1 vacancy filled with qualified candidate
              </p>
              <div className="text-xs text-gray-500">
                Complete recruitment & organizational development
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border-l-4 border-green-500">
              <h4 className="text-sm md:text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Icon
                  icon="mdi:factory"
                  className="text-green-500 w-[18px] h-[18px] md:w-5 md:h-5"
                />
                Supply Chain
              </h4>
              <p className="text-xs md:text-sm text-gray-600 mb-2">
                1 hour = minimum 2 supplier introductions
              </p>
              <div className="text-xs text-gray-500">
                BOM analysis, DFM advisory, strategic sourcing
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* FAQ Section */}
      <Section className="py-8 md:py-20 bg-gradient-to-br from-slate-50 via-white to-[#377ecc]/5">
        <Container className="px-4 md:px-0">
          <div className="text-center mb-8 md:mb-12" id="xen-faq">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-base md:text-xl text-gray-600 px-4">
              Answers to common questions about XEN membership and support
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4 md:space-y-8 px-4">
            {[
              {
                question: "Who can join the XEN community?",
                answer:
                  "Anyone interested in hardware startups, from students to large corporates, can join. Membership tiers are designed to fit every stage of the startup journey.",
              },
              {
                question: "What support do I get as a member?",
                answer:
                  "Members receive access to expert consultants, business development, investor introductions, mentoring, supply chain support, and more—depending on the chosen tier.",
              },
              {
                question: "How do I choose the right membership tier?",
                answer:
                  "Review the tier comparison table above or schedule a consultation with our team for personalized guidance.",
              },
              {
                question: "Can I upgrade my membership later?",
                answer:
                  "Yes, you can upgrade your membership at any time to access more benefits and hours.",
              },
              {
                question: "Are there events or networking opportunities?",
                answer:
                  "Yes! XEN hosts regular mixers, summits, and exclusive events for members to connect and grow their network.",
              },
            ].map((faq, idx) => (
              <div key={idx} className="text-left">
                <div className="font-semibold text-base md:text-lg text-[#377ecc] mb-2 flex items-center gap-2">
                  <Icon
                    icon="mdi:help-circle-outline"
                    className="text-xl md:text-2xl"
                  />
                  {faq.question}
                </div>
                <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-gray-700 text-sm md:text-base">
                  {faq.answer}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Call to Action */}
      <Section className="py-8 md:py-20 bg-gradient-to-r from-[#377ecc] to-[#2c63a3]">
        <Container className="text-center text-white px-4">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">
            Ready to Join the Hardware Revolution?
          </h2>
          <p className="text-base md:text-xl mb-6 md:mb-8 text-white/90 max-w-2xl mx-auto">
            Connect with 40+ expert consultants and join the only community
            built specifically for automotive and hardware entrepreneurs
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Button
              text="Start with X0 (Free)"
              type="primary"
              className="bg-gradient-to-r from-[#cc9b37] to-[#b8862f] hover:from-[#b8862f] hover:to-[#a3752a] text-sm md:text-lg w-full sm:w-auto"
            />
            <Button
              text="View All Plans"
              type="secondary"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-sm md:text-lg border border-white/30 w-full sm:w-auto"
              onClick={() => {
                document.getElementById("xen-membership")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            />
          </div>
        </Container>
      </Section>
    </div>
  );
};

export default XenPage;
