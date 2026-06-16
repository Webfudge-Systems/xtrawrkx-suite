"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  Clock,
  AlertCircle,
  Plus,
  CheckCircle2,
  Eye,
  FolderKanban,
  Table2,
  Kanban,
  ChevronRight,
  Link2,
  Flag,
  MessageSquarePlus,
  SendHorizontal,
  Calendar,
  ExternalLink,
} from "lucide-react";
import {
  KPICard,
  Card,
  TabsWithActions,
  Table,
  Button,
  TableColumnPicker,
  TableCellTitleSubtitle,
  TableCellCreated,
  TableCellTaskStatus,
  ViewToggleGroup,
  ViewToggleButton,
  Avatar,
  TableSortDropdown,
  TableRowActionMenuPortal,
  Textarea,
  LoadingSpinner,
  useTableSort,
  useTableColumnPreferences,
} from "@webfudge/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { PortalPageShell } from "@/components/layout/PortalPageShell";
import { useSession } from "@/lib/auth";
import { exportItemsToCSV } from "@/lib/exportUtils";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import { listCompanyMembers } from "@/lib/api/companyMembersService";
import { listTasksForClient, createClientTask } from "@/lib/api/clientTaskService";
import { listProjectsForClient } from "@/lib/api/clientProjectService";
import { resolveClientAccountId, mapProjectsForTaskSelect } from "@/lib/clientAccountId";
import { getTaskStatusLabel } from "@webfudge/utils";

// ─── constants ────────────────────────────────────────────────────────────────

const COLUMN_VISIBILITY_STORAGE_KEY = "portal.tasks.tableColumnVisibility";
const COLUMN_ORDER_STORAGE_KEY = "portal.tasks.tableColumnOrder";
const COLUMN_WIDTHS_STORAGE_KEY = "portal.tasks.tableColumnWidths.v2";
const TABLE_SORT_STORAGE_KEY = "portal.tasks.tableSort";

const TOGGLEABLE_COLUMNS = [
  { key: "project", label: "Project" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "assignee", label: "Assignee" },
  { key: "dueDate", label: "Due Date" },
  { key: "createdAt", label: "Created" },
];

const DEFAULT_ON_COLUMNS = new Set(["project", "status", "priority", "assignee", "dueDate"]);

const DEFAULT_COLUMN_VISIBILITY = TOGGLEABLE_COLUMNS.reduce((acc, { key }) => {
  acc[key] = DEFAULT_ON_COLUMNS.has(key);
  return acc;
}, {});

const DEFAULT_COLUMN_WIDTHS = {
  name: 300,
  project: 180,
  status: 170,
  priority: 140,
  assignee: 160,
  dueDate: 130,
  createdAt: 130,
  actions: 130,
};

const REORDERABLE_COLUMN_KEYS = TOGGLEABLE_COLUMNS.map((c) => c.key);
const MIN_COLUMN_WIDTHS = { actions: 120 };

const SORT_COLUMN_OPTIONS = [
  { key: "name", label: "Task Name" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "dueDate", label: "Due Date" },
  { key: "createdAt", label: "Created" },
];

const SORTABLE_COLUMN_KEYS = SORT_COLUMN_OPTIONS.map((o) => o.key);

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

// ─── kanban constants ─────────────────────────────────────────────────────────

const KANBAN_STAGES = [
  { key: "ASSIGNED",         label: "Assigned" },
  { key: "SCHEDULED",        label: "To Do" },
  { key: "IN_PROGRESS",      label: "In Progress" },
  { key: "INTERNAL_REVIEW",  label: "In Review" },
  { key: "COMPLETED",        label: "Completed" },
  { key: "CANCELLED",        label: "Cancelled" },
];

const KANBAN_STAGE_STYLES = {
  ASSIGNED:        { header: "bg-orange-50 border-orange-200", text: "text-orange-700", badge: "bg-orange-100 text-orange-700" },
  SCHEDULED:       { header: "bg-blue-50 border-blue-200",     text: "text-blue-700",   badge: "bg-blue-100 text-blue-700" },
  IN_PROGRESS:     { header: "bg-amber-50 border-amber-200",   text: "text-amber-700",  badge: "bg-amber-100 text-amber-700" },
  INTERNAL_REVIEW: { header: "bg-violet-50 border-violet-200", text: "text-violet-700", badge: "bg-violet-100 text-violet-700" },
  COMPLETED:       { header: "bg-emerald-50 border-emerald-200",text:"text-emerald-700",badge: "bg-emerald-100 text-emerald-700" },
  CANCELLED:       { header: "bg-red-50 border-red-200",       text: "text-red-700",    badge: "bg-red-100 text-red-700" },
};

