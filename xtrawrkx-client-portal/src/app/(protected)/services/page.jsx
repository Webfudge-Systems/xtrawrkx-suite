"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  Star,
  Users,
  Zap,
  Shield,
  Globe,
  Code,
  Palette,
  BarChart3,
  Mail,
  Phone,
  Video,
  FileText,
  Database,
  Cloud,
  Smartphone,
  Monitor,
  Server,
  Lock,
  Award,
  TrendingUp,
  Target,
  Rocket,
  Heart,
  DollarSign,
  Calendar,
  ArrowRight,
  Plus,
  Filter,
  Search,
  Crown,
  ArrowUpRight,
  CheckSquare,
} from "lucide-react";
import ModernButton from "@/components/ui/ModernButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

// Mock services data with community segregation
const servicesData = [
  // XEN Community Services (X3 Tier - Included Services)
  {
    id: 1,
    title: "Web Development",
    description:
      "Custom web applications built with modern technologies including React, Next.js, and Node.js",
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
    ],
    icon: Code,
    color: "from-blue-500 to-blue-600",
    bgColor: "from-blue-50 to-blue-100",
    rating: 4.9,
    reviews: 127,
    team: ["Frontend Developer", "Backend Developer", "UI/UX Designer"],
    technologies: ["React", "Next.js", "Node.js", "PostgreSQL", "Tailwind CSS"],
    deliverables: ["Source Code", "Documentation", "Deployment", "Training"],
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
  },
  {
    id: 2,
    title: "UI/UX Design",
    description:
      "Professional user interface and user experience design services for web and mobile applications",
    category: "Design",
    status: "active",
    price: "$1,800/month",
    duration: "2-4 months",
    features: [
      "User Research",
      "Wireframing",
      "Prototyping",
      "Visual Design",
      "Design Systems",
      "Usability Testing",
    ],
    icon: Palette,
    color: "from-purple-500 to-purple-600",
    bgColor: "from-purple-50 to-purple-100",
    rating: 4.9,
    reviews: 156,
    team: ["UI Designer", "UX Researcher", "Design Lead"],
    technologies: ["Figma", "Sketch", "Adobe XD", "Principle", "InVision"],
    deliverables: [
      "Design Files",
      "Prototypes",
      "Style Guide",
      "User Personas",
    ],
    support: "Design Support",
    nextBilling: "2024-02-10",
    usage: {
      current: 60,
      limit: 80,
      unit: "hours",
    },
    community: "XEN",
    tier: "X3",
    tierName: "Growth Member",
    isIncluded: true,
    allocatedHours: 80,
    usedHours: 60,
    remainingHours: 20,
  },
  {
    id: 3,
    title: "Digital Marketing",
    description:
      "Comprehensive digital marketing strategies including SEO, social media, and content marketing",
    category: "Marketing",
    status: "active",
    price: "$2,000/month",
    duration: "Ongoing",
    features: [
      "SEO Optimization",
      "Social Media Management",
      "Content Creation",
      "Email Marketing",
      "Analytics & Reporting",
      "Campaign Management",
    ],
    icon: TrendingUp,
    color: "from-orange-500 to-orange-600",
    bgColor: "from-orange-50 to-orange-100",
    rating: 4.7,
    reviews: 203,
    team: ["SEO Specialist", "Content Creator", "Social Media Manager"],
    technologies: ["Google Analytics", "SEMrush", "Hootsuite", "Mailchimp"],
    deliverables: [
      "Marketing Reports",
      "Content Calendar",
      "SEO Audit",
      "Campaigns",
    ],
    support: "Marketing Support",
    nextBilling: "2024-02-05",
    usage: {
      current: 45,
      limit: 60,
      unit: "hours",
    },
    community: "XEN",
    tier: "X3",
    tierName: "Growth Member",
    isIncluded: true,
    allocatedHours: 60,
    usedHours: 45,
    remainingHours: 15,
  },
  {
    id: 4,
    title: "Cloud Infrastructure",
    description:
      "Scalable cloud solutions with AWS, Azure, and Google Cloud Platform services",
    category: "Infrastructure",
    status: "active",
    price: "$1,500/month",
    duration: "Ongoing",
    features: [
      "Cloud Migration",
      "Auto Scaling",
      "Load Balancing",
      "Security Management",
      "Backup & Recovery",
      "Monitoring & Alerting",
    ],
    icon: Cloud,
    color: "from-cyan-500 to-cyan-600",
    bgColor: "from-cyan-50 to-cyan-100",
    rating: 4.8,
    reviews: 94,
    team: ["DevOps Engineer", "Cloud Architect", "Security Specialist"],
    technologies: ["AWS", "Azure", "Google Cloud", "Docker", "Kubernetes"],
    deliverables: [
      "Infrastructure Setup",
      "Documentation",
      "Monitoring",
      "Support",
    ],
    support: "24/7 Infrastructure Support",
    nextBilling: "2024-02-12",
    usage: {
      current: 200,
      limit: 250,
      unit: "GB",
    },
    community: "XEN",
    tier: "X3",
    tierName: "Growth Member",
    isIncluded: true,
    allocatedHours: 50,
    usedHours: 35,
    remainingHours: 15,
  },
  {
    id: 5,
    title: "Data Analytics",
    description:
      "Business intelligence and data analytics solutions to drive data-driven decisions",
    category: "Analytics",
    status: "active",
    price: "$2,200/month",
    duration: "3-6 months",
    features: [
      "Data Visualization",
      "Business Intelligence",
      "Predictive Analytics",
      "Custom Dashboards",
      "Data Integration",
      "Reporting Automation",
    ],
    icon: BarChart3,
    color: "from-indigo-500 to-indigo-600",
    bgColor: "from-indigo-50 to-indigo-100",
    rating: 4.9,
    reviews: 78,
    team: ["Data Analyst", "BI Developer", "Data Engineer"],
    technologies: ["Tableau", "Power BI", "Python", "SQL", "Apache Spark"],
    deliverables: [
      "Analytics Dashboards",
      "Reports",
      "Data Models",
      "Insights",
    ],
    support: "Analytics Support",
    nextBilling: "2024-02-18",
    usage: {
      current: 90,
      limit: 120,
      unit: "hours",
    },
    community: "XEN",
    tier: "X3",
    tierName: "Growth Member",
    isIncluded: true,
    allocatedHours: 120,
    usedHours: 90,
    remainingHours: 30,
  },

  // Additional Services (Not Included in X3 - Available for Upgrade)
  {
    id: 6,
    title: "Mobile App Development",
    description:
      "Native and cross-platform mobile applications for iOS and Android with modern frameworks",
    category: "Development",
    status: "available",
    price: "$3,200/month",
    duration: "4-8 months",
    features: [
      "iOS & Android Apps",
      "Cross-platform Solutions",
      "Push Notifications",
      "Offline Capabilities",
      "App Store Optimization",
      "Performance Monitoring",
    ],
    icon: Smartphone,
    color: "from-green-500 to-green-600",
    bgColor: "from-green-50 to-green-100",
    rating: 4.8,
    reviews: 89,
    team: ["Mobile Developer", "UI/UX Designer", "QA Tester"],
    technologies: ["React Native", "Flutter", "Swift", "Kotlin", "Firebase"],
    deliverables: [
      "Mobile Apps",
      "App Store Listings",
      "Documentation",
      "Maintenance",
    ],
    support: "Priority Support",
    nextBilling: "2024-02-20",
    usage: {
      current: 0,
      limit: 150,
      unit: "hours",
    },
    community: "XEN",
    tier: "X4",
    tierName: "Scale Member",
    isIncluded: false,
    upgradeRequired: true,
    upgradeTier: "X4",
    upgradeTierName: "Scale Member",
  },
  {
    id: 7,
    title: "E-commerce Solutions",
    description:
      "Complete e-commerce platforms with payment integration, inventory management, and analytics",
    category: "E-commerce",
    status: "available",
    price: "$3,500/month",
    duration: "4-8 months",
    features: [
      "Online Store Setup",
      "Payment Integration",
      "Inventory Management",
      "Order Processing",
      "Customer Management",
      "Analytics & Reporting",
    ],
    icon: Globe,
    color: "from-pink-500 to-pink-600",
    bgColor: "from-pink-50 to-pink-100",
    rating: 4.8,
    reviews: 145,
    team: ["E-commerce Developer", "Payment Specialist", "UI/UX Designer"],
    technologies: ["Shopify", "WooCommerce", "Magento", "Stripe", "PayPal"],
    deliverables: [
      "E-commerce Platform",
      "Payment Setup",
      "Training",
      "Support",
    ],
    support: "E-commerce Support",
    nextBilling: "2024-03-01",
    usage: {
      current: 0,
      limit: 200,
      unit: "hours",
    },
    community: "XEN",
    tier: "X4",
    tierName: "Scale Member",
    isIncluded: false,
    upgradeRequired: true,
    upgradeTier: "X4",
    upgradeTierName: "Scale Member",
  },
  {
    id: 8,
    title: "Cybersecurity",
    description:
      "Comprehensive cybersecurity services including vulnerability assessment and security monitoring",
    category: "Security",
    status: "available",
    price: "$2,800/month",
    duration: "Ongoing",
    features: [
      "Security Assessment",
      "Penetration Testing",
      "Security Monitoring",
      "Incident Response",
      "Compliance Management",
      "Security Training",
    ],
    icon: Shield,
    color: "from-red-500 to-red-600",
    bgColor: "from-red-50 to-red-100",
    rating: 4.9,
    reviews: 112,
    team: ["Security Analyst", "Penetration Tester", "Compliance Officer"],
    technologies: ["Nessus", "Burp Suite", "Splunk", "SIEM", "OWASP"],
    deliverables: [
      "Security Reports",
      "Compliance Documentation",
      "Training",
      "Monitoring",
    ],
    support: "24/7 Security Support",
    nextBilling: "2024-02-08",
    usage: {
      current: 0,
      limit: 100,
      unit: "hours",
    },
    community: "XEN",
    tier: "X4",
    tierName: "Scale Member",
    isIncluded: false,
    upgradeRequired: true,
    upgradeTier: "X4",
    upgradeTierName: "Scale Member",
  },
];

