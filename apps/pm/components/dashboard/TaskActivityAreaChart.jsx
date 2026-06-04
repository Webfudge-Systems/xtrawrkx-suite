'use client';

import { useId, useMemo } from 'react';
import { buildTaskActivitySeries } from './taskActivitySeries';

const W = 280;
const H = 72;
const PAD = { top: 6, right: 4, bottom: 18, left: 4 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

function scaleY(value, max) {
  if (max <= 0) return CHART_H;
  return CHART_H - (value / max) * CHART_H;
}

function pointCoords(values, max) {
  const n = values.length;
  const step = n > 1 ? CHART_W / (n - 1) : CHART_W;
  return values.map((v, i) => {
    const x = PAD.left + (n > 1 ? i * step : CHART_W / 2);
    const y = PAD.top + scaleY(v, max);
    return [x, y];
  });
}

/** Closed path between lower and upper value series (stacked band). */
function buildBandPath(lowerValues, upperValues, max) {
  const lower = pointCoords(lowerValues, max);
  const upper = pointCoords(upperValues, max);
  if (lower.length === 0) return '';

  let d = `M ${lower[0][0]} ${lower[0][1]}`;
  for (let i = 1; i < lower.length; i++) d += ` L ${lower[i][0]} ${lower[i][1]}`;
  for (let i = upper.length - 1; i >= 0; i--) d += ` L ${upper[i][0]} ${upper[i][1]}`;
  d += ' Z';
  return d;
}

function buildLinePath(values, max) {
  const coords = pointCoords(values, max);
  if (coords.length === 0) return '';
  return coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
}

export default function TaskActivityAreaChart({ tasks = [], days = 7, className = '' }) {
  const uid = useId().replace(/:/g, '');
  const { points, max } = useMemo(() => buildTaskActivitySeries(tasks, days), [tasks, days]);

  const createdValues = points.map((p) => p.created);
  const stackedTop = points.map((p) => p.created + p.completed);
  const totalValues = points.map((p) => p.total);

  const createdBand = buildBandPath(
    points.map(() => 0),
    createdValues,
    max
  );
  const completedBand = buildBandPath(createdValues, stackedTop, max);
  const totalLine = buildLinePath(totalValues, max);

  const step = points.length > 1 ? CHART_W / (points.length - 1) : CHART_W;
  const hasActivity = totalValues.some((v) => v > 0);

  const gradCreated = `task-area-created-${uid}`;
  const gradCompleted = `task-area-completed-${uid}`;

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-3 pt-2 pb-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          Activity · last {days} days
        </p>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" aria-hidden />
            Created
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            Done
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto block w-full max-w-full"
        role="img"
        aria-label={`Task activity over the last ${days} days`}
      >
        <defs>
          <linearGradient id={gradCreated} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FF7A00" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id={gradCompleted} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.06" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((frac) => (
          <line
            key={frac}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + CHART_H * frac}
            y2={PAD.top + CHART_H * frac}
            stroke="#E5E7EB"
            strokeWidth="0.5"
            strokeDasharray="3 3"
          />
        ))}

        {hasActivity ? (
          <>
            <path d={createdBand} fill={`url(#${gradCreated})`} />
            <path d={completedBand} fill={`url(#${gradCompleted})`} />
            <path
              d={totalLine}
              fill="none"
              stroke="#FF7A00"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((p, i) => {
              const x = PAD.left + (points.length > 1 ? i * step : CHART_W / 2);
              const y = PAD.top + scaleY(p.total, max);
              return (
                <circle
                  key={p.label}
                  cx={x}
                  cy={y}
                  r="2.5"
                  fill="#FF7A00"
                  stroke="#fff"
                  strokeWidth="1"
                >
                  <title>{`${p.shortLabel}: ${p.created} created, ${p.completed} completed`}</title>
                </circle>
              );
            })}
          </>
        ) : (
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + CHART_H}
            y2={PAD.top + CHART_H}
            stroke="#E5E7EB"
            strokeWidth="1"
          />
        )}

        {points.map((p, i) => {
          const x = PAD.left + (points.length > 1 ? i * step : CHART_W / 2);
          return (
            <text
              key={`${p.label}-x`}
              x={x}
              y={H - 4}
              textAnchor="middle"
              className="fill-gray-400 text-[9px]"
            >
              {p.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
