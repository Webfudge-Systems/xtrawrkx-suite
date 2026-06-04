'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Avatar, ownerDisplayFromUser } from '@webfudge/ui';
import { clsx } from 'clsx';
import { FolderOpen, GripVertical } from 'lucide-react';
import { ProgressBar as PMProgress } from '@webfudge/ui';
import { PROJECT_STATUS_OPTIONS } from './PMStatusBadge';
import { canEditProjectInPm } from '../lib/pmOrgRoles';

const BOARD_COLUMNS = PROJECT_STATUS_OPTIONS.filter((status) => status.value !== 'CANCELLED');

const BOARD_COLUMN_STYLES = {
  PLANNING: {
    header: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    dropActive: 'border-blue-400 bg-blue-50/80 shadow-lg shadow-blue-100',
  },
  ACTIVE: {
    header: 'bg-cyan-50 border-cyan-200',
    text: 'text-cyan-700',
    badge: 'bg-cyan-100 text-cyan-700',
    dropActive: 'border-cyan-400 bg-cyan-50/80 shadow-lg shadow-cyan-100',
  },
  IN_PROGRESS: {
    header: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    dropActive: 'border-amber-400 bg-amber-50/80 shadow-lg shadow-amber-100',
  },
  ON_HOLD: {
    header: 'bg-violet-50 border-violet-200',
    text: 'text-violet-700',
    badge: 'bg-violet-100 text-violet-700',
    dropActive: 'border-violet-400 bg-violet-50/80 shadow-lg shadow-violet-100',
  },
  COMPLETED: {
    header: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
    dropActive: 'border-emerald-400 bg-emerald-50/80 shadow-lg shadow-emerald-100',
  },
  default: {
    header: 'bg-gray-50 border-gray-200',
    text: 'text-gray-700',
    badge: 'bg-gray-100 text-gray-700',
    dropActive: 'border-gray-400 bg-gray-50/80 shadow-lg shadow-gray-100',
  },
};

const TEAM_STACK_RINGS = [
  'ring-2 ring-sky-400 ring-offset-[2px] ring-offset-white',
  'ring-2 ring-amber-400 ring-offset-[2px] ring-offset-white',
  'ring-2 ring-rose-400 ring-offset-[2px] ring-offset-white',
];

function isProjectOverdue(project) {
  if (!project?.endDate) return false;
  const due = new Date(project.endDate);
  if (Number.isNaN(due.getTime())) return false;
  return due < new Date() && project.strapiStatus !== 'COMPLETED' && project.strapiStatus !== 'CANCELLED';
}

