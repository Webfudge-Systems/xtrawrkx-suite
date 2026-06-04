'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Avatar,
  Button,
  LoadingSpinner,
  Select,
  Table,
  TableCellCreated,
  TableCellTitleSubtitle,
  TableEmptyBelow,
  TableRowActionMenuPortal,
  TableSkeleton,
  TabsWithActions,
  Textarea,
  ChatMessageText,
  ownerDisplayFromUser,
  TableCellTaskStatusSelect,
  PM_TASK_STATUS_OPTIONS,
} from '@webfudge/ui';
import {
  CheckSquare,
  Copy,
  Edit3,
  Eye,
  Link2,
  MessageSquarePlus,
  Pencil,
  Plus,
  SendHorizontal,
  Trash2,
} from 'lucide-react';
import PMRowActions from './PMRowActions';
import { TaskSubtasksAfterRow, TaskSubtasksToggleButton } from './TaskSubtasksTableExtras';
import TaskAssigneesPicker from './TaskAssigneesPicker';
import {
  pmTableSelectFillProps,
  PRIORITY_OPTIONS,
} from './PMStatusBadge';
import taskService from '../lib/api/taskService';
import taskCommentService from '../lib/api/taskCommentService';
import { usePmTableSort } from '../hooks/usePmTableSort';
import { TableSortDropdown as PmTableSortDropdown } from '@webfudge/ui';
import { isTaskDueOverdue } from '@webfudge/utils';

const TABLE_SORT_STORAGE_KEY = 'pm.projectTasks.tableSort';

const STATUS_TABS = [
  { id: 'all', label: 'All Tasks' },
  { id: 'SCHEDULED', label: 'To Do' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'INTERNAL_REVIEW', label: 'In Review' },
  { id: 'ON_HOLD', label: 'On Hold' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'OVERDUE', label: 'Overdue' },
];

function assignerStrapiShape(row, users) {
  const u = users.find((x) => Number(x.id) === Number(row.assignerId));
  if (!u) return null;
  const parts = (u.name || '').trim().split(/\s+/);
  return {
    id: u.id,
    name: u.name,
    avatar: u.avatar,
    firstName: u.firstName || parts[0] || '',
    lastName: u.lastName || parts.slice(1).join(' ') || '',
    email: u.email || '',
    username: u.name || u.email || '',
  };
}

function assignerTableLabel(row, assignerUser, derived) {
  const a = row.assignerName && String(row.assignerName).trim();
  if (a) return a;
  if (assignerUser?.name?.trim()) return assignerUser.name.trim();
  if (assignerUser?.email?.trim()) return assignerUser.email.trim();
  const lbl = derived?.label;
  if (lbl && lbl !== 'Unassigned') return lbl;
  if (row.assignerId != null) return `User ${row.assignerId}`;
  return '';
}

function isTaskOverdue(task) {
  return isTaskDueOverdue(task?.dueDate, task?.strapiStatus);
}

function actorDisplay(actor) {
  if (!actor || typeof actor !== 'object') return 'Unknown user';
  if (actor.username) return actor.username;
  if (actor.email) return actor.email;
  if (actor.id != null) return `User ${actor.id}`;
  return 'Unknown user';
}

function commentTextFromMeta(meta) {
  if (meta == null) return '';
  if (typeof meta === 'string') {
    try {
      const parsed = JSON.parse(meta);
      return typeof parsed?.comment === 'string' ? parsed.comment : '';
    } catch {
      return '';
    }
  }
  if (typeof meta === 'object' && typeof meta.comment === 'string') {
    return meta.comment;
  }
  return '';
}

function formatCommentTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Project detail — Tasks tab: same patterns as /my-tasks (inline status/priority/assignee, comments), without Project column.
 */