// Service categories
const serviceCategories = [
  { name: "All", count: servicesData.length },
  { name: "Included", count: servicesData.filter((s) => s.isIncluded).length },
  {
    name: "Available",
    count: servicesData.filter((s) => !s.isIncluded).length,
  },
  {
    name: "Development",
    count: servicesData.filter((s) => s.category === "Development").length,
  },
  {
    name: "Design",
    count: servicesData.filter((s) => s.category === "Design").length,
  },
  {
    name: "Marketing",
    count: servicesData.filter((s) => s.category === "Marketing").length,
  },
  {
    name: "Infrastructure",
    count: servicesData.filter((s) => s.category === "Infrastructure").length,
  },
  {
    name: "Analytics",
    count: servicesData.filter((s) => s.category === "Analytics").length,
  },
  {
    name: "E-commerce",
    count: servicesData.filter((s) => s.category === "E-commerce").length,
  },
  {
    name: "Security",
    count: servicesData.filter((s) => s.category === "Security").length,
  },
];

function ServicesContent() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");

  // Set initial category based on URL parameter
  useEffect(() => {
    if (filter === "included") {
      setSelectedCategory("Included");
    } else if (filter === "available") {
      setSelectedCategory("Available");
    } else {
      setSelectedCategory("All");
    }
  }, [filter]);

  // Filter and sort services
  const filteredServices = servicesData
    .filter((service) => {
      const matchesCategory =
        selectedCategory === "All" ||
        (selectedCategory === "Included" && service.isIncluded) ||
        (selectedCategory === "Available" && !service.isIncluded) ||
        service.category === selectedCategory;
      const matchesSearch =
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.title.localeCompare(b.title);
        case "price":
          return (
            parseFloat(a.price.replace(/[^0-9.]/g, "")) -
            parseFloat(b.price.replace(/[^0-9.]/g, ""))
          );
        case "rating":
          return b.rating - a.rating;
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  const includedServices = servicesData.filter((s) => s.isIncluded);
  const availableServices = servicesData.filter((s) => !s.isIncluded);
  const totalAllocatedHours = includedServices.reduce(
    (sum, s) => sum + s.allocatedHours,
    0
  );
  const totalUsedHours = includedServices.reduce(
    (sum, s) => sum + s.usedHours,
    0
  );
  const totalRemainingHours = totalAllocatedHours - totalUsedHours;

  return (
    <div className="p-6 w-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
              {filter === "included"
                ? "Included Services"
                : filter === "available"
                  ? "Available Services"
                  : "My Services"}
            </h1>
            <p className="text-gray-600 text-lg">
              {filter === "included"
                ? "Your XEN X3 included services with allocated hours"
                : filter === "available"
                  ? "Additional services available with X4 upgrade"
                  : "Manage your XEN X3 services and explore additional solutions"}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {filter === "available" && (
              <ModernButton
                type="primary"
                text="Upgrade to X4"
                icon={ArrowUpRight}
                onClick={() => console.log("Upgrade to X4")}
              />
            )}
            {filter !== "available" && (
              <ModernButton
                type="secondary"
                text="View All Services"
                icon={ArrowRight}
                onClick={() => (window.location.href = "/services")}
              />
            )}
          </div>
        </div>

        {/* Community Tier Info */}
        {filter !== "available" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/50 shadow-xl rounded-3xl p-8 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    XEN Growth Member (X3)
                  </h3>
                  <p className="text-gray-600 text-lg">
                    {filter === "included"
                      ? "Your included services with allocated hours"
                      : "Your current community tier includes 5 core services"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-2 font-medium">
                  Total Allocated Hours
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {totalAllocatedHours}h
                </div>
                <div className="text-sm text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full">
                  {totalRemainingHours}h remaining
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* X4 Upgrade Info for Available Services */}
        {filter === "available" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-white via-purple-50/30 to-indigo-50/50 backdrop-blur-sm border border-purple-200/50 shadow-xl rounded-3xl p-8 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <ArrowUpRight className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Upgrade to XEN Scale Member (X4)
                  </h3>
                  <p className="text-gray-600 text-lg">
                    Unlock additional services and enhanced features
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-2 font-medium">
                  Available Services
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {availableServices.length}
                </div>
                <div className="text-sm text-purple-600 font-semibold bg-purple-50 px-3 py-1 rounded-full">
                  With X4 upgrade
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {filter === "included" ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/50 shadow-xl rounded-3xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
                    <CheckCircle className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Included Services
                    </h3>
                    <p className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {includedServices.length}
                    </p>
                    <p className="text-sm text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">
                      Active
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/50 shadow-xl rounded-3xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
                    <Clock className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Hours Used
                    </h3>
                    <p className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {totalUsedHours}h
                    </p>
                    <p className="text-sm text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-full">
                      of {totalAllocatedHours}h
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/50 shadow-xl rounded-3xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
                    <Target className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Usage Rate
                    </h3>
                    <p className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {Math.round((totalUsedHours / totalAllocatedHours) * 100)}
                      %
                    </p>
                    <p className="text-sm text-orange-600 font-semibold bg-orange-50 px-2 py-1 rounded-full">
                      Efficient usage
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
                className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/50 shadow-xl rounded-3xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
                    <Star className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Average Rating
                    </h3>
                    <p className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      4.8
                    </p>
                    <p className="text-sm text-purple-600 font-semibold bg-purple-50 px-2 py-1 rounded-full">
                      Excellent
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          ) : filter === "available" ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="bg-gradient-to-r from-white via-purple-50/30 to-indigo-50/50 backdrop-blur-sm border border-purple-200/50 shadow-xl rounded-3xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
                    <ArrowUpRight className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Available Services
                    </h3>
                    <p className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {availableServices.length}
                    </p>
                    <p className="text-sm text-purple-600 font-semibold bg-purple-50 px-2 py-1 rounded-full">
                      With X4
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="bg-gradient-to-r from-white via-purple-50/30 to-indigo-50/50 backdrop-blur-sm border border-purple-200/50 shadow-xl rounded-3xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
                    <DollarSign className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Total Value
                    </h3>
                    <p className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      $9,500
                    </p>
                    <p className="text-sm text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-full">
                      Monthly
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="bg-gradient-to-r from-white via-purple-50/30 to-indigo-50/50 backdrop-blur-sm border border-purple-200/50 shadow-xl rounded-3xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
                    <Star className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Average Rating
                    </h3>
                    <p className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      4.8
                    </p>
                    <p className="text-sm text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">
                      Excellent
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
                className="bg-gradient-to-r from-white via-purple-50/30 to-indigo-50/50 backdrop-blur-sm border border-purple-200/50 shadow-xl rounded-3xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
                    <Crown className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Upgrade Required
                    </h3>
                    <p className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      X4
                    </p>
                    <p className="text-sm text-orange-600 font-semibold bg-orange-50 px-2 py-1 rounded-full">
                      Scale Member
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          ) : (
            // Default stats for "All Services"
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/50 shadow-xl rounded-3xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
                    <CheckCircle className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Included Services
                    </h3>
                    <p className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {includedServices.length}
                    </p>
                    <p className="text-sm text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">
                      Active
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/50 shadow-xl rounded-3xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
                    <Clock className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Hours Used
                    </h3>
                    <p className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {totalUsedHours}h
                    </p>
                    <p className="text-sm text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-full">
                      of {totalAllocatedHours}h
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/50 shadow-xl rounded-3xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
                    <Star className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Available Services
                    </h3>
                    <p className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {availableServices.length}
                    </p>
                    <p className="text-sm text-purple-600 font-semibold bg-purple-50 px-2 py-1 rounded-full">
                      Upgrade to X4
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
                className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/50 shadow-xl rounded-3xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
                    <Target className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Usage Rate
                    </h3>
                    <p className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {Math.round((totalUsedHours / totalAllocatedHours) * 100)}
                      %
                    </p>
                    <p className="text-sm text-orange-600 font-semibold bg-orange-50 px-2 py-1 rounded-full">
                      Efficient usage
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>

        {/* Service Filters & Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/50 shadow-xl rounded-3xl p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Service Filter Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {serviceCategories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category.name
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                      : "bg-white/80 text-gray-700 hover:bg-white border border-gray-200/50 backdrop-blur-sm"
                  }`}
                >
                  {category.name}
                  <span className="bg-white/20 text-xs px-2 py-1 rounded-lg">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search and Sort */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-48"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-1">
                <span className="text-sm text-gray-600 px-3">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-none text-sm text-gray-700 focus:ring-0 focus:outline-none px-2 py-1"
                >
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="rating">Rating</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredServices.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="group"
              >
                <Card className="h-full bg-gradient-to-br from-white/90 to-pink-50/30 backdrop-blur-sm border border-pink-200/50 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-pink-300/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-12 h-12 bg-gradient-to-br ${service.color} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-900">
                            {service.title}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge
                              variant={
                                service.isIncluded ? "default" : "secondary"
                              }
                              className="text-xs"
                            >
                              {service.isIncluded ? "Included" : "Available"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {service.category}
                            </Badge>
                            {service.isIncluded && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-green-50 text-green-700 border-green-200"
                              >
                                {service.tier}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {service.price}
                        </p>
                        <p className="text-sm text-gray-500">
                          {service.duration}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {service.description}
                    </p>

                    {/* Hours Usage for Included Services */}
                    {service.isIncluded && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Hours Usage
                          </span>
                          <span className="text-sm text-gray-500">
                            {service.usedHours}/{service.allocatedHours}h
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`bg-gradient-to-r ${service.color} h-2 rounded-full transition-all duration-300`}
                            style={{
                              width: `${(service.usedHours / service.allocatedHours) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {service.remainingHours}h remaining
                        </p>
                      </div>
                    )}

                    {/* Features */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                        Key Features:
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {service.features.slice(0, 3).map((feature, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {feature}
                          </Badge>
                        ))}
                        {service.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{service.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Rating and Reviews */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium text-gray-900">
                            {service.rating}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          ({service.reviews} reviews)
                        </span>
                      </div>
                      {service.isIncluded && (
                        <div className="text-sm text-gray-500">
                          Next billing: {service.nextBilling}
                        </div>
                      )}
                    </div>

                    {/* Technologies */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                        Technologies:
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {service.technologies.slice(0, 3).map((tech, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tech}
                          </Badge>
                        ))}
                        {service.technologies.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{service.technologies.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
                      <div className="flex items-center space-x-2">
                        <Link href={`/services/${service.id}`}>
                          <ModernButton
                            type="secondary"
                            text="View Details"
                            size="sm"
                            icon={ArrowRight}
                          />
                        </Link>
                      </div>
                      <div className="flex items-center space-x-2">
                        {service.isIncluded ? (
                          <ModernButton
                            type="ghost"
                            text="Manage"
                            size="sm"
                            onClick={() =>
          })}
        </div>

        {/* Empty State */}
        {filteredServices.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No services found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filter criteria
            </p>
            <ModernButton
              type="primary"
              text="Browse All Services"
              icon={Plus}
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600">Loading services...</p>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ServicesContent />
    </Suspense>
  );
}
