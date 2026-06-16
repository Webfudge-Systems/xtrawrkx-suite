'use client';

import { TaskStatusStepper } from '../TaskStatusStepper';
import { resolveWorkflowStatus } from '@webfudge/utils';

/**
 * Pipeline UI for client-visible task workflow — uses the shared status stepper.
 *
 * @param {{
 *   currentStage?: string,
 *   status?: string,
 *   task?: object,
 *   compact?: boolean,
 *   variant?: 'client' | 'internal',
 *   className?: string,
 *   showLabels?: boolean,
 * }} props
 */
export function TaskWorkflowPipeline({
  currentStage,
  status,
  task = null,
  compact = false,
  variant = 'internal',
  className = '',
}) {
  const contextTask = task || {};
  const resolvedStatus =
    status || resolveWorkflowStatus(currentStage, contextTask);

  const stepperTask = {
    ...contextTask,
    strapiStatus: resolvedStatus,
    status: resolvedStatus,
    stageHistory: contextTask.stageHistory,
    clientWorkflowStage: currentStage || contextTask.clientWorkflowStage,
  };

  return (
    <TaskStatusStepper
      status={resolvedStatus}
      variant={variant}
      task={stepperTask}
      className={compact ? className : className}
    />
  );
}

export default TaskWorkflowPipeline;