const KANBAN_PRIORITY_PILL = {
  high:   "bg-red-100 text-red-700",
  urgent: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low:    "bg-gray-100 text-gray-500",
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function getPriorityFlagClass(p) {
  const k = (p || "medium").toLowerCase();
  if (k === "high" || k === "urgent") return "fill-red-500 text-red-500";
  if (k === "medium") return "fill-amber-500 text-amber-500";
  return "fill-emerald-500 text-emerald-500";
}

function getPriorityBadge(p) {
  const k = (p || "medium").toLowerCase();
  if (k === "high" || k === "urgent") return "bg-red-50 text-red-700 border border-red-200";
  if (k === "medium") return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-emerald-50 text-emerald-700 border border-emerald-200";
}

function isTaskOverdue(task) {
  if (!task.scheduledDate) return false;
  const s = (task.strapiStatus || "").toUpperCase();
  if (["COMPLETED", "DONE", "CANCELLED", "APPROVED"].includes(s)) return false;
  return new Date(task.scheduledDate) < new Date();
}

function formatCommentTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

// ─── kanban components ────────────────────────────────────────────────────────

function KanbanTaskCard({ task, router }) {
  const overdue = isTaskOverdue(task);
  const pri = (task.priority || "medium").toLowerCase();
  return (
    <div
      onClick={() => router.push(`/tasks/${task.id}`)}
      className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-1">
        <p className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-gray-900 group-hover:text-orange-600">
          {task.name || "Untitled"}
        </p>
        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-orange-400" />
      </div>
      {task.project && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); router.push(`/projects/${task.projectId || task.project}`); }}
          className="mt-1.5 inline-flex max-w-full items-center gap-1 truncate rounded-md border border-orange-100 bg-orange-50/80 px-2 py-0.5 text-left text-[11px] font-semibold text-orange-900 hover:border-orange-200"
        >
          <FolderKanban className="h-3 w-3 shrink-0 text-orange-600" />
          <span className="truncate">{task.project}</span>
        </button>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {task.priority && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${KANBAN_PRIORITY_PILL[pri] || "bg-gray-100 text-gray-500"}`}>
            {task.priority}
          </span>
        )}
        {task.scheduledDate && (
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${overdue ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
            <Calendar className="h-2.5 w-2.5" />
            {new Date(task.scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
      {task.assigneeName && (
        <div className="mt-2.5 flex items-center gap-1.5">
          <Avatar size="xs" alt={task.assigneeName} fallback={task.assigneeName.charAt(0)} className="ring-1 ring-white" />
          <span className="truncate text-[11px] text-gray-500">{task.assigneeName}</span>
        </div>
      )}
    </div>
  );
}

function KanbanBoard({ tasks, router }) {
  const stageMap = useMemo(() => {
    const by = {};
    KANBAN_STAGES.forEach(({ key }) => { by[key] = []; });
    for (const t of tasks) {
      const k = t.strapiStatus && by[t.strapiStatus] != null ? t.strapiStatus : "ASSIGNED";
      by[k].push(t);
    }
    return by;
  }, [tasks]);

  const activeStages = useMemo(
    () => KANBAN_STAGES.filter(({ key }) => stageMap[key]?.length > 0 || ["ASSIGNED", "SCHEDULED", "IN_PROGRESS", "INTERNAL_REVIEW"].includes(key)),
    [stageMap]
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
      {activeStages.map(({ key, label }) => {
        const style = KANBAN_STAGE_STYLES[key] || KANBAN_STAGE_STYLES.SCHEDULED;
        const colTasks = stageMap[key] || [];
        return (
          <div key={key} className="flex min-h-[380px] min-w-[272px] max-w-[300px] shrink-0 flex-col rounded-2xl border border-gray-200 bg-gray-50/60">
            <div className={`flex items-center justify-between rounded-t-2xl border-b px-4 py-3 ${style.header}`}>
              <h3 className={`text-[11px] font-extrabold uppercase tracking-widest ${style.text}`}>{label}</h3>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${style.badge}`}>{colTasks.length}</span>
            </div>
            <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3">
              {colTasks.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white/40 p-4 text-center">
                  <p className="text-[11px] text-gray-400">No tasks</p>
                </div>
              ) : (
                colTasks.map((t) => <KanbanTaskCard key={t.id} task={t} router={router} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeView, setActiveView] = useState("table");
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [clientMembers, setClientMembers] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [sortPickerOpen, setSortPickerOpen] = useState(false);

  // Comment state (per-row inline composer, matches PM)
  const [commentComposerMenu, setCommentComposerMenu] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentsByTask, setCommentsByTask] = useState({});
  const [commentCountsByTaskId, setCommentCountsByTaskId] = useState({});
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");

  // Column preferences
  const {
    columnVisibility,
    columnOrder,
    columnPickerOpen,
    setColumnPickerOpen,
    columnDropIndicator,
    toolbarRef,
    setColumnVisible,
    handleColumnDragStart,
    handleColumnDragEnd,
    handleColumnRowDragOver,
    handleColumnListDragLeave,
    handleColumnDrop,
    resetColumnTablePreferences,
    tableResizeProps,
  } = useTableColumnPreferences({
    visibilityStorageKey: COLUMN_VISIBILITY_STORAGE_KEY,
    orderStorageKey: COLUMN_ORDER_STORAGE_KEY,
    widthsStorageKey: COLUMN_WIDTHS_STORAGE_KEY,
    defaultVisibility: DEFAULT_COLUMN_VISIBILITY,
    reorderableKeys: REORDERABLE_COLUMN_KEYS,
    defaultWidths: DEFAULT_COLUMN_WIDTHS,
    minWidths: MIN_COLUMN_WIDTHS,
  });

  // Sort
  const {
    sortRules,
    sortData,
    addSortRule,
    removeSortRule,
    setRuleDirection,
    moveSortRule,
    clearSort,
    maxRules: sortMaxRules,
    hasActiveSort,
    bindSortableColumns,
  } = useTableSort({ storageKey: TABLE_SORT_STORAGE_KEY });

  // ── data loading ──────────────────────────────────────────────────────────

  useEffect(() => {
    const loadTasks = async () => {
      if (!session) return;
      try {
        setLoading(true);

        const accountId = await resolveClientAccountId(session);

        try {
          const m = await listCompanyMembers();
          setClientMembers(m?.data || []);
        } catch { setClientMembers([]); }

        if (!accountId) { setTasks([]); setProjects([]); setLoading(false); return; }

        try {
          const rows = await listProjectsForClient(accountId);
          setProjects(rows);
        } catch { setProjects([]); }

        const raw = await listTasksForClient(accountId);

        setTasks(
          raw.map((task) => {
            const d = task.attributes || task;
            const strapiStatus = (d.status || "ASSIGNED").toUpperCase();
            const stageHistory = Array.isArray(d.stageHistory) ? d.stageHistory : [];
            const pa = d.projects?.data || d.projects || [];
            const sp = d.project?.data?.attributes || d.project?.data || d.project?.attributes || d.project;
            let project = null;
            if (Array.isArray(pa) && pa.length > 0) { const fp = pa[0]; project = fp.attributes || fp; }
            else if (sp) project = sp;
            const assignee = d.assignee?.data?.attributes || d.assignee?.attributes || d.assignee;
            return {
              id: task.id || task.documentId,
              name: d.name || d.title || "Untitled Task",
              description: d.description || "",
              strapiStatus,
              status: getTaskStatusLabel(strapiStatus, {
                variant: "client",
                task: { strapiStatus, stageHistory },
              }),
              stageHistory,
              priority: (d.priority || "medium").toLowerCase(),
              project: project ? { name: project.name || "Unknown", id: project.id || project.documentId } : null,
              assignee: assignee
                ? {
                    name: (assignee.firstName && assignee.lastName)
                      ? `${assignee.firstName} ${assignee.lastName}`
                      : assignee.name || assignee.email?.split("@")[0] || "Unknown",
                    avatar: assignee.avatar || null,
                    id: assignee.id,
                  }
                : null,
              scheduledDate: d.scheduledDate || d.dueDate || null,
              createdAt: d.createdAt || new Date().toISOString(),
              updatedAt: d.updatedAt || d.createdAt || new Date().toISOString(),
              clientActionRequired: !!d.clientActionRequired,
            };
          }),
        );
      } catch (e) {
        console.error("Error loading tasks:", e);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    if (session) loadTasks();
  }, [session, reloadKey]);

  // ── create task ───────────────────────────────────────────────────────────

  const handleCreateTask = async (taskInput) => {
    const priority = (taskInput.priority || "medium").toLowerCase();
    const projectId = taskInput.projectId ? String(taskInput.projectId).trim() : "";
    await createClientTask({
      name: taskInput.title,
      description: taskInput.description || "",
      projects: projectId ? { set: [projectId] } : undefined,
      scheduledDate: taskInput.dueDate ? new Date(`${taskInput.dueDate}T00:00:00`).toISOString() : null,
      priority: priority === "urgent" ? "high" : priority,
    });
    setReloadKey((p) => p + 1);
  };

  const loadProjectsForTaskModal = useCallback(async () => {
    if (!session) return;
    try {
      const accountId = await resolveClientAccountId(session);
      if (!accountId) {
        setProjects([]);
        return;
      }
      const rows = await listProjectsForClient(accountId);
      setProjects(rows);
    } catch {
      setProjects([]);
    }
  }, [session]);

  const openCreateTaskModal = () => {
    setIsCreateTaskModalOpen(true);
    loadProjectsForTaskModal();
  };

  const taskProjectOptions = useMemo(
    () => mapProjectsForTaskSelect(projects),
    [projects],
  );

  // ── comment handlers ──────────────────────────────────────────────────────

  const openCommentComposer = useCallback((taskId, anchor) => {
    setCommentComposerMenu(anchor ? { id: taskId, ...anchor } : { id: taskId });
    setCommentDraft("");
    setCommentError("");
    // Optimistically ensure a comments array exists
    setCommentsByTask((prev) => prev[taskId] ? prev : { ...prev, [taskId]: [] });
  }, []);

  const closeCommentComposer = useCallback(() => {
    setCommentComposerMenu(null);
    setCommentDraft("");
    setCommentError("");
  }, []);

  const submitTaskComment = useCallback(async () => {
    const taskId = commentComposerMenu?.id;
    const text = commentDraft.trim();
    if (!taskId || !text) return;
    setCommentSubmitting(true);
    setCommentError("");
    try {
      const newComment = {
        id: `c-${Date.now()}`,
        actor: { username: session?.account?.companyName || session?.user?.email || "You" },
        meta: JSON.stringify({ comment: text }),
        createdAt: new Date().toISOString(),
      };
      setCommentsByTask((prev) => ({ ...prev, [taskId]: [newComment, ...(prev[taskId] || [])] }));
      setCommentCountsByTaskId((prev) => ({
        ...prev,
        [String(taskId)]: (Number(prev[String(taskId)] || 0)) + 1,
      }));
      setCommentDraft("");
    } catch (e) {
      setCommentError(e?.message || "Could not post comment");
    } finally {
      setCommentSubmitting(false);
    }
  }, [commentComposerMenu, commentDraft, session]);

  // ── stats & filters ───────────────────────────────────────────────────────

  const taskStats = useMemo(() => {
    const all = tasks.length;
    let todo = 0, inProgress = 0, internalReview = 0, done = 0, overdue = 0;
    for (const t of tasks) {
      const s = t.strapiStatus || "";
      if (["ASSIGNED", "ACCEPTED", "SCHEDULED", "PLANNED"].includes(s)) todo++;
      if (s === "IN_PROGRESS" || s === "ACTIVE") inProgress++;
      if (s === "PENDING_REVIEW" || s === "IN_REVIEW" || s === "REVISION_REQUIRED") internalReview++;
      if (["COMPLETED", "DONE", "APPROVED"].includes(s)) done++;
      if (isTaskOverdue(t)) overdue++;
    }
    return { all, todo, inProgress, internalReview, done, overdue };
  }, [tasks]);

  const filteredByTab = useMemo(() => {
    if (activeTab === "all") return tasks;
    return tasks.filter((t) => {
      const s = t.strapiStatus || "";
      if (activeTab === "todo") return ["ASSIGNED", "ACCEPTED", "SCHEDULED", "PLANNED"].includes(s);
      if (activeTab === "in-progress") return s === "IN_PROGRESS" || s === "ACTIVE";
      if (activeTab === "internal-review") return ["PENDING_REVIEW", "IN_REVIEW", "REVISION_REQUIRED"].includes(s);
      if (activeTab === "done") return ["COMPLETED", "DONE", "APPROVED"].includes(s);
      return true;
    });
  }, [tasks, activeTab]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return filteredByTab;
    const q = searchQuery.toLowerCase();
    return filteredByTab.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.project?.name?.toLowerCase().includes(q) ||
        t.assignee?.name?.toLowerCase().includes(q),
    );
  }, [filteredByTab, searchQuery]);

  const sortedTasks = useMemo(
    () =>
      sortData(filteredTasks, (row, key) => {
        if (key === "name") return (row.name || "").toLowerCase();
        if (key === "status") return (row.status || "").toLowerCase();
        if (key === "priority") return PRIORITY_ORDER[(row.priority || "medium").toLowerCase()] ?? 2;
        if (key === "dueDate") return row.scheduledDate ? new Date(row.scheduledDate).getTime() : Infinity;
        if (key === "createdAt") return row.createdAt ? new Date(row.createdAt).getTime() : 0;
        return "";
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredTasks, sortData],
  );

  // ── close pickers on outside click ────────────────────────────────────────

  useEffect(() => {
    if (!columnPickerOpen && !sortPickerOpen) return;
    const onDocMouseDown = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setColumnPickerOpen(false);
        setSortPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [columnPickerOpen, sortPickerOpen, setColumnPickerOpen, toolbarRef]);

  // ── table columns ─────────────────────────────────────────────────────────

  const allTaskColumns = useMemo(
    () => [
      {
        key: "name",
        label: "TASK NAME",
        defaultWidth: "300px",
        className: "align-top",
        render: (_, row) => {
          const initial = (row.name || "T").trim().charAt(0).toUpperCase();
          const commentCount = Number(commentCountsByTaskId[String(row.id)] || 0);
          return (
            <div className="group flex min-w-0 max-w-full items-start gap-3">
              <Avatar
                fallback={initial}
                alt={row.name}
                size="sm"
                className="mt-0.5 flex-shrink-0 bg-gray-600 text-white"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/tasks/${row.id}`)}
                    className="min-w-0 flex-1 text-left hover:text-orange-600"
                  >
                    <TableCellTitleSubtitle
                      title={row.name}
                      subtitle={row.description || "No description"}
                    />
                  </button>
                  {/* Comment button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const r = e.currentTarget.getBoundingClientRect();
                      openCommentComposer(row.id, {
                        top: r.bottom + 8,
                        left: r.left,
                        triggerEl: e.currentTarget,
                      });
                    }}
                    className={`relative mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition ${
                      commentCount > 0
                        ? "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                        : "border-transparent text-gray-400 hover:border-gray-300 hover:bg-white hover:text-gray-600"
                    } ${commentComposerMenu?.id === row.id ? "border-gray-300 bg-white text-gray-700" : ""} ${
                      commentCount > 0 ? "" : "opacity-0 group-hover:opacity-100"
                    }`}
                    title="Comments"
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                    {commentCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white" />
                    )}
                  </button>
                  {row.clientActionRequired && (
                    <span className="mt-0.5 shrink-0 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      Action required
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: "project",
        visibilityKey: "project",
        label: "PROJECT",
        className: "align-middle",
        headerClassName: "align-middle",
        render: (_, row) =>
          row.project ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); router.push(`/projects/${row.project.id}`); }}
              title={`Open project: ${row.project.name}`}
              className="inline-flex w-full min-w-[140px] max-w-[240px] items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 py-1.5 pl-2.5 pr-2 text-left text-xs font-semibold text-orange-900 shadow-sm transition hover:border-orange-300 hover:bg-orange-100/90"
            >
              <FolderKanban className="h-3.5 w-3.5 shrink-0 text-orange-600" />
              <span className="min-w-0 flex-1 truncate">{row.project.name}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-orange-400" />
            </button>
          ) : (
            <span className="inline-flex min-w-[140px] max-w-[240px] items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 py-1.5 px-2.5 text-xs font-medium text-gray-500">
              <FolderKanban className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              No project
            </span>
          ),
      },
      {
        key: "status",
        visibilityKey: "status",
        label: "STATUS",
        className: "align-middle",
        render: (_, row) => (
          <TableCellTaskStatus
            status={row.strapiStatus}
            options={[{ value: row.strapiStatus, label: row.status }]}
          />
        ),
      },
      {
        key: "priority",
        visibilityKey: "priority",
        label: "PRIORITY",
        className: "align-middle",
        render: (_, row) => {
          const p = (row.priority || "medium").toLowerCase();
          const label = p.charAt(0).toUpperCase() + p.slice(1);
          return (
            <div className="flex items-center gap-1.5">
              <Flag className={`h-3.5 w-3.5 shrink-0 ${getPriorityFlagClass(p)}`} strokeWidth={2} />
              <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${getPriorityBadge(p)}`}>
                {label}
              </span>
            </div>
          );
        },
      },
      {
        key: "assignee",
        visibilityKey: "assignee",
        label: "ASSIGNEE",
        className: "align-middle",
        render: (_, row) => {
          const a = row.assignee;
          if (!a) return <span className="text-sm text-gray-400">Unassigned</span>;
          return (
            <div className="flex items-center gap-2 py-0.5">
              <Avatar
                src={a.avatar || undefined}
                fallback={(a.name || "?").charAt(0).toUpperCase()}
                alt={a.name}
                size="sm"
                className="flex-shrink-0 bg-gray-600 text-white"
              />
              <span className="truncate text-xs font-semibold text-gray-900">{a.name}</span>
            </div>
          );
        },
      },
      {
        key: "dueDate",
        visibilityKey: "dueDate",
        label: "DUE DATE",
        className: "align-middle",
        render: (_, row) => (
          <div className={isTaskOverdue(row) ? "[&_.font-semibold]:text-red-700 [&_.text-gray-500]:text-red-600/90" : ""}>
            {row.scheduledDate ? (
              <TableCellCreated dateString={row.scheduledDate} dateMode="calendar" />
            ) : (
              <span className="text-sm text-gray-400">—</span>
            )}
          </div>
        ),
      },
      {
        key: "createdAt",
        visibilityKey: "createdAt",
        label: "CREATED",
        className: "align-middle",
        render: (_, row) => <TableCellCreated dateString={row.createdAt} />,
      },
      {
        key: "actions",
        label: "ACTIONS",
        resizable: false,
        defaultWidth: "130px",
        headerClassName: "whitespace-nowrap",
        className: "align-middle whitespace-nowrap",
        render: (_, row) => (
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-orange-600 hover:bg-orange-50"
              title="View task"
              onClick={() => router.push(`/tasks/${row.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-gray-500 hover:bg-gray-100"
              title="Copy link"
              onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/tasks/${row.id}`)}
            >
              <Link2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [router, commentCountsByTaskId, commentComposerMenu, openCommentComposer],
  );

  const visibleTaskColumns = useMemo(() => {
    const byKey = Object.fromEntries(allTaskColumns.map((c) => [c.key, c]));
    const out = [];
    if (byKey.name) out.push(byKey.name);
    for (const key of columnOrder) {
      const col = byKey[key];
      if (!col?.visibilityKey) continue;
      if (columnVisibility[col.visibilityKey] === false) continue;
      out.push(col);
    }
    if (byKey.actions) out.push(byKey.actions);
    return bindSortableColumns(out, SORTABLE_COLUMN_KEYS);
  }, [allTaskColumns, columnVisibility, columnOrder, bindSortableColumns]);

  const tabItems = [
    { key: "all", label: "All Tasks", badge: taskStats.all },
    { key: "todo", label: "To Do", badge: taskStats.todo },
    { key: "in-progress", label: "In Progress", badge: taskStats.inProgress },
    { key: "internal-review", label: "In Review", badge: taskStats.internalReview },
    { key: "done", label: "Done", badge: taskStats.done },
  ];

  // ── loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <PortalPageShell>
        <PageHeader title="Tasks" subtitle="Manage and track all your tasks" showSearch={false} showActions={false} />
        <Card variant="elevated" className="flex justify-center rounded-xl p-12">
          <LoadingSpinner size="lg" message="Loading tasks…" />
        </Card>
      </PortalPageShell>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <PortalPageShell>
      <PageHeader
        title="Tasks"
        subtitle="Manage and track all your tasks"
        showActions
        onExportClick={() =>
          exportItemsToCSV(sortedTasks, {
            filename: "client-portal-tasks_export.csv",
          })
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: "Total Tasks", count: taskStats.all, icon: CheckSquare },
          { label: "In Progress", count: taskStats.inProgress, icon: Clock },
          { label: "Completed", count: taskStats.done, icon: CheckCircle2 },
          { label: "Overdue", count: taskStats.overdue, icon: AlertCircle },
        ].map((card) => (
          <KPICard
            key={card.label}
            title={card.label}
            value={card.count.toString()}
            subtitle={card.count === 0 ? "No tasks" : `${card.count} ${card.count === 1 ? "task" : "tasks"}`}
            icon={card.icon}
            colorScheme="orange"
          />
        ))}
      </div>

      {/* Toolbar — tabs + sort + column picker (matches PM pattern) */}
      <div className="relative" ref={toolbarRef}>
        <TabsWithActions
          variant="glass"
          tabs={tabItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          afterTabs={
            <ViewToggleGroup aria-label="Task layout">
              <ViewToggleButton active={activeView === "table"} onClick={() => setActiveView("table")} title="Table view">
                <Table2 className="h-[18px] w-[18px]" />
              </ViewToggleButton>
              <ViewToggleButton active={activeView === "kanban"} onClick={() => setActiveView("kanban")} title="Kanban view">
                <Kanban className="h-[18px] w-[18px]" />
              </ViewToggleButton>
            </ViewToggleGroup>
          }
          showSearch
          searchPlaceholder="Search tasks..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showAdd
          onAddClick={openCreateTaskModal}
          addTitle="Add Task"
          showSort={activeView === "table"}
          onSortClick={() => { setColumnPickerOpen(false); setSortPickerOpen((o) => !o); }}
          hasActiveSort={hasActiveSort}
          sortTitle="Sort tasks"
          showColumnVisibility={activeView === "table"}
          onColumnVisibilityClick={() => { setSortPickerOpen(false); setColumnPickerOpen((o) => !o); }}
          columnVisibilityTitle="Show or hide columns"
        />

        {/* Sort dropdown */}
        <TableSortDropdown
          open={sortPickerOpen}
          sortRules={sortRules}
          columnOptions={SORT_COLUMN_OPTIONS}
          onAddRule={addSortRule}
          onRemoveRule={removeSortRule}
          onSetDirection={setRuleDirection}
          onMoveRule={moveSortRule}
          onClear={clearSort}
          maxRules={sortMaxRules}
        />

        {/* Column picker dropdown */}
        <TableColumnPicker
          open={columnPickerOpen}
          description="Task name and actions stay visible. Drag edges to resize."
          reorderableRows={TOGGLEABLE_COLUMNS}
          columnVisibility={columnVisibility}
          columnOrder={columnOrder}
          columnDropIndicator={columnDropIndicator}
          onSetVisible={setColumnVisible}
          onDragStart={handleColumnDragStart}
          onDragEnd={handleColumnDragEnd}
          onRowDragOver={handleColumnRowDragOver}
          onListDragLeave={handleColumnListDragLeave}
          onDrop={handleColumnDrop}
          onReset={resetColumnTablePreferences}
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing <span className="font-semibold text-gray-900">{sortedTasks.length}</span>{" "}
        result{sortedTasks.length !== 1 ? "s" : ""}
      </div>

      {/* ── Table view ────────────────────────────────────────────────────── */}
      {activeView === "table" && (
        sortedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-16">
            <CheckSquare className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-base font-semibold text-gray-700">No tasks found</p>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? "Try adjusting your search" : "Create a new task to get started"}
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4 gap-1.5"
              onClick={openCreateTaskModal}
            >
              <Plus className="h-4 w-4" /> Create task
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <Table
              columns={visibleTaskColumns}
              data={sortedTasks}
              keyField="id"
              variant="modernEmbedded"
              onRowClick={(row) => router.push(`/tasks/${row.id}`)}
              {...tableResizeProps}
            />
          </div>
        )
      )}

      {/* ── Kanban view ───────────────────────────────────────────────────── */}
      {activeView === "kanban" && (
        sortedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-16">
            <CheckSquare className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-base font-semibold text-gray-700">No tasks found</p>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? "Try adjusting your search" : "Create a new task to get started"}
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4 gap-1.5"
              onClick={openCreateTaskModal}
            >
              <Plus className="h-4 w-4" /> Create task
            </Button>
          </div>
        ) : (
          <KanbanBoard tasks={sortedTasks} router={router} />
        )
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        projects={taskProjectOptions}
        clientMembers={clientMembers}
        onTaskCreate={async (taskData) => {
          try {
            await handleCreateTask(taskData);
            setIsCreateTaskModalOpen(false);
          } catch (error) {
            console.error("Error creating task:", error);
            alert(error.message || "Failed to create task");
            throw error;
          }
        }}
      />

      {/* ── Inline row comment composer (matches PM pattern) ─────────────── */}
      {commentComposerMenu && (() => {
        const taskRow = sortedTasks.find((t) => t.id === commentComposerMenu.id) || tasks.find((t) => t.id === commentComposerMenu.id);
        if (!taskRow) return null;
        const taskComments = Array.isArray(commentsByTask[taskRow.id]) ? commentsByTask[taskRow.id] : [];
        return (
          <TableRowActionMenuPortal
            open
            anchor={{
              top: commentComposerMenu.top,
              left: commentComposerMenu.left,
              triggerEl: commentComposerMenu.triggerEl,
            }}
            onClose={closeCommentComposer}
            menuClassName="w-[360px] rounded-2xl border border-gray-200 bg-white p-0 shadow-2xl"
            menuWidthPx={360}
          >
            <div className="overflow-hidden rounded-2xl">
              {/* Header */}
              <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Comments</p>
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                    {taskComments.length}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-gray-500">{taskRow.name}</p>
              </div>

              {/* Comments list */}
              <div className="max-h-56 overflow-y-auto bg-gray-50/50 px-4 py-3">
                {taskComments.length > 0 ? (
                  <div className="relative">
                    <div
                      className="pointer-events-none absolute bottom-3 left-3 top-3 w-px bg-gradient-to-b from-orange-400/90 via-orange-200 to-gray-200"
                      aria-hidden
                    />
                    <ul className="relative m-0 list-none space-y-3 p-0 pr-1">
                      {taskComments.map((c) => {
                        const author = c.actor?.username || c.actor?.email || "You";
                        const text =
                          typeof c.meta === "string"
                            ? (() => { try { return JSON.parse(c.meta)?.comment || ""; } catch { return c.meta; } })()
                            : c.meta?.comment || c.content || "";
                        return (
                          <li key={c.id} className="relative flex gap-3">
                            <div className="relative z-[1] flex w-6 shrink-0 justify-center pt-0.5">
                              <Avatar
                                size="xs"
                                alt={author}
                                fallback={author.charAt(0).toUpperCase()}
                                className="shadow-sm ring-2 ring-white bg-gray-600 text-white"
                              />
                            </div>
                            <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
                              <div className="mb-1.5 flex flex-wrap items-center gap-x-2">
                                <p className="text-xs font-semibold text-gray-800">{author}</p>
                                <span className="text-xs text-gray-400">· {formatCommentTime(c.createdAt)}</span>
                              </div>
                              <p className="whitespace-pre-wrap break-words text-sm text-gray-700">{text}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-3 text-xs text-gray-500">
                    No comments yet. Start the thread.
                  </p>
                )}
              </div>

              {/* Compose */}
              <div className="space-y-2.5 border-t border-gray-100 bg-white px-4 py-3">
                {commentError && (
                  <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700">
                    {commentError}
                  </p>
                )}
                <Textarea
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  rows={2}
                  resize="none"
                  autoFocus
                  placeholder="Add a comment..."
                  className="rounded-xl border-orange-200 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-orange-500/20"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") { e.preventDefault(); closeCommentComposer(); }
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitTaskComment(); }
                  }}
                />
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-gray-400">Enter to post · Shift+Enter new line</p>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="muted" size="sm" onClick={closeCommentComposer}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={commentSubmitting || !commentDraft.trim()}
                      onClick={submitTaskComment}
                      className="gap-1.5"
                    >
                      {commentSubmitting ? (
                        <LoadingSpinner size="xs" />
                      ) : (
                        <SendHorizontal className="h-3.5 w-3.5" />
                      )}
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TableRowActionMenuPortal>
        );
      })()}
    </PortalPageShell>
  );
}
