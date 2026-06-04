import React, { useState, useCallback } from "react";
import Section from "../layout/Section";
import Container from "../layout/Container";
import SectionHeader from "../common/SectionHeader";
import CommunityCard from "../common/CommunityCard";
import { Icon } from "@iconify/react";
import { communitiesData, getCommunityStats } from "../../data/CommunityData";

const CommunitiesSection = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const stats = getCommunityStats();

  const categories = ["All", ...stats.categories];

  const filteredCommunities =
    selectedCategory === "All"
      ? communitiesData
      : communitiesData.filter(
          (community) => community.category === selectedCategory
        );

  const handleJoinCommunity = useCallback((community) => {
    if (community.slug === "xen") {
      window.open("https://forms.gle/feK3siB7oorSFzXr5", "_blank");
    } else {
      window.open("https://forms.gle/feK3siB7oorSFzXr5", "_blank");
    }
  }, []);

  return (
    <Section className="py-16 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <Container>
        <SectionHeader
          title="Our Communities"
          label="Connect & Grow"
          description="Join our vibrant communities and connect with like-minded professionals, entrepreneurs, and innovators in the EV ecosystem."
          className="mb-12 "
        />

        {/* Community Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:account-group" className="text-3xl text-white" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              {stats.totalCommunities}
            </h3>
            <p className="text-gray-600">Active Communities</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Icon
                icon="mdi:account-multiple"
                className="text-3xl text-white"
              />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              {stats.totalMembers}+
            </h3>
            <p className="text-gray-600">Total Members</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:chart-line" className="text-3xl text-white" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              {stats.averageMembers}+
            </h3>
            <p className="text-gray-600">Avg Members</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:tag-multiple" className="text-3xl text-white" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              {stats.categories.length}
            </h3>
            <p className="text-gray-600">Categories</p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg"
                  : "bg-white text-gray-600 hover:text-brand-primary hover:shadow-md"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Communities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {filteredCommunities.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              onJoin={handleJoinCommunity}
            />
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-brand-primary to-brand-secondary rounded-3xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">
              Ready to Join Our Community?
            </h3>
            <p className="text-xl mb-8 text-white/90">
              Connect with thousands of professionals, entrepreneurs, and
              innovators who are shaping the future of mobility.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-brand-primary cursor-pointer px-8 py-4 rounded-full font-semibold hover:shadow-lg transition-all duration-300">
                <Icon icon="mdi:account-plus" className="inline mr-2" />
                Create Account
              </button>
              <button className="bg-white/20 backdrop-blur-sm cursor-pointer text-white px-8 py-4 rounded-full font-semibold hover:bg-white/30 transition-all duration-300">
                <Icon icon="mdi:information" className="inline mr-2" />
                Learn More
              </button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default CommunitiesSection;
