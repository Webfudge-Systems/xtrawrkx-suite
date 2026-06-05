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
  Input,
  KPICard,
  LoadingSpinner,
  Modal,
  Select,
  TabsWithActions,
  Textarea,
} from '@webfudge/ui';
import {
  Activity,
  AlignLeft,
  Building2,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  Copy,
  Edit3,
  FileText,
  FolderOpen,
  IndianRupee,
  Plus,
  RefreshCw,
  Share2,
  Target,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import PMPageHeader from '../../../components/PMPageHeader';
import ProjectDetailMetaBar from '../../../components/ProjectDetailMetaBar';
import PMRowActions from '../../../components/PMRowActions';
import QuickCreateTaskModal from '../../../components/QuickCreateTaskModal';
import ProjectTasksPanel from '../../../components/ProjectTasksPanel';
import ProjectOwnerPicker from '../../../components/ProjectOwnerPicker';
import { InfoRow, InfoSection, SidebarCardTitle } from '@webfudge/ui';
import { getProjectStatusMeta, PROJECT_STATUS_OPTIONS } from '../../../components/PMStatusBadge';
import projectService from '../../../lib/api/projectService';
import { fetchProjectClientOptions, mapProjectClientSelectOptions } from '../../../lib/api/projectClientOptions';
import {
  addProjectComment,
  fetchProjectActivityTimeline,
  fetchProjectComments,
} from '../../../lib/api/projectActivityService';
import taskService from '../../../lib/api/taskService';
import { fetchPmAssignableUsers } from '../../../lib/api/messageService';
import { fetchChatMentionUsers } from '../../../lib/api/chatMentionUsers';
import { formatDate, transformProject, transformTask, transformUser } from '../../../lib/api/dataTransformers';
import { enrichTasksWithProjectManager } from '../../../lib/taskListUtils';
import {
  collectTaskAssigneeUsers,
  usersForProjectTaskAssignment,
} from '../../../lib/api/projectAssignableUsers';
import {
  canApproveTaskAssignmentsInPm,
  canCreateSubtaskOnTask,
  canCreateTaskInProject,
  canEditProjectInPm,
  getPmOrgRoleKind,
} from '../../../lib/pmOrgRoles';

const DETAIL_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'activity', label: 'Activity' },
  { key: 'files', label: 'Files' },
];

const headerIconBtnClass =
  'p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg text-brand-text-light';

const headerDangerIconBtnClass =
  'p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-red-500/20 hover:border-red-400/45 transition-all duration-300 shadow-lg text-brand-text-light hover:text-red-50';

function projectStatusHeaderVisual(status) {
  const s = status || 'PLANNING';
  const meta = getProjectStatusMeta(s);
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
  if (s === 'ON_HOLD') {
    return {
      pillClass:
        'border border-violet-300/90 bg-gradient-to-br from-violet-50 via-violet-50 to-violet-100/90 text-violet-950 ring-violet-200/70',
      Icon: Target,
      label: meta.label,
    };
  }
  if (s === 'IN_PROGRESS') {
    return {
      pillClass:
        'border border-orange-300/90 bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100/90 text-orange-950 ring-orange-200/70',
      Icon: Target,
      label: meta.label,
    };
  }
  if (s === 'ACTIVE') {
    return {
      pillClass:
        'border border-cyan-300/90 bg-gradient-to-br from-cyan-50 via-cyan-50 to-cyan-100/90 text-cyan-950 ring-cyan-200/70',
      Icon: Target,
      label: meta.label,
    };
  }
  if (s === 'PLANNING') {
    return {
      pillClass:
        'border border-blue-300/90 bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100/90 text-blue-950 ring-blue-200/70',
      Icon: Target,
      label: meta.label,
    };
  }
  return {
    pillClass:
      'border border-gray-300/90 bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100/90 text-gray-950 ring-gray-200/70',
    Icon: Target,
    label: meta.label,
  };
}

