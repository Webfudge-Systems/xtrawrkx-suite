import Section from "@/src/components/layout/Section";
import Container from "@/src/components/layout/Container";
import SectionHeader from "../common/SectionHeader";
import { Icon } from "@iconify/react";

export default function ContactInfo() {
  const contactMethods = [
    {
      icon: "solar:letter-bold",
      title: "General Inquiries",
      primary: "hello@xtrawrkx.com",
      secondary: "Response within 24 hours",
      description:
        "For general questions, information requests, and initial consultations",
    },
    {
      icon: "solar:phone-bold",
      title: "Phone Support",
      primary: "+1 (555) 123-4567",
      secondary: "Monday - Friday, 9 AM - 6 PM EST",
      description: "Direct phone support for urgent matters and consultations",
    },
    {
      icon: "solar:settings-bold",
      title: "Technical Support",
      primary: "support@xtrawrkx.com",
      secondary: "Response within 4 hours",
      description: "Technical assistance and platform support",
    },
    {
      icon: "solar:users-group-rounded-bold",
      title: "Community & Events",
      primary: "community@xtrawrkx.com",
      secondary: "Response within 12 hours",
      description: "Community membership and event-related inquiries",
    },
    {
      icon: "solar:buildings-2-bold",
      title: "Business Development",
      primary: "business@xtrawrkx.com",
      secondary: "Response within 24 hours",
      description: "Partnership opportunities and enterprise solutions",
    },
    {
      icon: "solar:document-text-bold",
      title: "Media & Press",
      primary: "media@xtrawrkx.com",
      secondary: "Response within 48 hours",
      description: "Press inquiries, media kits, and brand information",
    },
  ];

  return (
    <Section className="bg-[#ffffff] !py-16 relative overflow-hidden">
      <img
        src="/images/ContactInfoBg.png"
        alt="Contact Info Background"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0 opacity-10"
        aria-hidden="true"
      />
      <Container className="relative z-10">
        <div className=" mb-12">
          <SectionHeader
            label="Multiple Ways to Reach Us"
            title="Choose the best contact method for your needs"
            className="mb-6"
          />
          <p className="text-lg text-gray-600 max-w-3xl">
            We have dedicated teams for different types of inquiries to ensure
            you get the most relevant and timely assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {contactMethods.map((method, index) => (
            <div
              key={index}
              className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="bg-brand-primary/10 p-3 rounded-full mr-4">
                  <Icon
                    icon={method.icon}
                    width={24}
                    className="text-brand-primary"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {method.title}
                </h3>
              </div>

              <div className="mb-3">
                <a
                  href={
                    method.icon === "solar:phone-bold"
                      ? `tel:${method.primary}`
                      : `mailto:${method.primary}`
                  }
                  className="text-xl font-medium text-brand-primary hover:text-brand-primary/80 transition-colors"
                >
                  {method.primary}
                </a>
              </div>

              <div className="text-sm font-medium text-gray-600 mb-3">
                {method.secondary}
              </div>

              <p className="text-gray-500 text-sm leading-relaxed">
                {method.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional Contact Information */}
        <div className="mt-16 bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Icon
                  icon="solar:clock-circle-bold"
                  className="mr-2"
                  width={24}
                />
                Business Hours
              </h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>Monday - Friday:</span>
                  <span className="font-medium">9:00 AM - 6:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday:</span>
                  <span className="font-medium">10:00 AM - 4:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday:</span>
                  <span className="font-medium">Closed</span>
                </div>
                <div className="text-sm text-gray-500 mt-3">
                  * Emergency support available 24/7 for existing clients
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Icon icon="solar:map-point-bold" className="mr-2" width={24} />
                Office Location
              </h3>
              <div className="text-gray-600 space-y-1">
                <div>Xtrawrkx Headquarters</div>
                <div>123 Innovation Drive, Suite 400</div>
                <div>Tech City, TC 12345</div>
                <div>United States</div>
              </div>
              <div className="mt-4">
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-brand-primary hover:text-brand-primary/80 transition-colors"
                >
                  <Icon icon="solar:map-bold" className="mr-1" width={16} />
                  View on Map
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact Notice */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center bg-red-50 text-red-700 px-4 py-2 rounded-full text-sm">
            <Icon icon="solar:danger-bold" className="mr-2" width={16} />
            For urgent technical issues, call our 24/7 emergency line: +1 (555)
            999-0000
          </div>
        </div>
      </Container>
    </Section>
  );
}
