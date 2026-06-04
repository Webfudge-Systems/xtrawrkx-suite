'use client';

import dynamic from 'next/dynamic';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildWorkspaceCalendarEvents, filterWorkspaceCalendarEvents } from '@webfudge/utils';
import { Button, Card } from '@webfudge/ui';
import { CalendarRange, Loader2 } from 'lucide-react';
import CRMPageHeader from '../../components/CRMPageHeader';
import meetingService from '../../lib/api/meetingService';
import { loadWorkspaceCalendarData } from '../../lib/loadWorkspaceCalendar';
import { pmProjectDetailUrl } from '../../lib/pmAppUrl';

const UnifiedWorkspaceCalendar = dynamic(() => import('@webfudge/ui').then(m => ({ default: m.UnifiedWorkspaceCalendar })), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500">
      Loading calendar…
    </div>
  ),
});

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'meeting', label: 'Meetings' },
  { id: 'task', label: 'Tasks' },
  { id: 'project', label: 'Projects' },
];

function initialVisibleRange() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  };
}

export default function WorkspaceCalendarPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [viewRange, setViewRange] = useState(initialVisibleRange);

  const loadRange = useCallback(async (rangeStart, rangeEnd) => {
    setLoading(true);
    try {
      const data = await loadWorkspaceCalendarData(rangeStart, rangeEnd);
      setMeetings(data.meetings);
      setTasks(data.tasks);
      setProjects(data.projects);
    } catch (e) {
      console.error('Workspace calendar:', e);
      setMeetings([]);
      setTasks([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDatesSet = useCallback(
    (arg) => {
      setViewRange({ start: arg.start, end: arg.end });
      loadRange(arg.start, arg.end);
    },
    [loadRange]
  );

  const allEvents = useMemo(
    () =>
      buildWorkspaceCalendarEvents({
        meetings,
        tasks,
        projects,
        rangeStart: viewRange.start,
        rangeEnd: viewRange.end,
      }),
    [meetings, tasks, projects, viewRange]
  );

  const fcEvents = useMemo(() => filterWorkspaceCalendarEvents(allEvents, filter), [allEvents, filter]);

  const counts = useMemo(
    () => ({
      all: allEvents.length,
      meeting: allEvents.filter((e) => e.extendedProps?.kind === 'meeting').length,
      task: allEvents.filter((e) => e.extendedProps?.kind === 'task').length,
      project: allEvents.filter((e) => e.extendedProps?.kind === 'project').length,
    }),
    [allEvents]
  );

  const onMeetingTimeChange = useCallback(async (meeting, { startTime, endTime }) => {
    await meetingService.update(meeting.id, {
      startTime,
      ...(endTime != null ? { endTime } : {}),
    });
    setMeetings((prev) =>
      prev.map((m) => (m.id === meeting.id ? { ...m, startTime, endTime } : m))
    );
  }, []);

  const onEventClick = useCallback(
    ({ kind, entity }) => {
      if (kind === 'meeting' && entity?.id) {
        router.push(`/meetings/${entity.id}`);
        return;
      }
      if (kind === 'task') {
        router.push('/clients/tasks');
        return;
      }
      if (kind === 'project') {
        const slug = entity?.slug || entity?.id;
        if (!slug) {
          router.push('/clients/projects');
          return;
        }
        window.location.href = pmProjectDetailUrl(slug);
      }
    },
    [router]
  );

  const todaySummary = useMemo(() => {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const ts = dayStart.getTime();
    const te = dayEnd.getTime();

    let nMeetings = 0;
    let nTasks = 0;
    for (const ev of allEvents) {
      const k = ev.extendedProps?.kind;
      if (k !== 'meeting' && k !== 'task') continue;
      const t0 = new Date(ev.start).getTime();
      if (t0 < ts || t0 > te) continue;
      if (k === 'meeting') nMeetings += 1;
      if (k === 'task') nTasks += 1;
    }
    return { nMeetings, nTasks };
  }, [allEvents]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <CRMPageHeader
        title="Calendar"
        subtitle="Meetings, scheduled tasks, and project timelines — same schedule in CRM and PM"
        breadcrumb={[
          { label: 'Workspace', href: '/workspace' },
          { label: 'Calendar', href: '/calendar' },
        ]}
      />

      <Card className="border border-gray-200 p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
              <CalendarRange className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <p className="mt-0.5 text-sm text-gray-600">
                Today:{' '}
                <span className="font-medium text-gray-800">
                  {todaySummary.nMeetings} meeting{todaySummary.nMeetings === 1 ? '' : 's'}
                </span>
                ,{' '}
                <span className="font-medium text-gray-800">
                  {todaySummary.nTasks} task{todaySummary.nTasks === 1 ? '' : 's'}
                </span>{' '}
                scheduled
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <Button
                key={f.id}
                type="button"
                size="sm"
                variant={filter === f.id ? 'primary' : 'outline'}
                className={
                  filter === f.id
                    ? 'bg-orange-600 hover:bg-orange-700 border-orange-600'
                    : 'border-gray-200'
                }
                onClick={() => setFilter(f.id)}
              >
                {f.label}
                {f.id !== 'all' && (
                  <span className="ml-1.5 tabular-nums text-xs opacity-90">
                    ({counts[f.id] ?? 0})
                  </span>
                )}
              </Button>
            ))}
            {loading && (
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Updating
              </span>
            )}
          </div>
        </div>
      </Card>

      <UnifiedWorkspaceCalendar
        events={fcEvents}
        onDatesSet={handleDatesSet}
        onEventClick={onEventClick}
        onMeetingTimeChange={onMeetingTimeChange}
        height="auto"
      />
    </div>
  );
}
