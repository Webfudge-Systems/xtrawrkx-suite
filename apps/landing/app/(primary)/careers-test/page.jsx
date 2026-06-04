"use client";
import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Hero from "@/src/components/common/Hero";
import Section from "@/src/components/layout/Section";
import Container from "@/src/components/layout/Container";
import SectionHeader from "@/src/components/common/SectionHeader";
import CTASection from "@/src/components/common/CTASection";
import {
  JobCard,
  JobFilter,
  JobStats,
  FeaturedJobs,
} from "@/src/components/careers";
import jobsData, {
  getJobsByDepartment,
  getJobsByLocation,
  departments,
  locations,
  experienceLevels,
  jobTypes,
} from "@/src/data/CareersData";
import { Icon } from "@iconify/react";

// Separate component that uses useSearchParams
const CareersContent = () => {
  const searchParams = useSearchParams();
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [selectedExperience, setSelectedExperience] = useState(
    "All Experience Levels"
  );
  const [selectedType, setSelectedType] = useState("All Types");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Handle URL parameters for filtering
  useEffect(() => {
    const deptParam = searchParams.get("department");
    const locationParam = searchParams.get("location");
    const typeParam = searchParams.get("type");
    const searchParam = searchParams.get("search");

    if (deptParam && departments.includes(deptParam)) {
      setSelectedDepartment(deptParam);
    }
    if (locationParam && locations.includes(locationParam)) {
      setSelectedLocation(locationParam);
    }
    if (typeParam && jobTypes.includes(typeParam)) {
      setSelectedType(typeParam);
    }
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  // Filter jobs based on selected criteria
  const filteredJobs = useMemo(() => {
    let filtered = jobsData;

    // Filter by department
    if (selectedDepartment !== "All Departments") {
      filtered = filtered.filter(
        (job) => job.department === selectedDepartment
      );
    }

    // Filter by location
    if (selectedLocation !== "All Locations") {
      filtered = filtered.filter((job) =>
        job.location.includes(selectedLocation)
      );
    }

    // Filter by experience level
    if (selectedExperience !== "All Experience Levels") {
      filtered = filtered.filter(
        (job) => job.experience === selectedExperience
      );
    }

    // Filter by job type
    if (selectedType !== "All Types") {
      filtered = filtered.filter((job) => job.type === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query) ||
          job.department.toLowerCase().includes(query) ||
          job.skills.some((skill) => skill.toLowerCase().includes(query)) ||
          job.requirements.some((req) => req.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [
    selectedDepartment,
    selectedLocation,
    selectedExperience,
    selectedType,
    searchQuery,
  ]);

  const handleClearFilters = () => {
    setSelectedDepartment("All Departments");
    setSelectedLocation("All Locations");
    setSelectedExperience("All Experience Levels");
    setSelectedType("All Types");
    setSearchQuery("");
  };

  return (
    <>
      {/* Company Culture Section */}
      <Section className="py-20 bg-gradient-to-br from-slate-50 via-white to-[#377ecc]/5">
        <Container>
          <div className="text-center mb-16">
            <SectionHeader
              title="Why Work at Xtrawrkx?"
              label="Company Culture"
              description="Join our mission to revolutionize the EV ecosystem and build the future of sustainable transportation"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: "mdi:rocket-launch",
                title: "Innovation First",
                description:
                  "Work on cutting-edge EV technology and shape the future of sustainable transportation with breakthrough innovations.",
                color: "from-[#377ecc] to-[#2c63a3]",
              },
              {
                icon: "mdi:account-group",
                title: "Collaborative Environment",
                description:
                  "Join a diverse team of passionate professionals where every voice matters and collaboration drives success.",
                color: "from-[#cc9b37] to-[#b8862f]",
              },
              {
                icon: "mdi:chart-line",
                title: "Growth Opportunities",
                description:
                  "Accelerate your career with mentorship, learning programs, and the chance to take on challenging projects.",
                color: "from-green-500 to-green-600",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`bg-gradient-to-br ${item.color} rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg`}
                >
                  <Icon icon={item.icon} className="text-3xl text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Job Statistics */}
          <JobStats />
        </Container>
      </Section>

      {/* Featured Jobs */}
      <FeaturedJobs />

      {/* All Jobs Section */}
      <Section className="py-20 bg-white">
        <Container>
          <SectionHeader
            title="All Open Positions"
            label="Browse Jobs"
            description="Explore all available opportunities across our organization"
            className="mb-12"
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <JobFilter
                selectedDepartment={selectedDepartment}
                selectedLocation={selectedLocation}
                selectedExperience={selectedExperience}
                selectedType={selectedType}
                searchQuery={searchQuery}
                onDepartmentChange={setSelectedDepartment}
                onLocationChange={setSelectedLocation}
                onExperienceChange={setSelectedExperience}
                onTypeChange={setSelectedType}
                onSearchChange={setSearchQuery}
                onClearFilters={handleClearFilters}
                showFilters={showFilters}
                toggleFilters={() => setShowFilters(!showFilters)}
              />
            </div>

            {/* Jobs Grid */}
            <div className="lg:col-span-3">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {filteredJobs.length} Position
                    {filteredJobs.length !== 1 ? "s" : ""} Found
                  </h3>
                  {filteredJobs.length !== jobsData.length && (
                    <span className="bg-[#377ecc]/10 text-[#377ecc] px-3 py-1 rounded-full text-sm font-medium">
                      Filtered
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden bg-[#377ecc] text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Icon icon="mdi:filter-variant" width={16} />
                  Filters
                </button>
              </div>

              {/* Jobs Grid */}
              {filteredJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="bg-gray-50 rounded-2xl p-12">
                    <div className="text-gray-400 mb-6">
                      <Icon
                        icon="mdi:briefcase-search-outline"
                        width={64}
                        className="mx-auto"
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      No Jobs Found
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      We couldn't find any positions matching your current
                      filters. Try adjusting your search criteria or check back
                      later for new opportunities.
                    </p>
                    <button
                      onClick={handleClearFilters}
                      className="bg-[#377ecc] text-white px-6 py-3 rounded-lg hover:bg-[#2c63a3] transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Icon icon="mdi:filter-off" width={16} />
                      Clear All Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>

      {/* Benefits Section */}
      <Section className="py-20 bg-gradient-to-br from-[#377ecc]/10 via-white to-[#cc9b37]/10">
        <Container>
          <SectionHeader
            title="What We Offer"
            label="Benefits & Perks"
            description="Comprehensive benefits package designed to support your professional and personal growth"
            className="mb-12"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "mdi:currency-usd",
                title: "Competitive Compensation",
                description:
                  "Market-leading salaries, performance bonuses, and equity participation in our growing company.",
              },
              {
                icon: "mdi:medical-bag",
                title: "Health & Wellness",
                description:
                  "Comprehensive health insurance, wellness programs, and mental health support for you and your family.",
              },
              {
                icon: "mdi:clock-outline",
                title: "Work-Life Balance",
                description:
                  "Flexible working hours, remote work options, and generous time-off policies to maintain balance.",
              },
              {
                icon: "mdi:school",
                title: "Learning & Development",
                description:
                  "Professional development budget, conference attendance, and continuous learning opportunities.",
              },
              {
                icon: "mdi:car-electric",
                title: "EV Benefits",
                description:
                  "Employee discounts on EVs, charging infrastructure access, and sustainable transportation support.",
              },
              {
                icon: "mdi:gift",
                title: "Additional Perks",
                description:
                  "Modern office spaces, latest tech equipment, team events, and employee recognition programs.",
              },
            ].map((benefit, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="bg-[#377ecc]/10 rounded-xl p-3 w-fit mb-4">
                  <Icon
                    icon={benefit.icon}
                    className="text-2xl text-[#377ecc]"
                  />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA Section */}
      <CTASection />
    </>
  );
};

const CareersPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <Hero
        title="Join Our Team"
        description="Build the future of sustainable transportation with us. Discover exciting career opportunities in the rapidly growing EV ecosystem and make a meaningful impact on the world."
        backgroundImage="/images/hero_services.png"
        showButton={true}
        buttonText="View Open Positions"
        buttonLink="#all-jobs"
      />

      <Suspense fallback={<div>Loading careers...</div>}>
        <CareersContent />
      </Suspense>
    </div>
  );
};

export default CareersPage;
