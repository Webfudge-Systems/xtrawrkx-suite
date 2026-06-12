'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  CalendarDays,
  CalendarClock,
  Clock,
  CheckCircle2,
  Plus,
  Video,
  MapPin,
  Building2,
  Briefcase,
  User,
  Filter,
  X,
  MoreHorizontal,
  Pencil,
  Trash2,
  Ban,
  BarChart3,
  TrendingUp,
  Target,
  Award,
  Calendar,
  List,
  Mail,
  Link2,
  Eye,
  AlertCircle,
} from 'lucide-react';
import {
  Card,
  KPICard,
  Table,
  TabsWithActions,
  Badge,
  Button,
  Select,
  Modal,
  Pagination,
  Avatar,
  LoadingSpinner,
  TableCellOwner,
  TableCellOrangePill,
  TableCellText,
  TableRowActionMenuPortal,
  formatTableDate,
  useTableColumnPreferences,
  TableColumnPicker,
} from '@webfudge/ui';
import CRMPageHeader from '../../components/CRMPageHeader';
import meetingService from '../../lib/api/meetingService';

// Lazy-load FullCalendar to avoid SSR issues
const FullCalendarView = dynamic(() => import('../../components/MeetingsCalendarView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500" />
    </div>
  ),
});

// ── Constants ────────────────────────────────────────────────────────────────

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

const COLUMN_VISIBILITY_STORAGE_KEY = 'crm.meetings.tableColumnVisibility';
const COLUMN_ORDER_STORAGE_KEY = 'crm.meetings.tableColumnOrder';
const COLUMN_WIDTHS_STORAGE_KEY = 'crm.meetings.tableColumnWidths';

const DEFAULT_COLUMN_WIDTHS = {
  title: 300,
  startTime: 240,
  endTime: 120,
  meetingType: 130,
  status: 130,
  deal: 220,
  contact: 180,
  assignedTo: 160,
  actions: 180,
};

const MIN_COLUMN_WIDTHS = {
  title: 240,
  actions: 168,
};

const TOGGLEABLE_COLUMNS = [
  { key: 'startTime', label: 'Date & time' },
  { key: 'endTime', label: 'Duration' },
  { key: 'meetingType', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'deal', label: 'Linked record' },
  { key: 'contact', label: 'Attendees' },
  { key: 'assignedTo', label: 'Owner' },
];

const REORDERABLE_COLUMN_KEYS = TOGGLEABLE_COLUMNS.map((c) => c.key);

const DEFAULT_ON_COLUMN_KEYS = new Set(TOGGLEABLE_COLUMNS.map((c) => c.key));

const DEFAULT_COLUMN_VISIBILITY = TOGGLEABLE_COLUMNS.reduce((acc, { key }) => {
  acc[key] = DEFAULT_ON_COLUMN_KEYS.has(key);
  return acc;
}, {});

