"use client";
import React from "react";
import Marquee from "@/src/components/common/Marquee";
import ContactForm from "@/src/components/contact/ContactForm";
import ContactInfo from "@/src/components/contact/ContactInfo";
import NewsletterSection from "@/src/components/contact/NewsletterSection";
import Hero from "@/src/components/common/Hero";

export default function ContactUsPage() {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Hero
        title="Contact Us"
        description="Get in touch with us for any inquiries about our services, communities, events, or any other questions you may have. We're here to help you succeed and grow with Xtrawrkx."
      />
      <Marquee />
      <ContactForm />
      <ContactInfo />
      <NewsletterSection />
      <Marquee />
    </div>
  );
}
