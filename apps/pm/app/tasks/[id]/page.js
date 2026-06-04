'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@webfudge/auth';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  EntityActivityPanel,
  KPICard,
  LoadingSpinner,
  Modal,
  Select,
  Table,
  TableCellCreated,
  TabsWithActions,
  TableCellTaskStatusSelect,
  PM_TASK_STATUS_OPTIONS,
} from '@webfudge/ui';
import {
  Activity,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Copy,
  Edit3,
  Eye,
  Flag,
  Link2,
  ListTodo,
  ListTree,
  MessageSquare,
  Paperclip,
  Pencil,
  PlayCircle,
  Plus,
  RefreshCw,
  Share2,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import PMPageHeader from '../../../components/PMPageHeader';
import TaskDetailMetaBar from '../../../components/TaskDetailMetaBar';
import TaskDetailsCard from '../../../components/TaskDetailsCard';
import PMRowActions from '../../../components/PMRowActions';
import QuickCreateTaskModal from '../../../components/QuickCreateTaskModal';
import { usePmTableSort } from '../../../hooks/usePmTableSort';
import TaskAssigneesPicker from '../../../components/TaskAssigneesPicker';
import { recurrencePayloadFromForm } from '../../../components/TaskRecurrenceFormFields';
import { SidebarCardTitle } from '@webfudge/ui';
import {
  getTaskStatusMeta,
  pmTableSelectFillProps,
  PRIORITY_OPTIONS,
} from '../../../components/PMStatusBadge';
import projectService from '../../../lib/api/projectService';
import {
  addTaskComment,
  fetchTaskActivityTimeline,
  fetchTaskComments,
} from '../../../lib/api/taskActivityService';
import taskService from '../../../lib/api/taskService';
import strapiClient from '../../../lib/strapiClient';
import { formatDate, transformProject, transformTask, transformUser } from '../../../lib/api/dataTransformers';
import { getPmOrgRoleKind } from '../../../lib/pmOrgRoles';
import { fetchChatMentionUsers } from '../../../lib/api/chatMentionUsers';

const DETAIL_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'subtasks', label: 'Subtasks' },
  { key: 'comments', label: 'Comments' },
  { key: 'activity', label: 'Activity' },
  { key: 'files', label: 'Files' },
];

const headerIconBtnClass =
  'p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg text-brand-text-light';

const headerDangerIconBtnClass =
  'p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-red-500/20 hover:border-red-400/45 transition-all duration-300 shadow-lg text-brand-text-light hover:text-red-50';

function userLabel(user) {
  return (
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.username ||
    user?.email ||
    `User ${user?.id}`
  );
}

function taskStatusHeaderVisual(status) {
  const meta = getTaskStatusMeta(status || 'SCHEDULED');
  const s = status || 'SCHEDULED';
  if (s === 'COMPLETED') {
    return {
      pillClass:
        'border border-emerald-300/90 bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-100/90 text-emerald-950 ring-emerald-200/70',
      Icon: CheckCircle2,
      label: meta.label,
    };
  }
  if (s === 'CANCELLED') {
    return {
      pillClass:
        'border border-red-300/90 bg-gradient-to-br from-red-50 via-red-50 to-red-100/90 text-red-950 ring-red-200/70',
      Icon: Target,
      label: meta.label,
    };
  }
  if (s === 'INTERNAL_REVIEW') {
    return {
      pillClass:
        'border border-violet-300/90 bg-gradient-to-br from-violet-50 via-violet-50 to-violet-100/90 text-violet-950 ring-violet-200/70',
      Icon: ListTodo,
      label: meta.label,
    };
  }
  if (s === 'ON_HOLD') {
    return {
      pillClass:
        'border border-sky-300/90 bg-gradient-to-br from-sky-50 via-sky-50 to-sky-100/90 text-sky-950 ring-sky-200/70',
      Icon: ListTodo,
      label: meta.label,
    };
  }
  if (s === 'IN_PROGRESS') {
    return {
      pillClass:
        'border border-orange-300/90 bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100/90 text-orange-950 ring-orange-200/70',
      Icon: PlayCircle,
      label: meta.label,
    };
  }
  return {
    pillClass:
      'border border-blue-300/90 bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100/90 text-blue-950 ring-blue-200/70',
    Icon: ListTodo,
    label: meta.label,
  };
}

