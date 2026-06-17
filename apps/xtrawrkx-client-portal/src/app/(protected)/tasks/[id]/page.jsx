"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Flag,
  Clock,
  MessageSquare,
  ListTree,
  Paperclip,
  Activity,
  RefreshCw,
  Share2,
  PlayCircle,
  ListTodo,
  XCircle,
  Plus,
} from "lucide-react";
import {
  Button,
  Card,
  KPICard,
  TabsWithActions,
  TableCellTaskStatus,
  EmptyState,
  LoadingSpinner,
  EntityActivityPanel,
  TaskStatusStepper,
  formatRelativeTime,
  Table,
  SidebarCardTitle,
} from "@webfudge/ui";
import { isClientActionStage, isClientReviewStage, getTaskStatusLabel } from "@webfudge/utils";
import { useSession } from "@/lib/auth";
import { getClientTask, clientTaskAction, createClientSubtask } from "@/lib/api/clientTaskService";
import {
  fetchClientTaskTimeline,
  fetchClientTaskComments,
  addClientTaskComment,
} from "@/lib/api/clientTaskActivityService";
import ClientTaskDetailsCard, { getTaskStatusPillVisual } from "@/components/tasks/ClientTaskDetailsCard";
import ClientTaskDetailMetaBar from "@/components/tasks/ClientTaskDetailMetaBar";
import CreateSubtaskModal from "@/components/tasks/CreateSubtaskModal";
import { PageHeader } from "@/components/layout/PortalPageHeader";
import { PortalPageShell } from "@/components/layout/PortalPageShell";

const headerIconBtnClass =
  "p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg text-brand-text-light";

// ─── helpers ────────────────────────────────────────────────────────────────

function getStatusLabel(s, task = null) {
  return getTaskStatusLabel(s, { variant: "client", task });
}

function formatShortDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getPriorityLabel(p) {
  const k = (p || "medium").toLowerCase();
  return k.charAt(0).toUpperCase() + k.slice(1);
}

function getStatusVisual(strapiStatus, task = null) {
  const s = strapiStatus || "ASSIGNED";
  if (s === "COMPLETED" || s === "APPROVED" || s === "DONE")
    return { bgClass: "bg-gradient-to-br from-emerald-600 to-emerald-700", Icon: CheckCircle2, label: getStatusLabel(s, task) };
  if (s === "CANCELLED")
    return { bgClass: "bg-gradient-to-br from-red-600 to-red-700", Icon: XCircle, label: "Cancelled" };
  if (s === "IN_PROGRESS")
    return { bgClass: "bg-gradient-to-br from-orange-500 to-orange-600", Icon: PlayCircle, label: "In progress" };
  if (s === "PENDING_REVIEW" || s === "IN_REVIEW" || s === "REVISION_REQUIRED" || s === "INTERNAL_REVIEW")
    return { bgClass: "bg-gradient-to-br from-violet-600 to-violet-700", Icon: ListTodo, label: getStatusLabel(s, task) };
  if (s === "WAITING_FOR_CLIENT" || s === "CLIENT_REVIEW")
    return { bgClass: "bg-gradient-to-br from-sky-600 to-sky-700", Icon: AlertCircle, label: getStatusLabel(s, task) };
  return { bgClass: "bg-gradient-to-br from-brand-primary to-orange-600", Icon: ListTodo, label: getStatusLabel(s, task) };
}

function flattenTask(row) {
  if (!row) return null;
  if (row.attributes) return { id: row.id ?? row.documentId, documentId: row.documentId, ...row.attributes };
  return row;
}