// Compute a meeting's duration string
function computeDuration(startTime, endTime) {
  if (!startTime || !endTime) return '—';
  const diffMs = new Date(endTime) - new Date(startTime);
  if (diffMs <= 0) return '—';
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatDateTimeShort(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatTimeOnly(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function isToday(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isUpcoming(iso) {
  if (!iso) return false;
  return new Date(iso) > new Date();
}

function isPast(iso) {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

/** CRM record this meeting is tied to (deal, account, lead, or primary contact). */
function relatedEntityInfo(meeting) {
  if (meeting?.deal?.name) {
    return { kind: 'Deal', icon: Briefcase, label: meeting.deal.name, color: 'text-emerald-600' };
  }
  if (meeting?.clientAccount?.companyName) {
    return {
      kind: 'Client account',
      icon: Building2,
      label: meeting.clientAccount.companyName,
      color: 'text-orange-600',
    };
  }
  if (meeting?.leadCompany?.companyName) {
    return {
      kind: 'Lead company',
      icon: Building2,
      label: meeting.leadCompany.companyName,
      color: 'text-violet-600',
    };
  }
  if (meeting?.contact) {
    const name =
      [meeting.contact.firstName, meeting.contact.lastName].filter(Boolean).join(' ') ||
      meeting.contact.email ||
      'Contact';
    return { kind: 'Contact', icon: User, label: name, color: 'text-sky-600' };
  }
  return null;
}

function attendeeInitialsFromContact(c) {
  const name = [c?.firstName, c?.lastName].filter(Boolean).join(' ') || c?.email || '?';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
  }
  return String(name).slice(0, 2).toUpperCase();
}

/** Primary contact plus M2M attendees, deduped. */
function meetingAttendeesList(meeting) {
  const out = [];
  const seen = new Set();
  const add = (c) => {
    if (!c || typeof c !== 'object') return;
    const key =
      c.id != null
        ? `id:${c.id}`
        : `e:${String(c.email || '')
          .toLowerCase()
          .trim()}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({
      key,
      displayName: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || 'Guest',
      email: (c.email && String(c.email).trim()) || '',
      initials: attendeeInitialsFromContact(c),
    });
  };
  add(meeting?.contact);
  if (Array.isArray(meeting?.attendees)) meeting.attendees.forEach(add);
  return out;
}

const ATTENDEES_POPOVER_WIDTH_PX = 288;

function MeetingAttendeesStack({ meeting }) {
  const list = meetingAttendeesList(meeting);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const leaveTimerRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const [menuTop, setMenuTop] = useState(0);

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearLeaveTimer();
    leaveTimerRef.current = setTimeout(() => {
      setOpen(false);
      setAnchor(null);
    }, 200);
  }, [clearLeaveTimer]);

  const openPopover = useCallback(() => {
    clearLeaveTimer();
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 4;
    const top = rect.bottom + gap;
    setAnchor({
      top,
      left: rect.left,
      triggerEl: el,
    });
    setMenuTop(top);
    setOpen(true);
  }, [clearLeaveTimer]);

  useEffect(() => {
    if (!open || !anchor) return;
    const pad = 8;
    const gap = 4;
    const menuEl = menuRef.current;
    if (!menuEl) return;
    const rect = menuEl.getBoundingClientRect();
    let nextTop = anchor.top;
    const wouldOverflowBottom = nextTop + rect.height > window.innerHeight - pad;
    if (wouldOverflowBottom) {
      const triggerRect = anchor.triggerEl?.getBoundingClientRect?.();
      if (triggerRect) {
        nextTop = Math.max(pad, triggerRect.top - rect.height - gap);
      }
    }
    setMenuTop(nextTop);
  }, [open, anchor, list.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setAnchor(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => {
      setOpen(false);
      setAnchor(null);
    };
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      setOpen(false);
      setAnchor(null);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open]);

  if (list.length === 0) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  const maxShow = 4;
  const shown = list.slice(0, maxShow);
  const overflow = list.length - shown.length;

  const pad = 8;
  const menuLeft =
    anchor && typeof window !== 'undefined'
      ? Math.min(anchor.left, Math.max(pad, window.innerWidth - ATTENDEES_POPOVER_WIDTH_PX - pad))
      : 0;

  const popover =
    open &&
    anchor &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        ref={menuRef}
        role="tooltip"
        className="fixed z-[200] min-w-[14rem] max-w-[20rem] rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-3 text-left shadow-xl"
        style={{ top: menuTop, left: menuLeft, width: ATTENDEES_POPOVER_WIDTH_PX }}
        onMouseEnter={clearLeaveTimer}
        onMouseLeave={scheduleClose}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          Attendees ({list.length})
        </p>
        <ul className="max-h-52 space-y-2 overflow-y-auto text-sm">
          {list.map((a) => (
            <li key={a.key} className="min-w-0">
              <div className="truncate font-medium text-gray-900">{a.displayName}</div>
              {a.email ? <div className="truncate text-xs text-gray-500">{a.email}</div> : null}
            </li>
          ))}
        </ul>
      </div>,
      document.body
    );

  return (
    <>
      <div
        ref={triggerRef}
        className="relative w-max py-0.5"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={openPopover}
        onMouseLeave={scheduleClose}
      >
        <div className="flex items-center">
          <div className="flex items-center -space-x-2">
            {shown.map((a, i) => (
              <div key={a.key} className="relative" style={{ zIndex: shown.length - i }}>
                <Avatar
                  fallback={a.initials}
                  alt={a.displayName}
                  size="xs"
                  title={`${a.displayName}${a.email ? ` — ${a.email}` : ''}`}
                  className="border-2 border-white bg-gray-600 text-[10px] font-semibold shadow-sm"
                />
              </div>
            ))}
            {overflow > 0 ? (
              <div
                className="relative z-[10] flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border-2 border-white bg-gray-200 px-1 text-[10px] font-bold text-gray-700 shadow-sm"
                title={`${overflow} more attendee${overflow !== 1 ? 's' : ''}`}
              >
                +{overflow}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {popover}
    </>
  );
}

function csvEscapeCell(value) {
  const s = value == null ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

// ── Filter Panel ─────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'discovery', label: 'Discovery' },
  { value: 'demo', label: 'Demo' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'check_in', label: 'Check-in' },
  { value: 'review', label: 'Review' },
  { value: 'internal', label: 'Internal' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No-show' },
];

function FilterPanel({ filters, onChange, onClear, visible }) {
  if (!visible) return null;
  return (
    <Card className="p-5 border border-orange-100 bg-gradient-to-br from-orange-50/60 to-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Filter className="w-4 h-4 text-orange-500" />
          Filter Meetings
        </h3>
        <button type="button" onClick={onClear} className="text-xs text-gray-500 hover:text-orange-600 transition-colors">
          Clear all
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="Meeting type"
          value={filters.type}
          onChange={(v) => onChange('type', v)}
          options={TYPE_OPTIONS}
        />
        <Select
          label="Status"
          value={filters.status}
          onChange={(v) => onChange('status', v)}
          options={STATUS_OPTIONS}
        />
        <div>
          <label className="block mb-1.5 text-sm font-medium text-gray-700">From date</label>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => onChange('fromDate', e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <div>
          <label className="block mb-1.5 text-sm font-medium text-gray-700">To date</label>
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => onChange('toDate', e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
      </div>
    </Card>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────────────────────

function AnalyticsPanel({ meetings }) {
  const total = meetings.length;
  const completed = meetings.filter((m) => m.status === 'completed').length;
  const cancelled = meetings.filter((m) => m.status === 'cancelled').length;
  const noShow = meetings.filter((m) => m.status === 'no_show').length;
  const scheduled = meetings.filter((m) => m.status === 'scheduled').length;

  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);
  const thisWeek = meetings.filter((m) => m.startTime && new Date(m.startTime) >= thisWeekStart).length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const noShowRate = total > 0 ? Math.round((noShow / total) * 100) : 0;

  // Per type breakdown
  const byType = Object.entries(MEETING_TYPE_LABELS).map(([key, label]) => ({
    key,
    label,
    count: meetings.filter((m) => m.meetingType === key).length,
  })).filter((t) => t.count > 0).sort((a, b) => b.count - a.count);

  // Per owner
  const ownerMap = {};
  for (const m of meetings) {
    const owner = m.assignedTo;
    if (!owner) continue;
    const name =
      owner.username?.trim() || owner.email?.split('@')[0]?.trim() || `User ${owner.id}`;
    ownerMap[name] = (ownerMap[name] || 0) + 1;
  }
  const byOwner = Object.entries(ownerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Day of week
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const byDay = dayNames.map((day, i) => ({
    day,
    count: meetings.filter((m) => m.startTime && new Date(m.startTime).getDay() === i).length,
  }));
  const maxDay = Math.max(...byDay.map((d) => d.count), 1);

  const maxType = Math.max(...byType.map((t) => t.count), 1);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total', value: total, color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'This week', value: thisWeek, color: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50' },
          { label: 'Completion rate', value: `${completionRate}%`, color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' },
          { label: 'No-show rate', value: `${noShowRate}%`, color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
        ].map((s) => (
          <Card key={s.label} className={`p-5 ${s.bg}`}>
            <p className="text-xs font-medium text-gray-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-black ${s.text}`}>{s.value}</p>
            <div className={`mt-2 h-1 w-full rounded-full bg-white/60`}>
              <div className={`h-1 rounded-full ${s.color}`} style={{ width: '60%' }} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Status breakdown */}
        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-700 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-orange-500" />
            Status Breakdown
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Scheduled', value: scheduled, color: 'bg-blue-400' },
              { label: 'Completed', value: completed, color: 'bg-green-400' },
              { label: 'Cancelled', value: cancelled, color: 'bg-gray-400' },
              { label: 'No-show', value: noShow, color: 'bg-red-400' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-gray-600">{s.label}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${s.color} transition-all duration-500`}
                    style={{ width: total > 0 ? `${(s.value / total) * 100}%` : '0%' }}
                  />
                </div>
                <span className="w-6 text-right text-xs font-semibold text-gray-700">{s.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* By type */}
        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-500" />
            By Meeting Type
          </h3>
          {byType.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet</p>
          ) : (
            <div className="space-y-3">
              {byType.map((t) => (
                <div key={t.key} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs text-gray-600">{t.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-orange-400 transition-all duration-500"
                      style={{ width: `${(t.count / maxType) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs font-semibold text-gray-700">{t.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* By day of week */}
        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-500" />
            Meetings by Day of Week
          </h3>
          <div className="flex items-end gap-2 h-24">
            {byDay.map(({ day, count }) => (
              <div key={day} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center justify-end h-16">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-orange-500 to-orange-300 transition-all duration-500 min-h-[4px]"
                    style={{ height: `${(count / maxDay) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 font-medium">{day}</span>
                <span className="text-[10px] font-bold text-gray-700">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top owners */}
        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Award className="w-4 h-4 text-orange-500" />
            Top Meeting Owners
          </h3>
          {byOwner.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet</p>
          ) : (
            <div className="space-y-3">
              {byOwner.map(([name, count], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-xs font-bold text-orange-500">#{i + 1}</span>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-[10px] font-bold text-white">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="flex-1 truncate text-sm text-gray-700">{name}</span>
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'today', label: 'Today' },
  { id: 'past', label: 'Past' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'analytics', label: 'Analytics' },
];

const ITEMS_PER_PAGE = 15;

export default function MeetingsPage() {
  const router = useRouter();

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState('list'); // 'list' | 'calendar'
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({ type: '', status: '', fromDate: '', toDate: '' });

  const [deleteModal, setDeleteModal] = useState({ open: false, meeting: null });
  const [deleting, setDeleting] = useState(false);
  const [meetingActionMenu, setMeetingActionMenu] = useState(null);

  const {
    columnVisibility,
    columnOrder,
    columnPickerOpen,
    setColumnPickerOpen,
    columnDropIndicator,
    toolbarRef,
    setColumnVisible,
    handleColumnDragStart,
    handleColumnDragEnd,
    handleColumnRowDragOver,
    handleColumnListDragLeave,
    handleColumnDrop,
    resetColumnTablePreferences,
    tableResizeProps,
  } = useTableColumnPreferences({
    visibilityStorageKey: COLUMN_VISIBILITY_STORAGE_KEY,
    orderStorageKey: COLUMN_ORDER_STORAGE_KEY,
    widthsStorageKey: COLUMN_WIDTHS_STORAGE_KEY,
    defaultVisibility: DEFAULT_COLUMN_VISIBILITY,
    reorderableKeys: REORDERABLE_COLUMN_KEYS,
    defaultWidths: DEFAULT_COLUMN_WIDTHS,
    minWidths: MIN_COLUMN_WIDTHS,
  });

  useEffect(() => {
    if (!columnPickerOpen) return;
    const onDocMouseDown = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setColumnPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [columnPickerOpen, setColumnPickerOpen, toolbarRef]);

  // Load all meetings (client-side filtering for responsiveness)
  const loadMeetings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await meetingService.getCalendarRange();
      setMeetings(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setError(e?.message || 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  // ── Derived counts ───────────────────────────────────────────────────────

  const counts = useMemo(() => {
    const all = meetings.length;
    const upcoming = meetings.filter((m) => m.status === 'scheduled' && isUpcoming(m.startTime)).length;
    const today = meetings.filter((m) => isToday(m.startTime)).length;
    const past = meetings.filter((m) => m.status !== 'cancelled' && isPast(m.startTime)).length;
    const cancelled = meetings.filter((m) => m.status === 'cancelled').length;
    return { all, upcoming, today, past, cancelled };
  }, [meetings]);

  // ── KPIs ─────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    const completedThisWeek = meetings.filter(
      (m) => m.status === 'completed' && m.startTime && new Date(m.startTime) >= thisWeekStart
    ).length;
    return {
      total: meetings.length,
      upcoming: counts.upcoming,
      today: counts.today,
      completedThisWeek,
    };
  }, [meetings, counts]);

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filteredMeetings = useMemo(() => {
    let list = [...meetings];

    // Tab filter
    if (activeTab === 'upcoming') list = list.filter((m) => m.status === 'scheduled' && isUpcoming(m.startTime));
    else if (activeTab === 'today') list = list.filter((m) => isToday(m.startTime));
    else if (activeTab === 'past') list = list.filter((m) => m.status !== 'cancelled' && isPast(m.startTime));
    else if (activeTab === 'cancelled') list = list.filter((m) => m.status === 'cancelled');

    // Panel filters
    if (filters.type) list = list.filter((m) => m.meetingType === filters.type);
    if (filters.status) list = list.filter((m) => m.status === filters.status);
    if (filters.fromDate) list = list.filter((m) => m.startTime && m.startTime >= filters.fromDate);
    if (filters.toDate) list = list.filter((m) => m.startTime && m.startTime <= filters.toDate + 'T23:59:59');

    // Search
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((m) => {
        const contactName = [m.contact?.firstName, m.contact?.lastName].filter(Boolean).join(' ');
        return (
          m.title?.toLowerCase().includes(q) ||
          m.location?.toLowerCase().includes(q) ||
          contactName.toLowerCase().includes(q) ||
          m.deal?.name?.toLowerCase().includes(q) ||
          m.clientAccount?.companyName?.toLowerCase().includes(q) ||
          m.leadCompany?.companyName?.toLowerCase().includes(q)
        );
      });
    }

    // Sort upcoming first for default, past most-recent first
    if (activeTab === 'past') {
      list.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    } else {
      list.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }

    return list;
  }, [meetings, activeTab, searchQuery, filters]);

  const handleExportMeetings = useCallback(() => {
    const headers = [
      'Title',
      'Start',
      'End',
      'Type',
      'Status',
      'Linked record',
      'Attendees',
      'Location',
      'Virtual',
    ];
    const rows = filteredMeetings.map((m) => {
      const info = relatedEntityInfo(m);
      const linked = info ? `${info.kind}: ${info.label}` : '';
      const attendees = meetingAttendeesList(m)
        .map((a) => (a.email ? `${a.displayName} <${a.email}>` : a.displayName))
        .join('; ');
      return [
        m.title || '',
        m.startTime || '',
        m.endTime || '',
        MEETING_TYPE_LABELS[m.meetingType] || m.meetingType || '',
        STATUS_LABELS[m.status] || m.status || '',
        linked,
        attendees,
        m.location || '',
        m.isVirtual ? 'Yes' : 'No',
      ];
    });
    const csv = [headers.map(csvEscapeCell).join(',')]
      .concat(rows.map((r) => r.map(csvEscapeCell).join(',')))
      .join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meetings-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredMeetings]);

  // ── Pagination ────────────────────────────────────────────────────────────

  const totalFiltered = filteredMeetings.length;
  const totalPages = Math.ceil(totalFiltered / ITEMS_PER_PAGE);
  const paginatedMeetings = filteredMeetings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setView('list');
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteModal.meeting) return;
    setDeleting(true);
    try {
      await meetingService.delete(deleteModal.meeting.id);
      setMeetings((prev) => prev.filter((m) => m.id !== deleteModal.meeting.id));
      setDeleteModal({ open: false, meeting: null });
    } catch (e) {
      console.error('Delete failed', e);
    } finally {
      setDeleting(false);
    }
  };

  const handleMarkComplete = useCallback(async (meeting) => {
    try {
      await meetingService.update(meeting.id, { status: 'completed' });
      setMeetings((prev) => prev.map((m) => (m.id === meeting.id ? { ...m, status: 'completed' } : m)));
    } catch (e) {
      console.error('Update failed', e);
    }
  }, []);

  const handleCancel = useCallback(async (meeting) => {
    try {
      await meetingService.update(meeting.id, { status: 'cancelled' });
      setMeetings((prev) => prev.map((m) => (m.id === meeting.id ? { ...m, status: 'cancelled' } : m)));
    } catch (e) {
      console.error('Update failed', e);
    }
  }, []);

  // ── Filter helpers ────────────────────────────────────────────────────────

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ type: '', status: '', fromDate: '', toDate: '' });
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  // ── Table columns (match CRM list tables: `label` for headers, @webfudge/ui cells) ──

  const allMeetingTableColumns = useMemo(
    () => [
      {
        key: 'title',
        label: 'MEETING',
        render: (_, row) => {
          const title = row.title || 'Untitled';
          const locShort =
            row.location && row.location.length > 48 ? `${row.location.slice(0, 48)}…` : row.location || '';
          return (
            <div className="flex min-w-[220px] w-full items-start gap-3">
              <Avatar
                fallback={(title.trim().charAt(0) || 'M').toUpperCase()}
                alt={title}
                size="sm"
                className="flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/meetings/${row.id}`}
                  className="block truncate font-medium text-gray-900 transition-colors hover:text-orange-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  {title}
                </Link>
                <div className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-sm text-gray-500">
                  {row.isVirtual ? (
                    <>
                      <Video className="h-3.5 w-3.5 shrink-0 text-sky-500" aria-hidden />
                      <span>Virtual</span>
                    </>
                  ) : row.location ? (
                    <>
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                      <span title={row.location}>{locShort}</span>
                    </>
                  ) : (
                    <span>—</span>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: 'startTime',
        label: 'DATE & TIME',
        width: '240px',
        render: (_, row) => {
          const dateLine = row.startTime ? formatTableDate(row.startTime) : '—';
          const timeLine =
            row.startTime || row.endTime
              ? `${formatTimeOnly(row.startTime)}${row.endTime ? ` – ${formatTimeOnly(row.endTime)}` : ''}`
              : '';
          return (
            <div className="min-w-[220px]">
              <div className="whitespace-nowrap text-sm font-semibold text-gray-900">{dateLine}</div>
              {timeLine ? (
                <div className="whitespace-nowrap text-sm text-gray-500">{timeLine}</div>
              ) : null}
            </div>
          );
        },
      },
      {
        key: 'endTime',
        label: 'DURATION',
        render: (_, row) => (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden />
            <TableCellText value={computeDuration(row.startTime, row.endTime)} nowrap emphasized />
          </div>
        ),
      },
      {
        key: 'meetingType',
        label: 'TYPE',
        render: (_, row) => <TableCellOrangePill value={row.meetingType} />,
      },
      {
        key: 'status',
        label: 'STATUS',
        render: (_, row) => {
          const label = STATUS_LABELS[row.status] || row.status || '—';
          return (
            <Badge variant={STATUS_COLORS[row.status] || 'default'} className="font-semibold">
              {String(label).toUpperCase()}
            </Badge>
          );
        },
      },
      {
        key: 'deal',
        label: 'LINKED RECORD',
        render: (_, row) => {
          const info = relatedEntityInfo(row);
          if (!info) return <TableCellText value="" />;
          const { kind, icon: Icon, label, color } = info;
          return (
            <div className="flex min-w-0 max-w-[220px] flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400" title="Deal, client account, lead company, or contact">
                {kind}
              </span>
              <div className="flex min-w-0 items-center gap-2">
                <Icon className={`h-4 w-4 shrink-0 ${color}`} aria-hidden />
                <TableCellText value={label} nowrap className="min-w-0 !max-w-none" />
              </div>
            </div>
          );
        },
      },
      {
        key: 'contact',
        label: 'ATTENDEES',
        render: (_, row) => <MeetingAttendeesStack meeting={row} />,
      },
      {
        key: 'assignedTo',
        label: 'OWNER',
        render: (_, row) => <TableCellOwner user={row.assignedTo} />,
      },
      {
        key: 'actions',
        label: 'ACTIONS',
        render: (_, row) => (
          <div className="flex min-w-[168px] items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-teal-600 hover:bg-teal-50"
                title="More options"
                onClick={(e) => {
                  e.stopPropagation();
                  const r = e.currentTarget.getBoundingClientRect();
                  setMeetingActionMenu((prev) =>
                    prev?.id === row.id
                      ? null
                      : { id: row.id, top: r.bottom + 4, left: r.left, triggerEl: e.currentTarget }
                  );
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-emerald-600 hover:bg-emerald-50"
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/meetings/${row.id}?edit=true`);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-orange-600 hover:bg-orange-50 disabled:opacity-40"
              title="Send mail"
              disabled={!(row.contact?.email || row.attendees?.[0]?.email)}
              onClick={(e) => {
                e.stopPropagation();
                const em = row.contact?.email || row.attendees?.[0]?.email;
                if (em) window.location.href = `mailto:${em}`;
              }}
            >
              <Mail className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-red-600 hover:bg-red-50"
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteModal({ open: true, meeting: row });
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [router]
  );

  const meetingTableColumns = useMemo(() => {
    const byKey = Object.fromEntries(allMeetingTableColumns.map((c) => [c.key, c]));
    const out = [];
    if (byKey.title) out.push(byKey.title);
    for (const key of columnOrder) {
      if (columnVisibility[key] && byKey[key]) out.push(byKey[key]);
    }
    if (byKey.actions) out.push(byKey.actions);
    return out;
  }, [allMeetingTableColumns, columnOrder, columnVisibility]);

  const showTableColumnTools = activeTab !== 'analytics' && view === 'list';

  // ── Tabs config ───────────────────────────────────────────────────────────

  const tabsWithCounts = TABS.map((t) => ({
    ...t,
    badge: t.id !== 'analytics' ? (counts[t.id] ?? null) : null,
  }));

  return (
    <div className="space-y-6 p-4 md:p-6">
      <CRMPageHeader
        title="Meetings"
        subtitle="Schedule, track, and manage all your client and internal meetings."
        breadcrumb={[
          { label: 'Dashboard', href: '/' },
          { label: 'Meetings', href: '/meetings' },
        ]}
        showProfile
        showActions
        onExportClick={handleExportMeetings}
      />

      {/* KPI row — same orange scheme as lead companies */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Meetings"
          value={kpis.total}
          icon={CalendarDays}
          colorScheme="orange"
          subtitle={`${kpis.total} total`}
        />
        <KPICard
          title="Upcoming"
          value={kpis.upcoming}
          icon={CalendarClock}
          colorScheme="orange"
          subtitle="Scheduled ahead"
        />
        <KPICard
          title="Today"
          value={kpis.today}
          icon={Clock}
          colorScheme="orange"
          subtitle="Meetings today"
        />
        <KPICard
          title="Completed this week"
          value={kpis.completedThisWeek}
          icon={CheckCircle2}
          colorScheme="orange"
          subtitle="This week"
        />
      </div>

      {/* Tabs + toolbar */}
      <div className="relative" ref={toolbarRef}>
        <TabsWithActions
          tabs={tabsWithCounts}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          showSearch={activeTab !== 'analytics'}
          searchQuery={searchQuery}
          onSearchChange={(v) => {
            setSearchQuery(v);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search meetings…"
          showAdd={activeTab !== 'analytics'}
          onAddClick={() => router.push('/meetings/new')}
          addTitle="New Meeting"
          showFilter={activeTab !== 'analytics'}
          onFilterClick={() => setShowFilter((v) => !v)}
          filterTitle={hasActiveFilters ? 'Filters active' : 'Filter'}
          showViewToggle={activeTab !== 'analytics'}
          activeView={view}
          onViewChange={setView}
          viewOptions={['list', 'calendar']}
          listViewTitle="List view"
          calendarViewTitle="Calendar view"
          showColumnVisibility={showTableColumnTools}
          onColumnVisibilityClick={() => setColumnPickerOpen((o) => !o)}
          columnVisibilityTitle="Show, hide, or reorder columns"
          variant="glass"
        />
        <TableColumnPicker
          open={showTableColumnTools && columnPickerOpen}
          description="Meeting title and actions stay visible. Drag column edges in the table to resize."
          reorderableRows={TOGGLEABLE_COLUMNS}
          columnVisibility={columnVisibility}
          columnOrder={columnOrder}
          columnDropIndicator={columnDropIndicator}
          onSetVisible={setColumnVisible}
          onDragStart={handleColumnDragStart}
          onDragEnd={handleColumnDragEnd}
          onRowDragOver={handleColumnRowDragOver}
          onListDragLeave={handleColumnListDragLeave}
          onDrop={handleColumnDrop}
          onReset={resetColumnTablePreferences}
        />
      </div>

      {/* Filter panel */}
      {activeTab !== 'analytics' && (
        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
          visible={showFilter}
        />
      )}

      {/* Analytics tab */}
      {activeTab === 'analytics' ? (
        <AnalyticsPanel meetings={meetings} />
      ) : view === 'calendar' ? (
        /* Calendar view */
        <Card className="overflow-hidden p-0">
          <FullCalendarView
            meetings={filteredMeetings}
            onEventClick={(meeting) => router.push(`/meetings/${meeting.id}`)}
            onDateClick={(dateStr) => router.push(`/meetings/new?date=${dateStr}`)}
            onMeetingUpdate={(updated) =>
              setMeetings((prev) =>
                prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
              )
            }
          />
        </Card>
      ) : (
        /* List / table view — same shell as lead companies / client accounts */
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{totalFiltered}</span> result
            {totalFiltered !== 1 ? 's' : ''}
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
              <Button type="button" size="sm" variant="outline" onClick={loadMeetings} className="ml-auto">
                Retry
              </Button>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12">
                <LoadingSpinner size="lg" message="Loading meetings…" />
              </div>
            ) : (
              <>
                <Table
                  columns={meetingTableColumns}
                  data={paginatedMeetings}
                  keyField="id"
                  variant="modern"
                  onRowClick={(row) => router.push(`/meetings/${row.id}`)}
                  {...tableResizeProps}
                />
                {paginatedMeetings.length === 0 && (
                  <div className="border-t border-gray-200 p-12 text-center">
                    <div className="mb-2 text-gray-400">
                      <CalendarDays className="mx-auto mb-3 h-12 w-12 opacity-50" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-700">No meetings found</h3>
                    <p className="mb-4 text-sm text-gray-500">
                      {searchQuery || hasActiveFilters || activeTab !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Schedule your first meeting to get started'}
                    </p>
                    {!searchQuery && !hasActiveFilters && activeTab === 'all' && (
                      <Button variant="primary" onClick={() => router.push('/meetings/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Meeting
                      </Button>
                    )}
                  </div>
                )}
                {totalPages > 1 && (
                  <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalFiltered}
                      itemsPerPage={ITEMS_PER_PAGE}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {meetingActionMenu &&
        (() => {
          const row = meetings.find((m) => m.id === meetingActionMenu.id);
          if (!row) return null;
          return (
            <TableRowActionMenuPortal
              open
              anchor={{
                top: meetingActionMenu.top,
                left: meetingActionMenu.left,
                triggerEl: meetingActionMenu.triggerEl,
              }}
              onClose={() => setMeetingActionMenu(null)}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                onClick={() => {
                  setMeetingActionMenu(null);
                  router.push(`/meetings/${row.id}`);
                }}
              >
                <Eye className="h-4 w-4 shrink-0 text-teal-600" />
                View meeting
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                onClick={() => {
                  setMeetingActionMenu(null);
                  router.push(`/meetings/${row.id}?edit=true`);
                }}
              >
                <Pencil className="h-4 w-4 shrink-0 text-teal-600" />
                Edit meeting
              </button>
              {row.status === 'scheduled' ? (
                <>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                    onClick={() => {
                      setMeetingActionMenu(null);
                      handleMarkComplete(row);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600" />
                    Mark complete
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                    onClick={() => {
                      setMeetingActionMenu(null);
                      handleCancel(row);
                    }}
                  >
                    <Ban className="h-4 w-4 shrink-0 text-teal-600" />
                    Cancel meeting
                  </button>
                </>
              ) : null}
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!(row.contact?.email || row.attendees?.[0]?.email)}
                onClick={() => {
                  setMeetingActionMenu(null);
                  const em = row.contact?.email || row.attendees?.[0]?.email;
                  if (em) window.location.href = `mailto:${em}`;
                }}
              >
                <Mail className="h-4 w-4 shrink-0 text-teal-600" />
                Email attendee
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                onClick={() => {
                  setMeetingActionMenu(null);
                  navigator.clipboard.writeText(`${window.location.origin}/meetings/${row.id}`);
                }}
              >
                <Link2 className="h-4 w-4 shrink-0 text-teal-600" />
                Copy URL
              </button>
            </TableRowActionMenuPortal>
          );
        })()}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, meeting: null })}
        title="Delete Meeting"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-gray-700">
                Are you sure you want to delete{' '}
                <strong className="text-gray-900">
                  &quot;{deleteModal.meeting?.title || 'this meeting'}&quot;
                </strong>
                ? This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <Button variant="outline" onClick={() => setDeleteModal({ open: false, meeting: null })}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2"
            >
              {deleting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
