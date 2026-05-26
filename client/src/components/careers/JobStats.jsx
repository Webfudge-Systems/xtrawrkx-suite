import React from "react";
import { Icon } from "@iconify/react";
import { getJobStats } from "@/src/data/CareersData";

const JobStats = () => {
  const stats = getJobStats();

  const statsData = [
    {
      label: "Open Positions",
      value: stats.total,
      icon: "mdi:briefcase-variant",
      color: "from-[#377ecc] to-[#2c63a3]",
      description: "Available roles across all departments",
    },
    {
      label: "Featured Jobs",
      value: stats.featured,
      icon: "mdi:star",
      color: "from-[#cc9b37] to-[#b8862f]",
      description: "Priority openings and high-impact roles",
    },
    {
      label: "Departments",
      value: stats.departments,
      icon: "mdi:office-building",
      color: "from-green-500 to-green-600",
      description: "Different teams actively hiring",
    },
    {
      label: "Locations",
      value: stats.locations,
      icon: "mdi:map-marker",
      color: "from-purple-500 to-purple-600",
      description: "Cities and remote opportunities",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className={`bg-gradient-to-br ${stat.color} rounded-xl p-3 shadow-lg`}
            >
              <Icon icon={stat.icon} className="text-2xl text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {stat.description}
          </p>
        </div>
      ))}
    </div>
  );
};

export default JobStats;
