import React from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import Button from "../common/Button";

const JobCard = ({ job, featured = false }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysAgo = (dateString) => {
    const posted = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - posted);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
        featured
          ? "border-[#377ecc] ring-2 ring-[#377ecc]/20"
          : "border-gray-100 hover:border-[#377ecc]/30"
      } relative overflow-hidden`}
    >
      {/* Top badges */}
      <div className="absolute top-4 right-4 flex gap-2">
        {job.featured && (
          <span className="bg-gradient-to-r from-[#377ecc] to-[#2c63a3] text-white px-3 py-1 rounded-full text-xs font-medium">
            <Icon icon="mdi:star" className="inline mr-1" width={12} />
            Featured
          </span>
        )}
        {job.urgent && (
          <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-medium">
            <Icon icon="mdi:clock-fast" className="inline mr-1" width={12} />
            Urgent
          </span>
        )}
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-900 hover:text-[#377ecc] transition-colors pr-4">
              <Link href={`/careers/${job.slug}`}>{job.title}</Link>
            </h3>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <span className="flex items-center gap-1">
              <Icon icon="mdi:office-building" width={16} />
              {job.department}
            </span>
            <span className="flex items-center gap-1">
              <Icon icon="mdi:map-marker" width={16} />
              {job.location}
            </span>
            <span className="flex items-center gap-1">
              <Icon icon="mdi:clock-outline" width={16} />
              {job.type}
            </span>
          </div>

          <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">
            {job.description}
          </p>
        </div>

        {/* Key Info */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Experience:</span>
            <span className="text-sm font-medium text-gray-900">
              {job.experience}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Salary:</span>
            <span className="text-sm font-medium text-[#377ecc]">
              {job.salary}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Posted:</span>
            <span className="text-sm text-gray-500">
              {getDaysAgo(job.posted)}
            </span>
          </div>
        </div>

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {job.skills.slice(0, 4).map((skill, index) => (
                <span
                  key={index}
                  className="bg-[#377ecc]/10 text-[#377ecc] px-3 py-1 rounded-full text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
              {job.skills.length > 4 && (
                <span className="text-xs text-gray-500 px-2 py-1">
                  +{job.skills.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            <Icon
              icon="mdi:calendar-outline"
              className="inline mr-1"
              width={14}
            />
            Deadline: {formatDate(job.deadline)}
          </div>
          <Button
            text="View Details"
            type="secondary"
            link={`/careers/${job.slug}`}
            className="text-sm px-4 py-2 border-[#377ecc] text-[#377ecc] hover:bg-[#377ecc] hover:text-white"
          />
        </div>
      </div>

      {/* Accent line */}
      {featured && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#377ecc] to-[#2c63a3]"></div>
      )}
    </div>
  );
};

export default JobCard;