export default function ProjectTasksPanel({
  tasks,
  tasksLoading,
  users,
  onRefresh,
  onAddTask,
  /** Open create-task flow with parent set (e.g. from inline subtasks row). */
  onOpenCreateSubtask,
  onEditTask,
  onDeleteTask,
  /** Org Member role: only status updates; hide task CRUD. */
  memberScopedTasks = false,
  /** Project team member may create tasks (including org Members on the team). */
  canCreateProjectTasks = true,
  /** Org admin/manager may approve pending member assignments. */
  canApproveAssignments = false,
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [expandedSubtaskParents, setExpandedSubtaskParents] = useState(() => new Set());
  const [commentComposerMenu, setCommentComposerMenu] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentsByTask, setCommentsByTask] = useState({});
  const [commentCountsByTaskId, setCommentCountsByTaskId] = useState({});
  const [commentLoadingTaskId, setCommentLoadingTaskId] = useState(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [sortPickerOpen, setSortPickerOpen] = useState(false);
  const toolbarRef = useRef(null);

  const handleApproveAssignment = useCallback(
    async (task) => {
      try {
        setSavingId(task.id);
        await taskService.approveTaskAssignment(task.id);
        await onRefresh?.();
      } catch (error) {
        console.error('Approve assignment error:', error);
      } finally {
        setSavingId(null);
      }
    },
    [onRefresh]
  );

  const handleRejectAssignment = useCallback(
    async (task) => {
      try {
        setSavingId(task.id);
        await taskService.rejectTaskAssignment(task.id);
        await onRefresh?.();
      } catch (error) {
        console.error('Reject assignment error:', error);
      } finally {
        setSavingId(null);
      }
    },
    [onRefresh]
  );

  const updateTask = useCallback(
    async (task, patch) => {
      let next = patch;
      if (memberScopedTasks) {
        next = {};
        if (patch.status !== undefined) next.status = patch.status;
        if (Object.keys(next).length === 0) return;
      }
      try {
        setSavingId(task.id);
        await taskService.updateTask(task.id, next);
        await onRefresh?.();
      } catch (error) {
        console.error('Update task error:', error);
      } finally {
        setSavingId(null);
      }
    },
    [memberScopedTasks, onRefresh]
  );

  const copyTaskLink = useCallback(async (task) => {
    await navigator.clipboard?.writeText(`${window.location.origin}/tasks/${task.id}`);
  }, []);

  const openCommentComposer = useCallback(async (taskId, anchor) => {
    setCommentComposerMenu(anchor ? { id: taskId, ...anchor } : { id: taskId });
    setCommentDraft('');
    setCommentError('');
    setCommentLoadingTaskId(taskId);
    try {
      const res = await taskCommentService.fetchTaskComments({ taskId, limit: 20 });
      setCommentsByTask((prev) => ({ ...prev, [taskId]: res?.data || [] }));
    } catch (e) {
      setCommentError(e?.message || 'Could not load comments');
      setCommentsByTask((prev) => ({ ...prev, [taskId]: prev[taskId] || [] }));
    } finally {
      setCommentLoadingTaskId(null);
    }
  }, []);

  const closeCommentComposer = useCallback(() => {
    setCommentComposerMenu(null);
    setCommentDraft('');
    setCommentError('');
  }, []);

  const submitTaskComment = useCallback(async () => {
    const taskId = commentComposerMenu?.id;
    const text = commentDraft.trim();
    if (!taskId || !text) return;
    setCommentSubmitting(true);
    setCommentError('');
    try {
      const res = await taskCommentService.addTaskComment({ taskId, comment: text });
      const newComment = res?.data;
      if (newComment) {
        setCommentsByTask((prev) => ({
          ...prev,
          [taskId]: [newComment, ...(Array.isArray(prev[taskId]) ? prev[taskId] : [])],
        }));
      }
      setCommentCountsByTaskId((prev) => ({
        ...prev,
        [String(taskId)]: Math.max(
          1,
          (parseInt(prev[String(taskId)] || prev[taskId] || 0, 10) || 0) + 1
        ),
      }));
      setCommentDraft('');
    } catch (e) {
      setCommentError(e?.message || 'Could not post comment');
    } finally {
      setCommentSubmitting(false);
    }
  }, [commentComposerMenu, commentDraft]);

  const filteredTasks = useMemo(() => {
    let list = [...tasks];
    if (activeTab !== 'all') {
      if (activeTab === 'OVERDUE') list = list.filter(isTaskOverdue);
      else list = list.filter((task) => task.strapiStatus === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((task) => {
        const assigneeNames = (task.assignees || []).map((a) => a.name).join(' ');
        return [task.name, task.assigneeName, task.assignerName, assigneeNames, task.description].some((value) =>
          String(value || '').toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [tasks, activeTab, searchQuery]);

  const tableRootTasks = useMemo(() => {
    const idSet = new Set(tasks.map((t) => t.id).filter((x) => x != null));
    return filteredTasks.filter((t) => !t.parentId || !idSet.has(t.parentId));
  }, [tasks, filteredTasks]);

  const {
    sortedData: sortedTableRootTasks,
    bindSortableColumns,
    hasActiveSort,
    sortRules,
    columnOptions: sortColumnOptions,
    addSortRule,
    removeSortRule,
    setRuleDirection,
    moveSortRule,
    clearSort,
    maxRules: sortMaxRules,
  } = usePmTableSort({
    entity: 'task',
    storageKey: TABLE_SORT_STORAGE_KEY,
    data: tableRootTasks,
  });

  useEffect(() => {
    if (!sortPickerOpen) return;
    const onDocMouseDown = (event) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target)) {
        setSortPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [sortPickerOpen]);

  const toggleSubtaskExpand = useCallback((taskId) => {
    setExpandedSubtaskParents((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  useEffect(() => {
    const ids = tableRootTasks.map((t) => t?.id).filter(Boolean);
    if (!ids.length) return;
    let cancelled = false;
    (async () => {
      try {
        const counts = await taskCommentService.fetchTaskCommentCounts({ taskIds: ids });
        if (!cancelled) setCommentCountsByTaskId((prev) => ({ ...prev, ...(counts || {}) }));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tableRootTasks]);

  const tabsWithBadges = useMemo(() => {
    const counts = { all: tasks.length };
    for (const task of tasks) {
      counts[task.strapiStatus] = (counts[task.strapiStatus] || 0) + 1;
      if (isTaskOverdue(task)) counts.OVERDUE = (counts.OVERDUE || 0) + 1;
    }
    return STATUS_TABS.map((tab) => ({ ...tab, badge: counts[tab.id] || 0 }));
  }, [tasks]);

  const taskColumns = useMemo(
    () => [
      {
        key: 'name',
        label: 'TASK NAME',
        headerClassName: 'max-w-[14rem] sm:max-w-[17rem] lg:max-w-[20rem]',
        className: 'max-w-[14rem] sm:max-w-[17rem] lg:max-w-[20rem] align-top',
        render: (_, row) => {
          const initial = (row.name || 'T').trim().charAt(0).toUpperCase() || 'T';
          const commentCount = Number(commentCountsByTaskId[String(row.id)] || 0);
          return (
            <div className="flex min-w-0 max-w-full items-start gap-3">
              <Avatar fallback={initial} alt={row.name} size="sm" className="flex-shrink-0 bg-gray-600 text-white" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/tasks/${row.id}`)}
                    className="min-w-0 flex-1 text-left hover:text-orange-600"
                  >
                    <TableCellTitleSubtitle
                      title={row.name}
                      subtitle={`${row.description || 'No description'}${row.recurrenceSummary ? ` · ${row.recurrenceSummary}` : ''}`}
                    />
                  </button>
                  <TaskSubtasksToggleButton
                    row={row}
                    expanded={expandedSubtaskParents.has(row.id)}
                    onToggle={toggleSubtaskExpand}
                  />
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
                        ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-white hover:text-gray-700'
                    } ${commentComposerMenu?.id === row.id ? 'border-gray-300 bg-white text-gray-700' : ''} ${
                      commentCount > 0 ? '' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    aria-label={`Comment on ${row.name || 'task'}`}
                    title="Comments"
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                    {commentCount > 0 ? (
                      <span
                        className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: 'status',
        label: 'STATUS',
        render: (_, row) => (
          <TableCellTaskStatusSelect
            status={row.strapiStatus}
            onStatusChange={(status) => updateTask(row, { status })}
            saving={savingId === row.id}
            options={PM_TASK_STATUS_OPTIONS}
            fillStyle="pm"
          />
        ),
      },
      {
        key: 'priority',
        label: 'PRIORITY',
        render: (_, row) => (
          <div onClick={(event) => event.stopPropagation()}>
            <Select
              value={row.priority}
              options={PRIORITY_OPTIONS}
              onChange={(priority) => updateTask(row, { priority })}
              disabled={memberScopedTasks || savingId === row.id}
              {...pmTableSelectFillProps(row.priority, 'priority')}
              containerClassName="min-w-[130px]"
              placeholder="Priority"
            />
          </div>
        ),
      },
      {
        key: 'assigner',
        label: 'ASSIGNER',
        render: (_, row) => {
          const assignerUser = row.assigner || assignerStrapiShape(row, users);
          const derived = ownerDisplayFromUser(assignerUser);
          const label = assignerTableLabel(row, assignerUser, derived);
          const empty = !label;
          return (
            <div
              className="flex min-w-[180px] max-w-[min(280px,22vw)] items-center gap-2.5 py-0.5"
              onClick={(event) => event.stopPropagation()}
              title={label || 'No assigner'}
            >
              <Avatar
                src={assignerUser?.avatar || undefined}
                fallback={empty ? '?' : derived.avatarFallback}
                alt={label || 'Assigner'}
                size="sm"
                className={`flex-shrink-0 text-white ${empty ? 'bg-gray-300 text-gray-600' : 'bg-gray-600'}`}
              />
              <span className={`min-w-0 flex-1 truncate text-xs font-semibold leading-tight ${empty ? 'text-gray-400' : 'text-gray-900'}`}>
                {empty ? '—' : label}
              </span>
            </div>
          );
        },
      },
      {
        key: 'assignees',
        label: 'ASSIGNEES',
        render: (_, row) => (
          <div className="min-w-[140px] py-0.5" onClick={(event) => event.stopPropagation()}>
            {row.assignmentPending ? (
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                Pending approval
              </span>
            ) : null}
            <TaskAssigneesPicker
              userIds={row.assigneeUserIds || []}
              assignees={row.assignees}
              users={users}
              onChange={(assigneeUserIds) => updateTask(row, { assigneeUserIds })}
              disabled={memberScopedTasks || row.assignmentPending || savingId === row.id}
              compact
            />
            {row.assignmentPending && canApproveAssignments ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                <Button
                  type="button"
                  size="sm"
                  className="h-7 px-2 text-[10px]"
                  disabled={savingId === row.id}
                  onClick={() => handleApproveAssignment(row)}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[10px]"
                  disabled={savingId === row.id}
                  onClick={() => handleRejectAssignment(row)}
                >
                  Reject
                </Button>
              </div>
            ) : null}
          </div>
        ),
      },
      {
        key: 'startDate',
        label: 'START DATE',
        render: (_, row) => <TableCellCreated dateString={row.startDate} dateMode="calendar" />,
      },
      {
        key: 'dueDate',
        label: 'DUE DATE',
        render: (_, row) => (
          <div className={isTaskOverdue(row) ? '[&_.font-semibold]:text-red-700 [&_.text-gray-500]:text-red-600/90' : ''}>
            <TableCellCreated dateString={row.dueDate} dateMode="calendar" />
          </div>
        ),
      },
      {
        key: 'actions',
        label: 'ACTIONS',
        className: 'w-[220px]',
        render: (_, row) => (
          <div className="flex min-w-[220px] items-center gap-0.5" onClick={(event) => event.stopPropagation()}>
            <PMRowActions
              wrapperClassName="flex shrink-0 items-center"
              triggerClassName="inline-flex h-9 w-9 items-center justify-center rounded-md p-2 text-teal-600 transition hover:bg-teal-50"
              items={[
                { label: 'View', icon: Eye, onClick: () => router.push(`/tasks/${row.id}`) },
                ...(memberScopedTasks
                  ? []
                  : [
                      { label: 'Edit', icon: Edit3, onClick: () => onEditTask?.(row) },
                    ]),
                { label: 'Copy link', icon: Copy, onClick: () => copyTaskLink(row) },
                ...(memberScopedTasks
                  ? []
                  : [{ label: 'Delete', icon: Trash2, danger: true, onClick: () => onDeleteTask?.(row) }]),
              ]}
            />
            {!memberScopedTasks ? (
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-emerald-600 hover:bg-emerald-50"
              title="Edit task"
              onClick={(event) => {
                event.stopPropagation();
                onEditTask?.(row);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-orange-600 hover:bg-orange-50"
              title="Copy link"
              onClick={(event) => {
                event.stopPropagation();
                copyTaskLink(row);
              }}
            >
              <Link2 className="h-4 w-4" />
            </Button>
            {!memberScopedTasks ? (
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-red-600 hover:bg-red-50"
              title="Delete task"
              onClick={(event) => {
                event.stopPropagation();
                onDeleteTask?.(row);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [
      router,
      users,
      savingId,
      memberScopedTasks,
      canApproveAssignments,
      handleApproveAssignment,
      handleRejectAssignment,
      updateTask,
      copyTaskLink,
      onEditTask,
      onDeleteTask,
      commentCountsByTaskId,
      commentComposerMenu,
      openCommentComposer,
      expandedSubtaskParents,
      toggleSubtaskExpand,
    ]
  );

  const sortableTaskColumns = useMemo(
    () => bindSortableColumns(taskColumns),
    [taskColumns, bindSortableColumns]
  );

  const activeCommentTask = commentComposerMenu?.id
    ? tableRootTasks.find((t) => t.id === commentComposerMenu.id) || tasks.find((t) => t.id === commentComposerMenu.id)
    : null;
  const taskComments = activeCommentTask?.id ? commentsByTask[activeCommentTask.id] : [];

  return (
    <div className="space-y-3">
      <div className="relative" ref={toolbarRef}>
        <TabsWithActions
          tabs={tabsWithBadges}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search tasks..."
          showAdd={canCreateProjectTasks}
          onAddClick={onAddTask}
          addTitle="Add Task"
          showSort
          onSortClick={() => setSortPickerOpen((open) => !open)}
          hasActiveSort={hasActiveSort}
          sortTitle="Sort tasks (Shift+click headers for multi-sort)"
          variant="glass"
        />
        <PmTableSortDropdown
          open={sortPickerOpen}
          sortRules={sortRules}
          columnOptions={sortColumnOptions}
          onAddRule={addSortRule}
          onRemoveRule={removeSortRule}
          onSetDirection={setRuleDirection}
          onMoveRule={moveSortRule}
          onClear={clearSort}
          maxRules={sortMaxRules}
        />
      </div>

      <div className="text-sm text-gray-600">
        {tasksLoading ? (
          <span className="text-gray-400">Loading tasks…</span>
        ) : (
          <>
            Showing <span className="font-semibold text-gray-900">{sortedTableRootTasks.length}</span> result
            {sortedTableRootTasks.length !== 1 ? 's' : ''}
          </>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {tasksLoading ? (
          <div className="p-12">
            <TableSkeleton rows={5} columns={8} />
          </div>
        ) : (
          <>
            <Table
              columns={sortableTaskColumns}
              data={sortedTableRootTasks}
              keyField="id"
              variant="modern"
              onRowClick={(row) => router.push(`/tasks/${row.id}`)}
              renderAfterRow={(row) => (
                <TaskSubtasksAfterRow
                  row={row}
                  expanded={expandedSubtaskParents.has(row.id)}
                  colSpan={sortableTaskColumns.length}
                  users={users}
                  savingId={savingId}
                  memberScopedTasks={memberScopedTasks}
                  onUpdateTask={updateTask}
                  onOpenTask={(subtask) => router.push(`/tasks/${subtask.id}`)}
                  onEditTask={(subtask) => onEditTask?.(subtask)}
                  onCopyTaskLink={copyTaskLink}
                  onDeleteTask={(subtask) => onDeleteTask?.(subtask)}
                  onAddSubtask={(r) => onOpenCreateSubtask?.(r)}
                />
              )}
            />
            {tableRootTasks.length === 0 && (
              <div className="border-t border-gray-200 p-12 text-center">
                <div className="mb-2 text-gray-400">
                  <CheckSquare className="mx-auto mb-3 h-12 w-12 opacity-50" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-700">No tasks found</h3>
                <p className="mb-4 text-sm text-gray-500">
                  {searchQuery || activeTab !== 'all' ? 'Try adjusting filters or search' : 'Create the first task for this project'}
                </p>
                {!searchQuery && activeTab === 'all' && canCreateProjectTasks && (
                  <Button variant="primary" onClick={onAddTask} className="gap-2">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {commentComposerMenu && activeCommentTask ? (
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
                  {Array.isArray(taskComments) ? taskComments.length : 0}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-gray-500">{activeCommentTask.name || 'Task'}</p>
            </div>

            <div className="max-h-56 overflow-y-auto bg-gray-50/50 px-4 py-3">
              {commentLoadingTaskId === activeCommentTask.id ? (
                <div className="py-4">
                  <LoadingSpinner size="sm" message="Loading comments..." />
                </div>
              ) : taskComments.length > 0 ? (
                <div className="relative">
                  <div
                    className="pointer-events-none absolute bottom-3 left-3 top-3 w-px bg-gradient-to-b from-orange-400/90 via-orange-200 to-gray-200"
                    aria-hidden
                  />
                  <ul className="relative m-0 list-none space-y-3 p-0 pr-1" role="list">
                    {taskComments.map((row) => (
                      <li key={row.id} className="relative flex gap-3">
                        <div className="relative z-[1] flex w-6 shrink-0 justify-center pt-0.5">
                          <Avatar
                            size="xs"
                            alt={actorDisplay(row.actor)}
                            fallback={actorDisplay(row.actor).charAt(0).toUpperCase()}
                            className="shadow-sm ring-2 ring-white"
                          />
                        </div>
                        <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
                          <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <p className="text-xs font-semibold text-gray-800">{actorDisplay(row.actor)}</p>
                            <span className="text-xs text-gray-400">• {formatCommentTime(row.createdAt)}</span>
                          </div>
                          <p className="whitespace-pre-wrap break-words text-sm text-gray-700">
                            <ChatMessageText text={commentTextFromMeta(row.meta)} />
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-3 text-xs text-gray-500">
                  No comments yet. Start the thread.
                </p>
              )}
            </div>

            <div className="space-y-2.5 border-t border-gray-100 bg-white px-4 py-3">
              {commentError ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700">{commentError}</p>
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
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    closeCommentComposer();
                  }
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submitTaskComment();
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-gray-400">Enter to post, Shift+Enter for new line</p>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="muted" size="sm" onClick={closeCommentComposer}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={submitTaskComment}
                    disabled={!commentDraft.trim() || commentSubmitting}
                    className="inline-flex items-center gap-1.5"
                  >
                    <SendHorizontal className="h-3.5 w-3.5" />
                    <span>{commentSubmitting ? 'Posting...' : 'Post'}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TableRowActionMenuPortal>
      ) : null}
    </div>
  );
}
