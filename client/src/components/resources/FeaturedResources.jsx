import React from "react";
import Section from "../layout/Section";
import Container from "../layout/Container";
import SectionHeader from "../common/SectionHeader";
import ResourceCard from "./ResourceCard";

const FeaturedResources = ({ featuredResources = [] }) => {
  if (!featuredResources || featuredResources.length === 0) {
    return null;
  }

  return (
    <Section className="bg-gray-50 py-16">
      <Container>
        <SectionHeader
          title="Featured Resources"
          label="Trending"
          description="Discover our most popular and impactful resources"
          className="mb-12"
        />

        {/* Featured Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              layout="featured"
            />
          ))}
        </div>

        {/* Featured Badge Section */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-medium">
            <span className="mr-2">⭐</span>
            These resources are trending among our community
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default FeaturedResources;
