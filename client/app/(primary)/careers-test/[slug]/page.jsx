"use client";
import React, { use } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Section from "@/src/components/layout/Section";
import Container from "@/src/components/layout/Container";
import Button from "@/src/components/common/Button";
import { Icon } from "@iconify/react";
import { getJobBySlug, getRecentJobs } from "@/src/data/CareersData";
import { JobCard } from "@/src/components/careers";
import { useBookMeetModal } from "@/src/hooks/useBookMeetModal";

export default function JobDetailPage({ params }) {
  const { slug } = use(params);
  const { openModal } = useBookMeetModal();
  const job = getJobBySlug(slug);

  if (!job) {
    notFound();
  }

  // Get related jobs for suggestions
  const relatedJobs = getRecentJobs(3).filter((j) => j.id !== job.id);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysRemaining = (deadlineString) => {
    const deadline = new Date(deadlineString);
    const now = new Date();
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day";
    return `${diffDays} days`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <Section className="relative w-full h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden p-0">
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/images/hero_services.png"
            alt={job.title}
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#377ecc]/95 via-[#377ecc]/85 to-[#2c63a3]/90" />
        </div>

        <Container className="relative z-20 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-semibold mb-6">
            <Icon icon="mdi:office-building" width={20} />
            {job.department}
          </div>

          <div className="flex items-center justify-center gap-4 mb-4">
            {job.featured && (
              <span className="bg-gradient-to-r from-[#cc9b37] to-[#b8862f] text-white px-4 py-2 rounded-full text-sm font-medium">
                <Icon icon="mdi:star" className="inline mr-1" width={16} />
                Featured Position
              </span>
            )}
            {job.urgent && (
              <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                <Icon
                  icon="mdi:clock-fast"
                  className="inline mr-1"
                  width={16}
                />
                Urgent Hiring
              </span>
            )}
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">
            {job.title}
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8 drop-shadow">
            {job.description}
          </p>

          <div className="flex items-center justify-center gap-8 text-lg mb-8">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:map-marker" width={24} />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon="mdi:clock-outline" width={24} />
              <span>{job.type}</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon="mdi:currency-usd" width={24} />
              <span>{job.salary}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              text="Apply Now"
              type="primary"
              className="bg-gradient-to-r from-[#cc9b37] to-[#b8862f] hover:from-[#b8862f] hover:to-[#a3752a] text-lg px-8 py-4"
              onClick={openModal}
            />
            <Button
              text="← Back to Careers"
              type="secondary"
              link="/careers"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-lg px-8 py-4 border border-white/30"
            />
          </div>
        </Container>
      </Section>

      {/* Job Details */}
      <Section className="py-20">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Overview */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Icon
                    icon="mdi:information-outline"
                    className="text-[#377ecc]"
                    width={28}
                  />
                  Job Overview
                </h2>
                <p className="text-gray-700 text-lg leading-relaxed">
                  {job.description}
                </p>
              </div>

              {/* Key Responsibilities */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Icon
                    icon="mdi:clipboard-list"
                    className="text-[#377ecc]"
                    width={28}
                  />
                  Key Responsibilities
                </h2>
                <ul className="space-y-4">
                  {job.responsibilities.map((responsibility, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Icon
                        icon="mdi:check-circle"
                        className="text-[#377ecc] mt-1 flex-shrink-0"
                        width={20}
                      />
                      <span className="text-gray-700 leading-relaxed">
                        {responsibility}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requirements */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Icon
                    icon="mdi:school"
                    className="text-[#377ecc]"
                    width={28}
                  />
                  Requirements & Qualifications
                </h2>
                <ul className="space-y-4">
                  {job.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Icon
                        icon="mdi:check-circle"
                        className="text-[#377ecc] mt-1 flex-shrink-0"
                        width={20}
                      />
                      <span className="text-gray-700 leading-relaxed">
                        {requirement}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Benefits */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Icon icon="mdi:gift" className="text-[#377ecc]" width={28} />
                  Benefits & Perks
                </h2>
                <ul className="space-y-4">
                  {job.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Icon
                        icon="mdi:star"
                        className="text-[#cc9b37] mt-1 flex-shrink-0"
                        width={20}
                      />
                      <span className="text-gray-700 leading-relaxed">
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Skills */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Icon
                    icon="mdi:lightbulb"
                    className="text-[#377ecc]"
                    width={28}
                  />
                  Required Skills
                </h2>
                <div className="flex flex-wrap gap-3">
                  {job.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-[#377ecc]/10 text-[#377ecc] px-4 py-2 rounded-full text-sm font-medium border border-[#377ecc]/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Quick Apply */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Quick Apply
                  </h3>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Salary Range:
                      </span>
                      <span className="text-sm font-semibold text-[#377ecc]">
                        {job.salary}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Experience:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {job.experience}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Application Deadline:
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatDate(job.deadline)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Time Remaining:
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          getDaysRemaining(job.deadline).includes("day")
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {getDaysRemaining(job.deadline)}
                      </span>
                    </div>
                  </div>
                  <Button
                    text="Apply for This Position"
                    type="primary"
                    className="w-full bg-gradient-to-r from-[#377ecc] to-[#2c63a3]"
                    onClick={openModal}
                  />
                </div>

                {/* Job Details */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Job Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">
                        Reporting To:
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {job.reportingTo}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">
                        Team Size:
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {job.teamSize}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">
                        Posted On:
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatDate(job.posted)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">
                        Job Type:
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {job.type}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">
                        Location:
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {job.location}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Share Job */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Share This Job
                  </h3>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors">
                      <Icon
                        icon="mdi:linkedin"
                        width={20}
                        className="mx-auto"
                      />
                    </button>
                    <button className="flex-1 bg-blue-400 text-white p-3 rounded-lg hover:bg-blue-500 transition-colors">
                      <Icon icon="mdi:twitter" width={20} className="mx-auto" />
                    </button>
                    <button className="flex-1 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-colors">
                      <Icon
                        icon="mdi:whatsapp"
                        width={20}
                        className="mx-auto"
                      />
                    </button>
                    <button className="flex-1 bg-gray-600 text-white p-3 rounded-lg hover:bg-gray-700 transition-colors">
                      <Icon icon="mdi:email" width={20} className="mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Related Jobs */}
      {relatedJobs.length > 0 && (
        <Section className="py-20 bg-gradient-to-br from-slate-50 via-white to-[#377ecc]/5">
          <Container>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Other Open Positions
              </h2>
              <p className="text-lg text-gray-600">
                Explore more opportunities that might interest you
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedJobs.map((relatedJob) => (
                <JobCard key={relatedJob.id} job={relatedJob} />
              ))}
            </div>

            <div className="text-center mt-12">
              <Button
                text="View All Open Positions"
                type="secondary"
                link="/careers"
                className="border-[#377ecc] text-[#377ecc] hover:bg-[#377ecc] hover:text-white"
              />
            </div>
          </Container>
        </Section>
      )}
    </div>
  );
}
