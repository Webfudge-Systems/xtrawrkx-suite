"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  Crown,
  Calendar,
  TrendingUp,
  Plus,
  Grid3X3,
  List,
  MoreVertical,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import CommunityJoinRequirementsModal from "@/components/communities/CommunityJoinRequirementsModal";
import {
  COMMUNITIES_LIST,
  getCommunityById,
  avatarClassFor,
} from "@/data/communitiesCatalog";
import { listActiveMembershipsForClient } from "@/lib/api/communityProgramService";
import { strapiClient } from "@/lib/strapiClient";
import { resolveClientAccountCompanyName } from "@/utils/clientAccountCompany";

const filterOptions = {
  status: ["All", "Member", "Non-Member"],
  tier: ["All", "Standard", "Premium", "Elite"],
  category: [
    "All",
    "Business Division",
    "Investment Division",
    "Tech Division",
    "Creative Division",
  ],
};

export default function CommunitiesPage() {
  const searchParams = useSearchParams();
  const joinPromptConsumed = useRef(false);

  const [joinedEnums, setJoinedEnums] = useState([]);
  const [membershipsLoaded, setMembershipsLoaded] = useState(false);
  const [clientAccountId, setClientAccountId] = useState(null);
  const [accountDefaults, setAccountDefaults] = useState({});
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinTarget, setJoinTarget] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const id = strapiClient.getCurrentAccountId();
      if (!cancelled) setClientAccountId(id);

      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("client_account");
        if (raw) {
          try {
            const acc = JSON.parse(raw);
            const attrs = acc.attributes || acc;
            const onboardingData =
              attrs.onboardingData && typeof attrs.onboardingData === "object"
                ? attrs.onboardingData
                : {};
            setAccountDefaults({
              company:
                resolveClientAccountCompanyName(acc) ||
                resolveClientAccountCompanyName(attrs),
              companyEmail:
                onboardingData.companyEmail ||
                attrs.companyEmail ||
                "",
              jobTitle:
                onboardingData.jobTitle || attrs.jobTitle || acc.jobTitle || "",
              phone:
                onboardingData.phone ||
                attrs.phone ||
                acc.phone ||
                onboardingData.companyPhone ||
                "",
              companyPhone:
                onboardingData.companyPhone ||
                attrs.companyPhone ||
                "",
              industry:
                onboardingData.industry || attrs.industry || acc.industry || "",
              website: onboardingData.website || attrs.website || "",
              companyType:
                onboardingData.companyType || attrs.companyType || "",
              companySubType:
                onboardingData.companySubType || attrs.companySubType || "",
              companyDescription:
                onboardingData.companyDescription || attrs.companyDescription || "",
              addressLine1:
                onboardingData.addressLine1 || attrs.addressLine1 || "",
              addressLine2:
                onboardingData.addressLine2 || attrs.addressLine2 || "",
              city: onboardingData.city || attrs.city || "",
              state: onboardingData.state || attrs.state || "",
              country: onboardingData.country || attrs.country || "",
              postalCode: onboardingData.postalCode || attrs.postalCode || "",
              linkedin: onboardingData.linkedin || attrs.linkedin || "",
              xProfile: onboardingData.xProfile || attrs.xProfile || "",
              interests:
                onboardingData.interests || attrs.interests || "",
              registrationLookingFor:
                onboardingData.lookingFor || attrs.lookingFor || "",
              bio: onboardingData.bio || attrs.bio || "",
            });
          } catch {
            /* ignore */
          }
        }
      }

      if (!id) {
        if (!cancelled) setMembershipsLoaded(true);
        return;
      }

      const rows = await listActiveMembershipsForClient(id);
      if (cancelled) return;
      setJoinedEnums(rows.map((r) => r.community).filter(Boolean));
      setMembershipsLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!membershipsLoaded || joinPromptConsumed.current) return;
    const raw = searchParams.get("join");
    if (!raw) return;
    const c = getCommunityById(raw);
    if (!c || !clientAccountId) return;
    if (joinedEnums.includes(c.strapiEnum)) return;
    joinPromptConsumed.current = true;
    setJoinTarget(c);
    setJoinModalOpen(true);
  }, [membershipsLoaded, joinedEnums, clientAccountId, searchParams]);

  const communitiesData = useMemo(
    () =>
      COMMUNITIES_LIST.map((c) => ({
        ...c,
        isMember: joinedEnums.includes(c.strapiEnum),
      })),
    [joinedEnums]
  );

  const openJoinModal = (community) => {
    setJoinTarget(community);
    setJoinModalOpen(true);
  };

  const handleJoinSuccess = (community) => {
    if (!community?.strapiEnum) return;
    setJoinedEnums((prev) =>
      prev.includes(community.strapiEnum) ? prev : [...prev, community.strapiEnum]
    );
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    status: "All",
    tier: "All",
    category: "All",
  });
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);

  const filteredCommunities = communitiesData.filter((community) => {
    const matchesSearch =
      community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedFilters.status === "All" ||
      (selectedFilters.status === "Member" && community.isMember) ||
      (selectedFilters.status === "Non-Member" && !community.isMember);

    const matchesTier =
      selectedFilters.tier === "All" || community.tier === selectedFilters.tier;
    const matchesCategory =
      selectedFilters.category === "All" ||
      community.category === selectedFilters.category;

    return matchesSearch && matchesStatus && matchesTier && matchesCategory;
  });

  const memberCommunities = communitiesData.filter((c) => c.isMember);
  const totalMembers = communitiesData.reduce((sum, c) => sum + c.members, 0);
  const eventsThisMonth = communitiesData.reduce(
    (sum, c) => sum + c.monthlyEvents,
    0
  );
  const successStoriesTotal = communitiesData.reduce(
    (sum, c) => sum + (c.successStoriesCount ?? 0),
    0
  );

  const tabItems = [
    { key: "All", label: "All", badge: communitiesData.length.toString() },
    {
      key: "Member",
      label: "My communities",
      badge: memberCommunities.length.toString(),
    },
    {
      key: "Non-Member",
      label: "Discover",
      badge: (communitiesData.length - memberCommunities.length).toString(),
    },
  ];

  const setStatusFilter = (status) => {
    setSelectedFilters((prev) => ({ ...prev, status }));
  };

  const hasAdvancedFilters =
    selectedFilters.tier !== "All" || selectedFilters.category !== "All";

  const hasActiveFilters =
    searchTerm.length > 0 ||
    selectedFilters.status !== "All" ||
    hasAdvancedFilters;

  const kpiStats = [
    {
      title: "Total members",
      value: totalMembers.toLocaleString(),
      hint: "Across all communities",
      color: "bg-xtrawrkx-50",
      borderColor: "border-xtrawrkx-200",
      iconColor: "text-xtrawrkx-600",
      dotClass: "bg-xtrawrkx-500",
      icon: Users,
    },
    {
      title: "My communities",
      value: memberCommunities.length.toString(),
      hint: "Active memberships",
      color: "bg-green-50",
      borderColor: "border-green-200",
      iconColor: "text-green-600",
      dotClass: "bg-green-500",
      icon: CheckCircle,
    },
    {
      title: "Events this month",
      value: eventsThisMonth.toString(),
      hint: "Scheduled in network",
      color: "bg-purple-50",
      borderColor: "border-purple-200",
      iconColor: "text-purple-600",
      dotClass: "bg-purple-500",
      icon: Calendar,
    },
    {
      title: "Success stories",
      value: successStoriesTotal.toLocaleString(),
      hint: "Reported wins",
      color: "bg-orange-50",
      borderColor: "border-orange-200",
      iconColor: "text-orange-600",
      dotClass: "bg-orange-500",
      icon: TrendingUp,
    },
  ];

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedFilters({
      status: "All",
      tier: "All",
      category: "All",
    });
    setShowFilters(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 pt-4">
        <PageHeader
          title="Communities"
          subtitle="Connect with like-minded professionals and grow your network"
          breadcrumb={[]}
          showSearch={false}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg group"
              aria-label="Join a community"
            >
              <Plus className="w-5 h-5 text-gray-600 group-hover:text-xtrawrkx-600 transition-colors" />
            </button>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="relative p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg"
              aria-expanded={showFilters}
              aria-label="Toggle filters"
            >
              <Filter className="w-5 h-5 text-gray-600" />
              {(hasAdvancedFilters || searchTerm.length > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white/95 shadow-sm" />
              )}
            </button>
          </div>
        </PageHeader>
      </div>

      <div className="px-3 mt-6 pb-10">
        <div className="space-y-4">
          {/* KPI row — matches Dashboard / Projects / Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiStats.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={stat.title}
                  className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 mb-1 font-medium truncate">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-black text-gray-800 tracking-tight">
                        {stat.value}
                      </p>
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <span
                          className={`w-2 h-2 rounded-full mr-2 shrink-0 ${stat.dotClass}`}
                        />
                        <span className="truncate">{stat.hint}</span>
                      </div>
                    </div>
                    <div
                      className={`w-16 h-16 shrink-0 ${stat.color} backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border ${stat.borderColor}`}
                    >
                      <IconComponent className={`w-8 h-8 ${stat.iconColor}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Toolbar — single glass bar like Projects / Tasks */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl p-3">
            <div className="flex items-center gap-2 flex-1 overflow-x-auto min-w-0">
              {tabItems.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                    selectedFilters.status === tab.key
                      ? "bg-xtrawrkx-500 text-white shadow-lg"
                      : "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 border border-white/40"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${
                      selectedFilters.status === tab.key
                        ? "bg-white/30 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 justify-end flex-wrap">
              <div className="relative w-full min-w-[200px] sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  type="search"
                  placeholder="Search communities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/30 focus:border-xtrawrkx-500 focus:bg-white/90 transition-all duration-300 placeholder:text-gray-500 shadow-sm"
                />
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`w-10 h-10 rounded-full backdrop-blur-sm border transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center ${
                    viewMode === "grid"
                      ? "bg-xtrawrkx-500 text-white border-xtrawrkx-500/50"
                      : "bg-white/80 text-gray-700 border-white/40 hover:bg-white/90"
                  }`}
                  title="Grid view"
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`w-10 h-10 rounded-full backdrop-blur-sm border transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center ${
                    viewMode === "list"
                      ? "bg-xtrawrkx-500 text-white border-xtrawrkx-500/50"
                      : "bg-white/80 text-gray-700 border-white/40 hover:bg-white/90"
                  }`}
                  title="List view"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showFilters ? (
              <motion.div
                key="filters"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-xl"
              >
                <div className="p-4 sm:p-5 border-b border-white/30 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-800">
                    Refine by tier and category
                  </p>
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-sm font-medium text-xtrawrkx-600 hover:text-xtrawrkx-700"
                    >
                      Clear all
                    </button>
                  ) : null}
                </div>
                <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Tier
                    </label>
                    <select
                      value={selectedFilters.tier}
                      onChange={(e) =>
                        setSelectedFilters((p) => ({
                          ...p,
                          tier: e.target.value,
                        }))
                      }
                      className="w-full py-2.5 px-3 bg-white/90 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/30 focus:border-xtrawrkx-500"
                    >
                      {filterOptions.tier.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Category
                    </label>
                    <select
                      value={selectedFilters.category}
                      onChange={(e) =>
                        setSelectedFilters((p) => ({
                          ...p,
                          category: e.target.value,
                        }))
                      }
                      className="w-full py-2.5 px-3 bg-white/90 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/30 focus:border-xtrawrkx-500"
                    >
                      {filterOptions.category.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Community cards — same glass treatment as Projects grid */}
          {filteredCommunities.length > 0 ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "flex flex-col gap-4"
              }
            >
              {filteredCommunities.map((community, index) => {
                const avatarClass = avatarClassFor(community.color);
                return (
                  <motion.div
                    key={community.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.25) }}
                    className={`rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 ${
                      viewMode === "grid" ? "hover:scale-[1.02]" : ""
                    }`}
                  >
                  {viewMode === "grid" ? (
                    <div className="flex flex-col h-full">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md ${avatarClass}`}
                          >
                            <span className="text-white font-bold text-lg leading-none">
                              {community.name.charAt(0)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {community.name}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">
                              {community.category}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {community.isMember ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Member
                            </span>
                          ) : null}
                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white/60 border border-transparent hover:border-white/40 transition-colors"
                            aria-label="Community options"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                        {community.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {community.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/60 text-gray-800 border border-white/40"
                          >
                            {tag}
                          </span>
                        ))}
                        {community.tags.length > 2 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/60 text-gray-800 border border-white/40">
                            +{community.tags.length - 2}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4 pt-2 border-t border-white/30">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span>
                            {community.members.toLocaleString()} members
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Crown className="w-4 h-4 text-amber-500" />
                          <span className="font-medium text-gray-800">
                            {community.tier}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-auto">
                        {community.isMember ? (
                          <>
                            <Link
                              href={`/communities/${community.id}`}
                              className="inline-flex items-center justify-center px-4 py-2 bg-xtrawrkx-500 text-white rounded-xl text-sm font-semibold hover:bg-xtrawrkx-600 transition-colors shadow-md"
                            >
                              View community
                            </Link>
                            {community.canUpgrade ? (
                              <button
                                type="button"
                                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold border border-xtrawrkx-300 text-xtrawrkx-700 bg-white/50 hover:bg-white/80 transition-colors"
                              >
                                Upgrade
                              </button>
                            ) : null}
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openJoinModal(community)}
                            className="inline-flex flex-1 min-w-[140px] items-center justify-center px-4 py-2 bg-xtrawrkx-500 text-white rounded-xl text-sm font-semibold hover:bg-xtrawrkx-600 transition-colors shadow-md"
                          >
                            Join community
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-md ${avatarClass}`}
                        >
                          <span className="text-white font-bold text-xl leading-none">
                            {community.name.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-xl font-semibold text-gray-900 truncate">
                              {community.name}
                            </h3>
                            {community.isMember ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Member
                              </span>
                            ) : null}
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {community.fullName}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {community.category}
                          </p>
                          <p className="text-gray-600 text-sm mt-3">
                            {community.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {community.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/60 text-gray-800 border border-white/40"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:flex-col lg:items-end shrink-0">
                        <div className="text-sm text-gray-600 space-y-1 lg:text-right">
                          <div className="flex items-center gap-2 lg:justify-end">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span>
                              {community.members.toLocaleString()} members
                            </span>
                          </div>
                          <div className="flex items-center gap-2 lg:justify-end">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>{community.monthlyEvents} events / mo</span>
                          </div>
                          <div className="flex items-center gap-2 lg:justify-end">
                            <Crown className="w-4 h-4 text-amber-500" />
                            <span>{community.tier} tier</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
                          {community.isMember ? (
                            <>
                              <Link
                                href={`/communities/${community.id}`}
                                className="inline-flex items-center justify-center px-4 py-2 bg-xtrawrkx-500 text-white rounded-xl text-sm font-semibold hover:bg-xtrawrkx-600 transition-colors shadow-md"
                              >
                                View community
                              </Link>
                              {community.canUpgrade ? (
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold border border-xtrawrkx-300 text-xtrawrkx-700 bg-white/50 hover:bg-white/80 transition-colors"
                                >
                                  Upgrade
                                </button>
                              ) : null}
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openJoinModal(community)}
                              className="inline-flex items-center justify-center px-4 py-2 bg-xtrawrkx-500 text-white rounded-xl text-sm font-semibold hover:bg-xtrawrkx-600 transition-colors shadow-md"
                            >
                              Join community
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-12 text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No communities found
              </h3>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                Try adjusting search, tabs, or filters
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold border border-white/50 bg-white/70 text-gray-800 hover:bg-white transition-colors shadow-sm"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      <CommunityJoinRequirementsModal
        isOpen={joinModalOpen}
        onClose={() => {
          setJoinModalOpen(false);
          setJoinTarget(null);
        }}
        community={joinTarget}
        clientAccountId={clientAccountId}
        accountDefaults={accountDefaults}
        onSuccess={handleJoinSuccess}
      />
    </div>
  );
}
