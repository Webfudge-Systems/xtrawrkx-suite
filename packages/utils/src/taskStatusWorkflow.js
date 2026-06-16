/**
 * Unified task status workflow — client portal, PM, and CRM.
 *
 * Client-visible pipeline:
 *   Assigned → Accepted → Review (prep) → In progress → Your review → Completed
 *
 * Internal (PM/CRM) pipeline adds Scheduled, Internal review, and a distinct client-review step.
 */

export const TASK_STATUS_LABELS = {
  ASSIGNED: 'Assigned',
  ACCEPTED: 'Accepted',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In progress',
  INTERNAL_REVIEW: 'Internal review',
  PENDING_REVIEW: 'Review',
  WAITING_FOR_CLIENT: 'Client review',
  REVISION_REQUIRED: 'Revision required',
  ON_HOLD: 'On hold',
  OVERDUE: 'Overdue',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

/** Client portal chevron steps */
export const CLIENT_TASK_STATUS_STEPS = [
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'PREP_REVIEW', label: 'Review' },
  { key: 'IN_PROGRESS', label: 'In progress' },
  { key: 'CLIENT_REVIEW', label: 'Your review' },
  { key: 'COMPLETED', label: 'Completed' },
];

/** PM / CRM chevron steps (includes internal-only stages) */
export const INTERNAL_TASK_STATUS_STEPS = [
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'PREP_REVIEW', label: 'Client review' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'IN_PROGRESS', label: 'In progress' },
  { key: 'INTERNAL_REVIEW', label: 'Internal review' },
  { key: 'CLIENT_REVIEW', label: 'Client review' },
  { key: 'COMPLETED', label: 'Completed' },
];

export const TASK_STATUS_SELECT_OPTIONS = [
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'WAITING_FOR_CLIENT', label: 'Client review' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'INTERNAL_REVIEW', label: 'Internal review' },
  { value: 'PENDING_REVIEW', label: 'Review' },
  { value: 'REVISION_REQUIRED', label: 'Revision required' },
  { value: 'ON_HOLD', label: 'On hold' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function normalizeTaskStatus(status) {
  return String(status || 'ASSIGNED')
    .toUpperCase()
    .replace(/\s+/g, '_');
}

export function getTaskStatusLabel(status, options = {}) {
  const { variant = 'internal', task = null } = options;
  const key = normalizeTaskStatus(status);

  if (key === 'WAITING_FOR_CLIENT') {
    const hadProgress = taskHadInProgress(
      task || { status: key, stageHistory: task?.stageHistory }
    );
    if (variant === 'client') {
      return hadProgress ? 'Your review' : 'Review';
    }
    return hadProgress ? 'Client review (final)' : 'Client review (prep)';
  }

  return TASK_STATUS_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Whether the task has entered active work (used to distinguish prep vs final client review).
 * @param {{ status?: string, strapiStatus?: string, stageHistory?: object[] }} [task]
 */
export function taskHadInProgress(task) {
  if (!task) return false;
  const s = normalizeTaskStatus(task.strapiStatus || task.status);
  if (
    s === 'IN_PROGRESS' ||
    s === 'ON_HOLD' ||
    s === 'OVERDUE' ||
    s === 'REVISION_REQUIRED' ||
    s === 'INTERNAL_REVIEW' ||
    s === 'PENDING_REVIEW' ||
    s === 'COMPLETED'
  ) {
    return true;
  }
  if (s === 'WAITING_FOR_CLIENT') {
    const hist = Array.isArray(task.stageHistory) ? task.stageHistory : [];
    return hist.some((e) => {
      const stage = normalizeTaskStatus(e?.stage);
      return stage === 'IN_PROGRESS' || stage === 'CLIENT_REVIEW' || stage === 'CLOSED';
    });
  }
  return false;
}

/**
 * @param {string} status
 * @param {{ variant?: 'client' | 'internal', task?: object }} [options]
 * @returns {number} Step index, or -1 for cancelled
 */
export function getTaskStatusStepIndex(status, options = {}) {
  const { variant = 'client', task = null } = options;
  const s = normalizeTaskStatus(status);
  const hadProgress = taskHadInProgress(task || { status: s, stageHistory: task?.stageHistory });

  if (s === 'CANCELLED') return -1;
  if (s === 'COMPLETED') return variant === 'internal' ? 7 : 5;

  if (variant === 'client') {
    if (s === 'ASSIGNED') return 0;
    if (s === 'ACCEPTED') return 1;
    if (s === 'WAITING_FOR_CLIENT') return hadProgress ? 4 : 2;
    if (s === 'SCHEDULED' || s === 'IN_PROGRESS' || s === 'ON_HOLD' || s === 'OVERDUE' || s === 'REVISION_REQUIRED') {
      return 3;
    }
    if (s === 'INTERNAL_REVIEW' || s === 'PENDING_REVIEW') return hadProgress ? 4 : 3;
    return 0;
  }

  // internal
  if (s === 'ASSIGNED') return 0;
  if (s === 'ACCEPTED') return 1;
  if (s === 'WAITING_FOR_CLIENT') return hadProgress ? 6 : 2;
  if (s === 'SCHEDULED') return 3;
  if (s === 'IN_PROGRESS' || s === 'ON_HOLD' || s === 'OVERDUE' || s === 'REVISION_REQUIRED') return 4;
  if (s === 'INTERNAL_REVIEW' || s === 'PENDING_REVIEW') return 5;
  return 0;
}

export function getTaskStatusSteps(variant = 'client') {
  return variant === 'internal' ? INTERNAL_TASK_STATUS_STEPS : CLIENT_TASK_STATUS_STEPS;
}

/**
 * Suggested next status transitions (for docs / future UI).
 */
export const TASK_STATUS_TRANSITION_HINTS = {
  ASSIGNED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['WAITING_FOR_CLIENT', 'SCHEDULED', 'IN_PROGRESS', 'CANCELLED'],
  WAITING_FOR_CLIENT: ['IN_PROGRESS', 'ACCEPTED', 'CANCELLED'],
  SCHEDULED: ['IN_PROGRESS', 'ON_HOLD', 'CANCELLED'],
  IN_PROGRESS: ['INTERNAL_REVIEW', 'ON_HOLD', 'CANCELLED'],
  INTERNAL_REVIEW: ['COMPLETED', 'WAITING_FOR_CLIENT', 'IN_PROGRESS', 'CANCELLED'],
  PENDING_REVIEW: ['COMPLETED', 'WAITING_FOR_CLIENT', 'IN_PROGRESS', 'CANCELLED'],
  REVISION_REQUIRED: ['IN_PROGRESS', 'CANCELLED'],
  ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};
