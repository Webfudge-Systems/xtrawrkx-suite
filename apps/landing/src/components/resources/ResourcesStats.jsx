import React from "react";
import { Icon } from "@iconify/react";
import { getResourcesByType } from "../../data/ResourcesData";

const ResourcesStats = ({ resourceStats }) => {
  const stats = [
    {
      value: resourceStats.total,
      label: "Total Resources",
      icon: "solar:document-bold",
      color: "text-brand-primary",
      bgColor: "bg-brand-primary/10",
    },
    {
      value: resourceStats.whitepapers,
      label: "Whitepapers",
      icon: "solar:document-text-bold",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      value: resourceStats.articles,
      label: "Articles",
      icon: "solar:book-2-bold",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      value: resourceStats.reports,
      label: "Reports",
      icon: "solar:chart-square-bold",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center group hover:scale-105 transition-transform duration-300"
            >
              <div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${stat.bgColor} mb-4 group-hover:shadow-lg transition-shadow duration-300`}
              >
                <Icon icon={stat.icon} width={32} className={stat.color} />
              </div>
              <div className={`text-3xl font-bold ${stat.color} mb-2`}>
                {stat.value}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Additional Stats */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="group">
              <div className="flex items-center justify-center mb-2">
                <Icon
                  icon="solar:eye-bold"
                  width={24}
                  className="text-gray-600 mr-2"
                />
                <span className="text-2xl font-bold text-gray-900">50K+</span>
              </div>
              <p className="text-gray-600">Total Views</p>
            </div>
            <div className="group">
              <div className="flex items-center justify-center mb-2">
                <Icon
                  icon="solar:download-bold"
                  width={24}
                  className="text-gray-600 mr-2"
                />
                <span className="text-2xl font-bold text-gray-900">25K+</span>
              </div>
              <p className="text-gray-600">Downloads</p>
            </div>
            <div className="group">
              <div className="flex items-center justify-center mb-2">
                <Icon
                  icon="solar:users-group-rounded-bold"
                  width={24}
                  className="text-gray-600 mr-2"
                />
                <span className="text-2xl font-bold text-gray-900">15+</span>
              </div>
              <p className="text-gray-600">Expert Authors</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcesStats;