const DETAIL_TABS = [
  { key: "overview",  label: "Overview" },
  { key: "subtasks",  label: "Subtasks" },
  { key: "comments",  label: "Comments" },
  { key: "activity",  label: "Activity" },
  { key: "files",     label: "Files" },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const taskId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [crmTimeline, setCrmTimeline] = useState([]);
  const [crmTimelineLoading, setCrmTimelineLoading] = useState(false);
  const [crmTimelineError, setCrmTimelineError] = useState(null);
  const [crmTimelineTotal, setCrmTimelineTotal] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [subtaskModalOpen, setSubtaskModalOpen] = useState(false);
  const [savingSubtask, setSavingSubtask] = useState(false);

  const loadTask = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError("");
    try {
      const json = await getClientTask(taskId);
      const row = flattenTask(json?.data ?? json);
      if (row && !row.isSharedWithClient && row.createdBySource !== "client") {
        setError("This task is not shared with your account.");
        setTask(null);
        return;
      }
      // Normalize
      const taskData = row || {};
      const projectsArray = taskData.projects?.data || taskData.projects || [];
      const singleProject =
        taskData.project?.data?.attributes || taskData.project?.data ||
        taskData.project?.attributes || taskData.project;
      let project = null;
      if (Array.isArray(projectsArray) && projectsArray.length > 0) {
        const fp = projectsArray[0];
        project = fp.attributes || fp;
      } else if (singleProject && singleProject.id) {
        project = singleProject;
      }

      const assignee =
        taskData.assignee?.data?.attributes ||
        taskData.assignee?.attributes ||
        taskData.assignee;

      const assigner =
        taskData.assigner?.data?.attributes ||
        taskData.assigner?.attributes ||
        taskData.assigner;

      const projectManager =
        project?.projectManager?.data?.attributes ||
        project?.projectManager?.attributes ||
        project?.projectManager;

      const subtasks = (taskData.subtasks?.data || taskData.subtasks || []).map((st) => {
        const d = st.attributes || st;
        return {
          id: st.id || st.documentId,
          name: d.name || d.title || "Untitled",
          description: d.description || "",
          strapiStatus: (d.status || "ASSIGNED").toUpperCase(),
          status: d.status,
          priority: d.priority,
          dueDate: d.scheduledDate || d.dueDate,
        };
      });

      setTask({
        id: row.id || row.documentId,
        name: taskData.name || taskData.title || "Untitled Task",
        description: taskData.description || "",
        strapiStatus: (taskData.status || "ASSIGNED").toUpperCase(),
        status: getStatusLabel(taskData.status || "ASSIGNED", {
          strapiStatus: (taskData.status || "ASSIGNED").toUpperCase(),
          stageHistory: Array.isArray(taskData.stageHistory) ? taskData.stageHistory : [],
        }),
        priority: (taskData.priority || "medium").toLowerCase(),
        project: project ? { name: project.name || "Unknown Project", id: project.id || project.documentId } : null,
        assignee: assignee
          ? {
              name: assignee.firstName && assignee.lastName
                ? `${assignee.firstName} ${assignee.lastName}`
                : assignee.name || assignee.email?.split("@")[0] || "Unknown",
              avatar: assignee.avatar || null,
              id: assignee.id,
            }
          : null,
        assignerName: assigner
          ? assigner.firstName && assigner.lastName
            ? `${assigner.firstName} ${assigner.lastName}`
            : assigner.name || assigner.email?.split("@")[0] || "—"
          : null,
        projectManagerName: projectManager
          ? projectManager.firstName && projectManager.lastName
            ? `${projectManager.firstName} ${projectManager.lastName}`
            : projectManager.name || projectManager.email?.split("@")[0] || "—"
          : null,
        scheduledDate: taskData.scheduledDate || taskData.dueDate || null,
        createdAt: taskData.createdAt || null,
        updatedAt: taskData.updatedAt || taskData.createdAt || null,
        clientActionRequired: !!taskData.clientActionRequired,
        clientApprovalStatus: taskData.clientApprovalStatus || null,
        clientWorkflowStage: taskData.clientWorkflowStage || null,
        clientActionType: taskData.clientActionType || null,
        clientActionNotes: taskData.clientActionNotes || null,
        stageHistory: Array.isArray(taskData.stageHistory) ? taskData.stageHistory : [],
        subtasks,
        isSharedWithClient: !!taskData.isSharedWithClient,
        createdBySource: taskData.createdBySource || "internal",
      });
    } catch (e) {
      setError(e.message || "Failed to load task");
      setTask(null);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { loadTask(); }, [loadTask]);

  const reloadTaskTimeline = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    if (!taskId) return;
    if (!silent) {
      setCrmTimelineLoading(true);
      setCrmTimelineError(null);
    }
    try {
      const [{ data, total }, commentsRes] = await Promise.all([
        fetchClientTaskTimeline({ taskId, limit: 80 }),
        fetchClientTaskComments({ taskId, limit: 1 }),
      ]);
      const rows = Array.isArray(data) ? data : [];
      setCrmTimeline(rows);
      setCrmTimelineTotal(typeof total === "number" ? total : rows.length);
      setCommentCount(typeof commentsRes?.total === "number" ? commentsRes.total : 0);
    } catch (e) {
      if (!silent) {
        setCrmTimelineError(e?.message || "Could not load activities");
        setCrmTimeline([]);
        setCrmTimelineTotal(0);
        setCommentCount(0);
      }
    } finally {
      if (!silent) setCrmTimelineLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (!taskId || loading) return;
    reloadTaskTimeline({ silent: false });
  }, [taskId, loading, reloadTaskTimeline]);

  const refreshAll = useCallback(() => {
    loadTask();
    reloadTaskTimeline({ silent: false });
  }, [loadTask, reloadTaskTimeline]);

  const handleAddTaskComment = useCallback(
    async ({ entityId, comment }) => {
      const res = await addClientTaskComment({ taskId: entityId, comment });
      await reloadTaskTimeline({ silent: true });
      return res;
    },
    [reloadTaskTimeline],
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
    return task?.updatedAt ? formatRelativeTime(task.updatedAt) : "—";
  }, [crmTimeline, task?.updatedAt]);

  const canCreateSubtasks = useMemo(() => {
    if (!task) return false;
    return !!(task.isSharedWithClient || task.createdBySource === "client");
  }, [task]);

  const saveNewSubtask = useCallback(
    async (payload) => {
      if (!task?.id || !canCreateSubtasks) return;
      setSavingSubtask(true);
      try {
        await createClientSubtask(task.id, payload);
        setSubtaskModalOpen(false);
        await loadTask();
        await reloadTaskTimeline({ silent: true });
      } catch (e) {
        throw e;
      } finally {
        setSavingSubtask(false);
      }
    },
    [task, canCreateSubtasks, loadTask, reloadTaskTimeline],
  );

  const runClientAction = useCallback(async (action) => {
    setActionLoading(true);
    try {
      await clientTaskAction(taskId, action);
      await loadTask();
    } catch (e) {
      alert(e.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  }, [taskId, loadTask]);

  // Tab badges
  const tabsWithBadges = useMemo(
    () =>
      DETAIL_TABS.map((t) => ({
        ...t,
        badge:
          t.key === "comments" && commentCount
            ? commentCount
            : t.key === "subtasks" && task?.subtasks?.length
              ? task.subtasks.length
              : undefined,
        badgeCount:
          t.key === "activity" && activityCount ? activityCount : undefined,
      })),
    [commentCount, activityCount, task?.subtasks?.length],
  );

  // ── loading / error ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <PortalPageShell>
        <PageHeader
          title="Loading task..."
          breadcrumb={[
            { label: "Portal", href: "/dashboard" },
            { label: "Tasks", href: "/tasks" },
          ]}
          showSearch={false}
          showActions={false}
          onBack={() => router.push("/tasks")}
        />
        <Card variant="elevated" className="flex justify-center rounded-xl p-12">
          <LoadingSpinner size="lg" />
        </Card>
      </PortalPageShell>
    );
  }

  if (error || !task) {
    return (
      <PortalPageShell>
        <PageHeader
          title="Task unavailable"
          breadcrumb={[
            { label: "Portal", href: "/dashboard" },
            { label: "Tasks", href: "/tasks" },
          ]}
          showSearch={false}
          showActions={false}
          onBack={() => router.push("/tasks")}
        />
        <Card variant="elevated" className="rounded-xl p-12">
          <EmptyState
            icon={AlertCircle}
            title="Task unavailable"
            description={error || "Task not found"}
          />
        </Card>
      </PortalPageShell>
    );
  }

  const statusVisual = getStatusVisual(task.strapiStatus, task);
  const statusPillVisual = getTaskStatusPillVisual(task.strapiStatus, task.status);
  const StatusIcon = statusVisual.Icon;
  const stage = task.clientWorkflowStage;
  const showDecisionActions = isClientActionStage(stage, task) || task.clientActionRequired;
  const showReviewActions = isClientReviewStage(stage, task) || task.clientApprovalStatus === "pending";
  const priorityLabel = getPriorityLabel(task.priority);
  const breadcrumbItems = [
    { label: "Portal", href: "/dashboard" },
    { label: "Tasks", href: "/tasks" },
    { label: task.name, href: `/tasks/${task.id}` },
  ];

  const subtasksTableColumns = [
    {
      key: "name",
      label: "TASK NAME",
      className: "max-w-[24rem] align-top",
      render: (_, row) => (
        <button
          type="button"
          className="min-w-0 max-w-full text-left hover:text-orange-600"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/tasks/${row.id}`);
          }}
        >
          <div className="truncate font-medium text-gray-900">{row.name || "Untitled subtask"}</div>
          <div className="truncate text-sm text-gray-500">{row.description || "No description"}</div>
        </button>
      ),
    },
    {
      key: "status",
      label: "STATUS",
      render: (_, row) => <TableCellTaskStatus status={row.strapiStatus || "ASSIGNED"} />,
    },
    {
      key: "priority",
      label: "PRIORITY",
      render: (_, row) => (
        <span className="text-sm capitalize text-gray-700">{getPriorityLabel(row.priority)}</span>
      ),
    },
    {
      key: "dueDate",
      label: "DUE",
      render: (_, row) => (
        <span className="text-sm text-gray-700">{formatShortDate(row.dueDate)}</span>
      ),
    },
  ];

  const discussionPanelProps = {
    entityType: "task",
    entityId: task.id,
    entityName: task.name,
    crmTimeline,
    crmTimelineLoading,
    crmTimelineError,
    activityCount,
    fetchCommentsFn: ({ entityId }) => fetchClientTaskComments({ taskId: entityId, limit: 80 }),
    addCommentFn: handleAddTaskComment,
    composerAvatarFallback,
    chatFooterBadgeText: "Messages are saved on this task for your team.",
    className: "w-full",
  };

  return (
    <>
    <PortalPageShell>
      <div className="space-y-3">
        <PageHeader
          title={task.name}
          breadcrumb={breadcrumbItems}
          showProfile
          showSearch={false}
          showActions={false}
          onBack={() => router.push("/tasks")}
        >
          <div className="flex flex-wrap items-center justify-end gap-2">
            {task.clientActionRequired && (
              <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                Action required
              </span>
            )}
            <button
              type="button"
              className={headerIconBtnClass}
              title="Copy link"
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
            >
              <Share2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              className={headerIconBtnClass}
              title="Refresh"
              onClick={refreshAll}
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </PageHeader>

        <ClientTaskDetailMetaBar task={task} />

        <TaskStatusStepper status={task.strapiStatus} variant="client" task={task} />
      </div>

      {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KPICard compact title="Status" value={task.status} icon={StatusIcon} colorScheme="orange" />
          <KPICard compact title="Priority" value={priorityLabel} icon={Flag} colorScheme="orange" />
          <KPICard compact title="Due date" value={formatShortDate(task.scheduledDate)} icon={Calendar} colorScheme="orange" />
          <KPICard compact title="Created" value={formatShortDate(task.createdAt)} icon={Clock} colorScheme="orange" />
        </div>

        {/* Tabs */}
        <TabsWithActions
          variant="pill"
          tabs={tabsWithBadges}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Main col */}
              <div className="space-y-6 lg:col-span-2">
                <ClientTaskDetailsCard
                  task={task}
                  session={session}
                  statusVisual={statusPillVisual}
                  onViewSubtasks={() => setActiveTab("subtasks")}
                  onViewFiles={() => setActiveTab("files")}
                />
              </div>

              {/* Right sidebar */}
              <div className="space-y-4">

              {/* Subtasks sidebar */}
              <Card variant="elevated" className="rounded-xl">
                <SidebarCardTitle
                  title={`Subtasks (${task.subtasks?.length || 0})`}
                  icon={ListTree}
                />
                {!task.subtasks?.length ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-center">
                    <p className="text-sm text-gray-600">No subtasks yet for this task.</p>
                    {canCreateSubtasks ? (
                      <button
                        type="button"
                        onClick={() => setSubtaskModalOpen(true)}
                        className="mt-2 text-xs font-semibold text-orange-700 hover:underline"
                      >
                        Add first subtask
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="overflow-x-auto">
                      <table className="min-w-full table-fixed">
                        <thead className="bg-gray-50">
                          <tr className="text-left">
                            <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Name</th>
                            <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Status</th>
                            <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Due</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {task.subtasks.slice(0, 5).map((st) => (
                            <tr
                              key={st.id}
                              className="cursor-pointer hover:bg-orange-50/30"
                              onClick={() => router.push(`/tasks/${st.id}`)}
                            >
                              <td className="px-3 py-2.5 text-sm font-medium text-gray-900">{st.name}</td>
                              <td className="px-2 py-2.5">
                                <TableCellTaskStatus status={st.strapiStatus || "ASSIGNED"} />
                              </td>
                              <td className="px-2 py-2.5 text-xs text-gray-500">{formatShortDate(st.dueDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {task.subtasks.length > 5 ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab("subtasks")}
                        className="w-full border-t border-gray-100 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50/50"
                      >
                        View all {task.subtasks.length} subtasks
                      </button>
                    ) : null}
                  </div>
                )}
              </Card>

              {/* Client action card */}
              {(showDecisionActions || showReviewActions) && (
                <Card variant="elevated" className="rounded-xl p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    Your action required
                  </h3>
                  {showDecisionActions && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Xtrawrkx needs your decision
                        {task.clientActionType ? ` (${task.clientActionType.replace(/_/g, " ")})` : ""}.
                      </p>
                      <Button variant="primary" size="sm" disabled={actionLoading} onClick={() => runClientAction("approve")} className="w-full gap-1.5">
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Approve / Accept
                      </Button>
                      <Button variant="outline" size="sm" disabled={actionLoading} onClick={() => runClientAction("reject")} className="w-full gap-1.5">
                        <AlertCircle className="h-4 w-4" /> Request changes
                      </Button>
                    </div>
                  )}
                  {showReviewActions && !showDecisionActions && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Review the completed work and close this task.</p>
                      <Button variant="primary" size="sm" disabled={actionLoading} onClick={() => runClientAction("close")} className="w-full">
                        Mark complete & close
                      </Button>
                      <Button variant="outline" size="sm" disabled={actionLoading} onClick={() => runClientAction("request_revision")} className="w-full">
                        Request revision
                      </Button>
                    </div>
                  )}
                </Card>
              )}
            </div>
            </div>

            <section className="min-w-0" aria-label="Task discussion">
              <div className="mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <MessageSquare className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
                  <h2 className="text-lg font-semibold text-gray-900">Discussion</h2>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Team chat for this task — same thread as the{" "}
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
                key={`task-overview-chat-${task.id}`}
                {...discussionPanelProps}
                defaultSubTab="chat"
                minHeightPx={440}
                maxHeightPx={680}
              />
            </section>
          </div>
        )}

        {/* ── Subtasks tab ─────────────────────────────────────────────────── */}
        {activeTab === "subtasks" && (
          <div className="space-y-4">
            <Card variant="elevated" className="rounded-xl">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Subtasks</h2>
                  <p className="mt-1 text-sm text-gray-500">Break this task into smaller items.</p>
                </div>
                {canCreateSubtasks ? (
                  <Button
                    type="button"
                    variant="primary"
                    className="shrink-0 gap-2"
                    onClick={() => setSubtaskModalOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add subtask
                  </Button>
                ) : null}
              </div>
              {!task.subtasks?.length ? (
                <EmptyState
                  icon={ListTree}
                  title="No subtasks yet"
                  description="Add subtasks to split work across your team or milestones."
                />
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <Table
                    columns={subtasksTableColumns}
                    data={task.subtasks}
                    keyField="id"
                    variant="modernEmbedded"
                    onRowClick={(row) => router.push(`/tasks/${row.id}`)}
                  />
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── Comments ─────────────────────────────────────────────────────── */}
        {activeTab === "comments" && (
          <div className="min-w-0">
            <EntityActivityPanel
              key={`task-comments-${task.id}`}
              {...discussionPanelProps}
              defaultSubTab="chat"
              minHeightPx={560}
              maxHeightPx={800}
            />
          </div>
        )}

        {/* ── Activity ─────────────────────────────────────────────────────── */}
        {activeTab === "activity" && (
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
                  <span className="text-xs font-medium text-gray-600">Reporter</span>
                  <span className="truncate pl-2 text-right text-xs font-semibold text-gray-800">
                    {task.assignerName || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                  <span className="text-xs font-medium text-gray-600">Project Manager</span>
                  <span className="truncate pl-2 text-right text-xs font-semibold text-gray-800">
                    {task.projectManagerName || "—"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                  <span className="shrink-0 text-xs font-medium text-gray-600">Assignees</span>
                  <span className="line-clamp-3 text-right text-xs font-semibold text-gray-800">
                    {task.assignee?.name || "None"}
                  </span>
                </div>
              </div>
            </Card>
            <div className="min-w-0 lg:col-span-3">
              <EntityActivityPanel
                key={`task-activity-${task.id}`}
                {...discussionPanelProps}
                defaultSubTab="activity"
                minHeightPx={560}
                maxHeightPx={800}
              />
            </div>
          </div>
        )}

        {/* ── Files ────────────────────────────────────────────────────────── */}
        {activeTab === "files" && (
          <Card variant="elevated" className="rounded-xl">
            <EmptyState
              icon={Paperclip}
              title="No attachments"
              description="File attachments will appear here once added."
            />
          </Card>
        )}
    </PortalPageShell>

      <CreateSubtaskModal
        isOpen={subtaskModalOpen}
        onClose={() => setSubtaskModalOpen(false)}
        onSubmit={saveNewSubtask}
        parentTask={task}
        saving={savingSubtask}
      />
    </>
  );
}
