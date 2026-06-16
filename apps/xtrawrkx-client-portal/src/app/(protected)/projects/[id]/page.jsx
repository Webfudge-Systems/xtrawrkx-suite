"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  CheckSquare,
  Users,
  FileText,
  Clock,
  CheckCircle2,
  Target,
  AlignLeft,
  TrendingUp,
  Share2,
  RefreshCw,
  Activity,
  IndianRupee,
  FolderOpen,
} from "lucide-react";
import {
  KPICard,
  TabsWithActions,
  Button,
  Card,
  EmptyState,
  LoadingSpinner,
  Avatar,
  InfoRow,
  InfoSection,
  SidebarCardTitle,
  EntityActivityPanel,
  formatRelativeTime,
  PROJECT_STATUS_OPTIONS,
} from "@webfudge/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { PortalPageShell } from "@/components/layout/PortalPageShell";
import ClientProjectDetailMetaBar from "@/components/projects/ClientProjectDetailMetaBar";
import ClientProjectTasksPanel from "@/components/projects/ClientProjectTasksPanel";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import { useSession } from "@/lib/auth";
import { getProjectForClient } from "@/lib/api/clientProjectService";
import { createClientTask } from "@/lib/api/clientTaskService";
import { listCompanyMembers } from "@/lib/api/companyMembersService";
import {
  fetchClientProjectTimeline,
  fetchClientProjectComments,
  addClientProjectComment,
} from "@/lib/api/clientProjectActivityService";

const DETAIL_TABS = [
  { key: "overview", label: "Overview" },
  { key: "tasks", label: "Tasks" },
  { key: "comments", label: "Comments" },
  { key: "activity", label: "Activity" },
  { key: "files", label: "Files" },
];

const headerIconBtnClass =
  "p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg text-brand-text-light";

function getProjectStatusLabel(status) {
  const s = (status || "PLANNING").toUpperCase();
  return PROJECT_STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s.replace(/_/g, " ");
}

function formatShortDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isPresent(value) {
  if (value == null) return false;
  const s = String(value).trim();
  return s.length > 0 && s !== "—";
}

function userLabel(user) {
  return user?.name || user?.username || user?.email || `User ${user?.id}`;
}