function formatShortDate(iso) {
  if (!iso) return 'No due date';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'No due date';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function TeamAvatarStack({ members, maxShown = 4, className }) {
  const list = Array.isArray(members) ? members.filter(Boolean) : [];
  if (list.length === 0) {
    return <span className={clsx('text-xs text-gray-400', className)}>—</span>;
  }
  const shown = list.slice(0, maxShown);
  const overflow = list.length - shown.length;
  const title = list
    .map((m) => m?.name || m?.username || m?.email)
    .filter(Boolean)
    .join(', ');
  return (
    <div className={clsx('flex items-center pt-0.5', className)} title={title}>
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
              'relative border-2 border-white bg-gray-600 text-white',
              TEAM_STACK_RINGS[i % TEAM_STACK_RINGS.length],
              i > 0 && '-ml-2'
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

function ProjectKanbanCardInner({ project, router, canDrag }) {
  const overdue = isProjectOverdue(project);

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => router.push(`/projects/${project.slug || project.id}`)}
          className="line-clamp-2 flex-1 text-left text-sm font-semibold leading-snug text-gray-900 hover:text-orange-600"
        >
          {project.name || 'Untitled project'}
        </button>
        {canDrag ? (
          <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
        ) : (
          <FolderOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
        )}
      </div>
      <p className="mt-1 line-clamp-2 text-xs text-gray-500">
        {project.description || project.clientName || 'No description'}
      </p>
      <div className="mt-3">
        <PMProgress value={project.progress} size="sm" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <TeamAvatarStack members={project.team || []} maxShown={3} className="min-h-7" />
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            overdue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Due {formatShortDate(project.endDate)}
        </span>
      </div>
    </>
  );
}

function ProjectKanbanCard({ project, router, canDrag, overlay = false }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(project.id),
    disabled: !canDrag,
  });

  return (
    <div
      ref={setNodeRef}
      {...(canDrag ? attributes : {})}
      {...(canDrag ? listeners : {})}
      className={[
        'group rounded-xl border bg-white p-3.5 text-left shadow-sm transition-all',
        canDrag ? 'cursor-grab active:cursor-grabbing' : '',
        isDragging
          ? 'opacity-25 shadow-none'
          : 'border-gray-200 hover:border-orange-200 hover:shadow-md',
        overlay
          ? 'rotate-1 border-orange-300 shadow-2xl ring-2 ring-orange-400/30 !opacity-100'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <ProjectKanbanCardInner project={project} router={router} canDrag={canDrag} />
    </div>
  );
}

function ProjectKanbanColumn({ stageKey, label, projects, isOver, router, currentUserId }) {
  const { setNodeRef } = useDroppable({ id: stageKey });
  const style = BOARD_COLUMN_STYLES[stageKey] || BOARD_COLUMN_STYLES.default;

  return (
    <div
      ref={setNodeRef}
      className={[
        'flex min-h-[420px] min-w-[280px] max-w-[320px] flex-shrink-0 flex-col rounded-2xl border transition-all duration-150',
        isOver ? style.dropActive : 'border-gray-200 bg-gray-50/60',
      ].join(' ')}
    >
      <div
        className={`flex items-center justify-between rounded-t-2xl border-b px-4 py-3 ${style.header}`}
      >
        <h3 className={`text-[11px] font-extrabold uppercase tracking-widest ${style.text}`}>
          {label}
        </h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${style.badge}`}>
          {projects.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3">
        {projects.length === 0 ? (
          <div
            className={`flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition-colors ${
              isOver ? 'border-current bg-white/80' : 'border-gray-200 bg-white/40'
            }`}
          >
            <p className="text-[11px] text-gray-400">
              {isOver ? 'Release to move here' : 'No projects'}
            </p>
          </div>
        ) : (
          projects.map((project) => (
            <ProjectKanbanCard
              key={project.id}
              project={project}
              router={router}
              canDrag={canEditProjectInPm(project, currentUserId)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Kanban board for projects: drag cards between status columns to update status.
 */
export default function ProjectsKanbanBoard({ projects, router, onStatusChange, currentUserId }) {
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const columnData = useMemo(() => {
    const byStatus = {};
    BOARD_COLUMNS.forEach(({ value }) => {
      byStatus[value] = [];
    });
    for (const project of projects) {
      const status =
        project.strapiStatus && byStatus[project.strapiStatus] != null
          ? project.strapiStatus
          : 'PLANNING';
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push(project);
    }
    return BOARD_COLUMNS.map(({ value, label }) => ({
      key: value,
      label,
      projects: byStatus[value] || [],
    }));
  }, [projects]);

  const activeProject = useMemo(() => {
    if (!activeId) return null;
    return projects.find((p) => String(p.id) === activeId) ?? null;
  }, [activeId, projects]);

  const resolveDropStatus = useCallback(
    (overIdValue) => {
      if (!overIdValue) return null;
      const id = String(overIdValue);
      if (BOARD_COLUMNS.some((c) => c.value === id)) return id;
      const overProject = projects.find((p) => String(p.id) === id);
      return overProject?.strapiStatus ?? null;
    },
    [projects]
  );

  const handleDragStart = useCallback(({ active }) => {
    setActiveId(String(active.id));
  }, []);

  const handleDragOver = useCallback(({ over }) => {
    const status = resolveDropStatus(over?.id);
    setOverId(status);
  }, [resolveDropStatus]);

  const handleDragEnd = useCallback(
    async ({ active, over }) => {
      setActiveId(null);
      setOverId(null);
      if (!over) return;
      const projectId = String(active.id);
      const newStatus = resolveDropStatus(over.id);
      if (!newStatus) return;
      const project = projects.find((p) => String(p.id) === projectId);
      if (!project || project.strapiStatus === newStatus) return;
      if (!canEditProjectInPm(project, currentUserId)) return;
      await onStatusChange(project, newStatus);
    },
    [projects, currentUserId, onStatusChange, resolveDropStatus]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-4 pb-5 md:p-5">
        {columnData.map(({ key, label, projects: colProjects }) => (
          <ProjectKanbanColumn
            key={key}
            stageKey={key}
            label={label}
            projects={colProjects}
            isOver={overId === key}
            router={router}
            currentUserId={currentUserId}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
        {activeProject ? (
          <div className="w-[280px] rotate-1 rounded-xl border border-orange-300 bg-white p-3.5 shadow-2xl ring-2 ring-orange-400/30">
            <ProjectKanbanCardInner
              project={activeProject}
              router={router}
              canDrag={canEditProjectInPm(activeProject, currentUserId)}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
