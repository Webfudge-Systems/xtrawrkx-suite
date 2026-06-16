"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  LayoutGrid,
  Table2,
  CheckCircle2,
  UserPlus,
} from "lucide-react";
import {
  KPICard,
  Card,
  TabsWithActions,
  Table,
  Button,
  Badge,
  LoadingSpinner,
  ViewToggleGroup,
  ViewToggleButton,
  TableCellTitleSubtitle,
} from "@webfudge/ui";
import { getXenTierByCode } from "@webfudge/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { PortalPageShell } from "@/components/layout/PortalPageShell";
import {
  COMMUNITIES_LIST,
  getCommunityById,
  avatarClassFor,
} from "@/data/communitiesCatalog";
import {
  isPendingSubmissionStatus,
  listActiveMembershipsForClient,
  listSubmissionsForClient,
  fetchCommunityProgramStats,
} from "@/lib/api/communityProgramService";
import { fetchWebsiteEventsCatalog } from "@/lib/websiteEventsService";
import { strapiClient } from "@/lib/strapiClient";

const TAB_KEYS = {
  ALL: "all",
  MEMBER: "member",
  PENDING: "pending",
  DISCOVER: "discover",
};

function membershipTierLabel(communityEnum, membership) {
  if (!membership) return "—";
  const tierCode =
    membership.membershipData?.tier ||
    membership.membershipData?.selectedTier;
  if (communityEnum === "XEN" && tierCode) {
    const tier = getXenTierByCode(tierCode);
    if (tier) return `${tier.tier} · ${tier.name}`;
  }
  return membership.membershipType || "Active";
}

