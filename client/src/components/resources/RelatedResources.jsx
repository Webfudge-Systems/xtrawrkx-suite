import React from "react";
import Section from "../layout/Section";
import Container from "../layout/Container";
import SectionHeader from "../common/SectionHeader";
import ResourceCard from "./ResourceCard";
import Button from "../common/Button";

const RelatedResources = ({ currentResource, relatedResources = [] }) => {
  if (!relatedResources || relatedResources.length === 0) {
    return null;
  }

  return (
    <Section className="bg-gray-50 py-16">
      <Container>
        <SectionHeader
          title="Related Resources"
          label="More Reading"
          description="Discover more resources related to this topic"
          className="mb-12"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {relatedResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      </Container>
    </Section>
  );
};

export default RelatedResources;
