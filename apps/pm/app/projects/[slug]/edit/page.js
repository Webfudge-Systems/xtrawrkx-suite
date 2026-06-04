'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@webfudge/auth';
import {
  Card,
  Button,
  Input,
  Textarea,
  Select,
  LoadingSpinner,
} from '@webfudge/ui';
import {
  ArrowLeft,
  Save,
  FolderOpen,
  CalendarDays,
  DollarSign,
} from 'lucide-react';
import PMPageHeader from '../../../../components/PMPageHeader';
import TaskAssigneesPicker from '../../../../components/TaskAssigneesPicker';
import projectService from '../../../../lib/api/projectService';
import { fetchProjectClientOptions, mapProjectClientSelectOptions } from '../../../../lib/api/projectClientOptions';
import { fetchProjectDirectoryUsers } from '../../../../lib/api/messageService';
import { transformProject, transformUser } from '../../../../lib/api/dataTransformers';
import { canEditProjectInPm, getPmOrgRoleKind } from '../../../../lib/pmOrgRoles';

const STATUS_OPTIONS = [
  { value: 'PLANNING', label: 'Planning' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const { user: authUser } = useAuth();
  const currentUserId = useMemo(() => {
    const u = authUser?.attributes || authUser;
    return u?.id ?? authUser?.id ?? null;
  }, [authUser]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [projectSlug, setProjectSlug] = useState('');
  const [errors, setErrors] = useState({});

  const [allUsers, setAllUsers] = useState([]);
  const [clientOptions, setClientOptions] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'PLANNING',
    startDate: '',
    endDate: '',
    budget: '',
    clientId: '',
    projectManagerId: '',
    teamMemberIds: [],
  });

  const directoryUsers = useMemo(() => {
    const base = allUsers;
    if (currentUserId == null) return base;
    const sid = String(currentUserId);
    if (base.some((u) => String(u.id) === sid)) return base;
    const raw = authUser?.attributes || authUser;
    const merged = transformUser({ id: Number(currentUserId), ...raw });
    return merged ? [...base, merged] : base;
  }, [allUsers, currentUserId, authUser]);

  const loadUsersAndClients = useCallback(async () => {
    setClientsLoading(true);
    try {
      const [usersRes, clients] = await Promise.allSettled([
        fetchProjectDirectoryUsers(),
        fetchProjectClientOptions(),
      ]);
      if (usersRes.status === 'fulfilled') {
        const raw = usersRes.value || [];
        setAllUsers(raw.map(transformUser).filter(Boolean));
      }
      if (clients.status === 'fulfilled') {
        setClientOptions(mapProjectClientSelectOptions(clients.value));
      } else {
        setClientOptions([]);
      }
    } catch {
      setClientOptions([]);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsersAndClients();
  }, [loadUsersAndClients]);

  useEffect(() => {
    if (getPmOrgRoleKind() === 'member') {
      router.replace('/projects');
    }
  }, [router]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let res;
        if (/^\d+$/.test(String(slug))) {
          res = await projectService.getProjectById(slug);
        } else {
          res = await projectService.getProjectBySlug(slug);
        }
        const raw = res?.data;
        if (!cancelled && raw) {
          const p = transformProject(raw);
          if (!canEditProjectInPm(p, currentUserId)) {
            router.replace(`/projects/${p.slug || p.id}`);
            return;
          }
          setProjectId(p.id);
          setProjectSlug(p.slug || String(p.id));
          setForm({
            name: p.name || '',
            description: p.description || '',
            status: p.strapiStatus || 'PLANNING',
            startDate: p.startDate ? p.startDate.slice(0, 10) : '',
            endDate: p.endDate ? p.endDate.slice(0, 10) : '',
            budget: p.budget != null && p.budget !== '' ? String(p.budget) : '',
            clientId: p.clientAccountId ? String(p.clientAccountId) : '',
            projectManagerId: p.projectManager?.id ? String(p.projectManager.id) : '',
            teamMemberIds: (p.team || []).map((m) => String(m.id)),
          });
        }
      } catch (e) {
        console.error('Load project for edit:', e);
        if (!cancelled) setProjectId(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, router, currentUserId]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Project name is required';
    if (form.clientId === undefined || form.clientId === null) {
      errs.clientId = 'Client is required';
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      errs.endDate = 'End date must be after start date';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || !projectId) return;
    try {
      setSaving(true);
      setErrors((prev) => ({ ...prev, submit: '' }));
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        status: form.status,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        budget: form.budget ? Number(form.budget) : null,
      };
      if (form.projectManagerId) payload.projectManager = Number(form.projectManagerId);
      else payload.projectManager = null;
      if (form.clientId) payload.clientAccount = Number(form.clientId);
      else payload.clientAccount = null;
      payload.teamMembers = form.teamMemberIds.map(Number);

      await projectService.updateProject(projectId, payload);
      router.push(`/projects/${projectSlug || projectId}`);
    } catch (err) {
      console.error('Update project error:', err);
      setErrors({ submit: 'Failed to save project. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const userOptions = directoryUsers.map((u) => ({
    value: String(u.id),
    label: u.name || u.username || u.email || `User ${u.id}`,
  }));

  const assigneeUserIds = useMemo(
    () => form.teamMemberIds.map((id) => Number(id)).filter((n) => Number.isFinite(n) && n > 0),
    [form.teamMemberIds],
  );

  const detailHref = `/projects/${projectSlug || slug || projectId || ''}`;

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

  if (!projectId) {
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

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PMPageHeader
        title="Edit project"
        subtitle="Update project details, timeline, team, and client"
        showProfile
        breadcrumb={[
          { label: 'PM', href: '/' },
          { label: 'Projects', href: '/projects' },
          { label: form.name || 'Project', href: detailHref },
          { label: 'Edit', href: '#' },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errors.submit}</div>
        ) : null}

        <Card
          title={
            <span className="inline-flex items-center gap-3">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-500">
                <FolderOpen className="h-4 w-4 text-white" />
              </span>
              <span>Project information</span>
            </span>
          }
          subtitle="Basic information about the project"
          variant="default"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Input
                label="Project name"
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                error={errors.name}
                placeholder="Enter project name"
              />
              <Select label="Status" value={form.status} options={STATUS_OPTIONS} onChange={(val) => setForm((p) => ({ ...p, status: val }))} />
            </div>
            <Textarea
              label="Project description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={4}
              placeholder="Describe the project goals and requirements..."
            />
          </div>
        </Card>

        <Card
          title={
            <span className="inline-flex items-center gap-3">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
                <CalendarDays className="h-4 w-4 text-white" />
              </span>
              <span>Project timeline</span>
            </span>
          }
          subtitle="Start and end dates for this project"
          variant="default"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Start date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
            />
            <Input
              label="Due date"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
              error={errors.endDate}
            />
          </div>
        </Card>

        <Card
          title={
            <span className="inline-flex items-center gap-3">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500">
                <DollarSign className="h-4 w-4 text-white" />
              </span>
              <span>Budget &amp; assignment</span>
            </span>
          }
          subtitle="Budget, client, one project manager, and multiple assignees"
          variant="default"
        >
          <div className="space-y-4">
            <Input
              label="Budget"
              type="number"
              min="0"
              value={form.budget}
              onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))}
              placeholder="Optional"
            />
            <Select
              label="Client"
              required
              value={form.clientId}
              options={[{ value: '', label: 'No client' }, ...clientOptions]}
              onChange={(val) => setForm((p) => ({ ...p, clientId: val ?? '' }))}
              placeholder={clientsLoading ? 'Loading clients…' : 'No client'}
              allowEmpty={false}
              disabled={clientsLoading}
              searchable
              searchPlaceholder="Search clients…"
              error={errors.clientId}
            />
            {!clientsLoading && clientOptions.length === 0 ? (
              <p className="text-xs text-gray-500">
                No client accounts found for your organization. Add accounts in CRM (Clients → Accounts), then link them here.
              </p>
            ) : null}
            <Select
              label="Project manager"
              value={form.projectManagerId}
              options={[{ value: '', label: 'Not assigned' }, ...userOptions]}
              onChange={(val) => setForm((p) => ({ ...p, projectManagerId: val }))}
              placeholder="Choose one project manager"
            />
            <p className="text-xs text-gray-500 -mt-2">Only one project manager. Same member list as assignees.</p>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-800">Project assignees</p>
              <p className="mb-2 text-xs text-gray-500">Multiple people from your organization (optional).</p>
              {directoryUsers.length > 0 ? (
                <TaskAssigneesPicker
                  userIds={assigneeUserIds}
                  users={directoryUsers}
                  assignees={[]}
                  onChange={(next) =>
                    setForm((p) => ({
                      ...p,
                      teamMemberIds: next.map(String),
                    }))
                  }
                  compact={false}
                  pickerMode="modal"
                  searchable
                  popoverTitle="Project assignees"
                />
              ) : (
                <p className="text-sm text-gray-500">Loading organization members…</p>
              )}
            </div>
          </div>
        </Card>

        <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            rounded="default"
            className="!border-gray-300 !text-gray-700 hover:!bg-gray-50 px-5"
            onClick={() => router.push(detailHref)}
            disabled={saving}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            rounded="pill"
            className="bg-gradient-to-r from-orange-500 to-pink-500 px-6 shadow-lg hover:from-orange-600 hover:to-pink-600"
            disabled={saving}
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Saving…</span>
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save project
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