function isPresent(value) {
  if (value == null) return false;
  const s = String(value).trim();
  return s.length > 0 && s !== '—';
}

function userLabel(user) {
  return user?.name || user?.username || user?.email || `User ${user?.id}`;
}

function pmClientAccountHref(clientAccountId) {
  if (clientAccountId == null || clientAccountId === '') return null;
  return `/clients/accounts/${clientAccountId}`;
}

function ProjectClientInfoValue({ clientAccountId, clientName }) {
  const name = clientName?.trim();
  const href = pmClientAccountHref(clientAccountId);

  if (!name) {
    return <p className="text-base font-normal leading-snug text-gray-400">—</p>;
  }

  if (!href) {
    return (
      <span className="inline-flex max-w-full rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-base font-semibold text-orange-900 shadow-sm ring-1 ring-orange-200/80">
        <span className="truncate">{name}</span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex max-w-full min-w-0 items-center rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-base font-semibold text-orange-900 shadow-sm ring-1 ring-orange-200/80 transition-colors hover:bg-orange-100 hover:text-orange-950"
      title={`Open ${name}`}
    >
      <span className="truncate">{name}</span>
    </Link>
  );
}

function projectToInlineDraft(project) {
  if (!project) return null;
  return {
    name: project.name || '',
    description: project.description || '',
    status: project.strapiStatus || 'PLANNING',
    startDate: project.startDate ? project.startDate.slice(0, 10) : '',
    endDate: project.endDate ? project.endDate.slice(0, 10) : '',
    budget: project.budget != null && project.budget !== '' ? String(project.budget) : '',
    projectManagerId: project.projectManager?.id ? String(project.projectManager.id) : '',
    clientId: project.clientAccountId ? String(project.clientAccountId) : '',
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const router = useRouter();
  const { user: authUser } = useAuth();
  const currentUserId = useMemo(() => {
    const u = authUser?.attributes || authUser;
    return u?.id ?? authUser?.id ?? null;
  }, [authUser]);
  const pmOrgRoleKind = useMemo(() => getPmOrgRoleKind(), []);
  const memberScopedTasks = pmOrgRoleKind === 'member';
  const canApproveAssignments = useMemo(() => canApproveTaskAssignmentsInPm(), []);
  const defaultAssignerId = useMemo(() => {
    const u = authUser?.attributes || authUser;
    const id = u?.id ?? authUser?.id ?? null;
    return id != null ? String(id) : '';
  }, [authUser]);
  const [activeTab, setActiveTab] = useState('overview');
  const [project, setProject] = useState(null);
  const canEditThisProject = useMemo(
    () => (project ? canEditProjectInPm(project, currentUserId) : false),
    [project, currentUserId],
  );
  const canCreateProjectTasks = useMemo(
    () => (project ? canCreateTaskInProject(project, currentUserId) : false),
    [project, currentUserId],
  );
  const [tasks, setTasks] = useState([]);
  const displayTasks = useMemo(
    () => enrichTasksWithProjectManager(tasks, project ? [project] : []),
    [tasks, project]
  );
  const [users, setUsers] = useState([]);
  const [clientOptions, setClientOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [taskModal, setTaskModal] = useState({ open: false, task: null, parentContext: null });
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [deleteTaskModal, setDeleteTaskModal] = useState({ open: false, task: null });
  const [editingProjectInfo, setEditingProjectInfo] = useState(false);
  const [projectInfoDraft, setProjectInfoDraft] = useState(null);
  const [projectInfoSaveError, setProjectInfoSaveError] = useState('');
  const [crmTimeline, setCrmTimeline] = useState([]);
  const [crmTimelineLoading, setCrmTimelineLoading] = useState(false);
  const [crmTimelineError, setCrmTimelineError] = useState(null);
  const [crmTimelineTotal, setCrmTimelineTotal] = useState(0);

  const loadProject = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      let res;
      if (/^\d+$/.test(String(slug))) {
        res = await projectService.getProjectById(slug);
      } else {
        res = await projectService.getProjectBySlug(slug);
      }
      const transformed = transformProject(res?.data);
      setProject(transformed);
    } catch (error) {
      console.error('Load project error:', error);
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const loadTasks = useCallback(async () => {
    if (!project?.id) return;
    const pid = Number(project.id);
    if (Number.isNaN(pid)) return;
    try {
      setTasksLoading(true);
      const res = await taskService.getTasksByProject(pid, { pageSize: 100, sort: 'updatedAt:desc' });
      setTasks((res?.data || []).map(transformTask).filter(Boolean));
    } catch (error) {
      console.error('Load project tasks error:', error);
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, [project?.id]);

  const refreshTasksAndProject = useCallback(async () => {
    await loadTasks();
    await loadProject();
  }, [loadTasks, loadProject]);

  const loadUsers = useCallback(async () => {
    try {
      const rawUsers = await fetchPmAssignableUsers();
      setUsers(rawUsers.map(transformUser).filter(Boolean));
    } catch (error) {
      console.error('Load users error:', error);
      setUsers([]);
    }
  }, []);

  const loadClients = useCallback(async () => {
    try {
      const rows = await fetchProjectClientOptions();
      setClientOptions(mapProjectClientSelectOptions(rows));
    } catch (error) {
      console.error('Load clients error:', error);
      setClientOptions([]);
    }
  }, []);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const taskStats = useMemo(() => {
    if (!project) return { total: 0, completed: 0, progress: 0 };
    const total = tasks.length > 0 ? tasks.length : project.totalTasks ?? 0;
    const completed =
      tasks.length > 0
        ? tasks.filter((t) => t.strapiStatus === 'COMPLETED').length
        : project.completedTasks ?? 0;
    const progress = total > 0 ? Math.round((completed / total) * 100) : project.progress ?? 0;
    return { total, completed, progress };
  }, [tasks, project]);

  /** Task assignee picker: project team only (keeps existing assignees when editing). */
  const projectTaskUsers = useMemo(() => {
    if (!project) return users;
    const extraFromTasks = collectTaskAssigneeUsers(tasks);
    const extraFromModal = taskModal.task?.assignees || [];
    return usersForProjectTaskAssignment(project, users, {
      extraUsers: [...extraFromTasks, ...extraFromModal],
    });
  }, [project, users, tasks, taskModal.task]);

  const reloadProjectTimeline = useCallback(
    async (opts = {}) => {
      const silent = opts.silent === true;
      if (!project?.id) return;
      if (!silent) {
        setCrmTimelineLoading(true);
        setCrmTimelineError(null);
      }
      try {
        const { data, total } = await fetchProjectActivityTimeline({ projectId: project.id, limit: 80 });
        const rows = Array.isArray(data) ? data : [];
        setCrmTimeline(rows);
        setCrmTimelineTotal(typeof total === 'number' ? total : rows.length);
      } catch (e) {
        if (!silent) {
          setCrmTimelineError(e?.message || 'Could not load activities');
          setCrmTimeline([]);
          setCrmTimelineTotal(0);
        }
      } finally {
        if (!silent) setCrmTimelineLoading(false);
      }
    },
    [project?.id]
  );

  useEffect(() => {
    reloadProjectTimeline({ silent: false });
  }, [reloadProjectTimeline]);

  const activityCount = typeof crmTimelineTotal === 'number' ? crmTimelineTotal : crmTimeline.length;

  const lastActivityDisplay = useMemo(() => {
    const first = crmTimeline?.[0]?.createdAt;
    if (first) return formatDate(first, 'relative') || '—';
    return formatDate(project?.updatedAt, 'relative') || '—';
  }, [crmTimeline, project?.updatedAt]);

  const tabsWithBadges = useMemo(
    () =>
      DETAIL_TABS.map((tab) => ({
        ...tab,
        badge:
          tab.key === 'tasks'
            ? tasks.length
            : tab.key === 'files'
              ? 0
              : tab.key === 'activity'
                ? activityCount || undefined
                : undefined,
      })),
    [tasks.length, activityCount]
  );

  const handleAddProjectComment = useCallback(
    async ({ entityId, comment }) => {
      const res = await addProjectComment({ projectId: entityId, comment });
      await reloadProjectTimeline({ silent: true });
      return res;
    },
    [reloadProjectTimeline]
  );

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        value: String(u.id),
        label: u.name || u.username || u.email || `User ${u.id}`,
      })),
    [users]
  );

  const openProjectInfoEdit = useCallback(() => {
    if (!project || !canEditThisProject) return;
    setProjectInfoDraft(projectToInlineDraft(project));
    setProjectInfoSaveError('');
    setEditingProjectInfo(true);
  }, [project, canEditThisProject]);

  const cancelProjectInfoEdit = useCallback(() => {
    setEditingProjectInfo(false);
    setProjectInfoDraft(null);
    setProjectInfoSaveError('');
  }, []);

  const setProjectInfoField = (field, value) => {
    setProjectInfoDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const saveProjectInfo = async () => {
    if (!project || !projectInfoDraft || !canEditThisProject) return;
    if (!projectInfoDraft.name.trim()) {
      setProjectInfoSaveError('Project name is required.');
      return;
    }
    if (projectInfoDraft.clientId === undefined || projectInfoDraft.clientId === null) {
      setProjectInfoSaveError('Client is required.');
      return;
    }
    if (projectInfoDraft.startDate && projectInfoDraft.endDate && projectInfoDraft.endDate < projectInfoDraft.startDate) {
      setProjectInfoSaveError('Due date must be on or after the start date.');
      return;
    }
    try {
      setSaving(true);
      setProjectInfoSaveError('');
      await projectService.updateProject(project.id, {
        name: projectInfoDraft.name.trim(),
        description: projectInfoDraft.description?.trim() || null,
        status: projectInfoDraft.status,
        startDate: projectInfoDraft.startDate || null,
        endDate: projectInfoDraft.endDate || null,
        budget: projectInfoDraft.budget ? Number(projectInfoDraft.budget) : null,
        projectManager: projectInfoDraft.projectManagerId ? Number(projectInfoDraft.projectManagerId) : null,
        clientAccount: projectInfoDraft.clientId ? Number(projectInfoDraft.clientId) : null,
      });
      setEditingProjectInfo(false);
      setProjectInfoDraft(null);
      await loadProject();
      await reloadProjectTimeline({ silent: true });
    } catch (e) {
      console.error('Save project info error:', e);
      setProjectInfoSaveError('Could not save changes. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateProject = async (patch) => {
    if (!project || !canEditThisProject) return;
    try {
      setSaving(true);
      await projectService.updateProject(project.id, patch);
      await loadProject();
      await reloadProjectTimeline({ silent: true });
    } catch (error) {
      console.error('Update project error:', error);
    } finally {
      setSaving(false);
    }
  };

  const changeProjectOwner = async (userId) => {
    await updateProject({
      projectManager: userId != null && Number.isFinite(Number(userId)) ? Number(userId) : null,
    });
  };

  const saveTask = async (payload) => {
    if (!project) return;
    try {
      setSaving(true);
      const nextPayload = { ...payload, projectId: payload.projectId || project.id };
      if (taskModal.task) await taskService.updateTask(taskModal.task.id, nextPayload);
      else await taskService.createTask(nextPayload);
      setTaskModal({ open: false, task: null, parentContext: null });
      await loadTasks();
      await loadProject();
    } catch (error) {
      console.error('Save task error:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async () => {
    if (!project || !canEditThisProject) return;
    try {
      setSaving(true);
      await projectService.deleteProject(project.id);
      router.push('/projects');
    } catch (error) {
      console.error('Delete project error:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async () => {
    if (!deleteTaskModal.task) return;
    try {
      setSaving(true);
      await taskService.deleteTask(deleteTaskModal.task.id);
      setDeleteTaskModal({ open: false, task: null });
      await loadTasks();
    } catch (error) {
      console.error('Delete task error:', error);
    } finally {
      setSaving(false);
    }
  };

  const copyProjectLink = async () => {
    await navigator.clipboard?.writeText(window.location.href);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <PMPageHeader title="Loading..." breadcrumb={[{ label: 'PM', href: '/' }, { label: 'Projects', href: '/projects' }]} showProfile />
        <Card variant="elevated" className="flex justify-center p-12">
          <LoadingSpinner message="Loading project..." />
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <PMPageHeader title="Project not found" breadcrumb={[{ label: 'PM', href: '/' }, { label: 'Projects', href: '/projects' }]} showProfile />
        <Card variant="elevated" className="p-12 text-center">
          <p className="text-gray-600">This project may have been deleted or moved.</p>
          <Link href="/projects" className="mt-4 inline-block">
            <Button variant="primary">Back to projects</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const statusVisual = projectStatusHeaderVisual(project.strapiStatus);
  const StatusIcon = statusVisual.Icon;
  const editProjectHref = `/projects/${project.slug || project.id}/edit`;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-3">
        <PMPageHeader
          title={project.name}
          breadcrumb={[
            { label: 'PM', href: '/' },
            { label: 'Projects', href: '/projects' },
            { label: project.name, href: `/projects/${project.slug || project.id}` },
          ]}
          showProfile
        >
          <div className="flex flex-wrap items-center justify-end gap-2">
            {canEditThisProject ? (
              <button
                type="button"
                className={headerIconBtnClass}
                title="Edit project details"
                onClick={openProjectInfoEdit}
              >
                <Edit3 className="h-5 w-5" />
              </button>
            ) : null}
            <button type="button" className={headerIconBtnClass} title="Copy link" onClick={copyProjectLink}>
              <Share2 className="h-5 w-5" />
            </button>
            {canEditThisProject ? (
              <button
                type="button"
                className={`group ${headerDangerIconBtnClass}`}
                title="Delete project"
                onClick={() => setDeleteProjectOpen(true)}
              >
                <Trash2
                  className="h-5 w-5 shrink-0 text-brand-text-light transition-colors group-hover:text-red-50"
                  aria-hidden
                />
              </button>
            ) : null}
            <PMRowActions
              items={[
                ...(canEditThisProject
                  ? [
                    {
                      label: 'Edit full page',
                      icon: Edit3,
                      onClick: () => router.push(`/projects/${project.slug || project.id}/edit`),
                    },
                  ]
                  : []),
                ...(canCreateProjectTasks
                  ? [
                    {
                      label: 'Add task',
                      icon: Plus,
                      onClick: () => setTaskModal({ open: true, task: null, parentContext: null }),
                    },
                  ]
                  : []),
                { label: 'Copy link', icon: Copy, onClick: copyProjectLink },
                { label: 'Refresh', icon: RefreshCw, onClick: () => { loadProject(); loadTasks(); } },
              ]}
              label="More project actions"
            />
          </div>
        </PMPageHeader>

        <ProjectDetailMetaBar project={project} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard compact title="Total tasks" value={taskStats.total} icon={CheckSquare} colorScheme="orange" />
        <KPICard compact title="Completed" value={taskStats.completed} icon={CheckCircle2} colorScheme="orange" />
        <KPICard compact title="Progress" value={`${taskStats.progress}%`} icon={TrendingUp} colorScheme="orange" />
        <KPICard compact title="Team" value={(project.team || []).length} icon={Users} colorScheme="orange" />
      </div>

      <TabsWithActions variant="pill" tabs={tabsWithBadges} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card variant="elevated" className="rounded-xl">
              {!(editingProjectInfo && projectInfoDraft) ? (
                <>
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                      <h2 className="text-xl font-semibold text-gray-900">Project information</h2>
                      <p className="mt-1.5 text-base text-gray-500">
                        Scope, timeline, ownership, and how work is tracking.
                      </p>
                    </div>
                    <div
                      className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-start sm:justify-end sm:gap-2.5"
                      role="group"
                      aria-label="Project status"
                    >
                      <span
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-widest shadow-md ring-2 ${statusVisual.pillClass}`}
                        role="status"
                      >
                        <StatusIcon className="h-5 w-5 shrink-0 opacity-90" strokeWidth={2.25} aria-hidden />
                        {statusVisual.label}
                      </span>
                      <Select
                        value={project.strapiStatus}
                        options={PROJECT_STATUS_OPTIONS}
                        onChange={(status) => updateProject({ status })}
                        disabled={saving || !canEditThisProject}
                        containerClassName="sm:w-56"
                        placeholder="Change status"
                      />
                    </div>
                  </div>
                  <div className="space-y-5">
                    <InfoSection title="Key info" icon={Target} isFirst>
                      <div className="mb-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <InfoRow label="Owner" value={project.projectManager ? userLabel(project.projectManager) : ''} />
                        <InfoRow label="Client" icon={Building2}>
                          <ProjectClientInfoValue
                            clientAccountId={project.clientAccountId}
                            clientName={project.clientName}
                          />
                        </InfoRow>
                        <InfoRow label="Start date" value={formatDate(project.startDate, 'short') || ''} icon={Calendar} />
                        <InfoRow label="Due date" value={formatDate(project.endDate, 'short') || ''} icon={Clock} />
                      </div>
                    </InfoSection>

                    <section className="border-t border-gray-100 pt-4">
                      <div className="mb-2 flex items-center gap-2">
                        <AlignLeft className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">About</h3>
                      </div>
                      {isPresent(project.description) ? (
                        <p className="mt-2.5 whitespace-pre-wrap text-base font-normal leading-relaxed text-gray-800">{project.description}</p>
                      ) : (
                        <p className="mt-2.5 text-base font-normal text-gray-400">—</p>
                      )}
                    </section>

                    <p className="border-t border-gray-100 pt-3 text-center text-sm text-gray-500">
                      {canEditThisProject ? (
                        <>
                          <button type="button" onClick={openProjectInfoEdit} className="font-medium text-orange-600 hover:underline">
                            Edit project details
                          </button>
                          <span className="mx-2 text-gray-300" aria-hidden>
                            ·
                          </span>
                          <Link href={editProjectHref} className="font-medium text-gray-500 hover:text-orange-600 hover:underline">
                            Full edit page
                          </Link>
                        </>
                      ) : (
                        <span className="text-gray-400">You can view this project; only admins or assigned managers can change settings.</span>
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                      <h2 className="text-xl font-semibold text-gray-900">Project information</h2>
                      <p className="mt-1.5 text-base text-gray-500">Edit scope, timeline, ownership, and description.</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <Input
                      label="Project name"
                      required
                      value={projectInfoDraft.name}
                      onChange={(e) => setProjectInfoField('name', e.target.value)}
                      disabled={saving}
                    />
                    <InfoSection title="Key info" icon={Target} isFirst>
                      <div className="mb-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <Select
                          label="Project manager"
                          value={projectInfoDraft.projectManagerId}
                          options={[{ value: '', label: 'Unassigned' }, ...userOptions]}
                          onChange={(v) => setProjectInfoField('projectManagerId', v)}
                          disabled={saving}
                          placeholder="Assign owner"
                        />
                        <Select
                          label="Client"
                          required
                          value={projectInfoDraft.clientId}
                          options={[{ value: '', label: 'No client' }, ...clientOptions]}
                          onChange={(v) => setProjectInfoField('clientId', v ?? '')}
                          disabled={saving}
                          placeholder="No client"
                          allowEmpty={false}
                          searchable
                          searchPlaceholder="Search clients…"
                        />
                        <Select
                          label="Status"
                          value={projectInfoDraft.status}
                          options={PROJECT_STATUS_OPTIONS}
                          onChange={(v) => setProjectInfoField('status', v)}
                          disabled={saving}
                        />
                        <Input
                          label="Budget"
                          type="number"
                          min="0"
                          value={projectInfoDraft.budget}
                          onChange={(e) => setProjectInfoField('budget', e.target.value)}
                          disabled={saving}
                        />
                        <Input
                          label="Start date"
                          type="date"
                          value={projectInfoDraft.startDate}
                          onChange={(e) => setProjectInfoField('startDate', e.target.value)}
                          disabled={saving}
                        />
                        <Input
                          label="Due date"
                          type="date"
                          value={projectInfoDraft.endDate}
                          onChange={(e) => setProjectInfoField('endDate', e.target.value)}
                          disabled={saving}
                        />
                      </div>
                    </InfoSection>

                    <section className="border-t border-gray-100 pt-4">
                      <div className="mb-2 flex items-center gap-2">
                        <AlignLeft className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">About</h3>
                      </div>
                      <Textarea
                        rows={5}
                        value={projectInfoDraft.description}
                        onChange={(e) => setProjectInfoField('description', e.target.value)}
                        disabled={saving}
                        className="mt-1 text-base"
                        placeholder="Brief description of the project"
                        resize="none"
                      />
                    </section>

                    {projectInfoSaveError ? (
                      <p className="text-center text-sm text-red-600">{projectInfoSaveError}</p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-3 border-t border-gray-100 pt-4">
                      <Button type="button" variant="primary" disabled={saving} onClick={saveProjectInfo}>
                        {saving ? 'Saving…' : 'Save changes'}
                      </Button>
                      <Button type="button" variant="outline" disabled={saving} onClick={cancelProjectInfoEdit}>
                        Cancel
                      </Button>
                    </div>

                    <p className="text-center text-sm text-gray-500">
                      <Link href={editProjectHref} className="font-medium text-gray-500 hover:text-orange-600 hover:underline">
                        Open full edit page
                      </Link>
                      <span className="mx-2 text-gray-300" aria-hidden>
                        ·
                      </span>
                      <span className="text-gray-400">for team members and more options</span>
                    </p>
                  </div>
                </>
              )}
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
                <EmptyState icon={Users} title="No team members" description="Team members will appear here when assigned to this project." />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {project.team.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <Avatar fallback={(member.initials || member.name || 'U').charAt(0).toUpperCase()} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{userLabel(member)}</p>
                        <p className="truncate text-xs text-gray-500">{member.role || member.email || 'Team member'}</p>
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
                        ? (project.projectManager.initials || userLabel(project.projectManager)).slice(0, 2).toUpperCase()
                        : '?'
                    }
                    alt={project.projectManager ? userLabel(project.projectManager) : 'Unassigned'}
                    size="lg"
                    className="shrink-0 !bg-brand-primary font-semibold text-white shadow-sm ring-2 ring-brand-primary/25"
                  />
                  <p className="min-w-0 flex-1 truncate text-base font-semibold text-gray-900">
                    {project.projectManager ? userLabel(project.projectManager) : 'Unassigned'}
                  </p>
                </div>
                {canEditThisProject ? (
                  <div className="shrink-0 sm:ml-auto">
                    <ProjectOwnerPicker
                      users={users}
                      ownerId={project.projectManager?.id}
                      onChange={changeProjectOwner}
                      disabled={!users.length}
                      saving={saving}
                    />
                  </div>
                ) : null}
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
                      <span className="text-3xl font-bold tabular-nums leading-none text-orange-700">{taskStats.progress}</span>
                      <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Percent</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="hidden text-xs font-medium uppercase tracking-wide text-gray-500 sm:block">Overall completion</p>
                    <p className="mt-0 text-sm text-gray-600 sm:mt-1">Based on tasks marked complete for this project.</p>
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
                      <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(project.createdAt, 'short') || '—'}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
                      <p className="text-xs font-medium text-gray-500">Updated</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(project.updatedAt, 'short') || '—'}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-white px-3.5 py-3 shadow-sm sm:col-span-2">
                      <p className="text-xs font-medium text-gray-500">Budget</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                        {project.budget != null && String(project.budget).trim() !== '' ? (
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

      {activeTab === 'tasks' ? (
        <ProjectTasksPanel
          tasks={displayTasks}
          tasksLoading={tasksLoading}
          users={projectTaskUsers}
          onRefresh={refreshTasksAndProject}
          onAddTask={() => setTaskModal({ open: true, task: null, parentContext: null })}
          onOpenCreateSubtask={(parentRow) =>
            setTaskModal({
              open: true,
              task: null,
              parentContext: {
                id: parentRow.id,
                name: parentRow.name,
                projectId: project?.id,
              },
            })
          }
          onEditTask={(task) => setTaskModal({ open: true, task, parentContext: null })}
          onDeleteTask={(task) => setDeleteTaskModal({ open: true, task })}
          memberScopedTasks={memberScopedTasks}
          currentUserId={currentUserId}
          canCreateProjectTasks={canCreateProjectTasks}
          canAddSubtaskOnTask={(row) => canCreateSubtaskOnTask(row, currentUserId)}
          canApproveAssignments={canApproveAssignments}
        />
      ) : null}

      {activeTab === 'activity' ? (
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
          <div className="lg:col-span-3 min-w-0">
            <EntityActivityPanel
              entityType="project"
              entityId={project.id}
              entityName={project.name}
              crmTimeline={crmTimeline}
              crmTimelineLoading={crmTimelineLoading}
              crmTimelineError={crmTimelineError}
              activityCount={activityCount}
              fetchCommentsFn={({ entityId }) => fetchProjectComments({ projectId: entityId, limit: 80 })}
              addCommentFn={handleAddProjectComment}
              mentionUsers={projectTaskUsers}
              fetchMentionUsers={fetchChatMentionUsers}
              chatFooterBadgeText="Messages are saved on this project for your team."
            />
          </div>
        </div>
      ) : null}

      {activeTab === 'files' ? (
        <Card variant="elevated" className="rounded-xl">
          <EmptyState
            icon={FileText}
            title="No files attached"
            description="The files tab is ready for the CRM-style attachments experience once backend file relations are added."
          />
        </Card>
      ) : null}

      <QuickCreateTaskModal
        isOpen={taskModal.open}
        onClose={() => setTaskModal({ open: false, task: null, parentContext: null })}
        onSubmit={saveTask}
        task={taskModal.task}
        parentContext={taskModal.parentContext}
        projects={[project]}
        lockProject={!taskModal.task}
        lockedProject={
          taskModal.task || !project
            ? null
            : { id: project.id ?? project.documentId, name: project.name }
        }
        users={users}
        assigneeUsers={projectTaskUsers}
        defaultProjectId={project.id}
        defaultAssignerId={defaultAssignerId}
        assigneePickerScopedToProject
        requiresAssignmentApproval={memberScopedTasks}
        saving={saving}
      />

      <Modal isOpen={deleteProjectOpen} onClose={() => setDeleteProjectOpen(false)} title="Delete Project" size="sm">
        <div className="space-y-5">
          <p className="text-sm text-gray-700">
            Delete <span className="font-semibold text-gray-900">{project.name}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteProjectOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="danger" onClick={deleteProject} disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteTaskModal.open} onClose={() => setDeleteTaskModal({ open: false, task: null })} title="Delete Task" size="sm">
        <div className="space-y-5">
          <p className="text-sm text-gray-700">
            Delete <span className="font-semibold text-gray-900">{deleteTaskModal.task?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteTaskModal({ open: false, task: null })} disabled={saving}>Cancel</Button>
            <Button variant="danger" onClick={deleteTask} disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
