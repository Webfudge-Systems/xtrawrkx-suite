"use client";

import Link from "next/link";
import { Avatar, Card } from "@webfudge/ui";
import {
  Activity,
  AlignLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FolderOpen,
  ListTodo,
  Paperclip,
  PlayCircle,
  Timer,
  User,
  XCircle,
} from "lucide-react";

const detailLabelClass =
  "mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500 sm:text-sm";

function DetailCell({ label, icon: Icon, children, className = "" }) {
  return (
    <div className={`min-w-0 px-6 py-4 ${className}`}>
      <div className={detailLabelClass}>
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-gray-400" aria-hidden /> : null}
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}

function GridRow({ children, cols = 4, className = "" }) {
  const colClass =
    cols === 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : cols === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1 md:grid-cols-3";
  return (
    <div
      className={`grid divide-y divide-gray-100 border-b border-gray-100 md:divide-x md:divide-y-0 ${colClass} ${className}`}
    >
      {children}
    </div>
  );
}

function ProgressRing({ percent, size = 44 }) {
  const value = Math.max(0, Math.min(100, Number(percent) || 0));
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const stroke = value >= 100 ? "#10B981" : value >= 40 ? "#FF7A00" : "#94A3B8";

  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className="shrink-0" aria-hidden>
      <circle cx="22" cy="22" r={r} fill="none" stroke="#E5E7EB" strokeWidth="4" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 22 22)"
      />
    </svg>
  );
}

function computeTaskProgress(task) {
  const subs = task?.subtasks || [];
  if (subs.length > 0) {
    const done = subs.filter((s) => (s.status || s.strapiStatus) === "COMPLETED").length;
    const percent = Math.round((done / subs.length) * 100);
    return {
      percent,
      title: percent >= 100 ? "Completed" : "In progress",
      sub: percent >= 100 ? "All subtasks done" : `${done} of ${subs.length} subtasks done`,
    };
  }
  const status = task?.strapiStatus;
  if (status === "COMPLETED" || status === "APPROVED" || status === "DONE") {
    return { percent: 100, title: "Completed", sub: "Excellent work!" };
  }
  if (status === "IN_PROGRESS") {
    return { percent: 55, title: "In Progress", sub: "Task is underway" };
  }
  if (status === "PENDING_REVIEW" || status === "IN_REVIEW" || status === "INTERNAL_REVIEW") {
    return { percent: 80, title: "In Review", sub: "Awaiting review" };
  }
  if (status === "ON_HOLD") {
    return { percent: 40, title: "On Hold", sub: "Work is paused" };
  }
  return { percent: 0, title: "Not started", sub: "Update status as you go" };
}

function computeChecklist(task) {
  const subs = task?.subtasks || [];
  if (subs.length === 0) {
    return { done: 0, total: 0, sub: "No subtasks yet", allDone: false };
  }
  const done = subs.filter((s) => (s.status || s.strapiStatus) === "COMPLETED").length;
  return {
    done,
    total: subs.length,
    sub: done === subs.length ? "All completed" : `${subs.length - done} remaining`,
    allDone: done === subs.length,
  };
}

