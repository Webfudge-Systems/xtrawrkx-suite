"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  FolderOpen,
  Eye,
  CheckCircle,
  Plus,
  Table2,
  Kanban,
  ListTodo,
  PlayCircle,
  Link2,
  Lock,
  MessageSquarePlus,
  SendHorizontal,
} from "lucide-react";
import {
  KPICard,
  TabsWithActions,
  Table,
  Button,
  Card,
  Pagination,
  TableCellProjectStatus,
  TableCellTitleSubtitle,
  TableCellCreated,
  TableColumnPicker,
  ViewToggleGroup,
  ViewToggleButton,
  useTableColumnPreferences,
  useTableSort,
  TableSortDropdown,
  Avatar,
  ProgressBar,
  LoadingSpinner,
  Textarea,
  TableRowActionMenuPortal,
  ownerDisplayFromUser,
  PROJECT_STATUS_OPTIONS,
} from "@webfudge/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { PortalPageShell } from "@/components/layout/PortalPageShell";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import { useSession } from "@/lib/auth";
import { exportItemsToCSV } from "@/lib/exportUtils";
import { buildProjectSlug } from "@/lib/projectUtils";
import {
  listProjectsForClient,
  createClientProject,
} from "@/lib/api/clientProjectService";
import { resolveClientAccountId } from "@/lib/clientAccountId";
import {
  addClientProjectComment,
  fetchClientProjectComments,
  fetchClientProjectCommentCounts,
} from "@/lib/api/clientProjectActivityService";

// ─── constants (aligned with PM projects list) ───────────────────────────────

const COLUMN_VISIBILITY_STORAGE_KEY = "portal.projects.tableColumnVisibility";
const COLUMN_ORDER_STORAGE_KEY = "portal.projects.tableColumnOrder";
const COLUMN_WIDTHS_STORAGE_KEY = "portal.projects.tableColumnWidths.v3";
const TABLE_SORT_STORAGE_KEY = "portal.projects.tableSort";

const STATUS_TABS = [
  { key: "all", label: "All Projects" },
  { key: "ACTIVE", label: "Active" },
  { key: "PLANNING", label: "Planning" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "ON_HOLD", label: "On Hold" },
  { key: "COMPLETED", label: "Completed" },
];

const TOGGLEABLE_COLUMNS = [
  { key: "status", label: "Status" },
  { key: "progress", label: "Progress %" },
  { key: "projectManager", label: "Owner" },
  { key: "endDate", label: "Due date" },
  { key: "startDate", label: "Start date" },
  { key: "tasks", label: "Tasks (done / total)" },
  { key: "team", label: "Team" },
  { key: "budget", label: "Budget" },
  { key: "description", label: "Description" },
  { key: "createdAt", label: "Created" },
  { key: "updatedAt", label: "Last updated" },
];

const DEFAULT_ON_COLUMNS = new Set(["status", "progress", "projectManager", "endDate"]);
const DEFAULT_COLUMN_VISIBILITY = TOGGLEABLE_COLUMNS.reduce((acc, { key }) => {
  acc[key] = DEFAULT_ON_COLUMNS.has(key);
  return acc;
}, {});
const REORDERABLE_COLUMN_KEYS = TOGGLEABLE_COLUMNS.map((c) => c.key);

const DEFAULT_COLUMN_WIDTHS = {
  name: 280,
  status: 170,
  progress: 150,
  projectManager: 200,
  endDate: 130,
  startDate: 130,
  tasks: 110,
  team: 130,
  budget: 120,
  description: 200,
  createdAt: 120,
  updatedAt: 120,
  actions: 130,
};
const MIN_COLUMN_WIDTHS = { actions: 120 };

