'use client';

import Link from 'next/link';
import { Avatar, formatRelativeTime } from '@webfudge/ui';
import { Building2, Clock, Target } from 'lucide-react';
import { getProjectStatusMeta } from './PMStatusBadge';

const AVATAR_RING = 'ring-2 ring-white';
const MAX_VISIBLE_TEAM = 3;

function MetaDivider() {
  return <span className="hidden h-5 w-px shrink-0 bg-gray-200 sm:block" aria-hidden />;
}

function MetaSegment({ children, className = '' }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 px-3 py-2.5 sm:px-4 ${className}`}>
      {children}
    </div>
  );
}

function TeamStack({ members = [] }) {
  if (!members.length) {
    return <span className="text-sm text-gray-400">No team</span>;
  }

  const visible = members.slice(0, MAX_VISIBLE_TEAM);
  const extra = members.length - visible.length;

  return (
    <div className="flex items-center">
      <div className="flex items-center -space-x-2">
        {visible.map((person) => (
          <Avatar
            key={person.id}
            size="sm"
            src={person.avatar || undefined}
            fallback={person.initials || (person.name || '?').charAt(0).toUpperCase()}
            alt={person.name || 'Team member'}
            title={person.name}
            className={`${AVATAR_RING} ${person.color || 'bg-gray-500 text-white'} !h-8 !w-8 text-xs font-semibold`}
          />
        ))}
        {extra > 0 ? (
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 ${AVATAR_RING}`}
            title={`${extra} more team member${extra !== 1 ? 's' : ''}`}
          >
            +{extra}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function pmClientAccountHref(clientAccountId) {
  if (clientAccountId == null || clientAccountId === '') return null;
  return `/clients/accounts/${clientAccountId}`;
}

function teamMembersForMeta(project) {
  const pm = project.projectManager;
  const team = project.team || project.teamMembers || [];
  const seen = new Set();
  const out = [];
  if (pm?.id) {
    seen.add(pm.id);
    out.push(pm);
  }
  for (const m of team) {
    if (m?.id && !seen.has(m.id)) {
      seen.add(m.id);
      out.push(m);
    }
  }
  return out;
}

export default function ProjectDetailMetaBar({ project, className = '' }) {
  if (!project) return null;

  const statusMeta = getProjectStatusMeta(project.strapiStatus || 'PLANNING');
  const updatedRaw = project.updatedAt || project.createdAt;
  const updatedLabel = updatedRaw ? `Updated ${formatRelativeTime(updatedRaw)}` : null;

  const clientName = project.clientName?.trim();
  const clientHref = pmClientAccountHref(project.clientAccountId);
  const team = teamMembersForMeta(project);

  return (
    <div
      className={`flex flex-wrap items-center rounded-xl border border-gray-200/90 bg-white shadow-sm ${className}`}
      role="group"
      aria-label="Project summary"
    >
      <MetaSegment>
        <Building2 className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} aria-hidden />
        <span className="text-sm text-gray-500">Client:</span>
        {clientName && clientHref ? (
          <Link
            href={clientHref}
            className="truncate text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline"
            title={clientName}
          >
            {clientName}
          </Link>
        ) : clientName ? (
          <span className="truncate text-sm font-semibold text-orange-600" title={clientName}>
            {clientName}
          </span>
        ) : (
          <span className="text-sm text-gray-400">No client</span>
        )}
      </MetaSegment>

      <MetaDivider />

      <MetaSegment>
        <Target className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} aria-hidden />
        <span className="text-sm font-medium text-gray-900">{statusMeta.label}</span>
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
        <TeamStack members={team} />
      </MetaSegment>
    </div>
  );
}
