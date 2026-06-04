"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Star,
  Users,
  Shield,
  Code,
  Palette,
  BarChart3,
  TrendingUp,
  Cloud,
  Smartphone,
  Globe,
  CheckCircle,
  Calendar,
  DollarSign,
  Target,
  ArrowUpRight,
  Download,
  Share2,
  MessageCircle,
  Phone,
  Video,
  FileText,
  Award,
  Zap,
  Crown,
  Settings,
} from "lucide-react";
import Link from "next/link";
import ModernButton from "@/components/ui/ModernButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";

// Mock service data - this would come from props or API
const serviceData = {
  id: 1,
  title: "Web Development",
  description:
    "Custom web applications built with modern technologies including React, Next.js, and Node.js. Our team delivers scalable, performant, and user-friendly web solutions tailored to your business needs.",
  category: "Development",
  status: "active",
  price: "$2,500/month",
  duration: "3-6 months",
  features: [
    "Responsive Design",
    "Modern UI/UX",
    "Database Integration",
    "API Development",
    "SEO Optimization",
    "Performance Optimization",
    "Cross-browser Compatibility",
    "Mobile-first Approach",
    "Progressive Web Apps",
    "Real-time Features",
  ],
  icon: Code,
  color: "from-blue-500 to-blue-600",
  bgColor: "from-blue-50 to-blue-100",
  rating: 4.9,
  reviews: 127,
  team: [
    {
      name: "Sarah Johnson",
      role: "Frontend Developer",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
      experience: "5 years",
      specialties: ["React", "TypeScript", "Next.js"],
    },
    {
      name: "Michael Chen",
      role: "Backend Developer",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
      experience: "7 years",
      specialties: ["Node.js", "PostgreSQL", "AWS"],
    },
    {
      name: "Emily Rodriguez",
      role: "UI/UX Designer",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
      experience: "4 years",
      specialties: ["Figma", "User Research", "Design Systems"],
    },
  ],
  technologies: [
    "React",
    "Next.js",
    "Node.js",
    "PostgreSQL",
    "Tailwind CSS",
    "TypeScript",
    "AWS",
    "Docker",
  ],
  deliverables: [
    "Source Code Repository",
    "Technical Documentation",
    "Deployment Guide",
    "User Training Materials",
    "Maintenance Documentation",
    "Performance Reports",
  ],
  support: "24/7 Support",
  nextBilling: "2024-02-15",
  usage: {
    current: 85,
    limit: 100,
    unit: "hours",
  },
  community: "XEN",
  tier: "X3",
  tierName: "Growth Member",
  isIncluded: true,
  allocatedHours: 100,
  usedHours: 85,
  remainingHours: 15,
  milestones: [
    {
      title: "Project Kickoff",
      description: "Initial consultation and requirements gathering",
      status: "completed",
      date: "2024-01-15",
    },
    {
      title: "Design Phase",
      description: "UI/UX design and wireframing",
      status: "completed",
      date: "2024-01-25",
    },
    {
      title: "Development Phase",
      description: "Core development and feature implementation",
      status: "in-progress",
      date: "2024-02-10",
    },
    {
      title: "Testing & QA",
      description: "Quality assurance and testing",
      status: "pending",
      date: "2024-02-20",
    },
    {
      title: "Deployment",
      description: "Production deployment and go-live",
      status: "pending",
      date: "2024-02-28",
    },
  ],
  recentActivity: [
    {
      type: "development",
      message: "Completed user authentication module",
      timestamp: "2 hours ago",
      user: "Michael Chen",
    },
    {
      type: "design",
      message: "Updated dashboard mockups based on feedback",
      timestamp: "4 hours ago",
      user: "Emily Rodriguez",
    },
    {
      type: "meeting",
      message: "Weekly progress meeting completed",
      timestamp: "1 day ago",
      user: "Sarah Johnson",
    },
  ],
};

