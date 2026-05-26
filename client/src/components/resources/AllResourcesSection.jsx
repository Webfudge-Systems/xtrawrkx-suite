import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import Section from "../layout/Section";
import Container from "../layout/Container";
import SectionHeader from "../common/SectionHeader";
import ResourceFilter from "./ResourceFilter";
import ResourceCard from "./ResourceCard";
import Button from "../common/Button";
import { resourceService } from "../../services/databaseService";

// Resource categories for filtering
const resourceCategories = [
  "All",
  "Finance",
  "Technology",
  "Manufacturing",
  "Market Analysis",
  "Sustainability",
  "Regulatory",
  "Investment",
];

// Resource types
const resourceTypes = [
  { value: "all", label: "All Resources" },
  { value: "whitepaper", label: "Whitepapers" },
  { value: "article", label: "Articles" },
  { value: "report", label: "Reports" },
  { value: "interview", label: "Interviews" },
  { value: "newsletter", label: "Newsletters" },
];

const ResourceCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
    <div className="h-40 bg-gray-200"></div>
    <div className="p-4">
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded mb-3"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
);

const AllResourcesSection = () => {
  const searchParams = useSearchParams();
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load resources
  useEffect(() => {
    const loadAllResources = async () => {
      try {
        setLoading(true);
        setError(null);
        const resourcesData = await resourceService.getResources();
        const publishedResources = resourcesData.filter(
          (resource) => (resource.status || "published") === "published"
        );
        setResources(publishedResources);
      } catch (error) {
        setError("Failed to load resources");
      } finally {
        setLoading(false);
      }
    };

    loadAllResources();
  }, []);

  // Handle URL parameters for filtering
  useEffect(() => {
    const typeParam = searchParams.get("type");
    const categoryParam = searchParams.get("category");
    const searchParam = searchParams.get("search");

    if (
      typeParam &&
      ["whitepaper", "article", "report", "interview", "newsletter"].includes(
        typeParam
      )
    ) {
      setSelectedType(typeParam);
    }
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  // Filter resources based on selected filters and search query
  const filteredResources = useMemo(() => {
    let filtered = resources;

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((resource) => resource.type === selectedType);
    }

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (resource) => resource.category === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (resource) =>
          resource.title.toLowerCase().includes(query) ||
          resource.description.toLowerCase().includes(query) ||
          (resource.author && resource.author.toLowerCase().includes(query)) ||
          (resource.tags &&
            resource.tags.some((tag) => tag.toLowerCase().includes(query)))
      );
    }

    // Sort by publishedDate descending (newest first)
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.publishedDate || 0);
      const dateB = new Date(b.publishedDate || 0);

      // Handle invalid dates
      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;

      return dateB - dateA;
    });

    return filtered;
  }, [resources, selectedType, selectedCategory, searchQuery]);

  const handleClearFilters = () => {
    setSelectedType("all");
    setSelectedCategory("All");
    setSearchQuery("");
  };

  return (
    <Section className="bg-white py-16">
      <Container>
        <SectionHeader
          title="All Resources"
          label="Library"
          description="Browse our complete collection of resources"
          className="mb-12"
        />

        {/* Filters */}
        <ResourceFilter
          selectedType={selectedType}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onTypeChange={setSelectedType}
          onCategoryChange={setSelectedCategory}
          onSearchChange={setSearchQuery}
          resourceTypes={resourceTypes}
          resourceCategories={resourceCategories}
        />

        {/* Results Count */}
        {!loading && !error && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
              Showing{" "}
              <span className="font-medium">{filteredResources.length}</span> of{" "}
              <span className="font-medium">{resources.length}</span> resources
            </p>
          </div>
        )}

        {/* Resources Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
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
              Unable to load resources
            </h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <Button
              text="Try Again"
              type="primary"
              onClick={() => window.location.reload()}
            />
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
              <Icon
                icon="solar:document-bold"
                width={40}
                className="text-gray-400"
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No resources found
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              We couldn't find any resources matching your current filters. Try
              adjusting your search criteria or browse all resources.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                text="Clear Filters"
                type="secondary"
                onClick={handleClearFilters}
              />
              <Button
                text="Browse All Resources"
                type="primary"
                link="/resources"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                layout="grid"
              />
            ))}
          </div>
        )}

        {/* Load More Button (if needed) */}
        {!loading && !error && filteredResources.length >= 9 && (
          <div className="text-center mt-12">
            <Button text="Load More Resources" type="secondary" />
          </div>
        )}
      </Container>
    </Section>
  );
};

export default AllResourcesSection;
