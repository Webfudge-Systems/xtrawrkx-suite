"use client";
import { notFound } from "next/navigation";
import { use, useState, useEffect } from "react";
import Image from "next/image";
import Section from "@/src/components/layout/Section";
import Container from "@/src/components/layout/Container";
import Button from "@/src/components/common/Button";
import { Icon } from "@iconify/react";
import ServiceCard from "@/src/components/common/ServiceCard";
import { useBookMeetModal } from "@/src/hooks/useBookMeetModal";
import { ServiceService } from "@/src/services/databaseService";

export default function ServicePage({ params }) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;
  const { openModal } = useBookMeetModal();

  const [service, setService] = useState(null);
  const [relatedServices, setRelatedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const serviceService = new ServiceService();

  // Fetch service by slug from Firebase
  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const fetchedService = await serviceService.getServiceBySlug(slug);

        if (!fetchedService) {
          console.log("Service not found in Firebase");
          setError("Service not found");
          setLoading(false);
          return;
        }

        setService(fetchedService);

        // Fetch related services from the same category or sub-company
        const allServices = await serviceService.getServices();
        const related = allServices
          .filter(
            (s) =>
              s.slug !== slug &&
              (s.category === fetchedService.category ||
                s.subCompany === fetchedService.subCompany)
          )
          .slice(0, 3);
        setRelatedServices(related);

        setError(null);
      } catch (err) {
        console.error("Error fetching service:", err);
        setError("Failed to load service");
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [slug]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading service...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !service) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Icon
            icon="mdi:alert-circle"
            width={64}
            className="text-red-400 mx-auto mb-4"
          />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {error || "Service not found"}
          </h3>
          <p className="text-gray-500 mb-4">
            The service you're looking for doesn't exist or has been removed.
          </p>
          <Button href="/services">Back to Services</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <Section className="relative w-full h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden p-0">
        {/* Background image */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/images/hero_services.png"
            alt={service.name}
            fill
            className="object-cover object-center"
            priority
          />
          {/* Overlay for text readability */}
          {/* <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" /> */}
        </div>

        {/* Service Info Overlay */}
        <Container className="relative z-20 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-6 py-2 rounded-full text-sm font-semibold mb-6">
            <Icon icon="mdi:briefcase-variant" width={20} />
            {service.category}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">
            {service.name}
          </h1>
          {/* <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8 drop-shadow">
            {service.description}
          </p> */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              text="Schedule Call"
              type="primary"
              className="bg-gradient-to-r from-brand-primary to-brand-secondary"
              onClick={openModal}
            />
            {/* <Button
              text="Download Brochure"
              type="secondary"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
              link={service.brochureUrl || "/brochures/sample.pdf"}
              target="_blank"
              rel="noopener noreferrer"
            /> */}
          </div>
        </Container>
      </Section>

      {/* Service Details Section */}
      <Section className="py-16 bg-gray-50">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Service Overview */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Service Overview
              </h2>
              <p className="text-gray-700 mb-6 leading-relaxed">
                {service.description}
              </p>

              {service.highlights && service.highlights.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Key Highlights
                  </h3>
                  <ul className="space-y-3">
                    {service.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Icon
                          icon="solar:check-circle-bold"
                          className="text-green-500 mt-1"
                          width={20}
                        />
                        <span className="text-gray-700">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Service Info */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Get Started Today
              </h3>
              <p className="text-gray-600 mb-6">
                Ready to transform your business? Let's discuss how our{" "}
                {service.name} service can help you achieve your goals.
              </p>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <Icon
                    icon="solar:phone-bold"
                    className="text-brand-primary"
                    width={20}
                  />
                  <span className="text-gray-700">Free consultation call</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon
                    icon="solar:clock-circle-bold"
                    className="text-brand-primary"
                    width={20}
                  />
                  <span className="text-gray-700">
                    Quick response within 24 hours
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon
                    icon="solar:shield-check-bold"
                    className="text-brand-primary"
                    width={20}
                  />
                  <span className="text-gray-700">
                    Tailored solutions for your needs
                  </span>
                </div>
              </div>

              <Button
                text="Get Free Consultation"
                type="primary"
                className="w-full"
                onClick={openModal}
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* Related Services */}
      {relatedServices.length > 0 && (
        <Section className="py-16 bg-white">
          <Container>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Related Services
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedServices.map((relatedService) => (
                <ServiceCard
                  key={relatedService.id}
                  name={relatedService.name}
                  image={relatedService.image || "/images/hero_services.png"}
                  description={relatedService.description}
                  link={`/services/${relatedService.slug}`}
                  isFavorite={relatedService.featured}
                  onFavorite={() => {}}
                />
              ))}
            </div>
          </Container>
        </Section>
      )}
    </div>
  );
}
