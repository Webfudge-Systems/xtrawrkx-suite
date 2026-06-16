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
  Building2,
  Target,
  AlignLeft,
  TrendingUp,
  Share2,
  RefreshCw,
  FolderOpen,
  Activity,
  MessageSquare,
} from "lucide-react";
import {
  KPICard,
  TabsWithActions,
  Button,
  Card,
  EmptyState,
  LoadingSpinner,
  Avatar,
  ProgressBar,
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

function projectStatusHeaderVisual(status) {
  const label = getProjectStatusLabel(status);
  const s = (status || "PLANNING").toUpperCase();
  if (s === "COMPLETED") {
    return {
      pillClass: "border border-emerald-300/90 bg-gradient-to-br from-emerald-50 to-emerald-100/90 text-emerald-950 ring-emerald-200/70",
      Icon: CheckCircle2,
      label,
    };
  }
  if (s === "IN_PROGRESS" || s === "ACTIVE") {
    return {
      pillClass: "border border-orange-300/90 bg-gradient-to-br from-orange-50 to-orange-100/90 text-orange-950 ring-orange-200/70",
      Icon: Target,
      label,
    };
  }
  if (s === "PLANNING") {
    return {
      pillClass: "border border-blue-300/90 bg-gradient-to-br from-blue-50 to-blue-100/90 text-blue-950 ring-blue-200/70",
      Icon: Target,
      label,
    };
  }
  return {
    pillClass: "border border-gray-300/90 bg-gradient-to-br from-gray-50 to-gray-100/90 text-gray-950 ring-gray-200/70",
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
        projects: { set: [Number(taskInput.projectId || project.id)] },
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card variant="elevated" className="rounded-xl">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">Project information</h2>
                  <p className="mt-1.5 text-base text-gray-500">Scope, timeline, ownership, and how work is tracking.</p>
                </div>
                <span
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-widest shadow-md ring-2 ${statusVisual.pillClass}`}
                  role="status"
                >
                  <StatusIcon className="h-5 w-5 shrink-0 opacity-90" strokeWidth={2.25} aria-hidden />
                  {statusVisual.label}
                </span>
              </div>

              <InfoSection title="Key info" icon={Target} isFirst>
                <div className="mb-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <InfoRow label="Owner" value={project.projectManager?.name || "—"} />
                  <InfoRow label="Organization" icon={Building2} value={project.clientName || "—"} />
                  <InfoRow label="Start date" value={formatShortDate(project.startDate)} icon={Calendar} />
                  <InfoRow label="Due date" value={formatShortDate(project.endDate)} icon={Clock} />
                </div>
              </InfoSection>

              <section className="border-t border-gray-100 pt-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlignLeft className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">About</h3>
                </div>
                {project.description ? (
                  <p className="mt-2.5 whitespace-pre-wrap text-base leading-relaxed text-gray-800">{project.description}</p>
                ) : (
                  <p className="mt-2.5 text-base text-gray-400">—</p>
                )}
              </section>
            </Card>

            <Card variant="elevated" className="rounded-xl">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Team members</h2>
                  <p className="mt-1.5 text-base text-gray-500">People assigned to deliver work on this project.</p>
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                  {(project.team || []).length}
                </span>
              </div>
              {(project.team || []).length === 0 ? (
                <EmptyState icon={Users} title="No team members" description="Team members will appear here when assigned." />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {project.team.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <Avatar
                        src={member.avatar || undefined}
                        fallback={member.initials || (member.name || "U").charAt(0)}
                        size="sm"
                        className="bg-gray-600 text-white"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{member.name}</p>
                        <p className="truncate text-xs text-gray-500">{member.email || "Team member"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <Card variant="elevated" className="rounded-xl">
              <SidebarCardTitle title="Project owner" icon={Users} />
              {project.projectManager ? (
                <div className="flex items-center gap-3">
                  <Avatar
                    src={project.projectManager.avatar || undefined}
                    fallback={project.projectManager.initials}
                    size="md"
                    className="bg-gray-600 text-white"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{project.projectManager.name}</p>
                    <p className="truncate text-sm text-gray-500">{project.projectManager.email || "Project manager"}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Unassigned</p>
              )}
            </Card>

            <Card variant="elevated" className="rounded-xl">
              <SidebarCardTitle title="Delivery progress" icon={TrendingUp} />
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-gray-600">Overall progress</span>
                    <span className="font-bold text-gray-900">{taskStats.progress}%</span>
                  </div>
                  <ProgressBar value={taskStats.progress} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-500">Tasks done</p>
                    <p className="text-lg font-bold text-gray-900">
                      {taskStats.completed}/{taskStats.total}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-500">In progress</p>
                    <p className="text-lg font-bold text-gray-900">{taskStats.inProgress}</p>
                  </div>
                </div>
                <div className="space-y-2 border-t border-gray-100 pt-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Created</span>
                    <span className="font-medium text-gray-800">{formatShortDate(project.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated</span>
                    <span className="font-medium text-gray-800">{formatShortDate(project.updatedAt)}</span>
                  </div>
                  {project.budget != null && project.budget !== "" ? (
                    <div className="flex justify-between">
                      <span>Budget</span>
                      <span className="font-medium text-gray-800">
                        {Number(project.budget).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>

            <Card variant="elevated" className="rounded-xl">
              <SidebarCardTitle title="Quick links" icon={FolderOpen} />
              <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" className="justify-start" onClick={() => setActiveTab("tasks")}>
                  View project tasks ({projectTasks.length})
                </Button>
                <Button type="button" variant="outline" className="justify-start" onClick={() => setActiveTab("comments")}>
                  Open discussion
                </Button>
              </div>
            </Card>
          </div>
          </div>

          <section className="min-w-0" aria-label="Project discussion">
            <div className="mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <MessageSquare className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
                <h2 className="text-lg font-semibold text-gray-900">Discussion</h2>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Team chat for this project — same thread as the{" "}
                <button
                  type="button"
                  className="font-medium text-orange-600 hover:underline"
                  onClick={() => setActiveTab("comments")}
                >
                  Comments
                </button>{" "}
                tab.
              </p>
            </div>
            <EntityActivityPanel
              key={`project-chat-${projectApiId}`}
              {...discussionPanelProps}
              defaultSubTab="chat"
              minHeightPx={440}
              maxHeightPx={680}
            />
          </section>
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
            <SidebarCardTitle title="Activity summary" icon={Activity} />
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
                <span className="text-xs font-medium text-gray-600">Project manager</span>
                <span className="truncate pl-2 text-right text-xs font-semibold text-gray-800">
                  {project.projectManager?.name || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                <span className="text-xs font-medium text-gray-600">Organization</span>
                <span className="truncate pl-2 text-right text-xs font-semibold text-gray-800">
                  {project.clientName || "—"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                <span className="shrink-0 text-xs font-medium text-gray-600">Team</span>
                <span className="line-clamp-3 text-right text-xs font-semibold text-gray-800">
                  {(project.team || []).length
                    ? (project.team || []).map((m) => m.name).filter(Boolean).join(", ")
                    : "None"}
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
