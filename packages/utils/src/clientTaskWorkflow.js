import {
  getTaskStatusLabel,
  INTERNAL_TASK_STATUS_STEPS,
  normalizeTaskStatus,
  taskHadInProgress,
} from './taskStatusWorkflow';

/** @deprecated Legacy keys — mapped for existing records */
const LEGACY_STAGE_TO_STATUS = {
  CLIENT_SUBMITTED: 'ASSIGNED',
  XTRAWRKX_REVIEW: 'ACCEPTED',
  CLIENT_DECISION: 'WAITING_FOR_CLIENT',
  CLIENT_REVIEW: 'WAITING_FOR_CLIENT',
  CLOSED: 'COMPLETED',
};

/** Canonical workflow stages (aligned with internal status stepper) */
export const CLIENT_WORKFLOW_STAGES = INTERNAL_TASK_STATUS_STEPS.map((step) => ({
  key: step.key,
  label: step.label,
  shortLabel: step.label,
}));

export const CLIENT_WORKFLOW_STAGE_LABELS = Object.fromEntries(
  CLIENT_WORKFLOW_STAGES.map((s) => [s.key, s.label])
);

/**
 * Resolve a task's workflow status from `status` or legacy `clientWorkflowStage`.
 * @param {string | object} stageOrTask
 * @param {object} [task]
 */
export function resolveWorkflowStatus(stageOrTask, task = null) {
  const t =
    task ||
    (stageOrTask && typeof stageOrTask === 'object' ? stageOrTask : null);

  if (t?.strapiStatus || t?.status) {
    return normalizeTaskStatus(t.strapiStatus || t.status);
  }

  const stage =
    typeof stageOrTask === 'string'
      ? stageOrTask
      : t?.clientWorkflowStage;

  if (!stage) return 'ASSIGNED';

  const up = String(stage).toUpperCase();
  if (LEGACY_STAGE_TO_STATUS[up]) return LEGACY_STAGE_TO_STATUS[up];
  if (up === 'PREP_REVIEW') return 'WAITING_FOR_CLIENT';
  if (up === 'CLIENT_REVIEW') return 'WAITING_FOR_CLIENT';
  if (up === 'IN_PROGRESS') return 'IN_PROGRESS';
  if (up === 'INTERNAL_REVIEW') return 'INTERNAL_REVIEW';
  if (up === 'COMPLETED') return 'COMPLETED';
  return normalizeTaskStatus(up);
}

export function getClientWorkflowStageIndex(stage, task = null) {
  const status = resolveWorkflowStatus(stage, task);
  const contextTask = task || { clientWorkflowStage: stage, status };
  const hadProgress = taskHadInProgress({
    strapiStatus: status,
    status,
    stageHistory: contextTask.stageHistory,
  });

  const stepKeys = INTERNAL_TASK_STATUS_STEPS.map((s) => s.key);
  if (status === 'ASSIGNED') return stepKeys.indexOf('ASSIGNED');
  if (status === 'ACCEPTED') return stepKeys.indexOf('ACCEPTED');
  if (status === 'WAITING_FOR_CLIENT') {
    return stepKeys.indexOf(hadProgress ? 'CLIENT_REVIEW' : 'PREP_REVIEW');
  }
  if (status === 'SCHEDULED') return stepKeys.indexOf('SCHEDULED');
  if (
    status === 'IN_PROGRESS' ||
    status === 'ON_HOLD' ||
    status === 'OVERDUE' ||
    status === 'REVISION_REQUIRED'
  ) {
    return stepKeys.indexOf('IN_PROGRESS');
  }
  if (status === 'INTERNAL_REVIEW' || status === 'PENDING_REVIEW') {
    return stepKeys.indexOf('INTERNAL_REVIEW');
  }
  if (status === 'COMPLETED') return stepKeys.indexOf('COMPLETED');
  if (status === 'CANCELLED') return -1;
  return 0;
}

export function getClientWorkflowStageLabel(stage, task = null) {
  const context =
    task ||
    (stage && typeof stage === 'object'
      ? stage
      : { clientWorkflowStage: stage });

  const status = resolveWorkflowStatus(context);
  return getTaskStatusLabel(status, { variant: 'internal', task: context });
}

/** Prep review — client approves details before work starts */
export function isClientActionStage(stage, task = null) {
  const context =
    task ||
    (stage && typeof stage === 'object' ? stage : { clientWorkflowStage: stage });

  if (context.clientActionRequired) {
    const s = resolveWorkflowStatus(context);
    if (s === 'WAITING_FOR_CLIENT') return true;
  }

  const s = resolveWorkflowStatus(context);
  if (s === 'WAITING_FOR_CLIENT' && !taskHadInProgress(context)) return true;

  const up = String(context.clientWorkflowStage || stage || '').toUpperCase();
  return up === 'CLIENT_DECISION' || up === 'PREP_REVIEW';
}

/** Final client review — after work is done */
export function isClientReviewStage(stage, task = null) {
  const context =
    task ||
    (stage && typeof stage === 'object' ? stage : { clientWorkflowStage: stage });

  const s = resolveWorkflowStatus(context);
  if (s === 'WAITING_FOR_CLIENT' && taskHadInProgress(context)) return true;
  if (context.clientApprovalStatus === 'pending' && s === 'WAITING_FOR_CLIENT') return true;

  const up = String(context.clientWorkflowStage || stage || '').toUpperCase();
  return up === 'CLIENT_REVIEW';
}
