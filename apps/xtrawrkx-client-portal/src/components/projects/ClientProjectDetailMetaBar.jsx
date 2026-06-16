"use client";

import { Avatar, formatRelativeTime, PROJECT_STATUS_OPTIONS } from "@webfudge/ui";
import { Building2, Clock, Lock, Target } from "lucide-react";

function getProjectStatusLabel(status) {
  const s = (status || "PLANNING").toUpperCase();
  return PROJECT_STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s.replace(/_/g, " ");
}

function MetaDivider() {
  return <span className="hidden h-5 w-px shrink-0 bg-gray-200 sm:block" aria-hidden />;
}

function MetaSegment({ children, className = "" }) {
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
  const visible = members.slice(0, 3);
  const extra = members.length - visible.length;
  return (
    <div className="flex items-center -space-x-2">
      {visible.map((person) => (
        <Avatar
          key={person.id}
          size="sm"
          src={person.avatar || undefined}
          fallback={person.initials || (person.name || "?").charAt(0).toUpperCase()}
          alt={person.name || "Team member"}
          title={person.name}
          className="ring-2 ring-white !h-8 !w-8 bg-gray-600 text-xs font-semibold text-white"
        />
      ))}
      {extra > 0 ? (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 ring-2 ring-white">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

export default function ClientProjectDetailMetaBar({ project, className = "" }) {
  if (!project) return null;

  const statusLabel = getProjectStatusLabel(project.strapiStatus || project.status);
  const updatedRaw = project.updatedAt || project.createdAt;
  const updatedLabel = updatedRaw ? `Updated ${formatRelativeTime(updatedRaw)}` : null;
  const team = [
    ...(project.projectManager ? [project.projectManager] : []),
    ...(project.team || project.teamMembers || []).filter(
      (m) => m?.id !== project.projectManager?.id
    ),
  ];

  return (
    <div
      className={`flex flex-wrap items-center rounded-xl border border-gray-200/90 bg-white shadow-sm ${className}`}
      role="group"
      aria-label="Project summary"
    >
      {project.clientName ? (
        <>
          <MetaSegment>
            <Building2 className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} aria-hidden />
            <span className="text-sm text-gray-500">Organization:</span>
            <span className="truncate text-sm font-semibold text-orange-600" title={project.clientName}>
              {project.clientName}
            </span>
          </MetaSegment>
          <MetaDivider />
        </>
      ) : null}

      <MetaSegment>
        <Target className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} aria-hidden />
        <span className="text-sm font-medium text-gray-900">{statusLabel}</span>
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

      {project.isPrivate ? (
        <>
          <MetaDivider />
          <MetaSegment>
            <Lock className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} aria-hidden />
            <span className="text-xs font-medium text-gray-500">Private</span>
          </MetaSegment>
        </>
      ) : null}
    </div>
  );
}
