'use client';

import { Badge } from '@webfudge/ui';
import {
  crmPmTaskTableSelectFillProps,
  PM_TASK_STATUS_OPTIONS,
  PROJECT_STATUS_OPTIONS,
} from '@webfudge/ui';

export { PM_TASK_STATUS_OPTIONS as TASK_STATUS_OPTIONS, PROJECT_STATUS_OPTIONS };

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const TASK_STATUS_META = {
  SCHEDULED: { variant: 'primary', label: 'To Do' },
  IN_PROGRESS: { variant: 'warning', label: 'In Progress' },
  INTERNAL_REVIEW: { variant: 'purple', label: 'In Review' },
  ON_HOLD: { variant: 'cyan', label: 'On Hold' },
  COMPLETED: { variant: 'success', label: 'Completed' },
  CANCELLED: { variant: 'danger', label: 'Cancelled' },
  OVERDUE: { variant: 'danger', label: 'Overdue' },
};

const PROJECT_STATUS_META = {
  PLANNING: { variant: 'primary', label: 'Planning' },
  ACTIVE: { variant: 'cyan', label: 'Active' },
  IN_PROGRESS: { variant: 'orange', label: 'In Progress' },
  ON_HOLD: { variant: 'purple', label: 'On Hold' },
  COMPLETED: { variant: 'success', label: 'Completed' },
  CANCELLED: { variant: 'danger', label: 'Cancelled' },
  OVERDUE: { variant: 'danger', label: 'Overdue' },
};

const PRIORITY_META = {
  high: { variant: 'danger', label: 'High' },
  medium: { variant: 'warning', label: 'Medium' },
  low: { variant: 'success', label: 'Low' },
};

export function getTaskStatusMeta(status) {
  return TASK_STATUS_META[status] || { variant: 'default', label: status || '—' };
}

export function getProjectStatusMeta(status) {
  return PROJECT_STATUS_META[status] || { variant: 'default', label: status || '—' };
}

export function getPriorityMeta(priority) {
  return PRIORITY_META[(priority || '').toLowerCase()] || { variant: 'default', label: priority || '—' };
}

const PRIORITY_SELECT_FILL_CLASS = {
  high: 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100',
  medium: 'border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100',
  low: 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
};

export function getPrioritySelectFillClass(priority) {
  return PRIORITY_SELECT_FILL_CLASS[(priority || '').toLowerCase()] || PRIORITY_SELECT_FILL_CLASS.medium;
}

/** Shared className + chevron for filled PM table selects (priority only; status uses {@link TableCellTaskStatusSelect}). */
export function pmTableSelectFillProps(value, kind = 'status') {
  if (kind === 'priority') {
    const fill = getPrioritySelectFillClass(value);
    return {
      className: `rounded-lg py-1.5 text-xs font-semibold uppercase tracking-wide shadow-sm ${fill}`,
      chevronClassName: 'text-current opacity-60',
    };
  }
  return crmPmTaskTableSelectFillProps(value);
}

export function PMStatusBadge({ status, type = 'task', className }) {
  const meta = type === 'project' ? getProjectStatusMeta(status) : getTaskStatusMeta(status);
  return (
    <Badge variant={meta.variant} className={className}>
      {meta.label}
    </Badge>
  );
}

export function PMPriorityBadge({ priority, className }) {
  const meta = getPriorityMeta(priority);
  return (
    <Badge variant={meta.variant} className={className}>
      {meta.label}
    </Badge>
  );
}