function communityStatusMeta(community) {
  if (community.isMember) {
    return { label: "Member", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (community.isPending) {
    return { label: "Pending approval", className: "bg-amber-50 text-amber-800 border-amber-200" };
  }
  return { label: "Open to join", className: "bg-gray-50 text-gray-700 border-gray-200" };
}

function countEventsThisMonth(events) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return events.filter((event) => {
    if (!event?.date) return false;
    const d = new Date(event.date);
    return !Number.isNaN(d.getTime()) && d.getMonth() === month && d.getFullYear() === year;
  }).length;
}

function CommunityGalleryCard({ community, onJoin }) {
  const avatarClass = avatarClassFor(community.color);
  const status = communityStatusMeta(community);

  return (
    <Card
      variant="elevated"
      className="flex h-full flex-col rounded-xl border border-gray-200 p-5 transition-shadow hover:shadow-md"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm ${avatarClass}`}
          >
            <span className="text-lg font-bold leading-none text-white">
              {community.name.charAt(0)}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-gray-900">
              {community.name}
            </h3>
            <p className="truncate text-sm text-gray-500">{community.category}</p>
          </div>
        </div>
        <Badge className={`shrink-0 border text-xs font-semibold ${status.className}`}>
          {status.label}
        </Badge>
      </div>

      <p className="mb-4 line-clamp-2 flex-1 text-sm text-gray-600">
        {community.description}
      </p>

      {community.tags?.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {community.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mb-4 flex items-center justify-between border-t border-gray-100 pt-3 text-sm text-gray-600">
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-gray-400" />
          <span>{community.memberCount.toLocaleString()} members</span>
        </div>
        {community.isMember && community.userTierLabel ? (
          <span className="text-xs font-medium text-gray-700">{community.userTierLabel}</span>
        ) : null}
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        {community.isMember ? (
          <Link
            href={`/communities/${community.id}`}
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600"
          >
            View community
          </Link>
        ) : community.isPending ? (
          <span className="inline-flex flex-1 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">
            Awaiting approval
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onJoin(community)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600"
          >
            <UserPlus className="h-4 w-4" />
            Join community
          </button>
        )}
      </div>
    </Card>
  );
}

export default function CommunitiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinPromptConsumed = useRef(false);
  const toolbarRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [joinedEnums, setJoinedEnums] = useState([]);
  const [pendingEnums, setPendingEnums] = useState([]);
  const [membershipByEnum, setMembershipByEnum] = useState({});
  const [memberCounts, setMemberCounts] = useState({});
  const [totalNetworkMembers, setTotalNetworkMembers] = useState(0);
  const [eventsThisMonth, setEventsThisMonth] = useState(0);
  const [clientAccountId, setClientAccountId] = useState(null);

  const [activeTab, setActiveTab] = useState(TAB_KEYS.ALL);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState("gallery");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "pending") setActiveTab(TAB_KEYS.PENDING);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const id = strapiClient.getCurrentAccountId();
      if (!cancelled) setClientAccountId(id);

      const statsPromise = fetchCommunityProgramStats();
      const eventsPromise = fetchWebsiteEventsCatalog().catch(() => []);

      if (!id) {
        const [stats, events] = await Promise.all([statsPromise, eventsPromise]);
        if (cancelled) return;
        setMemberCounts(stats.byCommunity || {});
        setTotalNetworkMembers(stats.total || 0);
        setEventsThisMonth(countEventsThisMonth(events));
        setLoading(false);
        return;
      }

      const [membershipRows, submissionRows, stats, events] = await Promise.all([
        listActiveMembershipsForClient(id),
        listSubmissionsForClient(id),
        statsPromise,
        eventsPromise,
      ]);

      if (cancelled) return;

      const activeEnums = membershipRows.map((r) => r.community).filter(Boolean);
      const byEnum = {};
      for (const row of membershipRows) {
        if (row.community) byEnum[row.community] = row;
      }

      setJoinedEnums(activeEnums);
      setMembershipByEnum(byEnum);
      setPendingEnums(
        submissionRows
          .filter((s) => isPendingSubmissionStatus(s.status))
          .map((s) => s.community)
          .filter((c) => c && !activeEnums.includes(c))
      );
      setMemberCounts(stats.byCommunity || {});
      setTotalNetworkMembers(stats.total || 0);
      setEventsThisMonth(countEventsThisMonth(events));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading || joinPromptConsumed.current) return;
    const raw = searchParams.get("join");
    if (!raw) return;
    const c = getCommunityById(raw);
    if (!c || !clientAccountId) return;
    if (joinedEnums.includes(c.strapiEnum) || pendingEnums.includes(c.strapiEnum)) {
      return;
    }
    joinPromptConsumed.current = true;
    router.replace(`/communities/${c.id}/join`);
  }, [loading, joinedEnums, pendingEnums, clientAccountId, searchParams, router]);

  const openJoin = useCallback(
    (community) => {
      router.push(`/communities/${community.id}/join`);
    },
    [router]
  );

  const communitiesData = useMemo(
    () =>
      COMMUNITIES_LIST.map((c) => {
        const membership = membershipByEnum[c.strapiEnum];
        const isMember = joinedEnums.includes(c.strapiEnum);
        const isPending =
          !isMember && pendingEnums.includes(c.strapiEnum);
        return {
          ...c,
          isMember,
          isPending,
          memberCount: memberCounts[c.strapiEnum] ?? 0,
          userTierLabel: isMember
            ? membershipTierLabel(c.strapiEnum, membership)
            : null,
          joinedAt: membership?.joinedAt || null,
        };
      }),
    [joinedEnums, pendingEnums, membershipByEnum, memberCounts]
  );

  const memberCommunities = useMemo(
    () => communitiesData.filter((c) => c.isMember),
    [communitiesData]
  );
  const pendingCommunities = useMemo(
    () => communitiesData.filter((c) => c.isPending),
    [communitiesData]
  );
  const discoverCommunities = useMemo(
    () => communitiesData.filter((c) => !c.isMember && !c.isPending),
    [communitiesData]
  );

  const filteredCommunities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return communitiesData.filter((community) => {
      const matchesTab =
        activeTab === TAB_KEYS.ALL ||
        (activeTab === TAB_KEYS.MEMBER && community.isMember) ||
        (activeTab === TAB_KEYS.PENDING && community.isPending) ||
        (activeTab === TAB_KEYS.DISCOVER &&
          !community.isMember &&
          !community.isPending);

      if (!matchesTab) return false;
      if (!q) return true;

      const haystack = [
        community.name,
        community.fullName,
        community.description,
        community.category,
        ...(community.tags || []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [communitiesData, activeTab, searchQuery]);

  const tabItems = [
    { key: TAB_KEYS.ALL, label: "All", badge: communitiesData.length },
    {
      key: TAB_KEYS.MEMBER,
      label: "My communities",
      badge: memberCommunities.length,
    },
    {
      key: TAB_KEYS.PENDING,
      label: "Pending approval",
      badge: pendingCommunities.length,
    },
    {
      key: TAB_KEYS.DISCOVER,
      label: "Discover",
      badge: discoverCommunities.length,
    },
  ];

  const tableColumns = useMemo(
    () => [
      {
        key: "name",
        label: "COMMUNITY",
        render: (_, row) => (
          <TableCellTitleSubtitle
            title={row.name}
            subtitle={row.fullName || row.category}
          />
        ),
      },
      {
        key: "category",
        label: "DIVISION",
        render: (_, row) => (
          <span className="text-sm text-gray-700">{row.category}</span>
        ),
      },
      {
        key: "status",
        label: "STATUS",
        render: (_, row) => {
          const status = communityStatusMeta(row);
          return (
            <Badge className={`border text-xs font-semibold ${status.className}`}>
              {status.label}
            </Badge>
          );
        },
      },
      {
        key: "members",
        label: "MEMBERS",
        render: (_, row) => (
          <span className="text-sm text-gray-700">
            {row.memberCount.toLocaleString()}
          </span>
        ),
      },
      {
        key: "tier",
        label: "YOUR ACCESS",
        render: (_, row) => (
          <span className="text-sm text-gray-700">
            {row.isMember ? row.userTierLabel || "Active" : "—"}
          </span>
        ),
      },
      {
        key: "actions",
        label: "ACTIONS",
        className: "whitespace-nowrap",
        render: (_, row) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {row.isMember ? (
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-orange-600 hover:bg-orange-50"
                title="View community"
                onClick={() => router.push(`/communities/${row.id}`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            ) : row.isPending ? (
              <span className="px-2 text-xs font-medium text-amber-700">Pending</span>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 px-2 text-orange-600 hover:bg-orange-50"
                title="Join community"
                onClick={() => openJoin(row)}
              >
                <UserPlus className="h-4 w-4" />
                Join
              </Button>
            )}
          </div>
        ),
      },
    ],
    [openJoin, router]
  );

  if (loading) {
    return (
      <PortalPageShell>
        <PageHeader
          title="Communities"
          subtitle="Connect with like-minded professionals and grow your network"
          showSearch={false}
          showActions={false}
        />
        <Card variant="elevated" className="flex justify-center rounded-xl p-12">
          <LoadingSpinner size="lg" message="Loading communities…" />
        </Card>
      </PortalPageShell>
    );
  }

  return (
    <PortalPageShell>
      <PageHeader
        title="Communities"
        subtitle="Connect with like-minded professionals and grow your network"
        showSearch={false}
        showActions={false}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Network members"
          value={totalNetworkMembers.toLocaleString()}
          subtitle="Active across all programs"
          icon={Users}
          colorScheme="orange"
        />
        <KPICard
          title="My communities"
          value={String(memberCommunities.length)}
          subtitle={
            memberCommunities.length === 1
              ? "Active membership"
              : "Active memberships"
          }
          icon={CheckCircle}
          colorScheme="orange"
        />
        <KPICard
          title="Pending approval"
          value={String(pendingCommunities.length)}
          subtitle="Applications under review"
          icon={Clock}
          colorScheme="orange"
        />
        <KPICard
          title="Events this month"
          value={String(eventsThisMonth)}
          subtitle="From the events catalog"
          icon={Calendar}
          colorScheme="orange"
        />
      </div>

      <div className="relative" ref={toolbarRef}>
        <TabsWithActions
          variant="glass"
          tabs={tabItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          afterTabs={
            <ViewToggleGroup aria-label="Community layout">
              <ViewToggleButton
                active={activeView === "gallery"}
                onClick={() => setActiveView("gallery")}
                title="Gallery view"
              >
                <LayoutGrid className="h-[18px] w-[18px]" />
              </ViewToggleButton>
              <ViewToggleButton
                active={activeView === "table"}
                onClick={() => setActiveView("table")}
                title="Table view"
              >
                <Table2 className="h-[18px] w-[18px]" />
              </ViewToggleButton>
            </ViewToggleGroup>
          }
          showSearch
          searchPlaceholder="Search communities..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      <div className="text-sm text-gray-600">
        Showing{" "}
        <span className="font-semibold text-gray-900">
          {filteredCommunities.length}
        </span>{" "}
        result{filteredCommunities.length !== 1 ? "s" : ""}
      </div>

      {filteredCommunities.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-16">
          <CheckCircle2 className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-base font-semibold text-gray-700">No communities found</p>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery
              ? "Try adjusting your search"
              : "Switch tabs or explore programs available to join"}
          </p>
          {searchQuery ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setSearchQuery("")}
            >
              Clear search
            </Button>
          ) : null}
        </div>
      ) : activeView === "table" ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <Table
            columns={tableColumns}
            data={filteredCommunities}
            keyField="id"
            variant="modernEmbedded"
            onRowClick={(row) => {
              if (row.isMember) router.push(`/communities/${row.id}`);
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCommunities.map((community) => (
            <CommunityGalleryCard
              key={community.id}
              community={community}
              onJoin={openJoin}
            />
          ))}
        </div>
      )}

    </PortalPageShell>
  );
}
