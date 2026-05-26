"use client";
import React from "react";
import Section from "../layout/Section";
import Container from "../layout/Container";
import Button from "../common/Button";
import SectionHeader from "../common/SectionHeader";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

const VerticalsSection = () => {
  // Verticals data with external website URLs (placeholder URLs - replace with actual ones)
  const verticals = [
    {
      id: "XMC",
      name: "XMC",
      fullName: "Xtrawrkx Management Consulting Pvt Ltd",
      description:
        "Comprehensive management consulting services to accelerate your business growth and operational excellence.",
      icon: "mdi:chart-line",
      color: "from-blue-500 to-blue-600",
      // website: "https://xtrawrkx.com",
      features: [
        "Strategic Consulting",
        "Business Growth",
        "Operational Excellence",
      ],
    },
    {
      id: "XGV",
      name: "XGV",
      fullName: "Xtrawrkx Global Venture Private Limited",
      description:
        "Global venture capital and investment solutions for emerging businesses and innovative startups.",
      icon: "mdi:rocket-launch",
      color: "from-green-500 to-green-600",
      // website: "https://xgv.xtrawrkx.com",
      features: ["Venture Capital", "Investment Solutions", "Startup Support"],
    },
    {
      id: "XMB",
      name: "XMB",
      fullName: "Xtrawrkx Manufacturing Business Pvt Ltd",
      description:
        "End-to-end manufacturing solutions from design to production, leveraging cutting-edge technology.",
      icon: "mdi:factory",
      color: "from-orange-500 to-orange-600",
      website: "https://xmb.xtrawrkx.com",
      features: [
        "Manufacturing Solutions",
        "Design to Production",
        "Technology Integration",
      ],
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: {
      y: 50,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <Section className="bg-gray-50">
      <Container>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Section Header */}
          <div className="text-center mb-12">
            <motion.div variants={cardVariants}>
              <SectionHeader
                label="BUSINESS DIVISIONS"
                title="Our Companies"
                className="mb-4"
              />
            </motion.div>
            <motion.p
              variants={cardVariants}
              className="text-lg text-gray-600 max-w-3xl mx-auto"
            >
              Discover our specialized business divisions designed to serve
              different aspects of your growth journey
            </motion.p>
          </div>

          {/* Verticals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {verticals.map((vertical) => (
              <motion.div
                key={vertical.id}
                variants={cardVariants}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  {/* Logo */}
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon
                      icon={vertical.icon}
                      width={24}
                      height={24}
                      className="text-white"
                    />
                  </div>

                  {/* Status Badge */}
                  <div className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-lg">
                    Active
                  </div>
                </div>

                {/* Company Info */}
                <div className="mb-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {vertical.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Business Division
                  </p>
                </div>

                {/* Job Title */}
                <h4 className="text-xl font-semibold text-gray-900 mb-4 leading-tight">
                  {vertical.fullName}
                </h4>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {vertical.features.slice(0, 2).map((feature, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1 rounded-lg"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  {vertical.description}
                </p>

                {/* Bottom Section */}
                {vertical.website && (
                  <div className="flex items-center justify-between">
                    <Button
                      text="Know More"
                      type="secondary"
                      onClick={() => {
                        window.location.href = "/about";
                      }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* CTA Section */}
          <motion.div
            variants={cardVariants}
            className="text-center mt-12 p-8 bg-white rounded-2xl shadow-lg"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Need Help Choosing the Right Vertical?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Our team can help you identify which vertical best suits your
              needs and connect you with the right experts.
            </p>
            <Button
              text="Get Consultation"
              type="primary"
              onClick={() => {
                window.location.href = "/contact-us";
              }}
              icon="mdi:calendar"
              className="mx-auto"
            />
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
};

export default VerticalsSection;
