'use client';

import { EmptyState } from '@webfudge/ui';
import { Users } from 'lucide-react';
import { DashboardInsightShell, InsightCountBadge, DashboardProgressRow } from '@webfudge/ui';

const BAR_PALETTE = ['orange', 'green', 'blue', 'purple', 'teal', 'pink', 'indigo'];

/**
 * Workload % = share of open (non-completed) tasks for that member vs the busiest member.
 */
export function computeTeamWorkload(people, tasks, limit = 5) {
  const openCounts = new Map();

  for (const task of tasks || []) {
    if (task.strapiStatus === 'COMPLETED' || task.strapiStatus === 'CANCELLED') continue;
    const seen = new Set();
    for (const member of task.assignees || []) {
      if (member?.id == null || seen.has(member.id)) continue;
      seen.add(member.id);
      openCounts.set(member.id, (openCounts.get(member.id) || 0) + 1);
    }
  }

  const peopleById = new Map((people || []).map((p) => [p.id, p]));
  const entries = [...openCounts.entries()]
    .map(([id, count]) => {
      const person = peopleById.get(id);
      return {
        id,
        name: person?.name || 'Unknown',
        initials: person?.initials || '?',
        color: person?.color || 'bg-gray-500',
        avatar: person?.avatar,
        openCount: count,
      };
    })
    .sort((a, b) => b.openCount - a.openCount);

  const maxOpen = entries.length > 0 ? Math.max(...entries.map((e) => e.openCount)) : 1;

  return entries.slice(0, limit).map((entry, index) => ({
    ...entry,
    percent: maxOpen > 0 ? Math.round((entry.openCount / maxOpen) * 100) : 0,
    barColor: BAR_PALETTE[index % BAR_PALETTE.length],
  }));
}

export default function TeamWorkloadWidget({ people = [], tasks = [], className = '' }) {
  const workload = computeTeamWorkload(people, tasks);
  const totalOpen = workload.reduce((sum, m) => sum + m.openCount, 0);

  return (
    <DashboardInsightShell
      className={className}
      title="Team Workload"
      badge={
        workload.length > 0 ? (
          <InsightCountBadge tone="blue">{totalOpen} open</InsightCountBadge>
        ) : null
      }
      subtitle="Relative load by assignee"
      panelClassName="divide-y divide-gray-100/90"
    >
      {workload.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No workload data"
          description="Assign tasks to see workload."
          className="py-5"
        />
      ) : (
        workload.map((member) => (
          <div key={member.id} className="px-3 py-2">
            <DashboardProgressRow
              label={member.name}
              meta={member.openCount === 1 ? '1 task' : `${member.openCount} tasks`}
              percent={member.percent}
              avatarFallback={member.initials}
              avatarClassName={`${member.color} text-white`}
              avatarSrc={member.avatar}
              barColor={member.barColor}
            />
          </div>
        ))
      )}
    </DashboardInsightShell>
  );
}
