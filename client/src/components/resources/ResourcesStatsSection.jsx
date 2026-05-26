import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Section from "../layout/Section";
import Container from "../layout/Container";
import { resourceService } from "../../services/databaseService";
import SectionHeader from "../common/SectionHeader";

const StatBubble = ({ loading, error, value, label, icon, colorClass }) => {
  if (loading) {
    return (
      <div className="text-center">
        <Icon
          icon="mdi:loading"
          className="text-brand-primary mx-auto mb-2 animate-spin"
          width={32}
        />
        <div className="h-4 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <Icon
          icon="mdi:alert-circle"
          className="text-red-500 mx-auto mb-2"
          width={32}
        />
        <p className="text-2xl font-bold text-gray-400 mb-1">--</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    );
  }

  return (
    <div className="text-center group">
      <div
        className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${colorClass} mb-4 group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon icon={icon} width={32} className="text-white" />
      </div>
      <h3 className="text-3xl font-bold text-gray-800 mb-2 group-hover:text-brand-primary transition-colors duration-300">
        {value.toLocaleString()}
      </h3>
      <p className="text-gray-600 font-medium">{label}</p>
    </div>
  );
};

const ResourcesStatsSection = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadResourcesForStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const resourcesData = await resourceService.getResources();
        const publishedResources = resourcesData.filter(
          (resource) => (resource.status || "published") === "published"
        );
        setResources(publishedResources);
      } catch (error) {
        setError("Failed to load statistics");
      } finally {
        setLoading(false);
      }
    };

    loadResourcesForStats();
  }, []);

  const resourceStats = {
    total: resources.length,
    whitepapers: resources.filter((r) => r.type === "whitepaper").length,
    articles: resources.filter((r) => r.type === "article").length,
    reports: resources.filter((r) => r.type === "report").length,
    interviews: resources.filter((r) => r.type === "interview").length,
    newsletters: resources.filter((r) => r.type === "newsletter").length,
  };

  return (
    <Section className="py-16">
      <Container>
        <SectionHeader
          label="Resource Library"
          title="Resources"
          className="mb-6"
        />

        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <StatBubble
            loading={loading}
            error={error}
            value={resourceStats.total}
            label="Total Resources"
            icon="solar:documents-bold"
            colorClass="bg-gradient-to-r from-brand-primary to-brand-secondary"
          />
          <StatBubble
            loading={loading}
            error={error}
            value={resourceStats.whitepapers}
            label="Whitepapers"
            icon="solar:document-text-bold"
            colorClass="bg-gradient-to-r from-blue-500 to-blue-600"
          />
          <StatBubble
            loading={loading}
            error={error}
            value={resourceStats.articles}
            label="Articles"
            icon="solar:book-2-bold"
            colorClass="bg-gradient-to-r from-green-500 to-green-600"
          />
          <StatBubble
            loading={loading}
            error={error}
            value={resourceStats.reports}
            label="Reports"
            icon="solar:chart-square-bold"
            colorClass="bg-gradient-to-r from-purple-500 to-purple-600"
          />
          <StatBubble
            loading={loading}
            error={error}
            value={resourceStats.interviews}
            label="Interviews"
            icon="solar:video-frame-play-vertical-bold"
            colorClass="bg-gradient-to-r from-red-500 to-red-600"
          />
          <StatBubble
            loading={loading}
            error={error}
            value={resourceStats.newsletters}
            label="Newsletters"
            icon="solar:letter-bold"
            colorClass="bg-gradient-to-r from-orange-500 to-orange-600"
          />
        </div>
      </Container>
    </Section>
  );
};

export default ResourcesStatsSection;
