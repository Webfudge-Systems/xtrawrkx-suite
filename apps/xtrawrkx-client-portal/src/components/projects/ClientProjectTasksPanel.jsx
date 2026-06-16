"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  Eye,
  Flag,
  Link2,
  Plus,
} from "lucide-react";
import {
  Avatar,
  Button,
  EmptyState,
  Table,
  TableCellCreated,
  TableCellTaskStatus,
  TableCellTitleSubtitle,
  TableSortDropdown,
  TabsWithActions,
  useTableSort,
} from "@webfudge/ui";
import { getTaskStatusLabel } from "@webfudge/utils";

const TABLE_SORT_STORAGE_KEY = "portal.projectTasks.tableSort";

const STATUS_TABS = [
  { id: "all", label: "All Tasks" },
  { id: "todo", label: "To Do" },
  { id: "in-progress", label: "In Progress" },
  { id: "internal-review", label: "In Review" },
  { id: "done", label: "Completed" },
  { id: "overdue", label: "Overdue" },
];

const SORT_COLUMN_OPTIONS = [
  { key: "name", label: "Task Name" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "dueDate", label: "Due Date" },
];

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

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
  if (!task?.scheduledDate) return false;
  const s = (task.strapiStatus || "").toUpperCase();
  if (["COMPLETED", "DONE", "CANCELLED", "APPROVED"].includes(s)) return false;
  return new Date(task.scheduledDate) < new Date();
}

function taskMatchesTab(task, tabId) {
  const s = (task.strapiStatus || "").toUpperCase();
  if (tabId === "all") return true;
  if (tabId === "todo") return ["ASSIGNED", "ACCEPTED", "SCHEDULED", "PLANNED"].includes(s);
  if (tabId === "in-progress") return s === "IN_PROGRESS" || s === "ACTIVE";
  if (tabId === "internal-review") {
    return ["PENDING_REVIEW", "IN_REVIEW", "INTERNAL_REVIEW", "REVISION_REQUIRED"].includes(s);
  }
  if (tabId === "done") return ["COMPLETED", "DONE", "APPROVED"].includes(s);
  if (tabId === "overdue") return isTaskOverdue(task);
  return true;
}

