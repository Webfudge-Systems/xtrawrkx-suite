"use client";

import { useState, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle,
  Clock,
  Star,
  Zap,
  Shield,
  Globe,
  Code,
  Palette,
  BarChart3,
  Cloud,
  Smartphone,
  TrendingUp,
  Target,
  DollarSign,
  ArrowRight,
  Plus,
  Crown,
  ArrowUpRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
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

const SERVICE_CATEGORY_OPTIONS = [
  "All categories",
  ...Array.from(new Set(servicesData.map((s) => s.category))).sort((a, b) =>
    a.localeCompare(b)
  ),
];

function ServicesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const filter = searchParams.get("filter");

  const scopeFilter =
    filter === "included"
      ? "included"
      : filter === "available"
        ? "available"
        : "all";

  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [headerKey, setHeaderKey] = useState(0);

  const setScope = (next) => {
    if (next === "all") router.replace("/services");
    else router.replace(`/services?filter=${next}`);
  };

  const filteredServices = useMemo(() => {
    return servicesData
      .filter((service) => {
        const matchesScope =
          scopeFilter === "all" ||
          (scopeFilter === "included" && service.isIncluded) ||
          (scopeFilter === "available" && !service.isIncluded);
        const matchesCategory =
          categoryFilter === "All categories" ||
          service.category === categoryFilter;
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !q ||
          service.title.toLowerCase().includes(q) ||
          service.description.toLowerCase().includes(q);
        return matchesScope && matchesCategory && matchesSearch;
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
  }, [scopeFilter, categoryFilter, searchQuery, sortBy]);

  const includedServices = servicesData.filter((s) => s.isIncluded);
  const availableServices = servicesData.filter((s) => !s.isIncluded);
  const totalAllocatedHours = includedServices.reduce(
    (sum, s) => sum + (s.allocatedHours || 0),
    0
  );
  const totalUsedHours = includedServices.reduce(
    (sum, s) => sum + (s.usedHours || 0),
    0
  );
  const totalRemainingHours = Math.max(
    0,
    totalAllocatedHours - totalUsedHours
  );
  const usagePct =
    totalAllocatedHours > 0
      ? Math.round((totalUsedHours / totalAllocatedHours) * 100)
      : 0;

  const pageTitle =
    filter === "included"
      ? "Included services"
      : filter === "available"
        ? "Available services"
        : "My services";

  const pageSubtitle =
    filter === "included"
      ? "Work covered on your X3 plan and how hours are tracking."
      : filter === "available"
        ? "Optional services you can add when you move to X4."
        : "Plan summary, hours, and every service in one place.";

  const kpiRows = useMemo(() => {
    if (scopeFilter === "available") {
      return [
        {
          title: "Add-on services",
          value: String(availableServices.length),
          hint: "Unlocked with X4",
          icon: ArrowUpRight,
          color: "bg-purple-50",
          borderColor: "border-purple-200",
          iconColor: "text-purple-600",
          dotColor: "bg-purple-500",
        },
        {
          title: "Est. combined value",
          value: "$9.5k",
          hint: "Per month (sample)",
          icon: DollarSign,
          color: "bg-xtrawrkx-50",
          borderColor: "border-xtrawrkx-200",
          iconColor: "text-xtrawrkx-600",
          dotColor: "bg-xtrawrkx-500",
        },
        {
          title: "Avg. satisfaction",
          value: "4.8",
          hint: "Across add-ons",
          icon: Star,
          color: "bg-green-50",
          borderColor: "border-green-200",
          iconColor: "text-green-600",
          dotColor: "bg-green-500",
        },
        {
          title: "Tier to unlock",
          value: "X4",
          hint: "Scale Member",
          icon: Crown,
          color: "bg-orange-50",
          borderColor: "border-orange-200",
          iconColor: "text-orange-600",
          dotColor: "bg-orange-500",
        },
      ];
    }
    if (scopeFilter === "included") {
      return [
        {
          title: "On your plan",
          value: String(includedServices.length),
          hint: "Included services",
          icon: CheckCircle,
          color: "bg-green-50",
          borderColor: "border-green-200",
          iconColor: "text-green-600",
          dotColor: "bg-green-500",
        },
        {
          title: "Hours used",
          value: `${totalUsedHours}h`,
          hint: `of ${totalAllocatedHours}h allocated`,
          icon: Clock,
          color: "bg-xtrawrkx-50",
          borderColor: "border-xtrawrkx-200",
          iconColor: "text-xtrawrkx-600",
          dotColor: "bg-xtrawrkx-500",
        },
        {
          title: "Usage rate",
          value: `${usagePct}%`,
          hint: "Across included work",
          icon: Target,
          color: "bg-orange-50",
          borderColor: "border-orange-200",
          iconColor: "text-orange-600",
          dotColor: "bg-orange-500",
        },
        {
          title: "Avg. rating",
          value: "4.8",
          hint: "From client reviews",
          icon: Star,
          color: "bg-purple-50",
          borderColor: "border-purple-200",
          iconColor: "text-purple-600",
          dotColor: "bg-purple-500",
        },
      ];
    }
    return [
      {
        title: "Included services",
        value: String(includedServices.length),
        hint: "Active on X3",
        icon: CheckCircle,
        color: "bg-green-50",
        borderColor: "border-green-200",
        iconColor: "text-green-600",
        dotColor: "bg-green-500",
      },
      {
        title: "Hours used",
        value: `${totalUsedHours}h`,
        hint: `of ${totalAllocatedHours}h`,
        icon: Clock,
        color: "bg-xtrawrkx-50",
        borderColor: "border-xtrawrkx-200",
        iconColor: "text-xtrawrkx-600",
        dotColor: "bg-xtrawrkx-500",
      },
      {
        title: "Add-ons available",
        value: String(availableServices.length),
        hint: "Requires X4",
        icon: Star,
        color: "bg-purple-50",
        borderColor: "border-purple-200",
        iconColor: "text-purple-600",
        dotColor: "bg-purple-500",
      },
      {
        title: "Usage rate",
        value: `${usagePct}%`,
        hint: "Plan efficiency",
        icon: Target,
        color: "bg-orange-50",
        borderColor: "border-orange-200",
        iconColor: "text-orange-600",
        dotColor: "bg-orange-500",
      },
    ];
  }, [
    scopeFilter,
    availableServices.length,
    includedServices.length,
    totalUsedHours,
    totalAllocatedHours,
    usagePct,
  ]);

  const resetFilters = () => {
    setCategoryFilter("All categories");
    setSearchQuery("");
    router.replace("/services");
    setHeaderKey((k) => k + 1);
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="px-4 pt-4">
        <PageHeader
          key={headerKey}
          title={pageTitle}
          subtitle={pageSubtitle}
          showSearch
          searchPlaceholder="Search services..."
          onSearchChange={setSearchQuery}
          hasActiveFilters={
            Boolean(searchQuery.trim()) || categoryFilter !== "All categories"
          }
        />
      </div>

      <div className="px-3 mt-6 pb-10">
        <div className="space-y-4 max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiRows.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={stat.title}
                  className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm text-gray-600 mb-1 font-medium truncate">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-black text-gray-800">
                        {stat.value}
                      </p>
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <span
                          className={`w-2 h-2 rounded-full mr-2 shrink-0 ${stat.dotColor}`}
                        />
                        <span className="text-gray-600 font-medium leading-snug">
                          {stat.hint}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-16 h-16 shrink-0 ${stat.color} backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border ${stat.borderColor}`}
                    >
                      <IconComponent
                        className={`w-8 h-8 ${stat.iconColor}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {scopeFilter !== "available" ? (
            <Card
              variant="outlined"
              title="Your membership"
              subtitle="XEN · Growth Member (X3)"
              actions={
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Plan hours
                  </p>
                  <p className="text-2xl font-bold text-gray-900 leading-tight">
                    {totalAllocatedHours}h
                  </p>
                  <p className="text-sm text-green-600 font-semibold mt-0.5">
                    {totalRemainingHours}h remaining
                  </p>
                </div>
              }
            >
              <div className="flex flex-wrap items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center shadow-md shrink-0">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm text-gray-600 max-w-3xl flex-1 min-w-[200px]">
                  {scopeFilter === "included"
                    ? "Each row below is part of your subscription. Hours show how much of this service’s allocation you have already used."
                    : "You have five core services on X3. Use the tabs to focus on included work or browse add-ons. Open any card for the full breakdown."}
                </p>
              </div>
            </Card>
          ) : (
            <Card
              variant="outlined"
              title="Unlock with X4"
              subtitle="Scale Member · broader catalog"
              actions={
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Add-ons
                  </p>
                  <p className="text-2xl font-bold text-gray-900 leading-tight">
                    {availableServices.length}
                  </p>
                  <p className="text-sm text-purple-600 font-semibold mt-0.5">
                    With upgrade
                  </p>
                </div>
              }
            >
              <div className="flex flex-wrap items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-md shrink-0">
                  <ArrowUpRight className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm text-gray-600 max-w-3xl flex-1 min-w-[200px]">
                  These services are not on X3. Request details or upgrade to
                  allocate hours and start delivery.
                </p>
              </div>
            </Card>
          )}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl p-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 flex-1 min-w-0">
              {[
                { key: "all", label: "All", count: servicesData.length },
                {
                  key: "included",
                  label: "Included",
                  count: includedServices.length,
                },
                {
                  key: "available",
                  label: "Add-ons",
                  count: availableServices.length,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setScope(tab.key)}
                  className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap shrink-0 ${
                    scopeFilter === tab.key
                      ? "bg-xtrawrkx-500 text-white shadow-lg"
                      : "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 border border-white/40"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${
                      scopeFilter === tab.key
                        ? "bg-white/30 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-white/40 bg-white/90 px-3 py-2 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/30 min-w-[160px]"
                aria-label="Filter by category"
              >
                {SERVICE_CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-white/40 bg-white/90 px-3 py-2 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/30"
                aria-label="Sort services"
              >
                <option value="name">Sort: Name</option>
                <option value="price">Sort: Price</option>
                <option value="rating">Sort: Rating</option>
                <option value="status">Sort: Status</option>
              </select>

              {scopeFilter === "available" ? (
                <button
                  type="button"
                  className="px-4 py-2 bg-xtrawrkx-500 text-white rounded-xl text-sm font-semibold hover:bg-xtrawrkx-600 transition-colors shadow-md whitespace-nowrap"
                  onClick={() => {}}
                >
                  Upgrade to X4
                </button>
              ) : (
                <Link
                  href="/services?filter=available"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl hover:bg-white/30 text-sm font-medium text-gray-900 transition-all shadow-md whitespace-nowrap"
                >
                  Browse add-ons
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredServices.map((service) => {
              const Icon = service.icon;
              const hoursPct =
                service.isIncluded && service.allocatedHours
                  ? Math.min(
                      100,
                      Math.round(
                        (service.usedHours / service.allocatedHours) * 100
                      )
                    )
                  : 0;
              const planLabel = service.isIncluded
                ? "Included in X3"
                : "Add-on (X4)";
              const planTone = service.isIncluded
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-gray-100 text-gray-800 border-gray-200";

              return (
                <div
                  key={service.id}
                  className="group rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] flex flex-col h-full min-h-[320px]"
                >
                  <div className="flex gap-3">
                    <div
                      className={`w-12 h-12 shrink-0 bg-gradient-to-br ${service.color} rounded-xl flex items-center justify-center shadow-md`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-gray-900 leading-snug">
                        {service.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {service.category}
                        <span className="text-gray-300 mx-1.5">·</span>
                        <span className="text-gray-600">
                          {service.duration}
                        </span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500">
                        {service.isIncluded ? "Plan" : "From"}
                      </p>
                      <p className="text-base font-bold text-gray-900 whitespace-nowrap">
                        {service.price}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${planTone}`}
                    >
                      {planLabel}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      {service.rating}{" "}
                      <span className="text-gray-400">
                        ({service.reviews} reviews)
                      </span>
                    </span>
                    {service.isIncluded && service.nextBilling && (
                      <span className="text-xs text-gray-500">
                        Next billing{" "}
                        <span className="font-medium text-gray-700">
                          {service.nextBilling}
                        </span>
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-3">
                    {service.description}
                  </p>

                  <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/90 p-3 min-h-[5.5rem] flex flex-col justify-center">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                      <span>
                        {service.isIncluded
                          ? "Hours on this service"
                          : "Hours"}
                      </span>
                      <span className="tabular-nums text-gray-600">
                        {service.isIncluded
                          ? `${service.usedHours} / ${service.allocatedHours} h`
                          : "Not allocated"}
                      </span>
                    </div>
                    {service.isIncluded ? (
                      <>
                        <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${service.color}`}
                            style={{ width: `${hoursPct}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">
                          {service.remainingHours}h left for this line item
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500 mt-2 leading-snug">
                        Hours are assigned after you add the service to your
                        plan. Open details to request scope and pricing.
                      </p>
                    )}
                  </div>

                  <div className="mt-4">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Highlights
                    </p>
                    <p className="text-sm text-gray-700 leading-snug">
                      {service.features.slice(0, 3).join(" · ")}
                      {service.features.length > 3 &&
                        ` · +${service.features.length - 3} more in details`}
                    </p>
                    <p className="text-xs text-gray-500 mt-2 leading-snug">
                      <span className="font-medium text-gray-600">
                        Typical stack:{" "}
                      </span>
                      {service.technologies.join(", ")}
                    </p>
                  </div>

                  <div className="mt-auto pt-4 flex flex-col sm:flex-row gap-2 border-t border-gray-200/80">
                    <Link
                      href={`/services/${service.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/80 border border-gray-200 text-gray-900 hover:bg-white transition-colors"
                    >
                      View details
                      <ArrowRight className="w-4 h-4 opacity-70" />
                    </Link>
                    <Link
                      href={`/services/${service.id}`}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-xtrawrkx-500 text-white hover:bg-xtrawrkx-600 transition-colors shadow-sm"
                    >
                      {service.isIncluded
                        ? "Manage service"
                        : "Explore add-on"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-14 rounded-2xl border border-gray-200 bg-gray-50/50">
              <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-7 w-7 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                No services match
              </h3>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                Try another tab, set category to all types, or clear search.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 bg-xtrawrkx-500 text-white rounded-xl text-sm font-semibold hover:bg-xtrawrkx-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Reset filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="bg-white min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3 text-gray-600">
        <div className="w-8 h-8 border-2 border-xtrawrkx-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading services…</span>
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
