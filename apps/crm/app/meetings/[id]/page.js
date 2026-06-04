'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Building2,
  Briefcase,
  User,
  Users,
  Edit,
  CheckCircle2,
  Ban,
  Trash2,
  Save,
  X,
  ExternalLink,
  Link2,
  FileText,
  Activity,
  Bot,
  PlayCircle,
  Plus,
  Sparkles,
  Bell,
  Eye,
  Share2,
  Download,
  AlignLeft,
  Star,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  Card,
  KPICard,
  Badge,
  Button,
  Avatar,
  TabsWithActions,
  Input,
  Select,
  Modal,
  EmptyState,
  LoadingSpinner,
  EntityActivityPanel,
} from '@webfudge/ui';
import CRMPageHeader from '../../../components/CRMPageHeader';
import meetingService from '../../../lib/api/meetingService';
import taskService from '../../../lib/api/taskService';
import { fetchMeetingTimeline } from '../../../lib/api/crmActivityService';

// ── Constants ─────────────────────────────────────────────────────────────────

const MEETING_TYPE_LABELS = {
  discovery: 'Discovery',
  demo: 'Demo',
  follow_up: 'Follow-up',
  check_in: 'Check-in',
  review: 'Review',
  internal: 'Internal',
  other: 'Other',
};

const STATUS_COLORS = {
  scheduled: 'blue',
  completed: 'success',
  cancelled: 'gray',
  no_show: 'danger',
};

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
};

const OUTCOME_COLORS = {
  positive: 'success',
  neutral: 'default',
  negative: 'danger',
  pending: 'warning',
};

const OUTCOME_LABELS = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
  pending: 'Pending',
};

