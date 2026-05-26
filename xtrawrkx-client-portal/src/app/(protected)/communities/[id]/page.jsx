"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Calendar,
  MessageCircle,
  Award,
  Share2,
  Bell,
  Plus,
  CheckCircle,
  Target,
  BookOpen,
  Video,
  FileText,
  Download,
} from "lucide-react";
import { ModernButton } from "../../../../components/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import CommunityJoinRequirementsModal from "@/components/communities/CommunityJoinRequirementsModal";
import { getCommunityById, avatarClassFor } from "@/data/communitiesCatalog";
import {
  isPendingSubmissionStatus,
  listActiveMembershipsForClient,
  listSubmissionsForClient,
} from "@/lib/api/communityProgramService";
import { strapiClient } from "@/lib/strapiClient";
import { resolveClientAccountCompanyName } from "@/utils/clientAccountCompany";
import { CommunityChannelChat } from "@/components/chat/CommunityChannelChat";

/** Rich sections — sample content until wired to Strapi events/resources APIs. */
const DETAIL_TEMPLATE = {
  upcomingEvents: [
    {
      id: 1,
      title: "Weekly Networking Mixer",
      date: "2024-03-15",
      time: "6:00 PM",
      type: "Networking",
      attendees: 45,
      location: "Virtual",
      description: "Connect with fellow entrepreneurs and share experiences",
    },
    {
      id: 2,
      title: "Pitch Deck Workshop",
      date: "2024-03-20",
      time: "2:00 PM",
      type: "Workshop",
      attendees: 23,
      location: "Virtual",
      description: "Learn how to create compelling pitch decks",
    },
    {
      id: 3,
      title: "Investor Panel Discussion",
      date: "2024-03-25",
      time: "7:00 PM",
      type: "Panel",
      attendees: 67,
      location: "Virtual",
      description: "Q&A session with successful investors",
    },
  ],
  recentDiscussions: [
    {
      id: 1,
      title: "Best practices for startup funding",
      author: "Sarah Johnson",
      authorAvatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b47e?w=32&h=32&fit=crop&crop=face",
      replies: 12,
      lastActivity: "2 hours ago",
      category: "Funding",
    },
    {
      id: 2,
      title: "Co-founder equity split advice",
      author: "Mike Chen",
      authorAvatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
      replies: 8,
      lastActivity: "4 hours ago",
      category: "Legal",
    },
    {
      id: 3,
      title: "Marketing strategies for early-stage startups",
      author: "Emily Davis",
      authorAvatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face",
      replies: 15,
      lastActivity: "6 hours ago",
      category: "Marketing",
    },
  ],
  successStories: [
    {
      id: 1,
      title: "From Idea to $1M Series A",
      author: "Alex Rodriguez",
      company: "TechFlow Solutions",
      description: "How I raised my first million in just 6 months",
      readTime: "5 min read",
      publishedDate: "2024-03-10",
    },
    {
      id: 2,
      title: "Building a Remote-First Company",
      author: "Lisa Wang",
      company: "RemoteWork Pro",
      description: "Lessons learned from scaling a distributed team",
      readTime: "8 min read",
      publishedDate: "2024-03-08",
    },
  ],
  resources: [
    {
      id: 1,
      title: "Startup Funding Guide",
      type: "PDF",
      size: "2.4 MB",
      downloads: 234,
      description: "Complete guide to startup funding options",
    },
    {
      id: 2,
      title: "Pitch Deck Template",
      type: "PPTX",
      size: "1.8 MB",
      downloads: 189,
      description: "Professional pitch deck template",
    },
    {
      id: 3,
      title: "Business Plan Template",
      type: "DOCX",
      size: "3.2 MB",
      downloads: 156,
      description: "Comprehensive business plan template",
    },
  ],
};

/**
 * Same visual system as dashboard stats (`dashboard/page.jsx`):
 * glass card, title + font-black value, dot + change row, tinted icon tile.
 */
