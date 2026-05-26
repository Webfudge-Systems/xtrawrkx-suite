import { useState, useEffect } from "react";
import ServiceCard from "../common/ServiceCard";
import SectionHeader from "../common/SectionHeader";
import Section from "../layout/Section";
import Container from "../layout/Container";
import { ServiceService } from "@/src/services/databaseService";
import { Icon } from "@iconify/react";

// Company information mapping
const companyInfo = {
  XMC: {
    fullName: "Xtrawrkx Management Consulting Pvt Ltd [ XMC ]",
    description:
      "Comprehensive management consulting services to accelerate your business growth and operational excellence.",
  },
  XGV: {
    fullName: "Xtrawrkx Global Venture Private Limited [ XGV ]",
    description:
      "Global venture capital and investment solutions for emerging businesses and innovative startups.",
  },
  XMB: {
    fullName: "Xtrawrkx Manufacturing Business Pvt Ltd [ XMB ]",
    description:
      "End-to-end manufacturing solutions from design to production, leveraging cutting-edge technology.",
  },
};

const OurServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const serviceService = new ServiceService();

  // Fetch services from Firebase
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const servicesData = await serviceService.getServices();
        setServices(servicesData);
        setError(null);
      } catch (err) {
        setError("Failed to load services");
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Group services by subCompany
  const servicesBySubCompany = services.reduce((acc, service) => {
    const subCompany = service.subCompany;
    if (!acc[subCompany]) {
      acc[subCompany] = [];
    }
    acc[subCompany].push(service);
    return acc;
  }, {});

  return (
    <Section className="bg-white relative overflow-hidden">
      {/* Top left corner gradient */}
      <div className="pointer-events-none absolute -top-5 -right-5 w-[50%] h-[30%] opacity-40 bg-gradient-to-bl from-brand-primary via-brand-primary/50 to-transparent blur-3xl rounded-bl-full z-0" />
      <Container>
        <SectionHeader title="Our Services" label="what we do" />

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <Icon
              icon="mdi:alert-circle"
              width={64}
              className="text-red-400 mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {error}
            </h3>
            <p className="text-gray-500">
              Please try refreshing the page or contact support if the issue
              persists.
            </p>
          </div>
        )}

        {/* No Services State */}
        {!loading && !error && services.length === 0 && (
          <div className="text-center py-12">
            <Icon
              icon="mdi:briefcase-outline"
              width={64}
              className="text-gray-400 mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No services available
            </h3>
            <p className="text-gray-500">
              Check back later for our service offerings.
            </p>
          </div>
        )}

        {/* Service Categories by Sub-Company */}
        {!loading &&
          !error &&
          Object.entries(servicesBySubCompany).map(([subCompany, services]) => {
            const company = companyInfo[subCompany];

            if (!company || services.length === 0) return null;

            return (
              <div key={subCompany} className="mb-16">
                <h3 className="text-3xl font-medium text-gray-800 mb-2">
                  {company.fullName}
                </h3>
                <p className="text-gray-600 mb-8 max-w-4xl">
                  {company.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      name={service.name}
                      image={service.image || "/images/hero_services.png"}
                      description={service.description}
                      link={`/services/${service.slug}`}
                      isFavorite={service.featured}
                      onFavorite={() => {}}
                    />
                  ))}
                </div>

                {/* Show highlights if available */}
                {services.some((service) => service.highlights?.length > 0) && (
                  <div className="mt-8 p-6 bg-brand-gray-light/50 rounded-lg shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                      Key Highlights
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {services
                        .filter((service) => service.highlights?.length > 0)
                        .slice(0, 3)
                        .map((service) => (
                          <div key={service.id} className="space-y-2">
                            <h5 className="font-medium text-gray-700">
                              {service.name}
                            </h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {service.highlights.map((highlight, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="text-pink-500 mr-2 mt-1">
                                    •
                                  </span>
                                  {highlight}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </Container>
    </Section>
  );
};

export default OurServices;