export default function ClientProjectTasksPanel({ tasks = [], onAddTask }) {
  const router = useRouter();
  const toolbarRef = useRef(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortPickerOpen, setSortPickerOpen] = useState(false);

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

  const tabCounts = useMemo(() => {
    const counts = { all: tasks.length };
    for (const tab of STATUS_TABS) {
      if (tab.id === "all") continue;
      counts[tab.id] = tasks.filter((t) => taskMatchesTab(t, tab.id)).length;
    }
    return counts;
  }, [tasks]);

  const tabsWithBadges = useMemo(
    () =>
      STATUS_TABS.map((tab) => ({
        key: tab.id,
        label: tab.label,
        badge: tabCounts[tab.id] || undefined,
      })),
    [tabCounts],
  );

  const filteredTasks = useMemo(() => {
    let list = tasks.filter((t) => taskMatchesTab(t, activeTab));
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((t) =>
      [t.name, t.description, t.assigneeName, t.assignee?.name]
        .some((v) => String(v || "").toLowerCase().includes(q)),
    );
  }, [tasks, activeTab, searchQuery]);

  const sortedTasks = useMemo(
    () =>
      sortData(filteredTasks, (row, key) => {
        if (key === "name") return (row.name || "").toLowerCase();
        if (key === "status") return (row.strapiStatus || "").toLowerCase();
        if (key === "priority") return PRIORITY_ORDER[(row.priority || "medium").toLowerCase()] ?? 2;
        if (key === "dueDate") return row.scheduledDate ? new Date(row.scheduledDate).getTime() : Infinity;
        return "";
      }),
    [filteredTasks, sortData],
  );

  useEffect(() => {
    if (!sortPickerOpen) return;
    const onDocMouseDown = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setSortPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [sortPickerOpen]);

  const copyTaskLink = async (task) => {
    await navigator.clipboard?.writeText(`${window.location.origin}/tasks/${task.id}`);
  };

  const taskColumns = useMemo(
    () => [
      {
        key: "name",
        label: "TASK NAME",
        className: "max-w-[24rem] align-top",
        render: (_, row) => {
          const initial = (row.name || "T").trim().charAt(0).toUpperCase();
          return (
            <div className="flex min-w-0 items-start gap-3">
              <Avatar
                fallback={initial}
                alt={row.name}
                size="sm"
                className="mt-0.5 shrink-0 bg-gray-600 text-white"
              />
              <button
                type="button"
                className="min-w-0 flex-1 text-left hover:text-orange-600"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/tasks/${row.id}`);
                }}
              >
                <TableCellTitleSubtitle title={row.name} subtitle={row.description || "No description"} />
              </button>
            </div>
          );
        },
      },
      {
        key: "status",
        label: "STATUS",
        render: (_, row) => (
          <TableCellTaskStatus
            status={row.strapiStatus}
            options={[
              {
                value: row.strapiStatus,
                label: getTaskStatusLabel(row.strapiStatus, { variant: "client", task: row }),
              },
            ]}
          />
        ),
      },
      {
        key: "priority",
        label: "PRIORITY",
        render: (_, row) => {
          const p = (row.priority || "medium").toLowerCase();
          const label = p.charAt(0).toUpperCase() + p.slice(1);
          return (
            <div className="flex items-center gap-1.5">
              <Flag className={`h-3.5 w-3.5 shrink-0 ${getPriorityFlagClass(p)}`} strokeWidth={2} />
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${getPriorityBadge(p)}`}>
                {label}
              </span>
            </div>
          );
        },
      },
      {
        key: "assignee",
        label: "ASSIGNEE",
        render: (_, row) =>
          row.assignee ? (
            <div className="flex items-center gap-2">
              <Avatar
                size="sm"
                alt={row.assignee.name}
                fallback={row.assignee.initials || row.assignee.name?.charAt(0)}
                className="bg-gray-600 text-white"
              />
              <span className="truncate text-sm text-gray-700">{row.assignee.name}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          ),
      },
      {
        key: "dueDate",
        label: "DUE DATE",
        render: (_, row) => (
          <div className={isTaskOverdue(row) ? "[&_.font-semibold]:text-red-700 [&_.text-gray-500]:text-red-600/90" : ""}>
            <TableCellCreated dateString={row.scheduledDate} dateMode="calendar" emptyLabel="—" />
          </div>
        ),
      },
      {
        key: "actions",
        label: "ACTIONS",
        className: "w-[100px]",
        render: (_, row) => (
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-teal-600 hover:bg-teal-50"
              title="View task"
              onClick={() => router.push(`/tasks/${row.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-orange-600 hover:bg-orange-50"
              title="Copy link"
              onClick={() => copyTaskLink(row)}
            >
              <Link2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [router],
  );

  const sortableColumns = useMemo(
    () => bindSortableColumns(taskColumns),
    [taskColumns, bindSortableColumns],
  );

  const showEmpty = sortedTasks.length === 0;
  const canAddOnEmpty = !searchQuery.trim() && activeTab === "all";

  return (
    <div className="space-y-3">
      <div className="relative" ref={toolbarRef}>
        <TabsWithActions
          variant="glass"
          tabs={tabsWithBadges}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search tasks..."
          showAdd
          onAddClick={onAddTask}
          addTitle="Add Task"
          showSort
          onSortClick={() => setSortPickerOpen((open) => !open)}
          hasActiveSort={hasActiveSort}
          sortTitle="Sort tasks"
        />
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
      </div>

      <div className="text-sm text-gray-600">
        Showing <span className="font-semibold text-gray-900">{sortedTasks.length}</span> result
        {sortedTasks.length !== 1 ? "s" : ""}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {showEmpty ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks found"
            description={
              searchQuery || activeTab !== "all"
                ? "Try adjusting filters or search"
                : "Create the first task for this project"
            }
            action={
              canAddOnEmpty ? (
                <Button variant="primary" onClick={onAddTask} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
              ) : null
            }
          />
        ) : (
          <Table
            columns={sortableColumns}
            data={sortedTasks}
            keyField="id"
            variant="modernEmbedded"
            onRowClick={(row) => router.push(`/tasks/${row.id}`)}
          />
        )}
      </div>
    </div>
  );
}
