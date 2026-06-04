'use client';

import { useRouter } from 'next/navigation';
import { Button, EmptyState } from '@webfudge/ui';
import { FolderOpen } from 'lucide-react';
import { DashboardInsightShell, InsightCountBadge, DashboardProgressRow, progressBarColorForValue } from '@webfudge/ui';

const PROJECT_AVATAR_COLORS = [
  'bg-blue-500 text-white',
  'bg-purple-500 text-white',
  'bg-green-500 text-white',
  'bg-orange-500 text-white',
  'bg-pink-500 text-white',
];

export default function ProjectsOverviewWidget({
  projects = [],
  canViewProjects = true,
  className = '',
}) {
  const router = useRouter();
  const items = (projects || []).slice(0, 5);
  const total = projects?.length ?? 0;

  return (
    <DashboardInsightShell
      className={className}
      title="Projects Overview"
      badge={
        items.length > 0 ? (
          <InsightCountBadge tone="violet">
            {items.length}
            {total > items.length ? `/${total}` : ''}
          </InsightCountBadge>
        ) : null
      }
      subtitle="Top projects by activity"
      action={
        canViewProjects ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/projects')}
            className="!h-7 !px-2 text-[11px] font-semibold text-orange-600 hover:text-orange-700"
          >
            View all
          </Button>
        ) : null
      }
      panelClassName="divide-y divide-gray-100/90"
    >
      {items.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Your projects will appear here."
          className="py-5"
        />
      ) : (
        items.map((project, index) => (
          <button
            key={project.id}
            type="button"
            onClick={() => router.push(`/projects/${project.slug || project.id}`)}
            className="block w-full px-3 py-2 text-left transition-colors hover:bg-white/80"
          >
            <DashboardProgressRow
              label={project.name}
              meta={
                (project.progress ?? 0) > 0
                  ? `${Math.round(project.progress)}% done`
                  : 'Not started'
              }
              percent={project.progress ?? 0}
              avatarFallback={(project.icon || project.name?.charAt(0) || 'P').toUpperCase()}
              avatarClassName={PROJECT_AVATAR_COLORS[index % PROJECT_AVATAR_COLORS.length]}
              barColor={progressBarColorForValue(project.progress)}
            />
          </button>
        ))
      )}
    </DashboardInsightShell>
  );
}