function taskToInlineDraft(task) {
  if (!task) return null;
  const recurring = task.recurrenceFrequency && task.recurrenceFrequency !== 'none';
  return {
    name: task.name || '',
    description: task.description || '',
    status: task.strapiStatus || 'SCHEDULED',
    priority: task.priority || 'medium',
    assignerId: task.assignerId ? String(task.assignerId) : '',
    assigneeUserIds: Array.isArray(task.assigneeUserIds) ? [...task.assigneeUserIds] : [],
    startDate: task.startDate ? task.startDate.slice(0, 10) : '',
    scheduledDate: recurring ? '' : task.dueDate ? task.dueDate.slice(0, 10) : '',
    projectId: task.projectId ? String(task.projectId) : '',
    recurrenceFrequency: task.recurrenceFrequency || 'none',
    recurrenceInterval: task.recurrenceInterval ?? 1,
    recurrenceWeekdays: Array.isArray(task.recurrenceWeekdays) ? [...task.recurrenceWeekdays] : [],
    recurrenceMonthDay:
      task.recurrenceMonthDay != null && task.recurrenceMonthDay !== ''
        ? String(task.recurrenceMonthDay)
        : '',
    recurrenceCustomUnit: task.recurrenceCustomUnit || 'day',
    recurrenceEndsAt: task.recurrenceEndsAt ? task.recurrenceEndsAt.slice(0, 10) : '',
  };
}