function AssigneeStack({ assignees = [] }) {
  if (!assignees.length) {
    return <span className="text-base text-gray-400">None assigned</span>;
  }
  const visible = assignees.slice(0, 4);
  const extra = assignees.length - visible.length;

  return (
    <div className="flex -space-x-2">
      {visible.map((person) => (
        <Avatar
          key={person.id || person.name}
          size="sm"
          src={person.avatar || undefined}
          fallback={(person.name || "?").charAt(0).toUpperCase()}
          alt={person.name}
          title={person.name}
          className="!h-9 !w-9 bg-gray-500 text-xs font-semibold text-white ring-2 ring-white"
        />
      ))}
      {extra > 0 ? (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 ring-2 ring-white">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

function formatShortDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function getTaskStatusPillVisual(status, label) {
  const s = status || "ASSIGNED";
  if (s === "COMPLETED" || s === "APPROVED" || s === "DONE") {
    return {
      pillClass:
        "border border-emerald-300/90 bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-100/90 text-emerald-950 ring-emerald-200/70",
      Icon: CheckCircle2,
      label,
    };
  }
  if (s === "CANCELLED") {
    return {
      pillClass:
        "border border-red-300/90 bg-gradient-to-br from-red-50 via-red-50 to-red-100/90 text-red-950 ring-red-200/70",
      Icon: XCircle,
      label,
    };
  }
  if (s === "PENDING_REVIEW" || s === "IN_REVIEW" || s === "INTERNAL_REVIEW" || s === "REVISION_REQUIRED") {
    return {
      pillClass:
        "border border-violet-300/90 bg-gradient-to-br from-violet-50 via-violet-50 to-violet-100/90 text-violet-950 ring-violet-200/70",
      Icon: ListTodo,
      label,
    };
  }
  if (s === "ON_HOLD" || s === "WAITING_FOR_CLIENT" || s === "CLIENT_REVIEW") {
    return {
      pillClass:
        "border border-sky-300/90 bg-gradient-to-br from-sky-50 via-sky-50 to-sky-100/90 text-sky-950 ring-sky-200/70",
      Icon: ListTodo,
      label,
    };
  }
  if (s === "IN_PROGRESS") {
    return {
      pillClass:
        "border border-orange-300/90 bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100/90 text-orange-950 ring-orange-200/70",
      Icon: PlayCircle,
      label,
    };
  }
  return {
    pillClass:
      "border border-blue-300/90 bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100/90 text-blue-950 ring-blue-200/70",
    Icon: ListTodo,
    label,
  };
}

export default function ClientTaskDetailsCard({
  task,
  session,
  statusVisual,
  onViewSubtasks,
  onViewFiles,
  attachmentCount = 0,
}) {
  const progress = computeTaskProgress(task);
  const checklist = computeChecklist(task);
  const StatusIcon = statusVisual?.Icon || ListTodo;

  const reporterName =
    session?.contact?.firstName && session?.contact?.lastName
      ? `${session.contact.firstName} ${session.contact.lastName}`
      : session?.account?.companyName || session?.contact?.firstName || "Client";
  const reporterEmail = session?.contact?.email || session?.account?.email || "";
  const reporterInitial = reporterName.charAt(0).toUpperCase() || "C";

  const assignees = task?.assignee
    ? [{ id: task.assignee.id, name: task.assignee.name, avatar: task.assignee.avatar }]
    : [];

  return (
    <Card variant="elevated" padding={false} className="overflow-hidden rounded-xl">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-gray-100 px-6 pt-6 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 pr-2">
          <h2 className="text-xl font-semibold text-gray-900">Task details</h2>
          <p className="mt-1.5 text-base text-gray-500">Assignment, dates, and project.</p>
        </div>
        <div className="flex w-full shrink-0 sm:w-auto sm:justify-end" role="group" aria-label="Task status">
          <span
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-widest shadow-sm ring-2 ${statusVisual.pillClass}`}
            role="status"
          >
            <StatusIcon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2.25} aria-hidden />
            {statusVisual.label}
          </span>
        </div>
      </div>

      {/* Assignment row */}
      <GridRow cols={4}>
        <DetailCell label="Reporter" icon={User}>
          <div className="flex items-center gap-2.5">
            <Avatar
              size="sm"
              fallback={reporterInitial}
              alt={reporterName}
              className="shrink-0 bg-orange-500 text-white"
            />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold leading-snug text-gray-900">{reporterName}</p>
              {reporterEmail ? (
                <p className="truncate text-sm text-gray-500">{reporterEmail}</p>
              ) : null}
            </div>
          </div>
        </DetailCell>

        <DetailCell label="Assignees">
          <AssigneeStack assignees={assignees} />
        </DetailCell>

        <DetailCell label="Project Manager" icon={User}>
          <span className="text-base text-gray-400">Not assigned</span>
        </DetailCell>

        <DetailCell label="Project" icon={FolderOpen}>
          {task.project ? (
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 shrink-0 text-orange-500" aria-hidden />
              <Link
                href={`/projects/${task.project.id}`}
                className="truncate text-base font-semibold leading-snug text-orange-600 hover:text-orange-700 hover:underline"
              >
                {task.project.name}
              </Link>
            </div>
          ) : (
            <span className="text-base text-gray-400">No project</span>
          )}
        </DetailCell>
      </GridRow>

      {/* Schedule row */}
      <GridRow cols={4}>
        <DetailCell label="Start date" icon={Calendar}>
          <p className="text-base font-semibold leading-snug text-gray-900">—</p>
        </DetailCell>
        <DetailCell label="Due date" icon={Calendar} className="md:border-x md:border-gray-100">
          <p className="text-base font-semibold leading-snug text-gray-900">
            {formatShortDate(task.scheduledDate)}
          </p>
        </DetailCell>
        <DetailCell label="Created" icon={Activity} className="md:border-x md:border-gray-100">
          <p className="text-base font-semibold leading-snug text-gray-900">
            {formatShortDate(task.createdAt)}
          </p>
        </DetailCell>
        <DetailCell label="Updated" icon={Activity}>
          <p className="text-base font-semibold leading-snug text-gray-900">
            {formatShortDate(task.updatedAt)}
          </p>
        </DetailCell>
      </GridRow>

      {/* Metrics row */}
      <GridRow cols={4}>
        <DetailCell label="Time tracking" icon={Clock}>
          <div className="flex items-center gap-2.5">
            <Timer className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
            <div>
              <p className="text-base font-semibold leading-snug text-gray-900">—</p>
              <p className="text-sm text-gray-500">Not logged yet</p>
            </div>
          </div>
        </DetailCell>

        <DetailCell label="Progress" className="md:border-x md:border-gray-100">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <ProgressRing percent={progress.percent} />
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-gray-800">
                {progress.percent}%
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold leading-snug text-gray-900">{progress.title}</p>
              <p className="text-sm text-gray-500">{progress.sub}</p>
            </div>
          </div>
        </DetailCell>

        <DetailCell label="Checklist" icon={ListTodo} className="md:border-r md:border-gray-100">
          <div className="flex items-center gap-2.5">
            <CheckCircle2
              className={`h-5 w-5 shrink-0 ${checklist.allDone && checklist.total > 0 ? "text-emerald-500" : "text-gray-400"}`}
              aria-hidden
            />
            <div>
              <p className="text-base font-semibold leading-snug text-gray-900">
                {checklist.total > 0 ? `${checklist.done}/${checklist.total}` : "—"}
              </p>
              <button
                type="button"
                onClick={onViewSubtasks}
                className="text-sm text-gray-500 hover:text-orange-600 hover:underline"
              >
                {checklist.sub}
              </button>
            </div>
          </div>
        </DetailCell>

        <DetailCell label="Attachments" icon={Paperclip}>
          <div className="flex items-center gap-2.5">
            <Paperclip className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
            <div>
              <p className="text-base font-semibold leading-snug text-gray-900">{attachmentCount ?? 0}</p>
              <button
                type="button"
                onClick={onViewFiles}
                className="text-sm font-medium text-gray-500 hover:text-orange-600 hover:underline"
              >
                View files
              </button>
            </div>
          </div>
        </DetailCell>
      </GridRow>

      {/* Description */}
      <section className="border-t border-gray-100 px-6 py-4">
        <div className="mb-2 flex items-center gap-2">
          <AlignLeft className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Description</h3>
        </div>
        {task.description?.trim() ? (
          <p className="mt-2.5 whitespace-pre-wrap text-base font-normal leading-relaxed text-gray-800">
            {task.description}
          </p>
        ) : (
          <p className="mt-2.5 text-base font-normal text-gray-400">No task description yet.</p>
        )}
        {task.clientActionNotes ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Note from Xtrawrkx</p>
            <p className="mt-1 text-sm text-amber-800">{task.clientActionNotes}</p>
          </div>
        ) : null}
      </section>

      {/* Footer */}
      <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4 text-center">
        <span className="text-sm text-gray-400">Use Comments for discussion with your team.</span>
      </div>
    </Card>
  );
}
