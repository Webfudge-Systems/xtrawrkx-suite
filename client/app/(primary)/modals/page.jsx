"use client";
import React, { useState } from "react";
import Section from "@/src/components/layout/Section";
import Container from "@/src/components/layout/Container";
import Hero from "@/src/components/common/Hero";
import Button from "@/src/components/common/Button";
import { Icon } from "@iconify/react";
import modalsData from "@/src/data/ModalsData";
import Marquee from "@/src/components/common/Marquee";
import CTASection from "@/src/components/common/CTASection";

export default function ModalsPage() {
  const [selectedModal, setSelectedModal] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState([]);

  const toggleComparison = (modalId) => {
    if (selectedForComparison.includes(modalId)) {
      setSelectedForComparison(
        selectedForComparison.filter((id) => id !== modalId)
      );
    } else if (selectedForComparison.length < 3) {
      setSelectedForComparison([...selectedForComparison, modalId]);
    }
  };

  const getComparisonModals = () => {
    return modalsData.filter((modal) =>
      selectedForComparison.includes(modal.id)
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <Hero
        title="Engagement Models"
        description="Choose the perfect engagement model that fits your business stage and goals. From startup support to enterprise consulting, we have the right solution for your growth journey."
        showButton={true}
        buttonText="Get Started"
        buttonLink="/contact-us"
      />

      {/* Engagement Models Overview */}
      <Section className="py-20 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <Container>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-6 py-2 rounded-full text-sm font-semibold mb-6">
              <Icon icon="mdi:handshake" width={20} />
              How We Work
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Engagement{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
                Models
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              We believe in flexible partnerships that evolve with your
              business. Choose from our three engagement models, each designed
              to provide maximum value at different stages of your growth
              journey.
            </p>

            {/* Toggle Comparison Mode */}
            <div className="flex justify-center gap-4 mb-8">
              <Button
                text={compareMode ? "Exit Comparison" : "Compare Models"}
                type={compareMode ? "secondary" : "primary"}
                onClick={() => {
                  setCompareMode(!compareMode);
                  setSelectedForComparison([]);
                }}
              />
            </div>
          </div>

          {/* Engagement Models Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {modalsData.map((modal, index) => (
              <div
                key={modal.id}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  modal.popular
                    ? "border-2 border-brand-primary scale-105"
                    : "border border-gray-200"
                } ${
                  compareMode && selectedForComparison.includes(modal.id)
                    ? "ring-2 ring-brand-secondary"
                    : ""
                }`}
              >
                {/* Most Popular Banner */}
                {modal.popular && (
                  <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white text-center py-2 text-xs font-semibold tracking-wide z-20">
                    ⭐ Most Popular
                  </div>
                )}

                {/* Comparison Checkbox */}
                {compareMode && (
                  <div className="absolute top-4 right-4 z-30">
                    <button
                      onClick={() => toggleComparison(modal.id)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedForComparison.includes(modal.id)
                          ? "bg-brand-primary border-brand-primary text-white"
                          : "border-gray-300 bg-white"
                      }`}
                      disabled={
                        !selectedForComparison.includes(modal.id) &&
                        selectedForComparison.length >= 3
                      }
                    >
                      {selectedForComparison.includes(modal.id) && (
                        <Icon icon="mdi:check" width={16} />
                      )}
                    </button>
                  </div>
                )}

                {/* Header */}
                <div className={`px-6 py-6 ${modal.popular ? "pt-12" : ""}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {modal.name}
                      </h3>
                      <p className="text-gray-600">{modal.subtitle}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">
                        {modal.price}
                      </div>
                      <div className="text-sm text-gray-600">
                        / {modal.period}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-6">{modal.description}</p>
                </div>

                {/* Features Preview */}
                <div className="px-6 pb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                    Key Features
                  </h4>
                  <ul className="space-y-2 mb-6">
                    {modal.features.slice(0, 5).map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <Icon
                          icon="mdi:check-circle"
                          className="text-brand-primary mt-0.5 flex-shrink-0"
                          width={16}
                        />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {modal.features.length > 5 && (
                      <li className="text-sm text-gray-500 italic">
                        +{modal.features.length - 5} more features
                      </li>
                    )}
                  </ul>

                  <div className="space-y-3">
                    <Button
                      text="Learn More"
                      type="primary"
                      className="w-full"
                      link={`/modals/${modal.slug}`}
                    />
                    <Button
                      text="Get Started"
                      type="secondary"
                      className="w-full"
                      link="/contact-us"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          {compareMode && selectedForComparison.length > 1 && (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Model Comparison
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-4 font-semibold text-gray-900">
                        Feature
                      </th>
                      {getComparisonModals().map((modal) => (
                        <th
                          key={modal.id}
                          className="text-center py-4 px-4 font-semibold text-gray-900"
                        >
                          {modal.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium text-gray-700">
                        Price
                      </td>
                      {getComparisonModals().map((modal) => (
                        <td key={modal.id} className="py-3 px-4 text-center">
                          <span className="font-bold text-brand-primary">
                            {modal.price}
                          </span>
                          <span className="text-sm text-gray-600 block">
                            / {modal.period}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium text-gray-700">
                        Best For
                      </td>
                      {getComparisonModals().map((modal) => (
                        <td
                          key={modal.id}
                          className="py-3 px-4 text-center text-gray-600"
                        >
                          {modal.subtitle}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium text-gray-700">
                        Setup Time
                      </td>
                      {getComparisonModals().map((modal) => (
                        <td
                          key={modal.id}
                          className="py-3 px-4 text-center text-gray-600"
                        >
                          {modal.implementation.timeline}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium text-gray-700">
                        Support Level
                      </td>
                      {getComparisonModals().map((modal) => (
                        <td
                          key={modal.id}
                          className="py-3 px-4 text-center text-gray-600"
                        >
                          {modal.implementation.support}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Why Choose Our Engagement Models */}
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-8">
              Why Choose Our Engagement Models?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon
                    icon="mdi:rocket-launch"
                    className="text-white"
                    width={32}
                  />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">
                  Flexible Growth
                </h4>
                <p className="text-gray-600">
                  Start with what you need and scale up as your business grows.
                  Our models are designed to evolve with your journey.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon
                    icon="mdi:shield-check"
                    className="text-white"
                    width={32}
                  />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">
                  Proven Results
                </h4>
                <p className="text-gray-600">
                  Our engagement models have helped hundreds of businesses
                  achieve their goals with measurable ROI and sustainable
                  growth.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon
                    icon="mdi:account-group"
                    className="text-white"
                    width={32}
                  />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">
                  Expert Support
                </h4>
                <p className="text-gray-600">
                  Get access to our team of experienced consultants and industry
                  experts who are committed to your success.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* FAQ Section */}
      <Section className="py-20 bg-white">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h3>
            <div className="space-y-6">
              {[
                {
                  question: "Can I switch between engagement models?",
                  answer:
                    "Yes, absolutely! Our engagement models are designed to be flexible. You can upgrade or change your model as your business needs evolve. We'll work with you to ensure a smooth transition.",
                },
                {
                  question: "What's the minimum commitment for each model?",
                  answer:
                    "Complementary Support has no minimum commitment. Membership Advisory requires a 3-month minimum, and Consulting engagements are project-based with timelines determined during scoping.",
                },
                {
                  question: "Do you offer custom engagement models?",
                  answer:
                    "Yes, for enterprise clients with unique requirements, we can create custom engagement models that combine elements from our standard offerings with specialized services.",
                },
                {
                  question:
                    "How do you measure success in each engagement model?",
                  answer:
                    "We establish clear KPIs and success metrics at the beginning of each engagement. These vary by model but always focus on measurable business outcomes and ROI.",
                },
              ].map((faq, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    {faq.question}
                  </h4>
                  <p className="text-gray-700">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Marquee />
      <CTASection />
    </div>
  );
}
