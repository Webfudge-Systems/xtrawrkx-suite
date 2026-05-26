"use client";
import React, { use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Section from "../../../../src/components/layout/Section";
import Container from "../../../../src/components/layout/Container";
import Hero from "../../../../src/components/common/Hero";
import {
  RelatedResources,
  ResourceSidebar,
} from "../../../../src/components/resources";
import { Icon } from "@iconify/react";
import { resourceService } from "../../../../src/services/databaseService";
import { formatDate } from "../../../../src/utils/dateUtils";

const SingleResourcePage = ({ params }) => {
  const { slug } = use(params);
  const [resource, setResource] = useState(null);
  const [relatedResources, setRelatedResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadResource = async () => {
      try {
        setLoading(true);

        // Get resource by slug
        const resourceData = await resourceService.getResourceBySlug(slug);

        if (
          !resourceData ||
          (resourceData.status !== "published" &&
            resourceData.status !== undefined)
        ) {
          notFound();
          return;
        }

        setResource(resourceData);

        // Get related resources
        const allResources = await resourceService.getResources();
        const publishedResources = allResources.filter(
          (r) =>
            (r.status || "published") === "published" &&
            r.id !== resourceData.id
        );

        // Find related resources by category and tags
        const related = publishedResources
          .filter(
            (r) =>
              r.category === resourceData.category ||
              (r.tags &&
                resourceData.tags &&
                r.tags.some((tag) => resourceData.tags.includes(tag)))
          )
          .slice(0, 3);

        setRelatedResources(related);
        setError(null);
      } catch (error) {
        console.error("Error loading resource:", error);
        setError("Failed to load resource. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadResource();
    }
  }, [slug]);

  // Update view count when resource loads
  useEffect(() => {
    if (resource && resource.id) {
      const updateViews = async () => {
        try {
          const currentViews = resource.views || 0;
          await resourceService.update(resource.id, {
            views: currentViews + 1,
          });
        } catch (error) {
          console.error("Error updating views:", error);
        }
      };

      updateViews();
    }
  }, [resource]);

  const getTypeIcon = (type) => {
    switch (type) {
      case "whitepaper":
        return "solar:document-text-bold";
      case "article":
        return "solar:book-2-bold";
      case "report":
        return "solar:chart-square-bold";
      default:
        return "solar:document-bold";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "whitepaper":
        return "bg-blue-100 text-blue-800";
      case "article":
        return "bg-green-100 text-green-800";
      case "report":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200"></div>
          <Section className="bg-white py-16">
            <Container>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                  <div className="h-8 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-8"></div>
                  <div className="space-y-4">
                    {[...Array(5)].map((_, index) => (
                      <div
                        key={index}
                        className="h-4 bg-gray-200 rounded"
                      ></div>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              </div>
            </Container>
          </Section>
        </div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Hero
          title="Resource Not Found"
          description="The resource you're looking for could not be found"
        />
        <Section className="bg-white py-16">
          <Container>
            <div className="text-center py-12">
              <div className="text-red-500 text-xl font-semibold mb-4">
                {error ||
                  "This resource could not be found or may have been removed."}
              </div>
              <Link
                href="/resources"
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Back to Resources
              </Link>
            </div>
          </Container>
        </Section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <Hero
        title={resource.title}
        subtitle={resource.description}
        description={resource.excerpt}
        backgroundImage={resource.image}
        showButton={false}
      />

      {/* Resource Details */}
      <Section className="bg-white py-16">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Resource Header */}
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(
                      resource.type
                    )}`}
                  >
                    <Icon
                      icon={getTypeIcon(resource.type)}
                      className="inline mr-1"
                      width={16}
                    />
                    {resource.type.charAt(0).toUpperCase() +
                      resource.type.slice(1)}
                  </span>
                  <span className="text-sm text-brand-primary font-medium">
                    {resource.category}
                  </span>
                  {resource.featured && (
                    <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-3 py-1 rounded-full text-sm font-medium">
                      Featured
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-6">
                  <div className="flex items-center gap-6">
                    <span className="flex items-center">
                      <Icon
                        icon="solar:user-bold"
                        width={16}
                        className="mr-1"
                      />
                      {resource.author}
                    </span>
                    <span className="flex items-center">
                      <Icon
                        icon="solar:calendar-bold"
                        width={16}
                        className="mr-1"
                      />
                      {formatDate(resource.publishedDate || resource.createdAt)}
                    </span>
                    <span className="flex items-center">
                      <Icon
                        icon="solar:clock-circle-bold"
                        width={16}
                        className="mr-1"
                      />
                      {resource.readTime}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                {resource.tags && resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {resource.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-gray-600 pb-6 border-b border-gray-200">
                  <span className="flex items-center">
                    <Icon icon="solar:eye-bold" width={16} className="mr-1" />
                    {(resource.views || 0).toLocaleString()} views
                  </span>
                  {resource.downloads > 0 && (
                    <span className="flex items-center">
                      <Icon
                        icon="solar:download-bold"
                        width={16}
                        className="mr-1"
                      />
                      {resource.downloads.toLocaleString()} downloads
                    </span>
                  )}
                </div>
              </div>

              {/* Content - Only show for articles */}
              {resource.type === "article" && resource.content && (
                <div className="prose prose-lg max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: resource.content }} />
                </div>
              )}

              {/* For whitepapers and reports, show a message about the PDF */}
              {(resource.type === "whitepaper" ||
                resource.type === "report") && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Icon
                      icon="solar:file-text-bold"
                      width={24}
                      className="text-blue-600"
                    />
                    <h3 className="text-lg font-semibold text-blue-900">
                      {resource.type === "whitepaper" ? "Whitepaper" : "Report"}{" "}
                      Available
                    </h3>
                  </div>
                  <p className="text-blue-800 mb-4">
                    This {resource.type} is available as a downloadable PDF.
                    Click the download button to access the full document.
                  </p>
                  {resource.downloadUrl && (
                    <a
                      href={resource.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Icon icon="solar:download-bold" width={20} />
                      Download{" "}
                      {resource.type === "whitepaper" ? "Whitepaper" : "Report"}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <ResourceSidebar resource={resource} />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Related Resources */}
      {relatedResources.length > 0 && (
        <RelatedResources
          currentResource={resource}
          relatedResources={relatedResources}
        />
      )}
    </div>
  );
};

export default SingleResourcePage;