const SORT_COLUMN_OPTIONS = [
  { key: "name", label: "Project name" },
  { key: "status", label: "Status" },
  { key: "progress", label: "Progress" },
  { key: "projectManager", label: "Owner" },
  { key: "endDate", label: "Due date" },
  { key: "startDate", label: "Start date" },
  { key: "tasks", label: "Tasks" },
  { key: "budget", label: "Budget" },
  { key: "description", label: "Description" },
  { key: "createdAt", label: "Created" },
  { key: "updatedAt", label: "Last updated" },
];

const SORTABLE_COLUMN_KEYS = SORT_COLUMN_OPTIONS.map((o) => o.key);

const PROJECT_STATUS_ORDER = {
  PLANNING: 1,
  ACTIVE: 2,
  IN_PROGRESS: 3,
  ON_HOLD: 4,
  COMPLETED: 5,
  CANCELLED: 6,
};

const KANBAN_STATUSES = PROJECT_STATUS_OPTIONS.filter((o) => o.value !== "CANCELLED");
const PAGE_SIZE = 12;

function formatCommentTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function actorDisplay(actor) {
  if (!actor || typeof actor !== "object") return "Unknown";
  return actor.username || actor.name || actor.email || "Unknown";
}

function commentTextFromMeta(meta) {
  if (meta == null) return "";
  if (typeof meta === "string") {
    try {
      const parsed = JSON.parse(meta);
      return typeof parsed?.comment === "string" ? parsed.comment : "";
    } catch {
      return meta;
    }
  }
  if (typeof meta === "object" && typeof meta.comment === "string") {
    return meta.comment;
  }
  return "";
}

