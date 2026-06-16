'use strict';

const CLIENT_WORKFLOW_STAGES = [
  'ASSIGNED',
  'ACCEPTED',
  'PREP_REVIEW',
  'SCHEDULED',
  'IN_PROGRESS',
  'INTERNAL_REVIEW',
  'CLIENT_REVIEW',
  'COMPLETED',
  'CANCELLED',
];

const STAGE_LABELS = {
  ASSIGNED: 'Assigned',
  ACCEPTED: 'Accepted',
  PREP_REVIEW: 'Client review (prep)',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In progress',
  INTERNAL_REVIEW: 'Internal review',
  CLIENT_REVIEW: 'Client review (final)',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  /* legacy */
  CLIENT_SUBMITTED: 'Assigned',
  XTRAWRKX_REVIEW: 'Accepted',
  CLIENT_DECISION: 'Client review (prep)',
  CLOSED: 'Completed',
};

function defaultStageForClientCreated() {
  return 'ASSIGNED';
}

function defaultStageForInternalShared() {
  return 'ACCEPTED';
}

function appendStageHistory(existing, entry) {
  const base = Array.isArray(existing) ? [...existing] : [];
  base.push({
    stage: entry.stage,
    at: entry.at || new Date().toISOString(),
    by: entry.by || null,
    byType: entry.byType || 'system',
    note: entry.note || null,
  });
  return base;
}

function stageHistoryHadInProgress(history) {
  if (!Array.isArray(history)) return false;
  return history.some((e) => {
    const stage = String(e?.stage || '').toUpperCase();
    return (
      stage === 'IN_PROGRESS' ||
      stage === 'CLIENT_REVIEW' ||
      stage === 'CLOSED' ||
      stage === 'COMPLETED' ||
      stage === 'INTERNAL_REVIEW'
    );
  });
}

function taskHadProgress(task) {
  if (!task) return false;
  const s = String(task.status || '').toUpperCase();
  if (
    ['IN_PROGRESS', 'ON_HOLD', 'OVERDUE', 'REVISION_REQUIRED', 'INTERNAL_REVIEW', 'PENDING_REVIEW', 'COMPLETED'].includes(
      s
    )
  ) {
    return true;
  }
  return stageHistoryHadInProgress(task.stageHistory);
}

function mapStatusToStage(status, task) {
  const s = String(status || '').toUpperCase();
  if (s === 'ASSIGNED') return 'ASSIGNED';
  if (s === 'ACCEPTED') return 'ACCEPTED';
  if (s === 'WAITING_FOR_CLIENT') {
    return taskHadProgress(task) ? 'CLIENT_REVIEW' : 'PREP_REVIEW';
  }
  if (s === 'SCHEDULED') return 'SCHEDULED';
  if (s === 'IN_PROGRESS' || s === 'ON_HOLD' || s === 'OVERDUE' || s === 'REVISION_REQUIRED') {
    return 'IN_PROGRESS';
  }
  if (s === 'INTERNAL_REVIEW' || s === 'PENDING_REVIEW') return 'INTERNAL_REVIEW';
  if (s === 'COMPLETED' || s === 'APPROVED') return 'COMPLETED';
  if (s === 'CANCELLED') return 'CANCELLED';
  return null;
}

module.exports = {
  CLIENT_WORKFLOW_STAGES,
  STAGE_LABELS,
  defaultStageForClientCreated,
  defaultStageForInternalShared,
  appendStageHistory,
  mapStatusToStage,
  stageHistoryHadInProgress,
  taskHadProgress,
};