export default function ServiceDetailPage({ params }) {
  const [activeTab, setActiveTab] = useState("overview");
  const service = serviceData; // In real app, fetch based on params.id

  const tabs = [
    { id: "overview", label: "Overview", icon: Target },
    { id: "team", label: "Team", icon: Users },
    { id: "progress", label: "Progress", icon: BarChart3 },
    { id: "activity", label: "Activity", icon: Clock },
    { id: "documents", label: "Documents", icon: FileText },
  ];

  return (
    <div className="p-6 w-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/50 shadow-xl rounded-3xl p-8 mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <Link href="/services">
              <ModernButton
                type="secondary"
                icon={ArrowLeft}
                text="Back to Services"
                size="sm"
              />
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                    {service.title}
                  </h1>
                  <p className="text-lg text-gray-600 mb-4">
                    {service.category} • {service.tier} - {service.tierName}
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    {service.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`px-3 py-1 rounded-xl text-sm font-medium border ${
                      service.isIncluded
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-blue-100 text-blue-700 border-blue-200"
                    }`}
                  >
                    {service.isIncluded ? "Included" : "Available"}
                  </div>
                  <div className="px-3 py-1 rounded-xl text-sm font-medium bg-gray-100 text-gray-700">
                    {service.status}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Service Progress
                  </span>
                  <span className="text-sm text-gray-500">
                    {service.isIncluded
                      ? `${service.usedHours}/${service.allocatedHours} hours`
                      : "Not started"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-gradient-to-r ${service.color} h-2 rounded-full transition-all duration-300`}
                    style={{
                      width: service.isIncluded
                        ? `${(service.usedHours / service.allocatedHours) * 100}%`
                        : "0%",
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
              <ModernButton
                type="secondary"
                text="Contact Team"
                icon={MessageCircle}
                onClick={() => console.log("Contact team")}
              />
              <ModernButton
                type="primary"
                text="Manage Service"
                icon={Settings}
                onClick={() => console.log("Manage service")}
              />
            </div>
          </div>
        </motion.div>

        {/* Service Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/50 shadow-xl rounded-3xl p-8 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {service.price}
              </div>
              <div className="text-sm text-gray-500">{service.duration}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-xl font-bold text-gray-900">
                  {service.rating}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                ({service.reviews} reviews)
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900 mb-1">
                {service.support}
              </div>
              <div className="text-sm text-gray-500">
                {service.isIncluded
                  ? `Next billing: ${service.nextBilling}`
                  : "Available on upgrade"}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/50 shadow-xl rounded-3xl p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Key Features
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {service.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg"
                    >
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Technologies Used
                </h4>
                <div className="flex flex-wrap gap-2">
                  {service.technologies.map((tech, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Deliverables
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {service.deliverables.map((deliverable, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg"
                    >
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-700">
                        {deliverable}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === "team" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {service.team.map((member, index) => (
                  <Card
                    key={index}
                    className="bg-white/50 backdrop-blur-sm border border-gray-200/50"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-pink-500 to-red-500 text-white font-semibold">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h5 className="font-semibold text-gray-900">
                            {member.name}
                          </h5>
                          <p className="text-sm text-gray-600">{member.role}</p>
                          <p className="text-xs text-gray-500">
                            {member.experience} experience
                          </p>
                        </div>
                      </div>
                      <div>
                        <h6 className="font-medium text-gray-900 mb-2">
                          Specialties
                        </h6>
                        <div className="flex flex-wrap gap-1">
                          {member.specialties.map((specialty, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-4">
                        <ModernButton
                          type="ghost"
                          text="Message"
                          size="sm"
                          icon={MessageCircle}
                          onClick={() => console.log(`Message ${member.name}`)}
                        />
                        <ModernButton
                          type="ghost"
                          text="Call"
                          size="sm"
                          icon={Phone}
                          onClick={() => console.log(`Call ${member.name}`)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Progress Tab */}
          {activeTab === "progress" && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">
                  Project Milestones
                </h4>
                <div className="space-y-4">
                  {service.milestones.map((milestone, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          milestone.status === "completed"
                            ? "bg-green-500"
                            : milestone.status === "in-progress"
                              ? "bg-blue-500"
                              : "bg-gray-300"
                        }`}
                      >
                        {milestone.status === "completed" ? (
                          <CheckCircle className="h-4 w-4 text-white" />
                        ) : milestone.status === "in-progress" ? (
                          <Clock className="h-4 w-4 text-white" />
                        ) : (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">
                          {milestone.title}
                        </h5>
                        <p className="text-sm text-gray-600">
                          {milestone.description}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {milestone.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === "activity" && (
            <div className="space-y-4">
              {service.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === "development"
                        ? "bg-blue-500"
                        : activity.type === "design"
                          ? "bg-purple-500"
                          : "bg-green-500"
                    }`}
                  >
                    {activity.type === "development" ? (
                      <Code className="h-4 w-4 text-white" />
                    ) : activity.type === "design" ? (
                      <Palette className="h-4 w-4 text-white" />
                    ) : (
                      <Users className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {activity.user}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {activity.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              {service.deliverables.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div>
                      <h5 className="font-medium text-gray-900">{doc}</h5>
                      <p className="text-sm text-gray-500">PDF Document</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ModernButton
                      type="ghost"
                      text="Download"
                      size="sm"
                      icon={Download}
                      onClick={() => console.log(`Download ${doc}`)}
                    />
                    <ModernButton
                      type="ghost"
                      text="Share"
                      size="sm"
                      icon={Share2}
                      onClick={() => console.log(`Share ${doc}`)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
