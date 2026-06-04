import React from "react";
import { Icon } from "@iconify/react";
import Section from "../layout/Section";
import Container from "../layout/Container";
import SectionHeader from "../common/SectionHeader";
import JobCard from "./JobCard";
import { getFeaturedJobs } from "@/src/data/CareersData";

const FeaturedJobs = () => {
  const featuredJobs = getFeaturedJobs();

  if (featuredJobs.length === 0) {
    return null;
  }

  return (
    <Section className="py-20 bg-gradient-to-br from-[#377ecc]/5 via-white to-[#cc9b37]/5">
      <Container>
        <SectionHeader
          title="Featured Opportunities"
          label="Priority Openings"
          description="High-impact roles and priority positions across our growing organization"
          className="mb-12"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredJobs.map((job) => (
            <JobCard key={job.id} job={job} featured={true} />
          ))}
        </div>

        {featuredJobs.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="text-gray-400 mb-4">
                <Icon
                  icon="mdi:briefcase-search"
                  width={48}
                  className="mx-auto"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Featured Jobs Available
              </h3>
              <p className="text-gray-600">
                Check back soon for new featured opportunities, or browse all
                available positions below.
              </p>
            </div>
          </div>
        )}
      </Container>
    </Section>
  );
};

export default FeaturedJobs;