function projectStatusHeaderVisual(status) {
  const label = getProjectStatusLabel(status);
  const s = (status || "PLANNING").toUpperCase();
  if (s === "COMPLETED") {
    return {
      pillClass:
        "border border-emerald-300/90 bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-100/90 text-emerald-950 ring-emerald-200/70",
      Icon: CheckCircle2,
      label,
    };
  }
  if (s === "CANCELLED") {
    return {
      pillClass:
        "border border-red-300/90 bg-gradient-to-br from-red-50 via-red-50 to-red-100/90 text-red-950 ring-red-200/70",
      Icon: Target,
      label,
    };
  }
  if (s === "ON_HOLD") {
    return {
      pillClass:
        "border border-violet-300/90 bg-gradient-to-br from-violet-50 via-violet-50 to-violet-100/90 text-violet-950 ring-violet-200/70",
      Icon: Target,
      label,
    };
  }
  if (s === "IN_PROGRESS") {
    return {
      pillClass:
        "border border-orange-300/90 bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100/90 text-orange-950 ring-orange-200/70",
      Icon: Target,
      label,
    };
  }
  if (s === "ACTIVE") {
    return {
      pillClass:
        "border border-cyan-300/90 bg-gradient-to-br from-cyan-50 via-cyan-50 to-cyan-100/90 text-cyan-950 ring-cyan-200/70",
      Icon: Target,
      label,
    };
  }
  if (s === "PLANNING") {
    return {
      pillClass:
        "border border-blue-300/90 bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100/90 text-blue-950 ring-blue-200/70",
      Icon: Target,
      label,
    };
  }
  return {
    pillClass:
      "border border-gray-300/90 bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100/90 text-gray-950 ring-gray-200/70",
    Icon: Target,
    label,
  };
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const projectId = params?.id;

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [crmTimeline, setCrmTimeline] = useState([]);
  const [crmTimelineLoading, setCrmTimelineLoading] = useState(false);
  const [crmTimelineError, setCrmTimelineError] = useState(null);
  const [crmTimelineTotal, setCrmTimelineTotal] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [projectChatMessages, setProjectChatMessages] = useState([]);
  const [projectChatLoading, setProjectChatLoading] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [clientMembers, setClientMembers] = useState([]);

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getProjectForClient(projectId);
      setProject(data);
    } catch (e) {
      setError(e.message || "Failed to load project");
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const m = await listCompanyMembers();
        if (!cancelled) setClientMembers(m?.data || []);
      } catch {
        if (!cancelled) setClientMembers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const reloadProjectTimeline = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    const apiProjectId = project?.slug || project?.id;
    if (!apiProjectId) return;
    if (!silent) {
      setCrmTimelineLoading(true);
      setCrmTimelineError(null);
      setProjectChatLoading(true);
    }
    try {
      const [{ data, total }, commentsRes] = await Promise.all([
        fetchClientProjectTimeline({ projectId: apiProjectId, limit: 80, type: "activity" }),
        fetchClientProjectComments({ projectId: apiProjectId, limit: 80 }),
      ]);
      const rows = Array.isArray(data) ? data : [];
      const commentRows = Array.isArray(commentsRes?.data) ? commentsRes.data : [];
      setCrmTimeline(rows);
      setCrmTimelineTotal(typeof total === "number" ? total : rows.length);
      setProjectChatMessages([...commentRows].reverse());
      setCommentCount(
        typeof commentsRes?.total === "number"
          ? commentsRes.total
          : commentRows.length
      );
    } catch (e) {
      if (!silent) {
        setCrmTimelineError(e?.message || "Could not load activities");
        setCrmTimeline([]);
        setCrmTimelineTotal(0);
        setCommentCount(0);
        setProjectChatMessages([]);
      }
    } finally {
      if (!silent) {
        setCrmTimelineLoading(false);
        setProjectChatLoading(false);
      }
    }
  }, [project?.id, project?.slug]);

  useEffect(() => {
    if (!project?.id || loading) return;
    reloadProjectTimeline({ silent: false });
  }, [project?.id, project?.slug, loading, reloadProjectTimeline]);

  useEffect(() => {
    if (!project?.id || loading) return;
    if (activeTab === "comments" || activeTab === "overview") {
      reloadProjectTimeline({ silent: true });
    }
  }, [activeTab, project?.id, project?.slug, loading, reloadProjectTimeline]);

  const refreshAll = useCallback(() => {
    loadProject();
    reloadProjectTimeline({ silent: false });
  }, [loadProject, reloadProjectTimeline]);

  const handleAddProjectComment = useCallback(
    async ({ entityId, comment }) => {
      const res = await addClientProjectComment({ projectId: entityId, comment });
      const newMsg = res?.data;
      if (newMsg) {
        setProjectChatMessages((prev) => {
          const newId = newMsg.id ?? newMsg.documentId;
          if (newId != null && prev.some((m) => (m.id ?? m.documentId) === newId)) return prev;
          return [...prev, newMsg];
        });
      }
      await reloadProjectTimeline({ silent: true });
      return res;
    },
    [reloadProjectTimeline],
  );

  const composerAvatarFallback = useMemo(() => {
    const name =
      session?.contact?.firstName && session?.contact?.lastName
        ? `${session.contact.firstName} ${session.contact.lastName}`
        : session?.account?.companyName || session?.contact?.email?.split("@")[0] || "You";
    const parts = String(name).split(/[\s._-]/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (String(name).slice(0, 2) || "Y").toUpperCase();
  }, [session]);

  const activityCount = typeof crmTimelineTotal === "number" ? crmTimelineTotal : crmTimeline.length;

  const lastActivityDisplay = useMemo(() => {
    const first = crmTimeline?.[0]?.createdAt;
    if (first) return formatRelativeTime(first) || "—";
    return project?.updatedAt ? formatRelativeTime(project.updatedAt) : "—";
  }, [crmTimeline, project?.updatedAt]);

  const projectTasks = useMemo(() => project?.tasks || [], [project]);

  const taskStats = useMemo(() => {
    if (!project) return { total: 0, completed: 0, inProgress: 0, progress: 0 };
    const total = projectTasks.length;
    const completed = projectTasks.filter((t) =>
      ["COMPLETED", "DONE", "APPROVED"].includes((t.strapiStatus || "").toUpperCase()),
    ).length;
    const inProgress = projectTasks.filter((t) =>
      ["IN_PROGRESS", "ACTIVE"].includes((t.strapiStatus || "").toUpperCase()),
    ).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : project.progress ?? 0;
    return { total, completed, inProgress, progress };
  }, [project, projectTasks]);

  const handleCreateTask = useCallback(
    async (taskInput) => {
      if (!project?.id) return;
      const priority = (taskInput.priority || "medium").toLowerCase();
      await createClientTask({
        name: taskInput.title,
        description: taskInput.description || "",
        projects: { set: [String(taskInput.projectId || project.id)] },
        scheduledDate: taskInput.dueDate ? new Date(`${taskInput.dueDate}T00:00:00`).toISOString() : null,
        priority: priority === "urgent" ? "high" : priority,
      });
      await loadProject();
    },
    [loadProject, project?.id],
  );

  const visibleCommentCount = projectChatMessages.length || commentCount;

  const tabsWithBadges = useMemo(
    () =>
      DETAIL_TABS.map((tab) => ({
        ...tab,
        badge:
          tab.key === "tasks"
            ? projectTasks.length || undefined
            : tab.key === "comments" && visibleCommentCount
              ? visibleCommentCount
              : undefined,
        badgeCount:
          tab.key === "activity" && activityCount ? activityCount : undefined,
      })),
    [projectTasks.length, visibleCommentCount, activityCount]
  );

  if (loading) {
    return (
      <PortalPageShell>
        <PageHeader title="Loading..." subtitle="Project details" showActions={false} />
        <Card variant="elevated" className="flex justify-center rounded-xl p-12">
          <LoadingSpinner message="Loading project..." />
        </Card>
      </PortalPageShell>
    );
  }

  if (!project || error) {
    return (
      <PortalPageShell>
        <PageHeader title="Project not found" subtitle={error || "This project may have been removed"} showActions={false} />
        <Card variant="elevated" className="rounded-xl p-12 text-center">
          <p className="text-gray-600">{error || "This project may have been deleted or moved."}</p>
          <Button type="button" variant="primary" className="mt-4" onClick={() => router.push("/projects")}>
            Back to projects
          </Button>
        </Card>
      </PortalPageShell>
    );
  }

  const statusVisual = projectStatusHeaderVisual(project.strapiStatus);
  const StatusIcon = statusVisual.Icon;
  const breadcrumbItems = [
    { label: "Portal", href: "/dashboard" },
    { label: "Projects", href: "/projects" },
    { label: project.name, href: `/projects/${project.slug || project.id}` },
  ];

  const projectApiId = project?.slug || project?.id;

  const discussionPanelProps = {
    entityType: "project",
    entityId: projectApiId,
    entityName: project.name,
    crmTimeline,
    crmTimelineLoading,
    crmTimelineError,
    activityCount,
    fetchCommentsFn: ({ entityId }) => fetchClientProjectComments({ projectId: entityId, limit: 80 }),
    addCommentFn: handleAddProjectComment,
    composerAvatarFallback,
    chatFooterBadgeText: "Messages are saved on this project for your team.",
    className: "w-full",
    sharedChatMessages: projectChatMessages,
    onSharedChatMessagesChange: setProjectChatMessages,
    sharedChatLoading: projectChatLoading,
    onSharedChatReload: () => reloadProjectTimeline({ silent: true }),
  };

  return (
    <PortalPageShell>
      <div className="space-y-3">
        <PageHeader
          title={project.name}
          breadcrumb={breadcrumbItems}
          showProfile
          showSearch={false}
          showActions={false}
          onBack={() => router.push("/projects")}
        >
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              className={headerIconBtnClass}
              title="Copy link"
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
            >
              <Share2 className="h-5 w-5" />
            </button>
            <button type="button" className={headerIconBtnClass} title="Refresh" onClick={refreshAll}>
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </PageHeader>

        <ClientProjectDetailMetaBar project={project} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard compact title="Total tasks" value={taskStats.total} icon={CheckSquare} colorScheme="orange" />
        <KPICard compact title="Completed" value={taskStats.completed} icon={CheckCircle2} colorScheme="orange" />
        <KPICard compact title="Progress" value={`${taskStats.progress}%`} icon={TrendingUp} colorScheme="orange" />
        <KPICard compact title="Team" value={(project.team || []).length} icon={Users} colorScheme="orange" />
      </div>

      <TabsWithActions variant="pill" tabs={tabsWithBadges} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card variant="elevated" className="rounded-xl">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 pr-2">
                  <h2 className="text-xl font-semibold text-gray-900">Project information</h2>
                  <p className="mt-1.5 text-base text-gray-500">
                    Scope, timeline, ownership, and how work is tracking.
                  </p>
                </div>
                <span
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-widest shadow-md ring-2 ${statusVisual.pillClass}`}
                  role="status"
                >
                  <StatusIcon className="h-5 w-5 shrink-0 opacity-90" strokeWidth={2.25} aria-hidden />
                  {statusVisual.label}
                </span>
              </div>
              <div className="space-y-5">
                <InfoSection title="Key info" icon={Target} isFirst>
                  <div className="mb-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                    <InfoRow
                      label="Owner"
                      value={project.projectManager ? userLabel(project.projectManager) : ""}
                    />
                    <InfoRow label="Start date" value={formatShortDate(project.startDate)} icon={Calendar} />
                    <InfoRow label="Due date" value={formatShortDate(project.endDate)} icon={Clock} />
                  </div>
                </InfoSection>

                <section className="border-t border-gray-100 pt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <AlignLeft className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">About</h3>
                  </div>
                  {isPresent(project.description) ? (
                    <p className="mt-2.5 whitespace-pre-wrap text-base font-normal leading-relaxed text-gray-800">
                      {project.description}
                    </p>
                  ) : (
                    <p className="mt-2.5 text-base font-normal text-gray-400">—</p>
                  )}
                </section>
              </div>
            </Card>

            <Card variant="elevated" className="rounded-xl">
              <div className="mb-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Team members</h2>
                    <p className="mt-1.5 text-base text-gray-500">
                      People assigned to deliver work on this project.
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                    {(project.team || []).length}
                  </span>
                </div>
              </div>
              {(project.team || []).length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No team members"
                  description="Team members will appear here when assigned to this project."
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {project.team.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
                    >
                      <Avatar
                        fallback={(member.initials || member.name || "U").charAt(0).toUpperCase()}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{userLabel(member)}</p>
                        <p className="truncate text-xs text-gray-500">
                          {member.role || member.email || "Team member"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <Card variant="elevated" className="rounded-xl">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Project owner</h2>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar
                    fallback={
                      project.projectManager
                        ? (project.projectManager.initials || userLabel(project.projectManager))
                            .slice(0, 2)
                            .toUpperCase()
                        : "?"
                    }
                    alt={project.projectManager ? userLabel(project.projectManager) : "Unassigned"}
                    size="lg"
                    className="shrink-0 !bg-brand-primary font-semibold text-white shadow-sm ring-2 ring-brand-primary/25"
                  />
                  <p className="min-w-0 flex-1 truncate text-base font-semibold text-gray-900">
                    {project.projectManager ? userLabel(project.projectManager) : "Unassigned"}
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="elevated" className="rounded-xl">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-xl font-semibold text-gray-900">Delivery progress</h2>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ring-orange-200/80 bg-orange-50 text-orange-900">
                  {taskStats.progress}% complete
                </span>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-slate-50 to-gray-50/90 p-4 ring-1 ring-gray-100">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                  <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-stretch sm:gap-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 sm:hidden">Progress</p>
                    <div className="flex min-w-[5.5rem] flex-col items-center justify-center rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-orange-100/90">
                      <span className="text-3xl font-bold tabular-nums leading-none text-orange-700">
                        {taskStats.progress}
                      </span>
                      <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Percent
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="hidden text-xs font-medium uppercase tracking-wide text-gray-500 sm:block">
                      Overall completion
                    </p>
                    <p className="mt-0 text-sm text-gray-600 sm:mt-1">
                      Based on tasks marked complete for this project.
                    </p>
                    <div
                      className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/90 shadow-inner ring-1 ring-gray-100/80"
                      role="progressbar"
                      aria-valuenow={taskStats.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Project completion"
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500 ease-out"
                        style={{ width: `${taskStats.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                <div>
                  <h3 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <CheckSquare className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                    Tasks
                  </h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
                      <p className="text-xs font-medium text-gray-500">Total tasks</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900">{taskStats.total}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
                      <p className="text-xs font-medium text-gray-500">Completed</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900">{taskStats.completed}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-5">
                  <h3 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <FolderOpen className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                    Record &amp; budget
                  </h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
                      <p className="text-xs font-medium text-gray-500">Created</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatShortDate(project.createdAt)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
                      <p className="text-xs font-medium text-gray-500">Updated</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatShortDate(project.updatedAt)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-white px-3.5 py-3 shadow-sm sm:col-span-2">
                      <p className="text-xs font-medium text-gray-500">Budget</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                        {project.budget != null && String(project.budget).trim() !== "" ? (
                          <>
                            <IndianRupee className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                            {project.budget}
                          </>
                        ) : (
                          <span className="font-semibold text-gray-400">—</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {activeTab === "tasks" ? (
        <ClientProjectTasksPanel
          tasks={projectTasks}
          onAddTask={() => setIsCreateTaskModalOpen(true)}
        />
      ) : null}

      {activeTab === "comments" ? (
        <div className="min-w-0">
          <EntityActivityPanel
            key={`project-chat-${projectApiId}`}
            {...discussionPanelProps}
            defaultSubTab="chat"
            minHeightPx={560}
            maxHeightPx={800}
          />
        </div>
      ) : null}

      {activeTab === "activity" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:items-start">
          <Card variant="elevated" className="rounded-xl lg:col-span-2">
            <SidebarCardTitle title="Activity Summary" icon={Activity} />
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50/70 px-3 py-2.5">
                <span className="text-xs font-medium text-orange-700">Total events</span>
                <span className="text-lg font-bold tabular-nums text-orange-900">{activityCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                <span className="text-xs font-medium text-gray-600">Last activity</span>
                <span className="text-xs font-semibold text-gray-800">{lastActivityDisplay}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                <span className="text-xs font-medium text-gray-600">Tasks</span>
                <span className="text-xs font-semibold tabular-nums text-gray-800">{taskStats.total}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                <span className="text-xs font-medium text-gray-600">Completion</span>
                <span className="inline-flex rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-900 ring-1 ring-orange-200/80">
                  {taskStats.progress}%
                </span>
              </div>
            </div>
          </Card>
          <div className="min-w-0 lg:col-span-3">
            <EntityActivityPanel
              key={`project-activity-${project.id}`}
              {...discussionPanelProps}
              defaultSubTab="activity"
              minHeightPx={560}
              maxHeightPx={800}
            />
          </div>
        </div>
      ) : null}

      {activeTab === "files" ? (
        <Card variant="elevated" className="rounded-xl">
          <EmptyState
            icon={FileText}
            title="No files yet"
            description="Project files shared with your account will appear here."
          />
        </Card>
      ) : null}

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        projects={project ? [{ id: project.id, name: project.name }] : []}
        clientMembers={clientMembers}
        defaultProjectId={project?.id}
        onTaskCreate={handleCreateTask}
      />
    </PortalPageShell>
  );
}
