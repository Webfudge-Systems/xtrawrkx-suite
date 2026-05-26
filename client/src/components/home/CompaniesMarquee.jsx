"use client";
import React from "react";
import Section from "../layout/Section";
import Image from "next/image";

const CompaniesMarquee = () => {
  // Company logos data - you can replace these with actual client/partner logos
  const companies = [
    {
      name: "Microsoft",
      logo: "/images/client_logos/1.png",
    },
    {
      name: "Google",
      logo: "/images/client_logos/2.png",
    },
    {
      name: "Amazon",
      logo: "/images/client_logos/3.png",
    },
    {
      name: "Apple",
      logo: "/images/client_logos/4.png",
    },
    {
      name: "Tesla",
      logo: "/images/client_logos/5.png",
    },
    {
      name: "Intel",
      logo: "/images/client_logos/6.png",
    },
    {
      name: "Adobe",
      logo: "/images/client_logos/7.png",
    },
    {
      name: "BMW",
      logo: "/images/client_logos/8.png",
    },
    {
      name: "Samsung",
      logo: "/images/client_logos/9.png",
    },
    {
      name: "Oracle",
      logo: "/images/client_logos/10.png",
    },
  ];

  const repeatCount = 2; // How many times to repeat the logo set

  return (
    <Section className="!overflow-hidden !py-6 md:!py-6 bg-white relative border-y border-gray-200">
      {/* Left Gradient Overlay */}
      <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 lg:w-[300px] bg-gradient-to-r from-gray-50 via-gray-50 to-transparent z-10 pointer-events-none"></div>

      {/* Right Gradient Overlay */}
      <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 lg:w-[300px] bg-gradient-to-l from-gray-50 via-gray-50 to-transparent z-10 pointer-events-none"></div>

      <div
        className="flex w-max animate-marquee"
        style={{ animation: "marquee-logos 30s linear infinite" }}
      >
        {/* First set of logos */}
        {Array.from({ length: repeatCount }).map((_, setIndex) =>
          companies.map((company, i) => (
            <div
              key={`${setIndex}-${i}`}
              className="flex items-center justify-center mx-8 md:mx-12 lg:mx-16 flex-shrink-0"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 lg:w-28 lg:h-28 flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 p-3">
                <Image
                  src={company.logo}
                  alt={`${company.name} logo`}
                  width={80}
                  height={80}
                  className="w-full h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                />
              </div>
            </div>
          ))
        )}

        {/* Duplicate set for seamless looping */}
        {Array.from({ length: repeatCount }).map((_, setIndex) =>
          companies.map((company, i) => (
            <div
              key={`duplicate-${setIndex}-${i}`}
              className="flex items-center justify-center mx-8 md:mx-12 lg:mx-16 flex-shrink-0"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 p-3">
                <Image
                  src={company.logo}
                  alt={`${company.name} logo`}
                  width={60}
                  height={60}
                  className="w-full h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                />
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes marquee-logos {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </Section>
  );
};

export default CompaniesMarquee;