export default function TaskDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const { user: authUser } = useAuth();
  const currentUserId = useMemo(() => {
    const u = authUser?.attributes || authUser;
    return u?.id ?? authUser?.id ?? null;
  }, [authUser]);
  const pmOrgRoleKind = useMemo(() => getPmOrgRoleKind(), []);
  const isPmMember = pmOrgRoleKind === 'member';
  const [task, setTask] = useState(null);
  const [ancestorTasks, setAncestorTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingTaskInfo, setEditingTaskInfo] = useState(false);
  const [taskInfoDraft, setTaskInfoDraft] = useState(null);
  const [taskInfoSaveError, setTaskInfoSaveError] = useState('');
  const [crmTimeline, setCrmTimeline] = useState([]);
  const [crmTimelineLoading, setCrmTimelineLoading] = useState(false);
  const [crmTimelineError, setCrmTimelineError] = useState(null);
  const [crmTimelineTotal, setCrmTimelineTotal] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [subtaskModalOpen, setSubtaskModalOpen] = useState(false);
  const [subtaskEditModal, setSubtaskEditModal] = useState({ open: false, task: null });
  const [subtaskDeleteModal, setSubtaskDeleteModal] = useState({ open: false, task: null });

  const loadTask = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await taskService.getTaskById(id);
      setTask(transformTask(res?.data));
    } catch (error) {
      console.error('Load task error:', error);
      setTask(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadLookups = useCallback(async () => {
    try {
      const [projectRes, userRes] = await Promise.all([
        projectService.getAllProjects({ pageSize: 200, sort: 'name:asc' }),
        strapiClient.getXtrawrkxUsers({ pageSize: 200 }),
      ]);
      setProjects((projectRes?.data || []).map(transformProject).filter(Boolean));
      const rawUsers = Array.isArray(userRes) ? userRes : userRes?.data || [];
      setUsers(rawUsers.map(transformUser).filter(Boolean));
    } catch (error) {
      console.error('Load task detail lookups error:', error);
    }
  }, []);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    let cancelled = false;

    const loadAncestorTrail = async () => {
      if (!task?.parentTask?.id) {
        if (!cancelled) setAncestorTasks([]);
        return;
      }

      const trail = [];
      const seen = new Set([String(task.id)]);
      let cursorId = task.parentTask.id;

      while (cursorId != null && cursorId !== '') {
        const key = String(cursorId);
        if (seen.has(key)) break;
        seen.add(key);

        try {
          const res = await taskService.getTaskById(cursorId);
          const parentTask = transformTask(res?.data);
          if (!parentTask?.id) break;
          trail.push(parentTask);
          cursorId = parentTask.parentTask?.id ?? null;
        } catch (error) {
          console.error('Load parent task breadcrumb trail error:', error);
          break;
        }
      }

      if (!cancelled) {
        setAncestorTasks(trail.reverse());
      }
    };

    loadAncestorTrail();

    return () => {
      cancelled = true;
    };
  }, [task?.id, task?.parentTask?.id]);

  const reloadTaskTimeline = useCallback(
    async (opts = {}) => {
      const silent = opts.silent === true;
      if (!task?.id) return;
      if (!silent) {
        setCrmTimelineLoading(true);
        setCrmTimelineError(null);
      }
      try {
        const [{ data, total }, commentsRes] = await Promise.all([
          fetchTaskActivityTimeline({ taskId: task.id, limit: 80 }),
          fetchTaskComments({ taskId: task.id, limit: 1 }),
        ]);
        const rows = Array.isArray(data) ? data : [];
        setCrmTimeline(rows);
        setCrmTimelineTotal(typeof total === 'number' ? total : rows.length);
        setCommentCount(typeof commentsRes?.total === 'number' ? commentsRes.total : 0);
      } catch (e) {
        if (!silent) {
          setCrmTimelineError(e?.message || 'Could not load activities');
          setCrmTimeline([]);
          setCrmTimelineTotal(0);
          setCommentCount(0);
        }
      } finally {
        if (!silent) setCrmTimelineLoading(false);
      }
    },
    [task?.id]
  );

  useEffect(() => {
    reloadTaskTimeline({ silent: false });
  }, [reloadTaskTimeline]);

  const activityCount = typeof crmTimelineTotal === 'number' ? crmTimelineTotal : crmTimeline.length;

  const lastActivityDisplay = useMemo(() => {
    const first = crmTimeline?.[0]?.createdAt;
    if (first) return formatDate(first, 'relative') || '—';
    return formatDate(task?.updatedAt, 'relative') || '—';
  }, [crmTimeline, task?.updatedAt]);

  const tabsWithBadges = useMemo(
    () =>
      DETAIL_TABS.map((tab) => ({
        ...tab,
        badge:
          tab.key === 'files'
            ? 0
            : tab.key === 'activity'
              ? activityCount || undefined
              : tab.key === 'comments'
                ? commentCount || undefined
                : tab.key === 'subtasks'
                  ? (task?.subtaskCount ?? task?.subtasks?.length) || undefined
                  : undefined,
      })),
    [activityCount, commentCount, task?.subtaskCount, task?.subtasks]
  );

  const handleAddTaskComment = useCallback(
    async ({ entityId, comment }) => {
      const res = await addTaskComment({ taskId: entityId, comment });
      await reloadTaskTimeline({ silent: true });
      return res;
    },
    [reloadTaskTimeline]
  );

  const chatMentionUsers = useMemo(() => {
    const roster = [...(task?.assignees || [])];
    const projectId = task?.project?.id ?? task?.projectId;
    const project = projects.find((p) => String(p.id) === String(projectId));
    const team = project?.teamMembers || project?.team || [];
    team.forEach((member) => roster.push(member));
    if (project?.projectManager) roster.push(project.projectManager);
    users.forEach((u) => roster.push(u));
    const seen = new Set();
    return roster.filter((u) => {
      if (!u?.id) return false;
      const key = String(u.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [task, projects, users]);

  const composerAvatarFallback = useMemo(() => {
    const u = authUser?.attributes || authUser;
    const label = userLabel(u);
    const parts = label.split(/[\s._-]/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (label.slice(0, 2) || 'ME').toUpperCase();
  }, [authUser]);

  const updateTask = async (patch) => {
    if (!task) return;
    let next = patch;
    if (isPmMember) {
      next = {};
      if (patch.status !== undefined) next.status = patch.status;
      if (Object.keys(next).length === 0) return;
    }
    try {
      setSaving(true);
      await taskService.updateTask(task.id, next);
      await loadTask();
      await reloadTaskTimeline({ silent: true });
    } catch (error) {
      console.error('Update task error:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveTask = async (payload) => {
    if (!task || isPmMember) return;
    try {
      setSaving(true);
      await taskService.updateTask(task.id, payload);
      setEditModalOpen(false);
      setEditingTaskInfo(false);
      setTaskInfoDraft(null);
      setTaskInfoSaveError('');
      await loadTask();
      await reloadTaskTimeline({ silent: true });
    } catch (error) {
      console.error('Save task error:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveNewSubtask = useCallback(
    async (payload) => {
      if (!task || isPmMember) return;
      try {
        setSaving(true);
        await taskService.createTask({
          ...payload,
          projectId: payload.projectId || task.projectId,
        });
        setSubtaskModalOpen(false);
        await loadTask();
        await reloadTaskTimeline({ silent: true });
      } catch (error) {
        console.error('Create subtask error:', error);
      } finally {
        setSaving(false);
      }
    },
    [task, isPmMember, loadTask, reloadTaskTimeline]
  );

  const updateSubtaskField = useCallback(
    async (subtask, patch) => {
      if (!subtask?.id) return;
      let next = patch;
      if (isPmMember) {
        next = {};
        if (patch.status !== undefined) next.status = patch.status;
        if (Object.keys(next).length === 0) return;
      }
      try {
        setSaving(true);
        await taskService.updateTask(subtask.id, next);
        await loadTask();
        await reloadTaskTimeline({ silent: true });
      } catch (error) {
        console.error('Update subtask error:', error);
      } finally {
        setSaving(false);
      }
    },
    [isPmMember, loadTask, reloadTaskTimeline]
  );

  const saveEditedSubtask = useCallback(
    async (payload) => {
      if (isPmMember) return;
      const st = subtaskEditModal.task;
      if (!st?.id) return;
      try {
        setSaving(true);
        await taskService.updateTask(st.id, payload);
        setSubtaskEditModal({ open: false, task: null });
        await loadTask();
        await reloadTaskTimeline({ silent: true });
      } catch (error) {
        console.error('Save subtask error:', error);
      } finally {
        setSaving(false);
      }
    },
    [isPmMember, subtaskEditModal.task, loadTask, reloadTaskTimeline]
  );

  const deleteSubtask = useCallback(async () => {
    if (isPmMember) return;
    const st = subtaskDeleteModal.task;
    if (!st?.id) return;
    try {
      setSaving(true);
      await taskService.deleteTask(st.id);
      setSubtaskDeleteModal({ open: false, task: null });
      await loadTask();
      await reloadTaskTimeline({ silent: true });
    } catch (error) {
      console.error('Delete subtask error:', error);
    } finally {
      setSaving(false);
    }
  }, [isPmMember, subtaskDeleteModal.task, loadTask, reloadTaskTimeline]);

  const deleteTask = async () => {
    if (!task || isPmMember) return;
    try {
      setSaving(true);
      await taskService.deleteTask(task.id);
      router.push('/my-tasks');
    } catch (error) {
      console.error('Delete task error:', error);
    } finally {
      setSaving(false);
    }
  };

  const copyTaskLink = async (taskRow = null) => {
    const url = taskRow?.id ? `${window.location.origin}/tasks/${taskRow.id}` : window.location.href;
    await navigator.clipboard?.writeText(url);
  };

  const refreshAll = useCallback(() => {
    loadTask();
    reloadTaskTimeline({ silent: false });
  }, [loadTask, reloadTaskTimeline]);

  const openTaskInfoEdit = useCallback(() => {
    if (!task || isPmMember) return;
    setTaskInfoDraft(taskToInlineDraft(task));
    setTaskInfoSaveError('');
    setEditingTaskInfo(true);
  }, [task, isPmMember]);

  const cancelTaskInfoEdit = useCallback(() => {
    setEditingTaskInfo(false);
    setTaskInfoDraft(null);
    setTaskInfoSaveError('');
  }, []);

  const setTaskInfoField = useCallback((field, value) => {
    setTaskInfoDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  }, []);

  const saveTaskInfo = useCallback(async () => {
    if (!task || !taskInfoDraft || isPmMember) return;
    const d = taskInfoDraft;
    if (!d.name?.trim()) {
      setTaskInfoSaveError('Task name is required');
      return;
    }
    setTaskInfoSaveError('');
    try {
      setSaving(true);
      await taskService.updateTask(task.id, {
        name: d.name.trim(),
        description: d.description?.trim() || null,
        status: d.status,
        priority: d.priority,
        startDate: d.startDate || null,
        scheduledDate:
          d.recurrenceFrequency && d.recurrenceFrequency !== 'none' ? null : d.scheduledDate || null,
        assignerId: d.assignerId,
        assigneeUserIds: [...(d.assigneeUserIds || [])],
        projectId: d.projectId || null,
        ...recurrencePayloadFromForm(d),
      });
      setEditingTaskInfo(false);
      setTaskInfoDraft(null);
      await loadTask();
      await reloadTaskTimeline({ silent: true });
    } catch (e) {
      setTaskInfoSaveError(e?.message || 'Could not save changes');
    } finally {
      setSaving(false);
    }
  }, [task, taskInfoDraft, isPmMember, loadTask, reloadTaskTimeline]);

  const userSelectOptions = useMemo(
    () => users.map((u) => ({ value: String(u.id), label: userLabel(u) })),
    [users]
  );

  const breadcrumbItems = useMemo(() => {
    const base = [
      { label: 'PM', href: '/' },
      { label: 'My Tasks', href: '/my-tasks' },
    ];
    const parentCrumbs = ancestorTasks
      .filter((t) => t?.id)
      .map((t) => ({ label: t.name || `Task ${t.id}`, href: `/tasks/${t.id}` }));
    if (!task?.id) return base;
    return [...base, ...parentCrumbs, { label: task.name || `Task ${task.id}`, href: `/tasks/${task.id}` }];
  }, [ancestorTasks, task?.id, task?.name]);

  const subtasksTableSort = usePmTableSort({
    entity: 'task',
    storageKey: task?.id ? `pm.taskDetail.${task.id}.subtasks.sort` : undefined,
    data: Array.isArray(task?.subtasks) ? task.subtasks : [],
  });

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <PMPageHeader title="Loading task..." breadcrumb={[{ label: 'PM', href: '/' }, { label: 'Tasks', href: '/my-tasks' }]} showProfile />
        <Card variant="elevated" className="flex justify-center rounded-xl p-12">
          <LoadingSpinner message="Loading task..." />
        </Card>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <PMPageHeader title="Task Not Found" breadcrumb={[{ label: 'PM', href: '/' }, { label: 'Tasks', href: '/my-tasks' }]} showProfile />
        <Card variant="elevated" className="rounded-xl p-12">
          <EmptyState icon={CheckSquare} title="Task not found" description="The task may have been deleted or moved." />
        </Card>
      </div>
    );
  }

  const statusVisual = taskStatusHeaderVisual(task.strapiStatus);
  const StatusIcon = statusVisual.Icon;
  const statusMeta = getTaskStatusMeta(task.strapiStatus || 'SCHEDULED');
  const priorityLabel =
    PRIORITY_OPTIONS.find((o) => o.value === task.priority)?.label ?? task.priority ?? '—';

  const isRecurring = Boolean(task.recurrenceFrequency && task.recurrenceFrequency !== 'none');
  const draftRecurring = Boolean(
    taskInfoDraft && taskInfoDraft.recurrenceFrequency && taskInfoDraft.recurrenceFrequency !== 'none'
  );

  const subtasksTableColumns = [
      {
        key: 'name',
        label: 'TASK NAME',
        className: 'max-w-[24rem] align-top',
        render: (_, row) => (
          <button
            type="button"
            className="min-w-0 max-w-full text-left hover:text-orange-600"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/tasks/${row.id}`);
            }}
          >
            <div className="truncate font-medium text-gray-900">{row.name || 'Untitled subtask'}</div>
            <div className="truncate text-sm text-gray-500">{row.description || 'No description'}</div>
          </button>
        ),
      },
      {
        key: 'status',
        label: 'STATUS',
        render: (_, row) => (
          <TableCellTaskStatusSelect
            status={row.strapiStatus}
            onStatusChange={(status) => updateSubtaskField(row, { status })}
            saving={saving}
            options={PM_TASK_STATUS_OPTIONS}
            fillStyle="pm"
            containerClassName="min-w-[140px]"
          />
        ),
      },
      {
        key: 'priority',
        label: 'PRIORITY',
        render: (_, row) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              value={row.priority}
              options={PRIORITY_OPTIONS}
              onChange={(priority) => updateSubtaskField(row, { priority })}
              disabled={isPmMember || saving}
              {...pmTableSelectFillProps(row.priority, 'priority')}
              containerClassName="min-w-[120px]"
              placeholder="Priority"
            />
          </div>
        ),
      },
      {
        key: 'assigner',
        label: 'ASSIGNER',
        render: (_, row) => (
          <div className="flex min-w-[180px] items-center gap-2">
            <Avatar
              size="sm"
              src={row.assigner?.avatar || undefined}
              fallback={(row.assignerName || row.assigner?.name || '?').charAt(0).toUpperCase()}
              alt={row.assignerName || row.assigner?.name || 'Unassigned'}
              className={row.assignerName || row.assigner?.name ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-700'}
            />
            <span className={`truncate text-sm font-medium ${row.assignerName || row.assigner?.name ? 'text-gray-900' : 'text-gray-500'}`}>
              {row.assignerName || row.assigner?.name || '—'}
            </span>
          </div>
        ),
      },
      {
        key: 'assignees',
        label: 'ASSIGNEES',
        render: (_, row) => (
          <div className="min-w-[130px]" onClick={(e) => e.stopPropagation()}>
            <TaskAssigneesPicker
              userIds={row.assigneeUserIds || []}
              assignees={row.assignees}
              users={users}
              onChange={(assigneeUserIds) => updateSubtaskField(row, { assigneeUserIds })}
              disabled={isPmMember || saving}
              compact
            />
          </div>
        ),
      },
      {
        key: 'startDate',
        label: 'START DATE',
        render: (_, row) => <TableCellCreated dateString={row.startDate} showRelative={false} />,
      },
      {
        key: 'dueDate',
        label: 'DUE DATE',
        render: (_, row) => (
          <div className={row.dueDate ? '' : 'text-gray-400'}>
            <TableCellCreated dateString={row.dueDate} showRelative={false} />
          </div>
        ),
      },
      {
        key: 'actions',
        label: 'ACTIONS',
        className: 'w-[180px]',
        render: (_, row) => (
          <div className="flex min-w-[180px] items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <PMRowActions
              wrapperClassName="flex shrink-0 items-center"
              triggerClassName="inline-flex h-9 w-9 items-center justify-center rounded-md p-2 text-teal-600 transition hover:bg-teal-50"
              items={[
                { label: 'View', icon: Eye, onClick: () => router.push(`/tasks/${row.id}`) },
                ...(isPmMember
                  ? []
                  : [{ label: 'Edit', icon: Edit3, onClick: () => setSubtaskEditModal({ open: true, task: row }) }]),
                { label: 'Copy link', icon: Copy, onClick: () => copyTaskLink(row) },
                ...(isPmMember
                  ? []
                  : [{ label: 'Delete', icon: Trash2, danger: true, onClick: () => setSubtaskDeleteModal({ open: true, task: row }) }]),
              ]}
            />
            {!isPmMember ? (
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-emerald-600 hover:bg-emerald-50"
              title="Edit subtask"
              onClick={(e) => {
                e.stopPropagation();
                setSubtaskEditModal({ open: true, task: row });
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
              onClick={(e) => {
                e.stopPropagation();
                copyTaskLink(row);
              }}
            >
              <Link2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-3">
        <PMPageHeader title={task.name} breadcrumb={breadcrumbItems} showProfile>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {!isPmMember ? (
              <button
                type="button"
                className={headerIconBtnClass}
                title="Edit task details"
                onClick={openTaskInfoEdit}
              >
                <Edit3 className="h-5 w-5" />
              </button>
            ) : null}
            <button type="button" className={headerIconBtnClass} title="Copy link" onClick={copyTaskLink}>
              <Share2 className="h-5 w-5" />
            </button>
            {!isPmMember ? (
              <button
                type="button"
                className={`group ${headerDangerIconBtnClass}`}
                title="Delete task"
                onClick={() => setDeleteModalOpen(true)}
              >
                <Trash2
                  className="h-5 w-5 shrink-0 text-brand-text-light transition-colors group-hover:text-red-50"
                  aria-hidden
                />
              </button>
            ) : null}
            <PMRowActions
              items={[
                { label: 'Copy link', icon: Copy, onClick: copyTaskLink },
                { label: 'Refresh', icon: RefreshCw, onClick: refreshAll },
              ]}
              label="More task actions"
            />
          </div>
        </PMPageHeader>

        <TaskDetailMetaBar task={task} />
      </div>

      <div
        className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 ${
          isRecurring ? 'xl:grid-cols-3' : 'xl:grid-cols-4'
        }`}
      >
        <KPICard compact title="Status" value={statusMeta.label} icon={Flag} colorScheme="orange" />
        <KPICard compact title="Priority" value={priorityLabel} icon={TrendingUp} colorScheme="orange" />
        <KPICard compact title="Start date" value={formatDate(task.startDate, 'short') || '—'} icon={Calendar} colorScheme="orange" />
        {!isRecurring ? (
          <KPICard compact title="Due date" value={formatDate(task.dueDate, 'short') || '—'} icon={Calendar} colorScheme="orange" />
        ) : null}
      </div>

      <TabsWithActions variant="pill" tabs={tabsWithBadges} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'overview' ? (
        <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <TaskDetailsCard
              task={task}
              editing={Boolean(editingTaskInfo && taskInfoDraft)}
              taskInfoDraft={taskInfoDraft}
              isRecurring={isRecurring}
              draftRecurring={draftRecurring}
              isPmMember={isPmMember}
              saving={saving}
              users={users}
              projects={projects}
              userSelectOptions={userSelectOptions}
              statusVisual={statusVisual}
              StatusIcon={StatusIcon}
              taskInfoSaveError={taskInfoSaveError}
              formatDate={formatDate}
              onStatusChange={(status) => updateTask({ status })}
              onOpenSectionEdit={openTaskInfoEdit}
              onOpenFullPageEdit={() => {
                if (editingTaskInfo) cancelTaskInfoEdit();
                setEditModalOpen(true);
              }}
              onCancelEdit={cancelTaskInfoEdit}
              onSaveEdit={saveTaskInfo}
              onTaskInfoFieldChange={setTaskInfoField}
              onSetTaskInfoDraft={setTaskInfoDraft}
              onViewProject={() => {
                if (task.projectSlug) router.push(`/projects/${task.projectSlug}`);
              }}
              onViewFiles={() => setActiveTab('files')}
              onViewSubtasks={() => setActiveTab('subtasks')}
            />
          </div>

          <div className="space-y-4">
            <Card variant="elevated" className="rounded-xl">
              <SidebarCardTitle
                title={`Subtasks (${task.subtasks?.length || 0})`}
                icon={ListTree}
              />
              {!task.subtasks?.length ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-center">
                  <p className="text-sm text-gray-600">No subtasks yet for this task.</p>
                  <button
                    type="button"
                    onClick={() => setSubtaskModalOpen(true)}
                    className="mt-2 text-xs font-semibold text-orange-700 hover:underline"
                  >
                    Add first subtask
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-fixed">
                      <thead className="bg-gray-50">
                        <tr className="text-left">
                          <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                            Name
                          </th>
                          <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                            Status
                          </th>
                          <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                            Priority
                          </th>
                          <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                            Due
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {task.subtasks.slice(0, 5).map((subtask) => {
                          const subtaskStatusMeta = getTaskStatusMeta(subtask.strapiStatus || 'SCHEDULED');
                          const subtaskPriorityLabel =
                            PRIORITY_OPTIONS.find((p) => p.value === subtask.priority)?.label || '—';
                          return (
                            <tr
                              key={subtask.id}
                              className="cursor-pointer transition-colors hover:bg-orange-50/30"
                              onClick={() => router.push(`/tasks/${subtask.id}`)}
                            >
                              <td className="px-3 py-2.5 align-top">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                  {subtask.name || 'Untitled subtask'}
                                </p>
                                <p className="truncate text-[11px] text-gray-500">
                                  {(subtask.assignees || []).length > 0
                                    ? subtask.assignees.map((a) => a.name).join(', ')
                                    : 'No assignees'}
                                </p>
                              </td>
                              <td className="px-2 py-2.5 align-top">
                                <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-700">
                                  {subtaskStatusMeta.label}
                                </span>
                              </td>
                              <td className="px-2 py-2.5 align-top text-[11px] text-gray-700">
                                {subtaskPriorityLabel}
                              </td>
                              <td className="px-2 py-2.5 align-top text-[11px] text-gray-700">
                                {formatDate(subtask.dueDate, 'short') || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {(task.subtasks?.length || 0) > 4 ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab('subtasks')}
                      className="w-full border-t border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      View all subtasks ({task.subtasks.length})
                    </button>
                  ) : null}
                </div>
              )}
            </Card>
          </div>
        </div>

        <section className="min-w-0" aria-label="Task discussion">
          <div className="mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <MessageSquare className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
              <h2 className="text-lg font-semibold text-gray-900">Discussion</h2>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Team chat for this task — same thread as the{' '}
              <button
                type="button"
                className="font-medium text-orange-600 hover:underline"
                onClick={() => setActiveTab('comments')}
              >
                Comments
              </button>{' '}
              tab.
            </p>
          </div>
          <EntityActivityPanel
            key={`task-overview-chat-${task.id}`}
            entityType="task"
            entityId={task.id}
            entityName={task.name}
            crmTimeline={crmTimeline}
            crmTimelineLoading={crmTimelineLoading}
            crmTimelineError={crmTimelineError}
            activityCount={activityCount}
            fetchCommentsFn={({ entityId }) => fetchTaskComments({ taskId: entityId, limit: 80 })}
            addCommentFn={handleAddTaskComment}
            mentionUsers={chatMentionUsers}
            fetchMentionUsers={fetchChatMentionUsers}
            composerAvatarFallback={composerAvatarFallback}
            chatFooterBadgeText="Messages are saved on this task for your team."
            defaultSubTab="chat"
            className="w-full"
            minHeightPx={440}
            maxHeightPx={680}
          />
        </section>
        </div>
      ) : null}

      {activeTab === 'subtasks' ? (
        <div className="space-y-4">
          <Card variant="elevated" className="rounded-xl">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Subtasks</h2>
                <p className="mt-1 text-sm text-gray-500">Break this task into smaller items.</p>
              </div>
              {!isPmMember ? (
              <Button type="button" variant="primary" className="gap-2 shrink-0" onClick={() => setSubtaskModalOpen(true)}>
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
                  columns={subtasksTableSort.bindSortableColumns(subtasksTableColumns)}
                  data={subtasksTableSort.sortedData}
                  keyField="id"
                  variant="modernEmbedded"
                  onRowClick={(row) => router.push(`/tasks/${row.id}`)}
                />
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {activeTab === 'comments' ? (
        <div className="min-w-0">
          <EntityActivityPanel
            key={`task-comments-${task.id}`}
            entityType="task"
            entityId={task.id}
            entityName={task.name}
            crmTimeline={crmTimeline}
            crmTimelineLoading={crmTimelineLoading}
            crmTimelineError={crmTimelineError}
            activityCount={activityCount}
            fetchCommentsFn={({ entityId }) => fetchTaskComments({ taskId: entityId, limit: 80 })}
            addCommentFn={handleAddTaskComment}
            mentionUsers={chatMentionUsers}
            fetchMentionUsers={fetchChatMentionUsers}
            composerAvatarFallback={composerAvatarFallback}
            chatFooterBadgeText="Messages are saved on this task for your team."
            defaultSubTab="chat"
            className="w-full"
            minHeightPx={560}
            maxHeightPx={800}
          />
        </div>
      ) : null}

      {activeTab === 'activity' ? (
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
                <span className="text-xs font-medium text-gray-600">Assigner</span>
                <span className="truncate pl-2 text-right text-xs font-semibold text-gray-800">{task.assignerName || '—'}</span>
              </div>
              <div className="flex items-start justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                <span className="shrink-0 text-xs font-medium text-gray-600">Assignees</span>
                <span className="line-clamp-3 text-right text-xs font-semibold text-gray-800" title={(task.assignees || []).map((a) => a.name).join(', ') || ''}>
                  {(task.assignees || []).length > 0
                    ? (task.assignees || []).map((a) => a.name).join(', ')
                    : 'None'}
                </span>
              </div>
            </div>
          </Card>
          <div className="min-w-0 lg:col-span-3">
            <EntityActivityPanel
              key={`task-activity-${task.id}`}
              entityType="task"
              entityId={task.id}
              entityName={task.name}
              crmTimeline={crmTimeline}
              crmTimelineLoading={crmTimelineLoading}
              crmTimelineError={crmTimelineError}
              activityCount={activityCount}
              fetchCommentsFn={({ entityId }) => fetchTaskComments({ taskId: entityId, limit: 80 })}
              addCommentFn={handleAddTaskComment}
              mentionUsers={chatMentionUsers}
              fetchMentionUsers={fetchChatMentionUsers}
              composerAvatarFallback={composerAvatarFallback}
              chatFooterBadgeText="Messages are saved on this task for your team."
              defaultSubTab="activity"
              className="w-full"
              minHeightPx={560}
              maxHeightPx={800}
            />
          </div>
        </div>
      ) : null}

      {activeTab === 'files' ? (
        <Card variant="elevated" className="rounded-xl">
          <EmptyState
            icon={Paperclip}
            title="No attachments"
            description="The attachments section is a frontend-first CRM parity surface until file relations are added."
          />
        </Card>
      ) : null}

      {!isPmMember ? (
      <QuickCreateTaskModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={saveTask}
        task={task}
        projects={projects}
        users={users}
        defaultAssignerId={currentUserId ? String(currentUserId) : ''}
        saving={saving}
        title="Edit Task"
      />
      ) : null}

      {!isPmMember ? (
      <QuickCreateTaskModal
        isOpen={subtaskModalOpen}
        onClose={() => setSubtaskModalOpen(false)}
        onSubmit={saveNewSubtask}
        task={null}
        parentContext={
          task ? { id: task.id, name: task.name, projectId: task.projectId } : null
        }
        projects={projects}
        users={users}
        defaultAssignerId={currentUserId ? String(currentUserId) : ''}
        saving={saving}
      />
      ) : null}

      {!isPmMember ? (
      <QuickCreateTaskModal
        isOpen={subtaskEditModal.open}
        onClose={() => setSubtaskEditModal({ open: false, task: null })}
        onSubmit={saveEditedSubtask}
        task={subtaskEditModal.task}
        projects={projects}
        users={users}
        defaultAssignerId={currentUserId ? String(currentUserId) : ''}
        saving={saving}
        title="Edit Subtask"
      />
      ) : null}

      {!isPmMember ? (
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Task" size="sm">
        <div className="space-y-5">
          <p className="text-sm text-gray-700">
            Delete <span className="font-semibold text-gray-900">{task.name}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="danger" onClick={deleteTask} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
      ) : null}

      {!isPmMember ? (
      <Modal
        isOpen={subtaskDeleteModal.open}
        onClose={() => setSubtaskDeleteModal({ open: false, task: null })}
        title="Delete Subtask"
        size="sm"
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-700">
            Delete <span className="font-semibold text-gray-900">{subtaskDeleteModal.task?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setSubtaskDeleteModal({ open: false, task: null })}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={deleteSubtask} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
      ) : null}
    </div>
  );
}
