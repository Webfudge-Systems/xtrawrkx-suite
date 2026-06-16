'use client';

import {
  getTaskStatusStepIndex,
  getTaskStatusSteps,
  normalizeTaskStatus,
} from '@webfudge/utils';

function stepFillColor(index, currentIndex) {
  if (index > currentIndex) return null;
  const start = { h: 33, s: 100, l: 72 };
  const end = { h: 20, s: 92, l: 48 };
  const t = currentIndex <= 0 ? 1 : index / currentIndex;
  const h = start.h + (end.h - start.h) * t;
  const s = start.s + (end.s - start.s) * t;
  const l = start.l + (end.l - start.l) * t;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function segmentClipPath(isFirst, isLast) {
  const tail = 12;
  if (isFirst && isLast) return undefined;
  if (isFirst) {
    return `polygon(0 0, calc(100% - ${tail}px) 0, 100% 50%, calc(100% - ${tail}px) 100%, 0 100%)`;
  }
  if (isLast) {
    return `polygon(0 0, 100% 0, 100% 100%, 0 100%, ${tail}px 50%)`;
  }
  return `polygon(0 0, calc(100% - ${tail}px) 0, 100% 50%, calc(100% - ${tail}px) 100%, 0 100%, ${tail}px 50%)`;
}

function ChevronStep({ label, index, currentIndex, isFirst, isLast, total }) {
  const isReached = index <= currentIndex;
  const isCurrent = index === currentIndex;
  const fill = isReached ? stepFillColor(index, currentIndex) : '#f9fafb';
  const textColor = isReached ? '#ffffff' : '#9ca3af';
  const fontWeight = isCurrent ? 700 : isReached ? 600 : 500;

  return (
    <div
      className="relative min-w-0 flex-1"
      style={{
        marginLeft: isFirst ? 0 : -10,
        zIndex: total - index,
      }}
    >
      <div
        className="flex h-11 items-center justify-center px-2 text-center text-[10px] uppercase tracking-wide sm:h-12 sm:px-3 sm:text-[11px] lg:text-xs"
        style={{
          clipPath: segmentClipPath(isFirst, isLast),
          background: isReached
            ? `linear-gradient(135deg, ${fill} 0%, ${stepFillColor(Math.min(index + 0.35, currentIndex), currentIndex) || fill} 100%)`
            : fill,
          color: textColor,
          fontWeight,
          boxShadow: isCurrent ? 'inset 0 -2px 0 rgba(0,0,0,0.12)' : undefined,
        }}
      >
        <span className="truncate px-0.5">{label}</span>
      </div>
    </div>
  );
}

/**
 * Chevron task status bar — highlights current step and all prior steps with an orange gradient.
 *
 * @param {{ status?: string, variant?: 'client' | 'internal', task?: object, className?: string }} props
 */
export function TaskStatusStepper({
  status,
  variant = 'client',
  task = null,
  className = '',
}) {
  const normalized = normalizeTaskStatus(status);
  const steps = getTaskStatusSteps(variant);
  const contextTask = task ?? { status: normalized, stageHistory: [] };
  const currentIndex = getTaskStatusStepIndex(normalized, { variant, task: contextTask });
  const onHold = normalized === 'ON_HOLD';

  if (normalized === 'CANCELLED') {
    return (
      <div
        className={`rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100/80 px-4 py-3 text-center text-sm font-semibold text-red-800 ${className}`.trim()}
      >
        Task cancelled
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        className="overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-sm"
        role="list"
        aria-label="Task status progress"
      >
        <div className="flex w-full">
          {steps.map((step, index) => (
            <ChevronStep
              key={step.key}
              label={step.label}
              index={index}
              currentIndex={currentIndex}
              isFirst={index === 0}
              isLast={index === steps.length - 1}
              total={steps.length}
            />
          ))}
        </div>
      </div>
      {onHold ? (
        <p className="mt-1.5 text-center text-xs font-medium text-sky-700">
          Task is on hold — progress resumes when work continues.
        </p>
      ) : null}
    </div>
  );
}

export default TaskStatusStepper;
