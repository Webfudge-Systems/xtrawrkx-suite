'use client';

import Link from 'next/link';
import { Avatar, formatRelativeTime } from '@webfudge/ui';
import { Clock, Flag, FolderOpen } from 'lucide-react';
import { getPriorityMeta } from './PMStatusBadge';

const AVATAR_RING = 'ring-2 ring-white';
const MAX_VISIBLE_ASSIGNEES = 2;

const PRIORITY_FLAG_CLASS = {
  high: 'fill-red-500 text-red-500',
  medium: 'fill-amber-500 text-amber-500',
  low: 'fill-emerald-500 text-emerald-500',
};

function MetaDivider() {
  return <span className="hidden h-5 w-px shrink-0 bg-gray-200 sm:block" aria-hidden />;
}

function MetaSegment({ children, className = '' }) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 px-3 py-2.5 sm:px-4 ${className}`}
    >
      {children}
    </div>
  );
}

function AssigneeStack({ assignees = [] }) {
  if (!assignees.length) {
    return (
      <span className="text-sm text-gray-400">Unassigned</span>
    );
  }

  const visible = assignees.slice(0, MAX_VISIBLE_ASSIGNEES);
  const extra = assignees.length - visible.length;

  return (
    <div className="flex items-center">
      <div className="flex items-center -space-x-2">
        {visible.map((person) => (
          <Avatar
            key={person.id}
            size="sm"
            src={person.avatar || undefined}
            fallback={person.initials || (person.name || '?').charAt(0).toUpperCase()}
            alt={person.name || 'Assignee'}
            title={person.name}
            className={`${AVATAR_RING} ${person.color || 'bg-gray-500 text-white'} !h-8 !w-8 text-xs font-semibold`}
          />
        ))}
        {extra > 0 ? (
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 ${AVATAR_RING}`}
            title={`${extra} more assignee${extra !== 1 ? 's' : ''}`}
          >
            +{extra}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function TaskDetailMetaBar({ task, className = '' }) {
  if (!task) return null;

  const priorityKey = (task.priority || task.strapiPriority || 'medium').toLowerCase();
  const priorityMeta = getPriorityMeta(priorityKey);
  const flagClass = PRIORITY_FLAG_CLASS[priorityKey] || 'fill-gray-400 text-gray-400';
  const priorityLabel = `${priorityMeta.label} Priority`;

  const updatedRaw = task.updatedAt || task.createdAt;
  const updatedLabel = updatedRaw
    ? `Updated ${formatRelativeTime(updatedRaw)}`
    : null;

  const projectSlug = task.projectSlug || task.projectId;
  const projectName = task.project;

  return (
    <div
      className={`flex flex-wrap items-center rounded-xl border border-gray-200/90 bg-white shadow-sm ${className}`}
      role="group"
      aria-label="Task summary"
    >
      <MetaSegment>
        <FolderOpen className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} aria-hidden />
        <span className="text-sm text-gray-500">Project:</span>
        {projectName && projectSlug ? (
          <Link
            href={`/projects/${projectSlug}`}
            className="truncate text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline"
            title={projectName}
          >
            {projectName}
          </Link>
        ) : projectName ? (
          <span className="truncate text-sm font-semibold text-orange-600" title={projectName}>
            {projectName}
          </span>
        ) : (
          <span className="text-sm text-gray-400">No project</span>
        )}
      </MetaSegment>

      <MetaDivider />

      <MetaSegment>
        <Flag className={`h-4 w-4 shrink-0 ${flagClass}`} strokeWidth={2} aria-hidden />
        <span className="text-sm font-medium text-gray-900">{priorityLabel}</span>
      </MetaSegment>

      {updatedLabel ? (
        <>
          <MetaDivider />
          <MetaSegment>
            <Clock className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} aria-hidden />
            <span className="whitespace-nowrap text-sm text-gray-600">{updatedLabel}</span>
          </MetaSegment>
        </>
      ) : null}

      <MetaDivider />

      <MetaSegment className="ml-auto sm:ml-0">
        <AssigneeStack assignees={task.assignees} />
      </MetaSegment>
    </div>
  );
}
