'use client';

import { EmptyState } from '@webfudge/ui';
import { CheckSquare } from 'lucide-react';
import { DashboardInsightShell, InsightCountBadge } from '@webfudge/ui';
import TaskActivityAreaChart from './TaskActivityAreaChart';

const SEGMENTS = [
  { key: 'todo', label: 'To Do', color: '#FF7A00' },
  { key: 'inProgress', label: 'In Progress', color: '#3B82F6' },
  { key: 'done', label: 'Completed', color: '#10B981' },
  { key: 'overdue', label: 'Overdue', color: '#EF4444' },
];

const RADIUS = 34;
const STROKE = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const DONUT_SIZE = 108;

function TaskDonutChart({ stats }) {
  const values = {
    todo: stats.todo || 0,
    inProgress: stats.inProgress || 0,
    done: stats.done || 0,
    overdue: stats.overdue || 0,
  };
  const total = Object.values(values).reduce((sum, n) => sum + n, 0);

  let offset = 0;
  const arcs = SEGMENTS.map((seg) => {
    const value = values[seg.key] || 0;
    const fraction = total > 0 ? value / total : 0;
    const length = fraction * CIRCUMFERENCE;
    const arc = {
      ...seg,
      value,
      percent: total > 0 ? ((value / total) * 100).toFixed(1).replace(/\.0$/, '') : '0',
      strokeDasharray: `${length} ${CIRCUMFERENCE - length}`,
      strokeDashoffset: -offset,
    };
    offset += length;
    return arc;
  });

  return (
    <div className="flex items-center gap-4 px-3 py-2.5">
      <div className="relative shrink-0" style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
        <svg
          width={DONUT_SIZE}
          height={DONUT_SIZE}
          viewBox="0 0 120 120"
          className="block"
          aria-hidden
        >
          <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="#E5E7EB" strokeWidth={STROKE} />
          {total > 0
            ? arcs.map((arc) =>
                arc.value > 0 ? (
                  <circle
                    key={arc.key}
                    cx="60"
                    cy="60"
                    r={RADIUS}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={arc.strokeDasharray}
                    strokeDashoffset={arc.strokeDashoffset}
                    transform="rotate(-90 60 60)"
                  />
                ) : null
              )
            : null}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold tabular-nums leading-none text-gray-900">{total}</span>
          <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-gray-500">
            tasks
          </span>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-1">
        {arcs.map((arc) => (
          <li key={arc.key} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-1.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: arc.color }}
                aria-hidden
              />
              <span className="font-medium text-gray-700">{arc.label}</span>
            </span>
            <span className="shrink-0 tabular-nums text-gray-600">
              <span className="font-semibold text-gray-900">{arc.value}</span>
              <span className="text-gray-400"> ({arc.percent}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TaskOverviewWidget({ stats, tasks = [], className = '' }) {
  const total =
    (stats?.todo || 0) + (stats?.inProgress || 0) + (stats?.done || 0) + (stats?.overdue || 0);

  return (
    <DashboardInsightShell
      className={className}
      title="Task Overview"
      badge={total > 0 ? <InsightCountBadge tone="orange">{total}</InsightCountBadge> : null}
      subtitle="Status breakdown"
    >
      {total === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Breakdown appears when you have tasks."
          className="py-5"
        />
      ) : (
        <div className="flex flex-col">
          <TaskDonutChart stats={stats} />
          <TaskActivityAreaChart tasks={tasks} days={7} className="pb-1" />
        </div>
      )}
    </DashboardInsightShell>
  );
}