const TEAM_STACK_RINGS = [
  "ring-2 ring-sky-400 ring-offset-[2px] ring-offset-white",
  "ring-2 ring-amber-400 ring-offset-[2px] ring-offset-white",
  "ring-2 ring-rose-400 ring-offset-[2px] ring-offset-white",
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function isProjectOverdue(project) {
  if (!project?.endDate) return false;
  const due = new Date(project.endDate);
  if (Number.isNaN(due.getTime())) return false;
  const st = (project.strapiStatus || project.status || "").toUpperCase();
  return due < new Date() && st !== "COMPLETED" && st !== "CANCELLED";
}

function TeamAvatarStack({ members, maxShown = 4, className }) {
  const list = Array.isArray(members) ? members.filter(Boolean) : [];
  if (!list.length) return <span className={clsx("text-xs text-gray-400", className)}>—</span>;
  const shown = list.slice(0, maxShown);
  const overflow = list.length - shown.length;
  return (
    <div className={clsx("flex items-center pt-0.5", className)} title={list.map((m) => m.name).join(", ")}>
      {shown.map((m, i) => {
        const derived = ownerDisplayFromUser(m);
        return (
          <Avatar
            key={m.id ?? `t-${i}`}
            src={m.avatar || undefined}
            alt={derived.label}
            fallback={derived.avatarFallback}
            size="sm"
            className={clsx(
              "relative border-2 border-white bg-gray-600 text-white",
              TEAM_STACK_RINGS[i % TEAM_STACK_RINGS.length],
              i > 0 && "-ml-2"
            )}
            style={{ zIndex: 10 + i }}
          />
        );
      })}
      {overflow > 0 ? (
        <span
          className="-ml-2 inline-flex h-7 min-w-[1.625rem] items-center justify-center rounded-full border-2 border-white bg-gray-200 px-1 text-[10px] font-bold text-gray-800 ring-2 ring-gray-300 ring-offset-2 ring-offset-white"
          style={{ zIndex: 20 + shown.length }}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

function KanbanProjectCard({ project, router }) {
  const overdue = isProjectOverdue(project);
  return (
    <div
      onClick={() => router.push(`/projects/${project.slug || project.id}`)}
      className="cursor-pointer rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
    >
      <p className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-orange-600">
        {project.name}
      </p>
      {project.description ? (
        <p className="mt-1 line-clamp-2 text-xs text-gray-500">{project.description}</p>
      ) : null}
      <div className="mt-2.5">
        <ProgressBar value={project.progress || 0} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
        <span>{project.managerName || "Unassigned"}</span>
        {project.endDate ? (
          <span className={overdue ? "font-semibold text-red-600" : ""}>
            {new Date(project.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ProjectsKanbanView({ projects, router }) {
  const byStatus = useMemo(() => {
    const map = {};
    KANBAN_STATUSES.forEach((s) => { map[s.value] = []; });
    for (const p of projects) {
      const k = p.strapiStatus && map[p.strapiStatus] != null ? p.strapiStatus : "PLANNING";
      map[k].push(p);
    }
    return map;
  }, [projects]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
      {KANBAN_STATUSES.map(({ value, label }) => {
        const col = byStatus[value] || [];
        return (
          <div
            key={value}
            className="flex min-h-[380px] min-w-[272px] max-w-[300px] shrink-0 flex-col rounded-2xl border border-gray-200 bg-gray-50/60"
          >
            <div className="flex items-center justify-between rounded-t-2xl border-b border-gray-200 bg-white px-4 py-3">
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-gray-700">{label}</h3>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700">{col.length}</span>
            </div>
            <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3">
              {col.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white/40 p-4 text-center">
                  <p className="text-[11px] text-gray-400">No projects</p>
                </div>
              ) : (
                col.map((p) => <KanbanProjectCard key={p.id} project={p} router={router} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

async function resolveAccountId(session) {
  return resolveClientAccountId(session);
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeView, setActiveView] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortPickerOpen, setSortPickerOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [commentComposerMenu, setCommentComposerMenu] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentsByProject, setCommentsByProject] = useState({});
  const [commentCountsByProjectId, setCommentCountsByProjectId] = useState({});
  const [commentLoadingProjectId, setCommentLoadingProjectId] = useState(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");

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

  const loadProjects = useCallback(async () => {
    if (!session) return;
    try {
      setLoading(true);
      const accountId = await resolveAccountId(session);
      if (!accountId) {
        setProjects([]);
        return;
      }
      const rows = await listProjectsForClient(accountId);
      setProjects(rows);
    } catch (e) {
      console.error("Error fetching projects:", e);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const ids = projects.map((p) => p?.id).filter(Boolean);
    if (!ids.length) return;
    let cancelled = false;
    (async () => {
      try {
        const counts = await fetchClientProjectCommentCounts({ projectIds: ids });
        if (!cancelled) setCommentCountsByProjectId((prev) => ({ ...prev, ...counts }));
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, [projects]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

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

  const handleCreateProject = async (projectInput) => {
    const slug = buildProjectSlug(projectInput.name);
    const payload = {
      name: projectInput.name,
      slug,
      description: projectInput.description || "",
      status: projectInput.status || "PLANNING",
      icon: projectInput.name.charAt(0).toUpperCase() || "P",
    };
    if (projectInput.startDate) {
      payload.startDate = new Date(`${projectInput.startDate}T00:00:00`).toISOString();
    }
    if (projectInput.endDate) {
      payload.endDate = new Date(`${projectInput.endDate}T00:00:00`).toISOString();
    }
    await createClientProject(payload);
    await loadProjects();
  };

  const copyProjectLink = useCallback(async (project) => {
    const href = `${window.location.origin}/projects/${project.slug || project.id}`;
    await navigator.clipboard?.writeText(href);
  }, []);

  const openCommentComposer = useCallback(async (projectId, anchor) => {
    setCommentComposerMenu(anchor ? { id: projectId, ...anchor } : { id: projectId });
    setCommentDraft("");
    setCommentError("");
    setCommentLoadingProjectId(projectId);
    try {
      const res = await fetchClientProjectComments({ projectId, limit: 20 });
      setCommentsByProject((prev) => ({ ...prev, [projectId]: res?.data || [] }));
    } catch (e) {
      setCommentError(e?.message || "Could not load comments");
      setCommentsByProject((prev) => ({ ...prev, [projectId]: prev[projectId] || [] }));
    } finally {
      setCommentLoadingProjectId(null);
    }
  }, []);

  const closeCommentComposer = useCallback(() => {
    setCommentComposerMenu(null);
    setCommentDraft("");
    setCommentError("");
  }, []);

  const submitProjectComment = useCallback(async () => {
    const projectId = commentComposerMenu?.id;
    const text = commentDraft.trim();
    if (!projectId || !text) return;
    setCommentSubmitting(true);
    setCommentError("");
    try {
      const res = await addClientProjectComment({ projectId, comment: text });
      const newComment = res?.data;
      if (newComment) {
        setCommentsByProject((prev) => ({
          ...prev,
          [projectId]: [newComment, ...(Array.isArray(prev[projectId]) ? prev[projectId] : [])],
        }));
      }
      setCommentCountsByProjectId((prev) => ({
        ...prev,
        [String(projectId)]: Math.max(
          1,
          (Number(prev[String(projectId)] || prev[projectId] || 0)) + (newComment ? 1 : 0)
        ),
      }));
      setCommentDraft("");
    } catch (e) {
      setCommentError(e?.message || "Could not post comment");
    } finally {
      setCommentSubmitting(false);
    }
  }, [commentComposerMenu, commentDraft]);

  const tabCounts = useMemo(() => {
    const counts = { all: projects.length };
    for (const p of projects) {
      const st = p.strapiStatus || "PLANNING";
      counts[st] = (counts[st] || 0) + 1;
    }
    return counts;
  }, [projects]);

  const projectKpis = useMemo(() => {
    let active = 0, inProgress = 0, completed = 0;
    for (const p of projects) {
      if (p.strapiStatus === "ACTIVE") active++;
      if (p.strapiStatus === "IN_PROGRESS") inProgress++;
      if (p.strapiStatus === "COMPLETED") completed++;
    }
    return { total: projects.length, active, inProgress, completed };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (activeTab !== "all") {
      list = list.filter((p) => p.strapiStatus === activeTab);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.managerName?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [projects, activeTab, searchQuery]);

  const sortedProjects = useMemo(
    () =>
      sortData(filteredProjects, (row, key) => {
        if (key === "name") return (row.name || "").toLowerCase();
        if (key === "status") return PROJECT_STATUS_ORDER[row.strapiStatus] ?? 99;
        if (key === "progress") return Number(row.progress) || 0;
        if (key === "projectManager") return (row.managerName || "").toLowerCase();
        if (key === "endDate") return row.endDate ? new Date(row.endDate).getTime() : Infinity;
        if (key === "startDate") return row.startDate ? new Date(row.startDate).getTime() : 0;
        if (key === "tasks") {
          const total = row.totalTasks || 0;
          return total > 0 ? (row.completedTasks || 0) / total : -1;
        }
        if (key === "budget") return Number(row.budget) || 0;
        if (key === "description") return (row.description || "").toLowerCase();
        if (key === "createdAt") return row.createdAt ? new Date(row.createdAt).getTime() : 0;
        if (key === "updatedAt") return row.updatedAt ? new Date(row.updatedAt).getTime() : 0;
        return "";
      }),
    [filteredProjects, sortData]
  );

  const totalPages = Math.max(1, Math.ceil(sortedProjects.length / PAGE_SIZE));
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedProjects.slice(start, start + PAGE_SIZE);
  }, [sortedProjects, currentPage]);

  const tabsWithBadges = STATUS_TABS.map((tab) => ({
    ...tab,
    badge: tabCounts[tab.key] ?? 0,
  }));

  const allProjectColumns = useMemo(
    () => [
      {
        key: "name",
        label: "PROJECT NAME",
        className: "align-top",
        render: (_, row) => {
          const initial = (row.name || "P").trim().charAt(0).toUpperCase();
          const commentCount = Number(commentCountsByProjectId[String(row.id)] || 0);
          return (
            <div className="group flex min-w-0 max-w-full items-start gap-3">
              <Avatar fallback={initial} alt={row.name} size="sm" className="flex-shrink-0 bg-gray-600 text-white" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/projects/${row.slug || row.id}`)}
                    className="min-w-0 flex-1 text-left hover:text-orange-600"
                  >
                    <TableCellTitleSubtitle
                      title={
                        <span className="inline-flex items-center gap-1.5">
                          {row.name}
                          {row.isPrivate ? (
                            <Lock className="inline h-3 w-3 shrink-0 text-gray-400" title="Private project" />
                          ) : null}
                        </span>
                      }
                      subtitle={row.description || "No description"}
                    />
                  </button>
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
                    title="Add comment"
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                    {commentCount > 0 ? (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white" />
                    ) : null}
                  </button>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: "status",
        visibilityKey: "status",
        label: "STATUS",
        className: "align-middle",
        render: (_, row) => <TableCellProjectStatus status={row.strapiStatus} compact />,
      },
      {
        key: "progress",
        visibilityKey: "progress",
        label: "PROGRESS %",
        className: "align-middle",
        render: (_, row) => <ProgressBar value={row.progress || 0} />,
      },
      {
        key: "projectManager",
        visibilityKey: "projectManager",
        label: "OWNER",
        className: "align-middle",
        render: (_, row) => {
          const pm = row.projectManager;
          const derived = ownerDisplayFromUser(pm);
          const label = pm?.name || "—";
          return (
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar
                src={pm?.avatar || undefined}
                fallback={pm ? derived.avatarFallback : "?"}
                alt={label}
                size="sm"
                className={`flex-shrink-0 text-white ${pm ? "bg-gray-600" : "bg-gray-300 text-gray-600"}`}
              />
              <span className="min-w-0 truncate text-xs font-semibold text-gray-900">{label}</span>
            </div>
          );
        },
      },
      {
        key: "endDate",
        visibilityKey: "endDate",
        label: "DUE DATE",
        className: "align-middle",
        render: (_, row) => (
          <div className={isProjectOverdue(row) ? "[&_.font-semibold]:text-red-700 [&_.text-gray-500]:text-red-600/90" : ""}>
            <TableCellCreated dateString={row.endDate} dateMode="calendar" emptyLabel="—" />
          </div>
        ),
      },
      {
        key: "startDate",
        visibilityKey: "startDate",
        label: "START",
        className: "align-middle",
        render: (_, row) => <TableCellCreated dateString={row.startDate} dateMode="calendar" emptyLabel="—" />,
      },
      {
        key: "tasks",
        visibilityKey: "tasks",
        label: "TASKS",
        className: "align-middle",
        render: (_, row) => (
          <span className="text-xs font-semibold tabular-nums text-gray-800">
            {row.completedTasks ?? 0}/{row.totalTasks ?? 0}
          </span>
        ),
      },
      {
        key: "team",
        visibilityKey: "team",
        label: "TEAM",
        className: "align-middle",
        render: (_, row) => <TeamAvatarStack members={row.teamMembers ?? row.team ?? []} />,
      },
      {
        key: "budget",
        visibilityKey: "budget",
        label: "BUDGET",
        className: "align-middle",
        render: (_, row) =>
          row.budget != null && row.budget !== "" ? (
            <span className="text-xs font-semibold tabular-nums text-gray-800">
              {Number(row.budget).toLocaleString("en-IN")}
            </span>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          ),
      },
      {
        key: "description",
        visibilityKey: "description",
        label: "DESCRIPTION",
        className: "align-middle max-w-xs",
        render: (_, row) => (
          <p className="line-clamp-2 text-sm text-gray-600">{row.description || "—"}</p>
        ),
      },
      {
        key: "createdAt",
        visibilityKey: "createdAt",
        label: "CREATED",
        className: "align-middle",
        render: (_, row) => <TableCellCreated dateString={row.createdAt} dateMode="calendar" />,
      },
      {
        key: "updatedAt",
        visibilityKey: "updatedAt",
        label: "UPDATED",
        className: "align-middle",
        render: (_, row) => <TableCellCreated dateString={row.updatedAt} dateMode="calendar" />,
      },
      {
        key: "actions",
        label: "ACTIONS",
        resizable: false,
        headerClassName: "whitespace-nowrap",
        className: "align-middle whitespace-nowrap",
        render: (_, row) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="rounded-lg p-1.5 text-orange-600 transition-colors hover:bg-orange-50"
              title="View project"
              onClick={() => router.push(`/projects/${row.slug || row.id}`)}
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              title="Copy link"
              onClick={() => copyProjectLink(row)}
            >
              <Link2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [router, copyProjectLink, commentCountsByProjectId, commentComposerMenu, openCommentComposer]
  );

  const visibleProjectColumns = useMemo(() => {
    const byKey = Object.fromEntries(allProjectColumns.map((c) => [c.key, c]));
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
  }, [allProjectColumns, columnOrder, columnVisibility, bindSortableColumns]);

  const projectViewSwitcher = (
    <ViewToggleGroup aria-label="Project layout">
      <ViewToggleButton active={activeView === "list"} title="List view" onClick={() => setActiveView("list")}>
        <Table2 className="h-4 w-4" />
      </ViewToggleButton>
      <ViewToggleButton active={activeView === "kanban"} title="Kanban view" onClick={() => setActiveView("kanban")}>
        <Kanban className="h-4 w-4" />
      </ViewToggleButton>
    </ViewToggleGroup>
  );

  return (
    <PortalPageShell>
      <PageHeader
        title="Projects"
        subtitle="Manage and track all your projects"
        showActions
        onExportClick={() =>
          exportItemsToCSV(sortedProjects, {
            filename: "client-portal-projects_export.csv",
          })
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Projects" value={String(projectKpis.total)} icon={FolderOpen} colorScheme="orange" />
        <KPICard title="Active" value={String(projectKpis.active)} icon={ListTodo} colorScheme="orange" />
        <KPICard title="In Progress" value={String(projectKpis.inProgress)} icon={PlayCircle} colorScheme="orange" />
        <KPICard title="Completed" value={String(projectKpis.completed)} icon={CheckCircle} colorScheme="orange" />
      </div>

      <div className="relative" ref={toolbarRef}>
        <TabsWithActions
          variant="glass"
          tabs={tabsWithBadges}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          afterTabs={projectViewSwitcher}
          showSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search projects..."
          showAdd
          onAddClick={() => setIsCreateProjectModalOpen(true)}
          addTitle="Create project"
          showColumnVisibility={activeView === "list"}
          onColumnVisibilityClick={() => setColumnPickerOpen((o) => !o)}
          columnVisibilityTitle="Show / hide columns"
          showSort={activeView === "list"}
          onSortClick={() => setSortPickerOpen((o) => !o)}
          sortActive={hasActiveSort}
        />
        <TableColumnPicker
          open={columnPickerOpen && activeView === "list"}
          description="Project name and actions always stay visible. Drag to reorder columns."
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
        <TableSortDropdown
          open={sortPickerOpen && activeView === "list"}
          columnOptions={SORT_COLUMN_OPTIONS}
          sortRules={sortRules}
          maxRules={sortMaxRules}
          onAddRule={addSortRule}
          onRemoveRule={removeSortRule}
          onSetDirection={setRuleDirection}
          onMoveRule={moveSortRule}
          onClear={clearSort}
        />
      </div>

      <p className="text-sm text-gray-600">
        Showing <span className="font-semibold text-gray-900">{filteredProjects.length}</span> result
        {filteredProjects.length !== 1 ? "s" : ""}
      </p>

      {loading ? (
        <Card variant="elevated" className="flex justify-center rounded-xl p-12">
          <LoadingSpinner message="Loading projects..." />
        </Card>
      ) : activeView === "kanban" ? (
        filteredProjects.length === 0 ? (
          <Card variant="elevated" className="rounded-xl p-12 text-center">
            <FolderOpen className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="font-medium text-gray-700">No projects found</p>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || activeTab !== "all" ? "Try adjusting your filters" : "Get started by creating your first project"}
            </p>
            {!searchQuery && activeTab === "all" ? (
              <Button type="button" className="mt-4 gap-2" onClick={() => setIsCreateProjectModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            ) : null}
          </Card>
        ) : (
          <ProjectsKanbanView projects={sortedProjects} router={router} />
        )
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <Table
              columns={visibleProjectColumns}
              data={paginatedProjects}
              keyField="id"
              variant="modernEmbedded"
              {...tableResizeProps}
              onRowClick={(row) => router.push(`/projects/${row.slug || row.id}`)}
            />
            {paginatedProjects.length === 0 ? (
              <div className="border-t border-gray-200 p-12 text-center">
                <FolderOpen className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="font-medium text-gray-700">No projects found</p>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery || activeTab !== "all" ? "Try adjusting your filters" : "Get started by creating your first project"}
                </p>
                {!searchQuery && activeTab === "all" ? (
                  <Button type="button" className="mt-4 gap-2" onClick={() => setIsCreateProjectModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Create Project
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
          {sortedProjects.length > PAGE_SIZE ? (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={sortedProjects.length}
              itemsPerPage={PAGE_SIZE}
            />
          ) : null}
        </>
      )}

      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onProjectCreate={handleCreateProject}
      />

      {commentComposerMenu && (() => {
        const projectRow =
          paginatedProjects.find((p) => p.id === commentComposerMenu.id) ||
          sortedProjects.find((p) => p.id === commentComposerMenu.id) ||
          projects.find((p) => p.id === commentComposerMenu.id);
        if (!projectRow) return null;
        const projectComments = Array.isArray(commentsByProject[projectRow.id])
          ? commentsByProject[projectRow.id]
          : [];
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
              <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Comments</p>
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                    {projectComments.length}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-gray-500">{projectRow.name || "Project"}</p>
              </div>

              <div className="max-h-56 overflow-y-auto bg-gray-50/50 px-4 py-3">
                {commentLoadingProjectId === projectRow.id ? (
                  <div className="py-4">
                    <LoadingSpinner size="sm" message="Loading comments..." />
                  </div>
                ) : projectComments.length > 0 ? (
                  <ul className="relative m-0 list-none space-y-3 p-0 pr-1">
                    {projectComments.map((cRow) => (
                      <li key={cRow.id} className="relative flex gap-3">
                        <div className="relative z-[1] flex w-6 shrink-0 justify-center pt-0.5">
                          <Avatar
                            size="xs"
                            alt={actorDisplay(cRow.actor)}
                            fallback={actorDisplay(cRow.actor).charAt(0).toUpperCase()}
                            className="bg-gray-600 text-white shadow-sm ring-2 ring-white"
                          />
                        </div>
                        <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
                          <div className="mb-1.5 flex flex-wrap items-center gap-x-2">
                            <p className="text-xs font-semibold text-gray-800">{actorDisplay(cRow.actor)}</p>
                            <span className="text-xs text-gray-400">· {formatCommentTime(cRow.createdAt)}</span>
                          </div>
                          <p className="whitespace-pre-wrap break-words text-sm text-gray-700">
                            {commentTextFromMeta(cRow.meta)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-3 text-xs text-gray-500">
                    No comments yet. Start the thread.
                  </p>
                )}
              </div>

              <div className="space-y-2.5 border-t border-gray-100 bg-white px-4 py-3">
                {commentError ? (
                  <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700">
                    {commentError}
                  </p>
                ) : null}
                <Textarea
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  rows={2}
                  resize="none"
                  autoFocus
                  placeholder="Add a comment..."
                  className="rounded-xl border-orange-200 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-orange-500/20"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      closeCommentComposer();
                    }
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitProjectComment();
                    }
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
                      onClick={submitProjectComment}
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
