"use client";
import React, { useState, useEffect, use } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Section from "@/src/components/layout/Section";
import Container from "@/src/components/layout/Container";
import Button from "@/src/components/common/Button";
import { Icon } from "@iconify/react";
import { modalsData } from "../../../../src/data/ModalsData";

export default function SingleModalPage({ params }) {
  const { slug } = use(params);
  const [openFaq, setOpenFaq] = useState(null);

  // Find the modal by slug
  const modal = modalsData.find((m) => m.slug === slug);

  if (!modal) {
    notFound();
  }

  // State for testimonial carousel
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Auto-advance testimonials
  useEffect(() => {
    if (modal.testimonials && modal.testimonials.length > 1) {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % modal.testimonials.length);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [modal.testimonials]);

  // Get other modals for comparison
  const otherModals = modalsData.filter((m) => m.slug !== slug);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <Section className="relative w-full h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden p-0">
        {/* Background image */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/images/hero_services.png"
            alt={modal.name}
            fill
            className="object-cover object-center"
            priority
          />
          {/* Overlay for text readability */}
          {/* <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" /> */}
        </div>

        {/* Modal Info Overlay */}
        <Container className="relative z-20 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-6 py-2 rounded-full text-sm font-semibold mb-6">
            <Icon icon="mdi:handshake" width={20} />
            {modal.category}
          </div>
          {modal.popular && (
            <div className="inline-flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-semibold mb-4 ml-4">
              <Icon icon="mdi:star" width={16} />
              Most Popular
            </div>
          )}
          <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
            {modal.name}
          </h1>
          <p className="text-xl text-white/90 mb-6 drop-shadow">
            {modal.subtitle}
          </p>
          <div className="flex items-center justify-center gap-6 text-lg mb-8">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:currency-usd" width={24} />
              <span className="text-3xl font-bold">{modal.price}</span>
              <span className="text-white/80">/ {modal.period}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              text="Get Started Now"
              type="primary"
              className="bg-gradient-to-r from-brand-primary to-brand-secondary"
              link="/contact-us"
            />
            <Button
              text="Compare Models"
              type="secondary"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
              link="/modals"
            />
          </div>
        </Container>
      </Section>

      {/* Overview Section */}
      <Section className="py-20">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Description */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  About This Engagement Model
                </h2>
                <div className="prose prose-lg max-w-none text-gray-700">
                  <p className="text-lg leading-relaxed mb-6">
                    {modal.description}
                  </p>
                  {modal.longDescription && (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: modal.longDescription,
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  What's Included
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modal.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg"
                    >
                      <Icon
                        icon="mdi:check-circle"
                        className="text-brand-primary mt-0.5 flex-shrink-0"
                        width={20}
                      />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              {modal.benefits && modal.benefits.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    Key Benefits
                  </h2>
                  <div className="space-y-6">
                    {modal.benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl p-6"
                      >
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                          {benefit.title}
                        </h3>
                        <p className="text-gray-700">{benefit.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Case Studies */}
              {modal.caseStudies && modal.caseStudies.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    Success Stories
                  </h2>
                  <div className="space-y-8">
                    {modal.caseStudies.map((caseStudy, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {caseStudy.title}
                          </h3>
                          <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-sm font-medium">
                            {caseStudy.industry}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-6">
                          {caseStudy.summary}
                        </p>
                        {caseStudy.results && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">
                              Key Results:
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {caseStudy.results.map((result, resultIndex) => (
                                <div
                                  key={resultIndex}
                                  className="flex items-center gap-2"
                                >
                                  <Icon
                                    icon="mdi:trending-up"
                                    className="text-green-500"
                                    width={16}
                                  />
                                  <span className="text-sm text-gray-700">
                                    {result}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Testimonials */}
              {modal.testimonials && modal.testimonials.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    What Our Clients Say
                  </h2>
                  <div className="relative overflow-hidden">
                    <div
                      className="flex transition-transform duration-500 ease-in-out"
                      style={{
                        transform: `translateX(-${currentTestimonial * 100}%)`,
                        width: `${modal.testimonials.length * 100}%`,
                      }}
                    >
                      {modal.testimonials.map((testimonial, index) => (
                        <div key={index} className="w-full flex-shrink-0 px-3">
                          <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl p-6">
                            <div className="flex items-start gap-4">
                              <Icon
                                icon="mdi:format-quote-close"
                                className="text-brand-primary flex-shrink-0 mt-1"
                                width={24}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-700 w-[30%] italic mb-4">
                                  "{testimonial.quote}"
                                </p>
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {testimonial.author}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {testimonial.role}
                                  </p>
                                  <p className="text-sm text-brand-primary">
                                    {testimonial.company}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Dots indicator */}
                    <div className="flex justify-center mt-6 space-x-2">
                      {modal.testimonials.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentTestimonial(index)}
                          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                            currentTestimonial === index
                              ? "bg-brand-primary"
                              : "bg-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* FAQ */}
              {modal.faqs && modal.faqs.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    Frequently Asked Questions
                  </h2>
                  <div className="space-y-4">
                    {modal.faqs.map((faq, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg"
                      >
                        <button
                          className="w-full flex justify-between items-center p-6 text-left hover:bg-gray-50 transition-colors"
                          onClick={() =>
                            setOpenFaq(openFaq === index ? null : index)
                          }
                        >
                          <span className="font-medium text-gray-900">
                            {faq.question}
                          </span>
                          <Icon
                            icon={
                              openFaq === index
                                ? "mdi:chevron-up"
                                : "mdi:chevron-down"
                            }
                            className="text-gray-400"
                            width={20}
                          />
                        </button>
                        {openFaq === index && (
                          <div className="px-6 pb-6 text-gray-700">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Engagement Info Card */}
              <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl p-6 mb-8 sticky top-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Engagement Details
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Icon
                      icon="mdi:currency-usd"
                      className="text-brand-primary"
                      width={24}
                    />
                    <div>
                      <p className="font-medium text-gray-900">Investment</p>
                      <p className="text-gray-600">
                        {modal.price} / {modal.period}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Icon
                      icon="mdi:clock-outline"
                      className="text-brand-primary"
                      width={24}
                    />
                    <div>
                      <p className="font-medium text-gray-900">Setup Time</p>
                      <p className="text-gray-600">
                        {modal.implementation.timeline}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Icon
                      icon="mdi:account-group"
                      className="text-brand-primary"
                      width={24}
                    />
                    <div>
                      <p className="font-medium text-gray-900">Support Level</p>
                      <p className="text-gray-600">
                        {modal.implementation.support}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Icon
                      icon="mdi:calendar-range"
                      className="text-brand-primary"
                      width={24}
                    />
                    <div>
                      <p className="font-medium text-gray-900">Duration</p>
                      <p className="text-gray-600">
                        {modal.implementation.duration}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    text="Get Started"
                    type="primary"
                    className="w-full"
                    link="/contact-us"
                  />
                  <Button
                    text="Schedule Consultation"
                    type="secondary"
                    className="w-full"
                    link="/contact-us"
                  />
                </div>
              </div>

              {/* Implementation Steps */}
              {modal.nextSteps && modal.nextSteps.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg border mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Next Steps
                  </h3>
                  <div className="space-y-3">
                    {modal.nextSteps.map((step, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <p className="text-gray-700 pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Have Questions?
                </h3>
                <p className="text-gray-600 mb-4">
                  Need help choosing the right engagement model? Our experts are
                  here to help.
                </p>
                <Button
                  text="Contact Expert"
                  type="secondary"
                  link="/contact-us"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Other Models */}
      {otherModals.length > 0 && (
        <Section className="py-20 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
          <Container>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Other Engagement Models
              </h2>
              <p className="text-xl text-gray-600">
                Explore our other engagement options
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {otherModals.map((otherModal, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {otherModal.name}
                        </h3>
                        <p className="text-gray-600">{otherModal.subtitle}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-brand-primary">
                          {otherModal.price}
                        </div>
                        <div className="text-sm text-gray-600">
                          / {otherModal.period}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4">
                      {otherModal.description}
                    </p>
                    <div className="flex gap-3">
                      <Button
                        text="Learn More"
                        type="secondary"
                        link={`/modals/${otherModal.slug}`}
                        className="flex-1"
                      />
                      <Button
                        text="Get Started"
                        type="primary"
                        link="/contact-us"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}
    </div>
  );
}