function CommunityKpiCard({
  title,
  value,
  change,
  changeType = "increase",
  icon: IconComponent,
  configIndex,
}) {
  const statConfig = [
    {
      color: "bg-xtrawrkx-50",
      borderColor: "border-xtrawrkx-200",
      iconColor: "text-xtrawrkx-600",
      dotColor: "bg-xtrawrkx-500",
    },
    {
      color: "bg-green-50",
      borderColor: "border-green-200",
      iconColor: "text-green-600",
      dotColor: "bg-green-500",
    },
    {
      color: "bg-purple-50",
      borderColor: "border-purple-200",
      iconColor: "text-purple-600",
      dotColor: "bg-purple-500",
    },
    {
      color: "bg-orange-50",
      borderColor: "border-orange-200",
      iconColor: "text-orange-600",
      dotColor: "bg-orange-500",
    },
  ];

  const config = statConfig[configIndex % statConfig.length];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-black text-gray-800">{value}</p>
          <div className="mt-2 flex flex-wrap items-center text-xs text-gray-500">
            <span
              className={`mr-2 h-2 w-2 shrink-0 rounded-full ${config.dotColor}`}
            />
            <span
              className={
                changeType === "increase"
                  ? "font-medium text-green-600"
                  : "font-medium text-red-600"
              }
            >
              {change}
            </span>
            {change !== "0" && (
              <span className="ml-1">this period</span>
            )}
          </div>
        </div>
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border ${config.color} ${config.borderColor} shadow-lg backdrop-blur-md`}
        >
          <IconComponent className={`h-8 w-8 ${config.iconColor}`} />
        </div>
      </div>
    </div>
  );
}

export default function CommunityDetailPage() {
  const params = useParams();
  const id = Number(params?.id);

  const base = useMemo(() => {
    if (!Number.isFinite(id)) return null;
    return getCommunityById(id);
  }, [id]);

  const [activeTab, setActiveTab] = useState("overview");
  const [isMember, setIsMember] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [clientAccountId, setClientAccountId] = useState(null);
  const [accountDefaults, setAccountDefaults] = useState({});
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const accId = strapiClient.getCurrentAccountId();
      if (!cancelled) setClientAccountId(accId);

      if (typeof window !== "undefined" && accId) {
        const raw = localStorage.getItem("client_account");
        if (raw) {
          try {
            const acc = JSON.parse(raw);
            const attrs = acc.attributes || acc;
            if (!cancelled) {
              setAccountDefaults({
                company:
                  resolveClientAccountCompanyName(acc) ||
                  resolveClientAccountCompanyName(attrs),
                jobTitle: attrs.jobTitle || acc.jobTitle || "",
                phone: attrs.phone || acc.phone || "",
              });
            }
          } catch {
            /* ignore */
          }
        }
      }

      if (!accId || !base) return;

      const [memberships, submissions] = await Promise.all([
        listActiveMembershipsForClient(accId),
        listSubmissionsForClient(accId),
      ]);
      if (cancelled) return;
      setIsMember(memberships.some((m) => m.community === base.strapiEnum));
      setIsPending(
        submissions.some(
          (s) =>
            s.community === base.strapiEnum &&
            isPendingSubmissionStatus(s.status)
        )
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [base]);

  const communityData = useMemo(() => {
    if (!base) return null;
    return {
      ...DETAIL_TEMPLATE,
      ...base,
      description: `${base.description}. Connect with peers, join events, and access resources tailored to this vertical.`,
      tags:
        base.tags.length >= 4 ? base.tags : [...base.tags, "Innovation"],
      isMember,
      userTierName: isMember
        ? base.userTierName || "Member"
        : "Guest",
      canUpgrade: isMember && Boolean(base.canUpgrade),
      memberSince: isMember ? "Active" : isPending ? "Pending approval" : "—",
    };
  }, [base, isMember, isPending]);

  if (!base || !communityData) {
    notFound();
  }

  const headAvatarClass = avatarClassFor(communityData.color);

  const tabs = [
    { id: "overview", label: "Overview", icon: Target },
    { id: "events", label: "Events", icon: Calendar },
    { id: "discussions", label: "Discussions", icon: MessageCircle },
    { id: "resources", label: "Resources", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-50/90">
      {/* Header — title & actions */}
      <div className="border-b border-gray-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link href="/communities" className="shrink-0">
                <ModernButton
                  type="secondary"
                  size="sm"
                  text="Back to Communities"
                  icon={ArrowLeft}
                />
              </Link>
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-gray-900/10 ${headAvatarClass}`}
                >
                  <span className="text-2xl font-bold text-white">
                    {communityData.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    {communityData.name}
                  </h1>
                  <p className="mt-0.5 text-sm text-gray-600 sm:text-base">
                    {communityData.fullName}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!communityData.isMember && !isPending ? (
                <ModernButton
                  type="gradient"
                  size="sm"
                  text="Join community"
                  icon={Plus}
                  onClick={() => setJoinModalOpen(true)}
                />
              ) : null}
              {isPending && !communityData.isMember ? (
                <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900">
                  Approval pending
                </span>
              ) : null}
              <ModernButton
                type="secondary"
                size="sm"
                text="Notifications"
                icon={Bell}
              />
              <ModernButton
                type="secondary"
                size="sm"
                text="Share"
                icon={Share2}
              />
              <ModernButton
                type="gradient"
                size="sm"
                text="Create Post"
                icon={Plus}
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPIs — match dashboard stats grid */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl space-y-4 p-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <CommunityKpiCard
              title="Total members"
              value={communityData.members.toLocaleString()}
              change="All active members"
              changeType="increase"
              icon={Users}
              configIndex={0}
            />
            <CommunityKpiCard
              title="Events this month"
              value={String(communityData.monthlyEvents)}
              change="Scheduled in calendar"
              changeType="increase"
              icon={Calendar}
              configIndex={1}
            />
            <CommunityKpiCard
              title="Active discussions"
              value={String(communityData.activeDiscussions)}
              change="Open conversations"
              changeType="increase"
              icon={MessageCircle}
              configIndex={2}
            />
            <CommunityKpiCard
              title="Success stories"
              value={Number(
                communityData.successStoriesCount || 0
              ).toLocaleString()}
              change="Community highlights"
              changeType="increase"
              icon={Award}
              configIndex={3}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="mb-6 text-center">
                <div
                  className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl shadow-md ${headAvatarClass}`}
                >
                  <span className="text-3xl font-bold text-white">
                    {communityData.name.charAt(0)}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {communityData.name}
                </h3>
                <p className="text-sm text-gray-500">{communityData.category}</p>
                <div className="mt-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/60">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {communityData.userTierName}
                  </span>
                </div>
              </div>

              <dl className="space-y-0 divide-y divide-gray-100 rounded-xl bg-slate-50/50 px-3 py-1">
                <div className="flex items-center justify-between gap-3 py-3 text-sm">
                  <dt className="text-gray-500">Member since</dt>
                  <dd className="font-medium text-gray-900">
                    {communityData.memberSince}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-3 text-sm">
                  <dt className="text-gray-500">Tier</dt>
                  <dd className="font-medium text-gray-900">
                    {communityData.tier}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-3 text-sm">
                  <dt className="text-gray-500">Status</dt>
                  <dd className="font-semibold text-emerald-600">
                    {communityData.status}
                  </dd>
                </div>
              </dl>

              {communityData.canUpgrade && (
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <ModernButton
                    type="gradient"
                    size="sm"
                    text={`Upgrade to ${communityData.nextTierName}`}
                    className="w-full"
                  />
                </div>
              )}

              <div className="mt-6 border-t border-gray-100 pt-6">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Benefits
                </h4>
                <ul className="space-y-3">
                  {communityData.benefits.map((benefit, index) => (
                    <li
                      key={index}
                      className="flex gap-2.5 text-sm leading-snug text-gray-600"
                    >
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm ring-1 ring-gray-100">
              <div className="p-4 sm:p-5">
                <nav
                  className="flex flex-wrap gap-3"
                  aria-label="Community sections"
                >
                  {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex min-w-[7.5rem] flex-1 items-center justify-center gap-2 rounded-2xl border border-white/30 bg-gradient-to-br from-white/70 to-white/40 px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur-xl transition-all duration-300 sm:flex-initial sm:justify-start ${
                          isActive
                            ? "text-gray-900 ring-2 ring-xtrawrkx-400/45 shadow-2xl"
                            : "text-gray-600 hover:text-gray-900 hover:shadow-2xl"
                        }`}
                      >
                        <IconComponent
                          className={`h-4 w-4 shrink-0 ${isActive ? "text-xtrawrkx-500" : "text-gray-400"}`}
                        />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-gray-100 px-5 py-6 sm:px-7 sm:py-8">
                {activeTab === "overview" && (
                  <div className="space-y-8">
                    <section className="rounded-2xl border border-gray-100 bg-gradient-to-br from-slate-50/80 to-white p-6 sm:p-7">
                      <h3 className="text-base font-semibold text-gray-900">
                        About {communityData.name}
                      </h3>
                      <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
                        {communityData.description}
                      </p>
                    </section>

                    <section>
                      <h3 className="mb-3 text-base font-semibold text-gray-900">
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {communityData.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className="mb-4 text-base font-semibold text-gray-900">
                        Recent success stories
                      </h3>
                      <div className="space-y-4">
                        {communityData.successStories.map((story) => (
                          <article
                            key={story.id}
                            className="group relative overflow-hidden rounded-2xl border border-white/30 bg-gradient-to-br from-white/70 to-white/40 p-5 shadow-xl backdrop-blur-xl transition-all duration-300 hover:shadow-2xl"
                          >
                            <div className="sm:flex sm:items-start sm:justify-between sm:gap-6">
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-gray-900 group-hover:text-gray-950">
                                  {story.title}
                                </h4>
                                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                                  {story.description}
                                </p>
                                <p className="mt-3 text-xs text-gray-500">
                                  By {story.author}
                                  <span className="mx-2 text-gray-300">·</span>
                                  {story.company}
                                  <span className="mx-2 text-gray-300">·</span>
                                  {story.readTime}
                                </p>
                              </div>
                              <div className="mt-4 shrink-0 sm:mt-0">
                                <ModernButton
                                  type="secondary"
                                  size="sm"
                                  text="Read"
                                />
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === "events" && (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-base font-semibold text-gray-900">
                        Upcoming events
                      </h3>
                      <ModernButton
                        type="gradient"
                        size="sm"
                        text="Create Event"
                        icon={Plus}
                      />
                    </div>

                    <div className="space-y-3">
                      {communityData.upcomingEvents.map((event) => (
                        <div
                          key={event.id}
                          className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-sm transition hover:border-gray-300 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-semibold text-gray-900">
                                  {event.title}
                                </h4>
                                <span className="inline-flex items-center rounded-lg bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-800 ring-1 ring-sky-100">
                                  {event.type}
                                </span>
                              </div>
                              <p className="text-gray-600 mb-3">
                                {event.description}
                              </p>
                              <div className="flex items-center space-x-6 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  {event.date} at {event.time}
                                </div>
                                <div className="flex items-center">
                                  <Users className="w-4 h-4 mr-1" />
                                  {event.attendees} attendees
                                </div>
                                <div className="flex items-center">
                                  <Video className="w-4 h-4 mr-1" />
                                  {event.location}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <ModernButton
                                type="secondary"
                                size="sm"
                                text="Details"
                              />
                              <ModernButton
                                type="primary"
                                size="sm"
                                text="Join"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "discussions" && (
                  <div className="space-y-4">
                    {isMember ? (
                      <CommunityChannelChat
                        clientAccountId={clientAccountId}
                        communityCatalogId={base?.id}
                        title={`${base?.fullName || base?.name || "Community"} discussion`}
                      />
                    ) : (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-8 text-center">
                        <MessageCircle className="mx-auto mb-3 h-10 w-10 text-gray-400" />
                        <p className="text-sm font-medium text-gray-800">
                          Join this community to use the live discussion chat.
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Messages are shared with the Xtrawrkx team and other
                          members in this program.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "resources" && (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-base font-semibold text-gray-900">
                        Community resources
                      </h3>
                      <ModernButton
                        type="gradient"
                        size="sm"
                        text="Upload Resource"
                        icon={Plus}
                      />
                    </div>

                    <div className="space-y-3">
                      {communityData.resources.map((resource) => (
                        <div
                          key={resource.id}
                          className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow-md"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 ring-1 ring-slate-200/80">
                                <FileText className="h-6 w-6 text-slate-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {resource.title}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {resource.description}
                                </p>
                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                  <span>{resource.type}</span>
                                  <span className="mx-2">•</span>
                                  <span>{resource.size}</span>
                                  <span className="mx-2">•</span>
                                  <span>{resource.downloads} downloads</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                              <ModernButton
                                type="secondary"
                                size="sm"
                                text="Download"
                                icon={Download}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CommunityJoinRequirementsModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        community={base}
        clientAccountId={clientAccountId}
        accountDefaults={accountDefaults}
        onSuccess={() => {
          setIsPending(true);
          setJoinModalOpen(false);
        }}
      />
    </div>
  );
}
