'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Modal, Select, Textarea } from '@webfudge/ui';
import { PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from './PMStatusBadge';
import TaskRecurrenceFormFields, { recurrencePayloadFromForm } from './TaskRecurrenceFormFields';
import TaskAssigneesPicker from './TaskAssigneesPicker';
import { usersForProjectTaskAssignment } from '../lib/api/projectAssignableUsers';

const EMPTY_FORM = {
  name: '',
  description: '',
  status: 'SCHEDULED',
  priority: 'medium',
  startDate: '',
  scheduledDate: '',
  projectId: '',
  assignerId: '',
  assigneeUserIds: [],
  recurrenceFrequency: 'none',
  recurrenceInterval: 1,
  recurrenceWeekdays: [],
  recurrenceMonthDay: '',
  recurrenceCustomUnit: 'day',
  recurrenceEndsAt: '',
};

function userLabel(user) {
  return user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || user?.email || `User ${user?.id}`;
}

/** Resolve locked project for create flows (project detail, subtasks under a project). */
function resolveFrozenProject({ lockProject, lockedProject, defaultProjectId, projects, isEdit }) {
  if (isEdit) return null;
  if (!lockProject && !lockedProject) return null;

  const fromLocked = lockedProject?.id ?? lockedProject?.documentId;
  const fromDefault = defaultProjectId != null && String(defaultProjectId).trim() !== '' ? defaultProjectId : null;
  const fromSingle =
    projects.length === 1 ? projects[0]?.id ?? projects[0]?.documentId : null;
  const rawId = fromLocked ?? fromDefault ?? fromSingle;
  if (rawId == null || String(rawId).trim() === '') return null;

  const id = String(rawId);
  const match = projects.find(
    (p) => String(p.id) === id || String(p.documentId) === id
  );
  const name = lockedProject?.name || match?.name || 'Current project';
  return { id, name };
}

export default function QuickCreateTaskModal({
  isOpen,
  onClose,
  onSubmit,
  task = null,
  /** When creating a subtask: `{ id, name, projectId? }` of the parent task */
  parentContext = null,
  projects = [],
  users = [],
  /** When set, limits task assignee picker; assigner dropdown still uses `users`. */
  assigneeUsers = null,
  defaultProjectId = '',
  defaultStatus = 'SCHEDULED',
  defaultAssignerId = '',
  /** When true (e.g. project detail page), project cannot be changed on create. */
  lockProject = false,
  /** Optional `{ id, documentId?, name }` for display; id falls back to defaultProjectId. */
  lockedProject = null,
  saving = false,
  title,
  /** When true, assignee helper text reflects project-team roster (project detail page). */
  assigneePickerScopedToProject = false,
  /** Org member: assignees require admin/manager approval before they take effect. */
  requiresAssignmentApproval = false,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const frozenProject = useMemo(
    () => resolveFrozenProject({ lockProject, lockedProject, defaultProjectId, projects, isEdit: Boolean(task) }),
    [lockProject, lockedProject, defaultProjectId, projects, task]
  );
  const projectLocked = Boolean(frozenProject?.id);
  const rosterForAssignees = useMemo(() => {
    if (assigneeUsers != null) return assigneeUsers;
    if (projectLocked) {
      const pid = frozenProject?.id;
      const projectRecord =
        projects.find(
          (p) => String(p.id) === String(pid) || String(p.documentId) === String(pid)
        ) || projects[0];
      if (projectRecord) {
        return usersForProjectTaskAssignment(projectRecord, users, {
          extraUsers: task?.assignees || [],
        });
      }
    }
    return users;
  }, [assigneeUsers, projectLocked, frozenProject?.id, projects, users, task?.assignees]);

  useEffect(() => {
    if (!isOpen) return;
    if (task) {
      setForm({
        name: task.name || '',
        description: task.description || '',
        status: task.strapiStatus || 'SCHEDULED',
        priority: task.priority || 'medium',
        startDate: task.startDate ? task.startDate.slice(0, 10) : '',
        scheduledDate:
          task.recurrenceFrequency && task.recurrenceFrequency !== 'none'
            ? ''
            : task.dueDate
              ? task.dueDate.slice(0, 10)
              : '',
        projectId: task.projectId ? String(task.projectId) : defaultProjectId ? String(defaultProjectId) : '',
        assignerId: task.assignerId ? String(task.assignerId) : '',
        assigneeUserIds: Array.isArray(task.assigneeUserIds) ? [...task.assigneeUserIds] : [],
        recurrenceFrequency: task.recurrenceFrequency || 'none',
        recurrenceInterval: task.recurrenceInterval ?? 1,
        recurrenceWeekdays: Array.isArray(task.recurrenceWeekdays) ? [...task.recurrenceWeekdays] : [],
        recurrenceMonthDay:
          task.recurrenceMonthDay != null && task.recurrenceMonthDay !== ''
            ? String(task.recurrenceMonthDay)
            : '',
        recurrenceCustomUnit: task.recurrenceCustomUnit || 'day',
        recurrenceEndsAt: task.recurrenceEndsAt ? task.recurrenceEndsAt.slice(0, 10) : '',
      });
      return;
    }
    const fromParent =
      parentContext && parentContext.id != null && parentContext.projectId != null && parentContext.projectId !== ''
        ? String(parentContext.projectId)
        : '';
    const lockedId = projectLocked ? frozenProject.id : '';
    setForm({
      ...EMPTY_FORM,
      status: defaultStatus || 'SCHEDULED',
      projectId: lockedId || fromParent || (defaultProjectId ? String(defaultProjectId) : ''),
      assignerId: defaultAssignerId ? String(defaultAssignerId) : '',
      assigneeUserIds: [],
    });
  }, [defaultAssignerId, defaultProjectId, defaultStatus, frozenProject, isOpen, projectLocked, task, parentContext]);

  const update = (key, value) => {
    if (key === 'projectId' && projectLocked) return;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isSubtaskCreate = Boolean(parentContext && parentContext.id != null && !task);
  const isRecurring = !isSubtaskCreate && form.recurrenceFrequency && form.recurrenceFrequency !== 'none';

  const submit = () => {
    if (!form.name.trim()) return;
    const effectiveAssignerId =
      isSubtaskCreate && (!form.assignerId || String(form.assignerId).trim() === '')
        ? defaultAssignerId || ''
        : form.assignerId;
    const base = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      status: form.status,
      priority: form.priority,
      startDate: form.startDate || null,
      scheduledDate: isRecurring ? null : form.scheduledDate || null,
      projectId: projectLocked ? frozenProject.id : form.projectId || null,
      assignerId: effectiveAssignerId,
      assigneeUserIds: [...form.assigneeUserIds],
      ...(isSubtaskCreate
        ? {
            recurrenceFrequency: 'none',
            recurrenceInterval: 1,
            recurrenceWeekdays: [],
            recurrenceMonthDay: null,
            recurrenceCustomUnit: 'day',
            recurrenceEndsAt: null,
          }
        : recurrencePayloadFromForm(form)),
    };
    if (isSubtaskCreate) {
      base.parentId = parentContext.id;
    }
    onSubmit?.(base);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || (task ? 'Edit Task' : isSubtaskCreate ? 'Add subtask' : 'Create Task')}
      size="lg"
      contentClassName="space-y-5"
    >
      <div className="space-y-5">
        {isSubtaskCreate ? (
          <p className="rounded-lg border border-orange-100 bg-orange-50/90 px-3 py-2 text-sm text-orange-950">
            Subtask of <span className="font-semibold">{parentContext.name || 'parent task'}</span>
          </p>
        ) : null}
        <Input
          label="Task name"
          value={form.name}
          onChange={(event) => update('name', event.target.value)}
          placeholder="Enter task name"
          required
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(event) => update('description', event.target.value)}
          rows={4}
          resize="none"
          placeholder="Add context, acceptance criteria, or notes"
        />

        {!isSubtaskCreate ? (
          <TaskRecurrenceFormFields
            value={form}
            onChange={(patch) =>
              setForm((prev) => {
                const next = { ...prev, ...patch };
                if (patch.recurrenceFrequency && patch.recurrenceFrequency !== 'none') {
                  next.scheduledDate = '';
                }
                return next;
              })
            }
            disabled={saving}
          />
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Status"
            value={form.status}
            options={TASK_STATUS_OPTIONS}
            onChange={(value) => update('status', value)}
          />
          <Select
            label="Priority"
            value={form.priority}
            options={PRIORITY_OPTIONS}
            onChange={(value) => update('priority', value)}
          />
          <Input
            label="Start date"
            type="date"
            value={form.startDate}
            onChange={(event) => update('startDate', event.target.value)}
          />
          {!isRecurring ? (
            <Input
              label="Due date"
              type="date"
              value={form.scheduledDate}
              onChange={(event) => update('scheduledDate', event.target.value)}
            />
          ) : null}
          {projectLocked ? (
            <Select
              label="Project"
              value={frozenProject.id}
              options={[{ value: frozenProject.id, label: frozenProject.name }]}
              allowEmpty={false}
              disabled
              onChange={() => {}}
            />
          ) : (
            <Select
              label="Project"
              value={form.projectId}
              options={projects.map((project) => ({ value: String(project.id), label: project.name }))}
              onChange={(value) => update('projectId', value)}
              placeholder="No project"
              searchable
              searchPlaceholder="Search projects…"
            />
          )}
          <Select
            label={task ? 'Assigner' : 'Assigner (defaults to you when blank)'}
            value={form.assignerId}
            options={users.map((u) => ({ value: String(u.id), label: userLabel(u) }))}
            onChange={(value) => update('assignerId', value)}
            placeholder="Current user (optional)"
            containerClassName="sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <p className="mb-2 block text-sm font-medium leading-none text-black">Assignees</p>
            <p className="mb-3 text-xs text-gray-500">
              {requiresAssignmentApproval
                ? 'Choose who should work on this task. An admin or manager must approve before they are assigned.'
                : assigneePickerScopedToProject
                  ? 'Only members of this project team can be assigned.'
                  : 'People actively working on this task (shown as overlapping profile circles).'}
            </p>
            <TaskAssigneesPicker
              userIds={form.assigneeUserIds}
              assignees={task?.assignees}
              users={rosterForAssignees}
              onChange={(next) => update('assigneeUserIds', next)}
              disabled={saving}
              compact={false}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !form.name.trim()}>
            {saving ? 'Saving...' : task ? 'Save Task' : isSubtaskCreate ? 'Create subtask' : 'Create Task'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
