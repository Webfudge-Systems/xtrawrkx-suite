import Section from "@/src/components/layout/Section";
import Container from "@/src/components/layout/Container";
import { Icon } from "@iconify/react";
import { companies } from "@/src/data/aboutData";

export default function Companies() {
  return (
    <Section className="py-16 bg-gray-50">
      <Container>
        <div className="max-w-6xl">
          {/* Header */}
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-medium text-brand-foreground mb-4">
              {companies.heading}
            </h2>
            <p className="text-lg text-gray-600 max-w-4xl">
              {companies.subtext}
            </p>
          </div>

          {/* Companies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {companies.companiesList.map((company, index) => (
              <div
                key={company.id}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                {/* Company Icon and Name */}
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mr-4">
                    <Icon
                      icon={company.icon}
                      className="text-2xl text-pink-500"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-brand-foreground mb-1">
                      {company.shortName}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">
                      {company.name}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-base text-gray-700 leading-relaxed mb-6 text-justify">
                  {company.description}
                </p>

                {/* Specialties */}
                <div>
                  <h4 className="text-sm font-semibold text-brand-foreground mb-3 uppercase tracking-wide">
                    Key Specialties
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {company.specialties.map((specialty, specIndex) => (
                      <span
                        key={specIndex}
                        className="px-3 py-1 bg-pink-50 text-pink-700 text-xs font-medium rounded-full border border-pink-200"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Description */}
          <div className="mt-12 text-left">
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              Together, these three companies form the comprehensive Xtrawrkx
              ecosystem, providing end-to-end solutions from strategic
              consulting and venture capital to advanced manufacturing. This
              integrated approach enables us to support businesses at every
              stage of their growth journey, from initial concept and funding to
              full-scale production and market expansion.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
