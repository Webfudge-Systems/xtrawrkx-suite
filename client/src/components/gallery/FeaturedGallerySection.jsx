import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Section from "../layout/Section";
import Container from "../layout/Container";
import SectionHeader from "../common/SectionHeader";
import GalleryItem from "./GalleryItem";
import Button from "../common/Button";
import { galleryService } from "../../services/databaseService";

const FeaturedGallerySection = () => {
  const [featuredGallery, setFeaturedGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFeaturedGallery = async () => {
      try {
        setLoading(true);
        setError(null);
        const featuredItems = await galleryService.getFeaturedGalleryItems();
        // Limit to 6 featured items for the section
        setFeaturedGallery(featuredItems.slice(0, 6));
      } catch (error) {
        setError("Failed to load featured gallery");
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedGallery();
  }, []);

  const GalleryItemSkeleton = () => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
      <div className="h-64 bg-gray-200"></div>
      <div className="p-6">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Section className="bg-gray-50 py-16">
        <Container>
          <SectionHeader
            title="Featured Gallery"
            label="Highlights"
            description="Our most noteworthy moments and achievements"
            className="mb-12"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <GalleryItemSkeleton key={index} />
            ))}
          </div>
        </Container>
      </Section>
    );
  }

  if (error) {
    return (
      <Section className="bg-gray-50 py-16">
        <Container>
          <SectionHeader
            title="Featured Gallery"
            label="Highlights"
            description="Our most noteworthy moments and achievements"
            className="mb-12"
          />
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
              <Icon
                icon="mdi:alert-circle"
                width={40}
                className="text-red-500"
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to load featured gallery
            </h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <Button text="View All Gallery" type="primary" link="/gallery" />
          </div>
        </Container>
      </Section>
    );
  }

  if (featuredGallery.length === 0) {
    return (
      <Section className="bg-gray-50 py-16">
        <Container>
          <SectionHeader
            title="Featured Gallery"
            label="Highlights"
            description="Our most noteworthy moments and achievements"
            className="mb-12"
          />
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
              <Icon icon="mdi:star-off" width={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No featured items yet
            </h3>
            <p className="text-gray-500 mb-6">
              Featured gallery items will appear here once they are marked as
              featured.
            </p>
            <Button text="View All Gallery" type="primary" link="/gallery" />
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section className="bg-gray-50 py-16">
      <Container>
        <SectionHeader
          title="Featured Gallery"
          label="Highlights"
          description="Our most noteworthy moments and achievements"
          className="mb-12"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredGallery.map((item) => (
            <GalleryItem key={item.id} item={item} viewMode="grid" />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button
            text="View All Gallery Items"
            type="primary"
            link="/gallery"
            icon="mdi:arrow-right"
          />
        </div>
      </Container>
    </Section>
  );
};

export default FeaturedGallerySection;
