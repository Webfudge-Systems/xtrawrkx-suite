import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Section from "../layout/Section";
import Container from "../layout/Container";
import { galleryService } from "../../services/databaseService";
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

const GalleryStatsSection = () => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadGalleryForStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const galleryData = await galleryService.getGalleryItems();
        setGalleryItems(galleryData);
      } catch (error) {
        setError("Failed to load statistics");
      } finally {
        setLoading(false);
      }
    };

    loadGalleryForStats();
  }, []);

  const galleryStats = {
    total: galleryItems.length,
    events: galleryItems.filter((item) => item.category === "events").length,
    communities: galleryItems.filter((item) => item.category === "communities")
      .length,
    achievements: galleryItems.filter(
      (item) => item.category === "achievements"
    ).length,
    team: galleryItems.filter((item) => item.category === "team").length,
    featured: galleryItems.filter((item) => item.featured).length,
  };

  return (
    <Section className="bg-white py-16">
      <Container>
        <SectionHeader
          title="Gallery Overview"
          label="Statistics"
          description="Explore our visual collection across different categories"
          className="mb-12"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          <StatBubble
            loading={loading}
            error={error}
            value={galleryStats.total}
            label="Total Images"
            icon="mdi:image-multiple"
            colorClass="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatBubble
            loading={loading}
            error={error}
            value={galleryStats.events}
            label="Event Images"
            icon="mdi:calendar-star"
            colorClass="bg-gradient-to-br from-green-500 to-green-600"
          />
          <StatBubble
            loading={loading}
            error={error}
            value={galleryStats.communities}
            label="Community Images"
            icon="mdi:account-group"
            colorClass="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <StatBubble
            loading={loading}
            error={error}
            value={galleryStats.achievements}
            label="Achievement Images"
            icon="mdi:trophy"
            colorClass="bg-gradient-to-br from-orange-500 to-orange-600"
          />
          <StatBubble
            loading={loading}
            error={error}
            value={galleryStats.team}
            label="Team Images"
            icon="mdi:account-multiple"
            colorClass="bg-gradient-to-br from-indigo-500 to-indigo-600"
          />
          <StatBubble
            loading={loading}
            error={error}
            value={galleryStats.featured}
            label="Featured Images"
            icon="mdi:star"
            colorClass="bg-gradient-to-br from-yellow-500 to-yellow-600"
          />
        </div>
      </Container>
    </Section>
  );
};

export default GalleryStatsSection;