const TASK_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const REMINDER_LABELS = {
  none: 'No reminder',
  tenMin: '10 min before',
  thirtyMin: '30 min before',
  oneHour: '1 hour before',
  oneDay: '1 day before',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDateOnly(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimeOnly(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function computeDuration(startTime, endTime) {
  if (!startTime || !endTime) return null;
  const diffMs = new Date(endTime) - new Date(startTime);
  if (diffMs <= 0) return null;
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function contactFullName(c) {
  if (!c) return '';
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || `Contact #${c.id}`;
}

function ownerDisplayName(user) {
  if (!user) return 'Unassigned';
  const fn = user.firstName || user.firstname;
  const ln = user.lastName || user.lastname;
  if (fn || ln) return [fn, ln].filter(Boolean).join(' ').trim();
  return user.username?.trim() || user.email?.split('@')[0]?.trim() || `User ${user.id}`;
}

function ownerInitials(user) {
  const name = ownerDisplayName(user);
  if (name === 'Unassigned') return '?';
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function ownerRole(user) {
  if (!user || typeof user !== 'object') return 'Team member';
  const r = user.primaryRole ?? user.role;
  if (r && typeof r === 'object') return r.name || r.type || 'Team member';
  if (typeof r === 'string' && r.trim()) return r;
  return 'Team member';
}

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// ── Lead-company-style sub-components ────────────────────────────────────────

function InfoSection({ title, icon: Icon, children, isFirst = false }) {
  return (
    <section className={isFirst ? 'pt-0' : 'border-t border-gray-100 pt-4'}>
      <div className="mb-2 flex items-center gap-2">
        {Icon ? <Icon className="h-5 w-5 shrink-0 text-orange-500" aria-hidden /> : null}
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{title}</h3>
      </div>
      {children}
    </section>
  );
}

const infoLabelClass = 'flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500 sm:text-sm';

function InfoRow({ label, value, icon: RowIcon, className = '', emphasize = false, children }) {
  const hasCustom = children != null;
  if (hasCustom) {
    return (
      <div className={`min-w-0 ${className}`} role="group" aria-label={label}>
        <div className={infoLabelClass}>
          {RowIcon ? <RowIcon className="h-4 w-4 shrink-0 text-gray-400" aria-hidden /> : null}
          <span>{label}</span>
        </div>
        <div className="mt-2.5 text-base leading-snug">{children}</div>
      </div>
    );
  }
  const raw = value == null ? '' : String(value).trim();
  const empty = !raw || raw === '—';
  const display = empty ? '—' : raw;
  return (
    <div className={`min-w-0 ${className}`} role="group" aria-label={`${label}: ${empty ? 'empty' : display}`}>
      <div className={infoLabelClass}>
        {RowIcon ? <RowIcon className="h-4 w-4 shrink-0 text-gray-400" aria-hidden /> : null}
        <span>{label}</span>
      </div>
      <div className="mt-2.5">
        {!empty && emphasize ? (
          <span className="inline-flex rounded-lg bg-orange-50 px-3 py-2 text-base font-semibold text-orange-900 shadow-sm ring-1 ring-orange-200/80">
            {display}
          </span>
        ) : (
          <p className={`text-base leading-snug ${empty ? 'font-normal text-gray-400' : 'font-semibold text-gray-900'}`}>
            {display}
          </p>
        )}
      </div>
    </div>
  );
}

const headerIconBtnClass =
  'p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg text-brand-text-light';

// ── DETAIL TABS ───────────────────────────────────────────────────────────────

const DETAIL_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'attendees', label: 'Attendees' },
  { key: 'notes', label: 'Notes & Recording' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'activity', label: 'Activity' },
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function MeetingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [detailTab, setDetailTab] = useState(searchParams?.get('tab') || 'overview');

  // CRM activity timeline
  const [crmTimeline, setCrmTimeline] = useState([]);
  const [crmTimelineLoading, setCrmTimelineLoading] = useState(false);
  const [crmTimelineError, setCrmTimelineError] = useState(null);

  // Tasks
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({ title: '', priority: 'medium', dueDate: '' });
  const [addingTask, setAddingTask] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Inline edit
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const [editingAgenda, setEditingAgenda] = useState(false);
  const [agendaDraft, setAgendaDraft] = useState('');
  const [savingAgenda, setSavingAgenda] = useState(false);

  const [editingRecording, setEditingRecording] = useState(false);
  const [recordingDraft, setRecordingDraft] = useState('');
  const [savingRecording, setSavingRecording] = useState(false);

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingRsvp, setUpdatingRsvp] = useState(null);

  // ── Load meeting ──────────────────────────────────────────────────────────

  const loadMeeting = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await meetingService.getOne(id);
      const m = res?.data;
      if (!m) throw new Error('Meeting not found');
      setMeeting(m);
      setNotesDraft(m.notes || '');
      setAgendaDraft(m.agenda || '');
      setRecordingDraft(m.recordingUrl || '');
    } catch (e) {
      setError(e?.message || 'Failed to load meeting');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadMeeting(); }, [loadMeeting]);

  // ── Load CRM timeline ─────────────────────────────────────────────────────

  const loadTimeline = useCallback(async () => {
    if (!id) return;
    setCrmTimelineLoading(true);
    setCrmTimelineError(null);
    try {
      const res = await fetchMeetingTimeline({ meetingId: id, limit: 80 });
      setCrmTimeline(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setCrmTimelineError(e?.message || 'Could not load timeline');
    } finally {
      setCrmTimelineLoading(false);
    }
  }, [id]);

  useEffect(() => { loadTimeline(); }, [loadTimeline]);

  useEffect(() => {
    if (detailTab === 'activity') loadTimeline();
  }, [detailTab, loadTimeline]);

  // ── Load tasks ────────────────────────────────────────────────────────────

  const loadTasks = useCallback(async () => {
    if (!id || !taskService) return;
    setTasksLoading(true);
    try {
      const res = await taskService.getAll({ sort: 'createdAt:desc', 'pagination[pageSize]': 50 });
      const all = Array.isArray(res?.data) ? res.data : [];
      setTasks(all.filter((t) => String(t.meetingId) === String(id) || String(t.meeting?.id) === String(id)));
    } catch {
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (detailTab === 'tasks') loadTasks();
  }, [detailTab, loadTasks]);

  // ── Status updates ────────────────────────────────────────────────────────

  const updateStatus = async (newStatus) => {
    setStatusUpdating(true);
    try {
      await meetingService.update(id, { status: newStatus });
      setMeeting((prev) => ({ ...prev, status: newStatus }));
    } catch (e) {
      console.error(e);
    } finally {
      setStatusUpdating(false);
    }
  };

  // ── Inline save helpers ───────────────────────────────────────────────────

  const saveField = async (field, value, setEditing, setSaving) => {
    setSaving(true);
    try {
      await meetingService.update(id, { [field]: value });
      setMeeting((prev) => ({ ...prev, [field]: value }));
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // ── RSVP update ───────────────────────────────────────────────────────────

  const updateAttendeeRsvp = async (contactId, rsvp) => {
    setUpdatingRsvp(contactId);
    try {
      const currentMeta = Array.isArray(meeting?.attendeesMeta) ? meeting.attendeesMeta : [];
      const updatedMeta = currentMeta.map((a) =>
        String(a.contactId) === String(contactId) ? { ...a, rsvp } : a
      );
      if (!currentMeta.some((a) => String(a.contactId) === String(contactId))) {
        updatedMeta.push({ contactId, rsvp, role: 'required' });
      }
      await meetingService.update(id, { attendeesMeta: updatedMeta });
      setMeeting((prev) => ({ ...prev, attendeesMeta: updatedMeta }));
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingRsvp(null);
    }
  };

  // ── Create task ───────────────────────────────────────────────────────────

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskForm.title.trim()) return;
    setAddingTask(true);
    try {
      const payload = {
        title: newTaskForm.title.trim(),
        priority: newTaskForm.priority,
        dueDate: newTaskForm.dueDate || null,
        status: 'TODO',
        deal: meeting?.deal?.id || null,
        clientAccount: meeting?.clientAccount?.id || null,
        leadCompany: meeting?.leadCompany?.id || null,
        contact: meeting?.contact?.id || null,
      };
      const res = await taskService.create(payload);
      const newTask = res?.data;
      if (newTask) setTasks((prev) => [newTask, ...prev]);
      setNewTaskForm({ title: '', priority: 'medium', dueDate: '' });
      setShowTaskForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setAddingTask(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await meetingService.delete(id);
      router.push('/meetings');
    } catch (e) {
      console.error(e);
      setDeleting(false);
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: meeting?.title || 'Meeting', url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch { /* ignore */ }
  };

  const handleDownload = () => {
    if (!meeting || typeof window === 'undefined') return;
    const blob = new Blob([JSON.stringify(meeting, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `meeting-${meeting.id || id}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── Derived values ────────────────────────────────────────────────────────

  const duration = meeting ? computeDuration(meeting.startTime, meeting.endTime) : null;

  const attendeesMeta = useMemo(
    () => (Array.isArray(meeting?.attendeesMeta) ? meeting.attendeesMeta : []),
    [meeting?.attendeesMeta]
  );

  const allAttendees = useMemo(() => {
    if (!meeting) return [];
    return [
      ...(meeting.contact
        ? [{ contact: meeting.contact, role: 'host', rsvp: 'accepted', isPrimary: true }]
        : []),
      ...(Array.isArray(meeting.attendees)
        ? meeting.attendees.map((c) => {
          const meta = attendeesMeta.find((a) => String(a.contactId) === String(c.id));
          return { contact: c, role: meta?.role || 'required', rsvp: meta?.rsvp || 'pending', isPrimary: false };
        })
        : []),
    ];
  }, [meeting, attendeesMeta]);

  const tabsWithBadges = DETAIL_TABS.map((t) => ({
    ...t,
    badge:
      t.key === 'attendees'
        ? allAttendees.length || undefined
        : t.key === 'tasks'
          ? tasks.length || undefined
          : undefined,
  }));

  const lastActivityDisplay = useMemo(() => {
    if (!meeting) return '—';
    const latest = crmTimeline?.[0]?.createdAt;
    if (latest) return latest ? `${new Date(latest).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : '—';
    if (meeting.updatedAt) return new Date(meeting.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return '—';
  }, [meeting, crmTimeline]);

  // ── Loading / error ───────────────────────────────────────────────────────

  const meetingTitle = meeting?.title || 'Meeting';

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <CRMPageHeader
        title={loading ? 'Loading…' : meetingTitle}
        subtitle={meeting ? formatDateTime(meeting.startTime) : undefined}
        breadcrumb={[
          { label: 'Dashboard', href: '/' },
          { label: 'Meetings', href: '/meetings' },
          { label: meetingTitle, href: `/meetings/${id}` },
        ]}
        showProfile
      >
        <div className="flex flex-wrap items-center justify-end gap-2">
          {!loading && meeting && (
            <>
              <Badge variant={STATUS_COLORS[meeting.status] || 'default'} dot size="lg">
                {STATUS_LABELS[meeting.status] || meeting.status}
              </Badge>
              {meeting.status === 'scheduled' && (
                <>
                  <button
                    type="button"
                    onClick={() => updateStatus('completed')}
                    disabled={statusUpdating}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/90 bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-100/90 px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-md ring-2 ring-emerald-200/70 hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Complete
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus('cancelled')}
                    disabled={statusUpdating}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300/90 bg-gradient-to-br from-gray-50 to-gray-100/90 px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-md ring-2 ring-gray-200/70 hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    <Ban className="h-4 w-4 shrink-0" />
                    Cancel
                  </button>
                </>
              )}
              <Link href={`/meetings/${id}/edit`} className={headerIconBtnClass} title="Edit">
                <Edit className="w-5 h-5" />
              </Link>
              <button type="button" className={headerIconBtnClass} title="Share" onClick={handleShare}>
                <Share2 className="w-5 h-5" />
              </button>
              <button
                type="button"
                className={headerIconBtnClass}
                title="Download"
                onClick={handleDownload}
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className={`${headerIconBtnClass} !text-red-400 hover:!text-red-600`}
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </CRMPageHeader>

      {loading ? (
        <Card variant="elevated" className="p-12 flex justify-center">
          <LoadingSpinner message="Loading meeting…" />
        </Card>
      ) : error || !meeting ? (
        <Card variant="elevated" className="p-12 text-center">
          <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-400" />
          <p className="text-gray-700 font-medium">{error || 'Meeting not found'}</p>
          <Link href="/meetings" className="mt-4 inline-block">
            <Button variant="primary">Back to Meetings</Button>
          </Link>
        </Card>
      ) : (
        <>
          {/* KPI row — compact, orange, same as lead-company */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              compact
              title="Date"
              value={formatDateOnly(meeting.startTime)}
              icon={Calendar}
              colorScheme="orange"
            />
            <KPICard
              compact
              title="Duration"
              value={duration || '—'}
              icon={Clock}
              colorScheme="orange"
            />
            <KPICard
              compact
              title="Type"
              value={MEETING_TYPE_LABELS[meeting.meetingType] || meeting.meetingType || '—'}
              icon={Video}
              colorScheme="orange"
            />
            <KPICard
              compact
              title="Outcome"
              value={OUTCOME_LABELS[meeting.outcome] || meeting.outcome || 'Pending'}
              icon={CheckCircle2}
              colorScheme={meeting.outcome === 'positive' ? 'green' : meeting.outcome === 'negative' ? 'red' : 'orange'}
            />
          </div>

          {/* Tabs */}
          <TabsWithActions
            variant="pill"
            tabs={tabsWithBadges}
            activeTab={detailTab}
            onTabChange={setDetailTab}
          />

          {/* ── OVERVIEW TAB ────────────────────────────────────────────────── */}
          {detailTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ── Left: main info ── */}
              <div className="lg:col-span-2 space-y-6">
                {/* Meeting details card */}
                <Card variant="elevated" className="rounded-xl">
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                      <h2 className="text-xl font-semibold text-gray-900">Meeting details</h2>
                      <p className="mt-1.5 text-base text-gray-500">
                        Date, time, location, and logistics.
                      </p>
                    </div>
                    <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-start sm:justify-end sm:gap-2.5">
                      <span
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-300/90 bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100/90 px-4 py-2.5 text-sm font-bold uppercase tracking-widest text-orange-900 shadow-md ring-2 ring-orange-200/70"
                        title="Meeting type"
                      >
                        <Video className="h-4 w-4 shrink-0 text-orange-600" strokeWidth={2.25} aria-hidden />
                        {MEETING_TYPE_LABELS[meeting.meetingType] || meeting.meetingType || 'Other'}
                      </span>
                      <span
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-widest shadow-md ring-2 ${meeting.status === 'completed'
                          ? 'border border-emerald-300/90 bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-100/90 text-emerald-950 ring-emerald-200/70'
                          : meeting.status === 'cancelled'
                            ? 'border border-gray-300/90 bg-gradient-to-br from-gray-50 to-gray-100/90 text-gray-700 ring-gray-200/70'
                            : 'border border-amber-300/90 bg-gradient-to-br from-amber-50 via-amber-50 to-amber-100/90 text-amber-950 ring-amber-200/70'
                          }`}
                        role="status"
                        title="Status"
                      >
                        {meeting.status === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.25} aria-hidden />
                        ) : meeting.status === 'cancelled' ? (
                          <Ban className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2.25} aria-hidden />
                        ) : (
                          <Clock className="h-4 w-4 shrink-0 text-amber-600" strokeWidth={2.25} aria-hidden />
                        )}
                        {STATUS_LABELS[meeting.status] || meeting.status}
                      </span>
                    </div>
                  </div>

                  <InfoSection title="Date & Time" icon={Calendar} isFirst>
                    <div className="mb-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                      <InfoRow label="Start" value={formatDateTime(meeting.startTime)} />
                      <InfoRow label="End" value={meeting.endTime ? formatTimeOnly(meeting.endTime) : '—'} />
                      <InfoRow label="Duration" value={duration || '—'} />
                      <InfoRow label="Reminder" icon={Bell} value={REMINDER_LABELS[meeting.reminderPreset] || meeting.reminderPreset || '—'} />
                    </div>
                  </InfoSection>

                  <InfoSection title="Location" icon={MapPin}>
                    <div className="mt-2.5">
                      {meeting.location ? (
                        <div className="flex items-center gap-2.5">
                          {meeting.isVirtual || isValidUrl(meeting.location) ? (
                            <Video className="h-5 w-5 shrink-0 text-sky-500" aria-hidden />
                          ) : (
                            <MapPin className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
                          )}
                          {isValidUrl(meeting.location) ? (
                            <a
                              href={meeting.location}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-orange-600 hover:underline flex items-center gap-1.5"
                            >
                              {meeting.location.length > 60 ? `${meeting.location.slice(0, 60)}…` : meeting.location}
                              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            </a>
                          ) : (
                            <p className="text-base font-semibold text-gray-900">{meeting.location}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-base font-normal text-gray-400">No location set</p>
                      )}
                    </div>
                  </InfoSection>

                  <InfoSection title="Visibility & Settings" icon={Eye}>
                    <div className="mb-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                      <InfoRow label="Visibility" value={meeting.visibility ? String(meeting.visibility).charAt(0).toUpperCase() + String(meeting.visibility).slice(1) : 'Public'} />
                      <InfoRow label="Outcome">
                        <Badge variant={OUTCOME_COLORS[meeting.outcome] || 'default'} dot>
                          {OUTCOME_LABELS[meeting.outcome] || meeting.outcome || 'Pending'}
                        </Badge>
                      </InfoRow>
                    </div>
                  </InfoSection>

                  <p className="mt-4 border-t border-gray-100 pt-3 text-center text-sm text-gray-500">
                    <Link
                      href={`/meetings/${id}/edit`}
                      className="font-medium text-orange-600 hover:underline"
                    >
                      Edit meeting details
                    </Link>
                    <span className="mx-2 text-gray-300" aria-hidden>·</span>
                    <Link href="/meetings" className="font-medium text-gray-500 hover:text-orange-600 hover:underline">
                      Back to meetings
                    </Link>
                  </p>
                </Card>

                {/* Agenda card */}
                <Card variant="elevated" className="rounded-xl">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Agenda</h2>
                    <p className="mt-1.5 text-base text-gray-500">
                      Topics and objectives planned for this meeting.
                    </p>
                  </div>
                  {editingAgenda ? (
                    <div className="space-y-3">
                      <textarea
                        value={agendaDraft}
                        onChange={(e) => setAgendaDraft(e.target.value)}
                        rows={6}
                        className="w-full rounded-xl border border-orange-200 px-3 py-2.5 text-sm text-gray-800 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
                        placeholder="Meeting agenda…"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => saveField('agenda', agendaDraft, setEditingAgenda, setSavingAgenda)}
                          disabled={savingAgenda}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-50"
                        >
                          {savingAgenda ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-b-2 border-white" /> : <Save className="h-3.5 w-3.5" />}
                          Save
                        </button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingAgenda(false)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {meeting.agenda ? (
                        <pre className="whitespace-pre-wrap text-base text-gray-800 font-sans leading-relaxed">{meeting.agenda}</pre>
                      ) : (
                        <p className="text-base text-gray-400">No agenda set.</p>
                      )}
                      <p className="mt-4 border-t border-gray-100 pt-3 text-center text-sm text-gray-500">
                        <button
                          type="button"
                          onClick={() => { setEditingAgenda(true); setAgendaDraft(meeting.agenda || ''); }}
                          className="font-medium text-orange-600 hover:underline"
                        >
                          {meeting.agenda ? 'Edit agenda' : 'Add agenda'}
                        </button>
                      </p>
                    </>
                  )}
                </Card>
              </div>

              {/* ── Right sidebar ── */}
              <div className="space-y-4">
                {/* Owner card */}
                <Card variant="elevated" className="rounded-xl">
                  <h2 className="mb-3 text-xl font-semibold text-gray-900">Meeting Owner</h2>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar
                        fallback={ownerInitials(meeting.assignedTo)}
                        alt={ownerDisplayName(meeting.assignedTo)}
                        size="lg"
                        className="!bg-brand-primary font-semibold text-white shadow-sm ring-2 ring-brand-primary/25"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-gray-900">
                          {ownerDisplayName(meeting.assignedTo)}
                        </p>
                        <p className="text-sm text-gray-500">{ownerRole(meeting.assignedTo)}</p>
                        <div className="mt-0.5 flex items-center gap-1 text-sm text-gray-600">
                          <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                          <span className="font-medium">Assigned</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {meeting.organizer && meeting.organizer.id !== meeting.assignedTo?.id && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Organizer</p>
                      <div className="flex items-center gap-3">
                        <Avatar
                          fallback={ownerInitials(meeting.organizer)}
                          alt={ownerDisplayName(meeting.organizer)}
                          size="sm"
                          className="bg-gray-600 text-white flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">{ownerDisplayName(meeting.organizer)}</p>
                          <p className="text-xs text-gray-500">{meeting.organizer.email || ''}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Engagement card */}
                <Card variant="elevated" className="rounded-xl">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Meeting Info</h2>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <h3 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <Activity className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                        Engagement
                      </h3>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="rounded-lg border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
                          <p className="text-xs font-medium text-gray-500">Last activity</p>
                          <p className="mt-1 text-sm font-semibold leading-snug text-gray-900">{lastActivityDisplay}</p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
                          <p className="text-xs font-medium text-gray-500">Attendees</p>
                          <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900">{allAttendees.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-5">
                      <h3 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                        Record
                      </h3>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="rounded-lg border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
                          <p className="text-xs font-medium text-gray-500">Created</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">{formatDateOnly(meeting.createdAt)}</p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
                          <p className="text-xs font-medium text-gray-500">Outcome</p>
                          <div className="mt-1.5">
                            <Badge variant={OUTCOME_COLORS[meeting.outcome] || 'default'} dot>
                              {OUTCOME_LABELS[meeting.outcome] || 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Linked records */}
                <Card variant="elevated" className="rounded-xl">
                  <h2 className="mb-3 text-xl font-semibold text-gray-900">Linked Records</h2>
                  <div className="space-y-2">
                    {meeting.deal ? (
                      <Link
                        href={`/sales/deals/${meeting.deal.id}`}
                        className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 hover:bg-emerald-100 transition-colors group"
                      >
                        <Briefcase className="h-4 w-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-emerald-800">{meeting.deal.name || 'Deal'}</p>
                          {meeting.deal.stage && (
                            <p className="text-xs text-emerald-600 capitalize">{meeting.deal.stage}</p>
                          )}
                        </div>
                        <svg className="ml-auto h-4 w-4 text-emerald-400 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </Link>
                    ) : (
                      <p className="text-xs text-gray-400">No deal linked</p>
                    )}

                    {meeting.clientAccount && (
                      <Link
                        href={`/clients/accounts/${meeting.clientAccount.id}`}
                        className="flex items-center gap-2.5 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2.5 hover:bg-orange-100 transition-colors group"
                      >
                        <Building2 className="h-4 w-4 text-orange-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-orange-800">{meeting.clientAccount.companyName || 'Account'}</p>
                          <p className="text-xs text-orange-500">Client Account</p>
                        </div>
                        <svg className="ml-auto h-4 w-4 text-orange-400 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </Link>
                    )}

                    {meeting.leadCompany && (
                      <Link
                        href={`/sales/lead-companies/${meeting.leadCompany.id}`}
                        className="flex items-center gap-2.5 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2.5 hover:bg-violet-100 transition-colors group"
                      >
                        <Building2 className="h-4 w-4 text-violet-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-violet-800">{meeting.leadCompany.companyName || 'Lead'}</p>
                          <p className="text-xs text-violet-500">Lead Company</p>
                        </div>
                        <svg className="ml-auto h-4 w-4 text-violet-400 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </Link>
                    )}

                    {meeting.contact && (
                      <Link
                        href={`/sales/contacts/${meeting.contact.id}`}
                        className="flex items-center gap-2.5 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2.5 hover:bg-sky-100 transition-colors group"
                      >
                        <User className="h-4 w-4 text-sky-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-sky-800">{contactFullName(meeting.contact)}</p>
                          <p className="text-xs text-sky-500">Primary Contact</p>
                        </div>
                        <svg className="ml-auto h-4 w-4 text-sky-400 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </Link>
                    )}

                    {!meeting.deal && !meeting.clientAccount && !meeting.leadCompany && !meeting.contact && (
                      <p className="text-sm text-gray-400">No CRM records linked to this meeting.</p>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ── ATTENDEES TAB ────────────────────────────────────────────────── */}
          {detailTab === 'attendees' && (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="min-h-[1.25rem] text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{allAttendees.length}</span> attendee
                  {allAttendees.length !== 1 ? 's' : ''}
                </p>
                <Link href={`/meetings/${id}/edit`} className="w-full shrink-0 sm:w-auto">
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full "
                  >
                    <Plus className="mr-2 inline h-4 w-4 shrink-0 align-text-bottom" aria-hidden />
                    Add attendees
                  </Button>
                </Link>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {allAttendees.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      icon={Users}
                      title="No attendees yet"
                      description="Add CRM contacts as attendees and set roles on the meeting editor. The primary contact can be set there too."
                      action={
                        <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
                          <Link href={`/meetings/${id}/edit`} className="w-full sm:w-auto">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 sm:w-auto"
                            >
                              <Plus className="mr-2 inline h-4 w-4 shrink-0 align-text-bottom" aria-hidden />
                              Add attendees
                            </Button>
                          </Link>
                          <Link href={`/meetings/${id}/edit`} className="w-full sm:w-auto">
                            <Button type="button" variant="outline" className="w-full sm:w-auto">
                              Edit meeting
                            </Button>
                          </Link>
                        </div>
                      }
                    />
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {allAttendees.map(({ contact, role, rsvp, isPrimary }) => {
                      const name = contactFullName(contact);
                      const currentRsvp =
                        attendeesMeta.find((a) => String(a.contactId) === String(contact.id))?.rsvp ||
                        rsvp ||
                        'pending';
                      const rsvpLabel =
                        currentRsvp === 'accepted'
                          ? 'Accepted'
                          : currentRsvp === 'declined'
                            ? 'Declined'
                            : 'Pending';

                      const rsvpOptions = [
                        { id: 'accepted', label: 'Accept', short: 'Yes' },
                        { id: 'pending', label: 'Pending', short: '?' },
                        { id: 'declined', label: 'Decline', short: 'No' },
                      ];

                      return (
                        <div
                          key={contact.id}
                          className="grid grid-cols-1 gap-3 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:px-5"
                        >
                          <div className="flex min-w-0 items-start gap-3 sm:items-center">
                            <Avatar
                              fallback={name.slice(0, 2).toUpperCase()}
                              alt={name}
                              size="md"
                              className="!h-10 !w-10 shrink-0 !bg-gradient-to-br !from-orange-500 !to-orange-600 !text-[11px] font-bold !text-white shadow-sm ring-2 ring-white"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <Link
                                  href={`/sales/contacts/${contact.id}`}
                                  className="truncate text-sm font-semibold text-gray-900 transition-colors hover:text-orange-600"
                                >
                                  {name}
                                </Link>
                                {isPrimary ? (
                                  <span className="shrink-0 rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-800 ring-1 ring-orange-200/80">
                                    Organizer
                                  </span>
                                ) : (
                                  <span
                                    className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${role === 'optional'
                                      ? 'bg-slate-50 text-slate-600 ring-slate-200'
                                      : 'bg-sky-50 text-sky-800 ring-sky-200/80'
                                      }`}
                                  >
                                    {role === 'optional' ? 'Optional' : 'Required'}
                                  </span>
                                )}
                              </div>
                              {contact.email ? (
                                <p className="mt-0.5 truncate text-xs text-gray-500">{contact.email}</p>
                              ) : (
                                <p className="mt-0.5 text-xs text-gray-400">No email on file</p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-start gap-3 border-t border-gray-100 pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
                            {isPrimary ? (
                              <Badge variant="success" size="sm" className="font-semibold">
                                {rsvpLabel}
                              </Badge>
                            ) : (
                              <>
                                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 sm:hidden">
                                  RSVP
                                </span>
                                <div
                                  className="inline-flex rounded-lg border border-gray-200 bg-gray-50/90 p-0.5 shadow-inner"
                                  role="group"
                                  aria-label="Update RSVP"
                                >
                                  {rsvpOptions.map((opt) => {
                                    const active = currentRsvp === opt.id;
                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        disabled={updatingRsvp === contact.id}
                                        title={opt.label}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateAttendeeRsvp(contact.id, opt.id);
                                        }}
                                        className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all sm:px-3 ${active
                                          ? opt.id === 'accepted'
                                            ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-700/20'
                                            : opt.id === 'declined'
                                              ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-700/20'
                                              : 'bg-amber-500 text-white shadow-sm ring-1 ring-amber-600/30'
                                          : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm'
                                          } disabled:cursor-not-allowed disabled:opacity-50`}
                                      >
                                        <span className="sm:hidden">{opt.short}</span>
                                        <span className="hidden sm:inline">{opt.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── NOTES & RECORDING TAB ───────────────────────────────────────── */}
          {detailTab === 'notes' && (
            <div className="space-y-6">
              {/* Notes */}
              <Card variant="elevated" className="rounded-xl">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Post-meeting Notes</h2>
                  <p className="mt-1.5 text-base text-gray-500">
                    Key decisions, action items, and follow-ups from the meeting.
                  </p>
                </div>
                {editingNotes ? (
                  <div className="space-y-3">
                    <textarea
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      rows={8}
                      className="w-full rounded-xl border border-orange-200 px-3 py-2.5 text-sm text-gray-800 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
                      placeholder="Add post-meeting notes, key decisions, action items…"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => saveField('notes', notesDraft, setEditingNotes, setSavingNotes)}
                        disabled={savingNotes}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-50"
                      >
                        {savingNotes ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-b-2 border-white" /> : <Save className="h-3.5 w-3.5" />}
                        Save Notes
                      </button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingNotes(false)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {meeting.notes ? (
                      <pre className="whitespace-pre-wrap text-base text-gray-800 font-sans leading-relaxed">{meeting.notes}</pre>
                    ) : (
                      <p className="text-base text-gray-400">No post-meeting notes yet.</p>
                    )}
                    <p className="mt-4 border-t border-gray-100 pt-3 text-center text-sm text-gray-500">
                      <button
                        type="button"
                        onClick={() => { setEditingNotes(true); setNotesDraft(meeting.notes || ''); }}
                        className="font-medium text-orange-600 hover:underline"
                      >
                        {meeting.notes ? 'Edit notes' : 'Add notes'}
                      </button>
                    </p>
                  </>
                )}
              </Card>

              {/* Recording */}
              <Card variant="elevated" className="rounded-xl">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Recording</h2>
                  <p className="mt-1.5 text-base text-gray-500">
                    Link to the meeting recording or video.
                  </p>
                </div>
                {editingRecording ? (
                  <div className="space-y-3">
                    <Input
                      label="Recording URL"
                      value={recordingDraft}
                      onChange={(e) => setRecordingDraft(e.target.value)}
                      placeholder="https://drive.google.com/... or Loom/Zoom link"
                      icon={Link2}
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => saveField('recordingUrl', recordingDraft, setEditingRecording, setSavingRecording)}
                        disabled={savingRecording}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-50"
                      >
                        {savingRecording ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-b-2 border-white" /> : <Save className="h-3.5 w-3.5" />}
                        Save
                      </button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingRecording(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : meeting.recordingUrl ? (
                  <>
                    <a
                      href={meeting.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 hover:bg-blue-100 transition-colors group"
                    >
                      <PlayCircle className="h-5 w-5 text-blue-600 shrink-0" />
                      <span className="flex-1 truncate text-sm font-medium text-blue-700">{meeting.recordingUrl}</span>
                      <ExternalLink className="h-4 w-4 text-blue-400 group-hover:text-blue-600 transition-colors" />
                    </a>
                    <p className="mt-4 border-t border-gray-100 pt-3 text-center text-sm text-gray-500">
                      <button
                        type="button"
                        onClick={() => { setEditingRecording(true); setRecordingDraft(meeting.recordingUrl || ''); }}
                        className="font-medium text-orange-600 hover:underline"
                      >
                        Update recording link
                      </button>
                    </p>
                  </>
                ) : (
                  <p className="mt-4 border-t border-gray-100 pt-3 text-center text-sm text-gray-500">
                    <button
                      type="button"
                      onClick={() => { setEditingRecording(true); setRecordingDraft(''); }}
                      className="font-medium text-orange-600 hover:underline"
                    >
                      Add recording link
                    </button>
                  </p>
                )}
              </Card>

              {/* AI Summary */}
              <Card variant="elevated" className="rounded-xl">
                <div className="mb-6 flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">AI Summary</h2>
                  <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700">Firefly.ai</span>
                </div>
                {meeting.aiSummary ? (
                  <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">{meeting.aiSummary}</pre>
                    {meeting.transcriptUrl && (
                      <a
                        href={meeting.transcriptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 transition-colors font-medium"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> View full transcript
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                    <Sparkles className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">AI summary will appear here</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Connect Fireflies.ai to automatically get meeting transcripts, summaries, and action items.
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-600">
                      <Bot className="h-3 w-3" /> Firefly.ai integration — coming soon
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ── TASKS TAB ────────────────────────────────────────────────────── */}
          {detailTab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-600 min-h-[1.25rem]">
                  {tasksLoading ? (
                    <span className="text-gray-400">Loading tasks…</span>
                  ) : (
                    <>
                      Showing <span className="font-semibold text-gray-900">{tasks.length}</span> task{tasks.length !== 1 ? 's' : ''}
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowTaskForm((v) => !v)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-95 transition-opacity shrink-0 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 shrink-0" aria-hidden />
                  Create Task
                </button>
              </div>

              {showTaskForm && (
                <Card variant="elevated" className="rounded-xl">
                  <form onSubmit={handleCreateTask} className="space-y-3">
                    <Input
                      label="Task title"
                      required
                      value={newTaskForm.title}
                      onChange={(e) => setNewTaskForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Send follow-up proposal"
                      autoFocus
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Select
                        label="Priority"
                        value={newTaskForm.priority}
                        onChange={(v) => setNewTaskForm((p) => ({ ...p, priority: v }))}
                        options={TASK_PRIORITY_OPTIONS}
                      />
                      <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-700">Due date</label>
                        <input
                          type="date"
                          value={newTaskForm.dueDate}
                          onChange={(e) => setNewTaskForm((p) => ({ ...p, dueDate: e.target.value }))}
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      This task will be automatically linked to the same deal, account, and contact as this meeting.
                    </p>
                    <div className="flex gap-2 border-t border-gray-100 pt-3">
                      <button
                        type="submit"
                        disabled={addingTask || !newTaskForm.title.trim()}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-50"
                      >
                        {addingTask ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-b-2 border-white" /> : <Plus className="h-3.5 w-3.5" />}
                        Add Task
                      </button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setShowTaskForm(false)}>Cancel</Button>
                    </div>
                  </form>
                </Card>
              )}

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {tasksLoading ? (
                  <div className="flex flex-col items-center justify-center p-12">
                    <LoadingSpinner size="lg" message="Loading tasks…" />
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      icon={Check}
                      title="No tasks yet"
                      description="Create tasks from this meeting to track follow-ups and action items."
                      action={
                        !showTaskForm ? (
                          <button
                            type="button"
                            onClick={() => setShowTaskForm(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-95"
                          >
                            <Plus className="h-4 w-4" /> Create First Task
                          </button>
                        ) : null
                      }
                    />
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3 px-6 py-4">
                        <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${task.status === 'DONE' ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                          {task.status === 'DONE' && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${task.status === 'DONE' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {task.title}
                          </p>
                          {task.dueDate && (
                            <p className="text-xs text-gray-400 mt-0.5">Due: {task.dueDate}</p>
                          )}
                        </div>
                        <Badge
                          variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'default'}
                          size="sm"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ACTIVITY TAB ─────────────────────────────────────────────────── */}
          {detailTab === 'activity' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:items-start">
              {/* Left: Quick summary */}
              <div className="lg:col-span-2 space-y-4">
                <Card variant="elevated" className="rounded-xl p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-orange-500" />
                    Activity Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-orange-50/70 border border-orange-100 px-3 py-2.5">
                      <span className="text-xs font-medium text-orange-700">Total events</span>
                      <span className="text-lg font-bold text-orange-900 tabular-nums">{crmTimeline.length}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                      <span className="text-xs font-medium text-gray-600">Last activity</span>
                      <span className="text-xs font-semibold text-gray-800">{lastActivityDisplay}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                      <span className="text-xs font-medium text-gray-600">Attendees</span>
                      <span className="text-xs font-semibold text-gray-800">{allAttendees.length}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                      <span className="text-xs font-medium text-gray-600">Status</span>
                      <span className="text-xs font-semibold text-gray-800">{STATUS_LABELS[meeting.status] || meeting.status}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                      <span className="text-xs font-medium text-gray-600">Created</span>
                      <span className="text-xs font-semibold text-gray-800">{formatDateOnly(meeting.createdAt)}</span>
                    </div>
                  </div>
                </Card>
              </div>
              {/* Right: Activity panel */}
              <div className="lg:col-span-3">
                <EntityActivityPanel
                  entityType="meeting"
                  entityId={id}
                  entityName={meeting.title}
                  crmTimeline={crmTimeline}
                  crmTimelineLoading={crmTimelineLoading}
                  crmTimelineError={crmTimelineError}
                  activityCount={crmTimeline.length}
                  fetchCommentsFn={null}
                  addCommentFn={null}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { if (!deleting) setShowDeleteModal(false); }}
        title="Delete Meeting"
        size="md"
        closeOnBackdrop={!deleting}
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <p className="text-sm text-red-900">
              <span className="font-semibold">This action cannot be undone</span>
            </p>
          </div>
          <p className="text-sm text-gray-700">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-gray-900">&quot;{meeting?.title || 'this meeting'}&quot;</span>?
          </p>
          <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-700">
              This will permanently delete:
            </p>
            <ul className="space-y-1 text-sm text-red-900">
              <li>• Meeting details and agenda</li>
              <li>• All attendee records and RSVP data</li>
              <li>• Post-meeting notes and recording links</li>
            </ul>
          </div>
          <div className="mt-1 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="muted"
              disabled={deleting}
              onClick={() => setShowDeleteModal(false)}
              className="w-full rounded-xl border-[1.5px] border-gray-400 bg-gray-300 px-5 py-2.5 sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={deleting}
              onClick={handleDelete}
              className="w-full min-w-[10rem] rounded-xl py-2.5 sm:w-auto"
            >
              {deleting ? 'Deleting…' : 'Delete Meeting'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
