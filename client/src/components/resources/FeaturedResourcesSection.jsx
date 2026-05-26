import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Section from "../layout/Section";
import Container from "../layout/Container";
import SectionHeader from "../common/SectionHeader";
import ResourceCard from "./ResourceCard";
import { resourceService } from "../../services/databaseService";

const ResourceCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200"></div>
    <div className="p-6">
      <div className="h-6 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
);

const FeaturedResourcesSection = () => {
  const [featuredResources, setFeaturedResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFeaturedResources = async () => {
      try {
        setLoading(true);
        setError(null);
        const resourcesData = await resourceService.getResources();
        const publishedResources = resourcesData.filter(
          (resource) => (resource.status || "published") === "published"
        );
        const featured = publishedResources.filter(
          (resource) => resource.featured
        );
        setFeaturedResources(featured);
      } catch (error) {
        setError("Failed to load featured resources");
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedResources();
  }, []);

  // Don't render the section at all if no featured resources after loading
  if (!loading && !error && featuredResources.length === 0) {
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
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, index) => (
              <ResourceCardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <Icon
              icon="mdi:alert-circle"
              className="text-red-500 mx-auto mb-4"
              width={64}
            />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Unable to load featured resources
            </h3>
            <p className="text-gray-500">{error}</p>
          </div>
        ) : (
          <>
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
          </>
        )}
      </Container>
    </Section>
  );
};

export default FeaturedResourcesSection;
