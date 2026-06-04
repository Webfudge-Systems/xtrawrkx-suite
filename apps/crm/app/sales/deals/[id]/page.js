'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Edit,
  Share2,
  Download,
  Target,
  Calendar,
  IndianRupee,
  BarChart3,
  Building2,
  User,
  Clock,
  Briefcase,
  Mail,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Phone,
  Globe,
  MapPin,
  Linkedin,
  Activity,
  Plus,
  Users,
  MoreHorizontal,
  Eye,
  Pencil,
  ClipboardList,
  Link2,
  Video,
} from 'lucide-react';
import {
  Button,
  Card,
  Avatar,
  KPICard,
  TabsWithActions,
  LoadingSpinner,
  EmptyState,
  Input,
  Select,
  Textarea,
  Badge,
  Table,
  Modal,
  TableRowActionMenuPortal,
  ActivitiesTimeline,
  EntityActivityPanel,
} from '@webfudge/ui';
import CRMPageHeader from '../../../../components/CRMPageHeader';
import dealService from '../../../../lib/api/dealService';
import contactService from '../../../../lib/api/contactService';
import taskService from '../../../../lib/api/taskService';
import { fetchActivityTimeline, fetchDealComments, addDealComment } from '../../../../lib/api/crmActivityService';
import { MeetingsEmbedList } from '@webfudge/ui';
import meetingService from '../../../../lib/api/meetingService';
import {
  stageLabel,
  contactDisplayName,
  DEAL_STAGE_OPTIONS,
  PRIORITY_OPTIONS,
} from '../../../../lib/dealFormOptions';
import { canEditCRMRecord, canManageCRM, canWriteCRM } from '../../../../lib/rbac';
import { fetchChatMentionUsers } from '../../../../lib/chatMentionUsers';

const headerIconBtnClass =
  'rounded-xl border border-white/20 bg-white/10 p-2.5 text-brand-text-light shadow-lg backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-white/20';

const dealAddContactRoleOptions = [
  { value: 'PRIMARY_CONTACT', label: 'Primary contact' },
  { value: 'TECHNICAL_CONTACT', label: 'Technical contact' },
  { value: 'DECISION_MAKER', label: 'Decision maker' },
  { value: 'INFLUENCER', label: 'Influencer' },
  { value: 'CONTACT', label: 'Contact' },
  { value: 'GATEKEEPER', label: 'Gatekeeper' },
];

const initialDealAddContactForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  jobTitle: '',
  department: '',
  contactRole: 'TECHNICAL_CONTACT',
};

function formatCurrency(value) {
  if (value == null || value === '') return '₹0';
  const n = Number(value);
  if (Number.isNaN(n)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 0) return 'just now';
  if (diffDay === 0) {
    if (diffHour === 0) {
      if (diffMin === 0) return 'just now';
      return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    }
    return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  }
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  if (diffDay < 30) {
    const w = Math.floor(diffDay / 7);
    return `${w} week${w !== 1 ? 's' : ''} ago`;
  }
  if (diffDay < 365) {
    const m = Math.floor(diffDay / 30);
    return `${m} month${m !== 1 ? 's' : ''} ago`;
  }
  const y = Math.floor(diffDay / 365);
  return `${y} year${y !== 1 ? 's' : ''} ago`;
}

function assigneeName(user) {
  if (!user) return 'Unassigned';
  if (typeof user === 'object') {
    const fn = user.firstName || user.firstname;
    const ln = user.lastName || user.lastname;
    if (fn || ln) return [fn, ln].filter(Boolean).join(' ').trim();
    if (user.username) return user.username;
    if (user.email) return user.email.split('@')[0];
  }
  return 'Team member';
}

function assigneeInitials(user) {
  const name = assigneeName(user);
  if (name === 'Unassigned' || name === 'Team member') return '?';
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function assigneeRole(user) {
  if (!user || typeof user !== 'object') return 'Deal owner';
  const r = user.primaryRole ?? user.role;
  if (r && typeof r === 'object') {
    return r.name || r.type || 'Deal owner';
  }
  if (typeof r === 'string' && r.trim()) return r;
  return 'Deal owner';
}

function assigneeEmailLine(user) {
  if (!user || typeof user !== 'object') return null;
  const e = user.email?.trim();
  return e || null;
}

function companyLine(deal) {
  if (deal?.leadCompany && typeof deal.leadCompany === 'object') {
    return deal.leadCompany.companyName || deal.leadCompany.name || '—';
  }
  if (deal?.clientAccount && typeof deal.clientAccount === 'object') {
    return deal.clientAccount.companyName || deal.clientAccount.name || '—';
  }
  return '—';
}

/** Top-right stage pill — same visual language as lead company “Company information” status. */
function dealStageHighlightClass(stage) {
  const s = (stage || '').toLowerCase();
  if (s === 'won') {
    return 'border border-emerald-300/90 bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-100/90 text-emerald-950 ring-emerald-200/70';
  }
  if (s === 'lost') {
    return 'border border-rose-300/90 bg-gradient-to-br from-rose-50 via-rose-50 to-rose-100/90 text-rose-950 ring-rose-200/70';
  }
  if (s === 'negotiation') {
    return 'border border-violet-300/90 bg-gradient-to-br from-violet-50 via-violet-50 to-violet-100/90 text-violet-950 ring-violet-200/70';
  }
  if (s === 'proposal') {
    return 'border border-amber-300/90 bg-gradient-to-br from-amber-50 via-amber-50 to-amber-100/90 text-amber-950 ring-amber-200/70';
  }
  return 'border border-orange-300/90 bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100/90 text-orange-950 ring-orange-200/70';
}

/** Stage KPI card background + ring (matches pipeline stage semantics). */
function dealStageKpiCardClass(stage) {
  const s = (stage || '').toLowerCase();
  if (s === 'won') {
    return 'bg-gradient-to-br from-emerald-50 via-emerald-100/55 to-white ring-1 ring-emerald-200/55';
  }
  if (s === 'lost') {
    return 'bg-gradient-to-br from-rose-50 via-rose-100/55 to-white ring-1 ring-rose-200/55';
  }
  if (s === 'negotiation') {
    return 'bg-gradient-to-br from-violet-50 via-violet-100/45 to-white ring-1 ring-violet-200/55';
  }
  if (s === 'proposal') {
    return 'bg-gradient-to-br from-amber-50 via-amber-100/65 to-white ring-1 ring-amber-200/50';
  }
  if (s === 'prospect') {
    return 'bg-gradient-to-br from-yellow-50 via-amber-50/75 to-white ring-1 ring-yellow-200/50';
  }
  return 'bg-gradient-to-br from-orange-50 via-orange-50/85 to-white ring-1 ring-orange-200/40';
}

/** KPICard colorScheme keys: emerald, red, purple, orange, yellow. */
function dealStageKpiColorScheme(stage) {
  const s = (stage || '').toLowerCase();
  if (s === 'won') return 'emerald';
  if (s === 'lost') return 'red';
  if (s === 'negotiation') return 'purple';
  if (s === 'proposal') return 'orange';
  if (s === 'prospect') return 'yellow';
  return 'orange';
}

function dealStageKpiIcon(stage) {
  const s = (stage || '').toLowerCase();
  if (s === 'won') return CheckCircle2;
  if (s === 'lost') return XCircle;
  if (s === 'negotiation') return BarChart3;
  if (s === 'proposal') return Briefcase;
  return Target;
}

function DealStageHeaderPill({ stage }) {
  const s = (stage || '').toLowerCase();
  let StageIcon = Target;
  let iconClass = 'text-orange-600';
  if (s === 'won') {
    StageIcon = CheckCircle2;
    iconClass = 'text-emerald-600';
  } else if (s === 'lost') {
    StageIcon = XCircle;
    iconClass = 'text-rose-600';
  } else if (s === 'negotiation') {
    StageIcon = BarChart3;
    iconClass = 'text-violet-600';
  } else if (s === 'proposal') {
    StageIcon = Briefcase;
    iconClass = 'text-amber-600';
  }
  return (
    <span
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-widest shadow-md ring-2 ${dealStageHighlightClass(stage)}`}
      role="status"
      title="Pipeline stage"
    >
      <StageIcon className={`h-5 w-5 shrink-0 ${iconClass}`} strokeWidth={2.25} aria-hidden />
      {stageLabel(stage).toUpperCase()}
    </span>
  );
}

function priorityLabel(p) {
  if (!p) return '—';
  return String(p).charAt(0).toUpperCase() + String(p).slice(1);
}

function daysToClose(expectedCloseDate) {
  if (!expectedCloseDate) return null;
  const end = new Date(expectedCloseDate);
  if (Number.isNaN(end.getTime())) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

function isPresent(value) {
  if (value == null) return false;
  const s = String(value).trim();
  return s.length > 0 && s !== '—';
}

function humanizeToken(value) {
  if (!isPresent(value)) return '';
  return String(value)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function taskStatusLabel(status) {
  if (!status) return '—';
  return String(status)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function contactInitials(contact) {
  const fn = contact?.firstName?.trim();
  const ln = contact?.lastName?.trim();
  if (fn && ln) return `${fn[0]}${ln[0]}`.toUpperCase();
  const name = contactDisplayName(contact);
  if (name && name.length >= 2) return name.slice(0, 2).toUpperCase();
  return (name?.[0] || contact?.email?.[0] || 'C').toUpperCase();
}

/** Build a display + optional map line from address parts (lead company, client account, contact). */
function formatAddressLines(entity) {
  if (!entity || typeof entity !== 'object') return null;
  const line1 = entity.address?.trim();
  const cityState = [entity.city, entity.state].filter((x) => isPresent(x)).join(', ');
  const zip = entity.zipCode?.trim();
  const mid = [cityState, zip].filter(Boolean).join(' ');
  const country = entity.country?.trim();
  const parts = [line1, mid, country].filter(Boolean);
  return parts.length ? parts : null;
}

function websiteHref(raw) {
  if (!isPresent(raw)) return null;
  const u = String(raw).trim();
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

function twitterHref(raw) {
  if (!isPresent(raw)) return null;
  const u = String(raw).trim();
  if (/^https?:\/\//i.test(u)) return u;
  const h = u.replace(/^@/, '');
  return `https://twitter.com/${encodeURIComponent(h)}`;
}

const outlineAccentBtnClass = 'border-orange-200 text-orange-800 hover:bg-orange-50';

/** Compact label / value row for sidebar entity cards (deal detail). */
function SidebarDetailRow({ label, children }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-t border-gray-100 py-2.5 first:border-t-0 first:pt-0 sm:grid-cols-[6.75rem_1fr] sm:items-start sm:gap-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="min-w-0 text-sm font-medium leading-snug text-gray-900">{children}</div>
    </div>
  );
}

function InfoSection({ title, icon: Icon, children, isFirst = false }) {
  return (
    <section className={isFirst ? 'pt-0' : 'border-t border-gray-100 pt-4'}>
      <div className="mb-2 flex items-center gap-2">
        {Icon ? <Icon className="h-5 w-5 shrink-0 text-orange-500" aria-hidden /> : null}
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600">{title}</h3>
      </div>
      {children}
    </section>
  );
}

const infoLabelClass =
  'flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-600 sm:text-sm';

function InfoRow({ label, value, icon: RowIcon, className = '', emphasize = false, children, bodyClassName }) {
  const hasCustom = children != null;

  if (hasCustom) {
    return (
      <div className={`min-w-0 ${className}`} role="group" aria-label={label}>
        <div className={infoLabelClass}>
          {RowIcon ? <RowIcon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden /> : null}
          <span>{label}</span>
        </div>
        <div className={bodyClassName ?? 'mt-2.5 text-base leading-snug'}>{children}</div>
      </div>
    );
  }

  const raw = value == null ? '' : String(value).trim();
  const empty = !raw || raw === '—';
  const display = empty ? '—' : raw;

  return (
    <div
      className={`min-w-0 ${className}`}
      role="group"
      aria-label={`${label}: ${empty ? 'empty' : display}`}
    >
      <div className={infoLabelClass}>
        {RowIcon ? <RowIcon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden /> : null}
        <span>{label}</span>
      </div>
      <div className="mt-2.5">
        {!empty && emphasize ? (
          <span className="inline-flex rounded-lg bg-orange-50 px-3 py-2 text-base font-semibold text-orange-900 shadow-sm ring-1 ring-orange-200/80">
            {display}
          </span>
        ) : (
          <p
            className={`text-base leading-snug ${empty ? 'font-normal text-gray-500' : 'font-semibold text-gray-900'}`}
          >
            {display}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailTab, setDetailTab] = useState('overview');
  const [crmTimeline, setCrmTimeline] = useState([]);
  const [crmTimelineLoading, setCrmTimelineLoading] = useState(false);
  const [crmTimelineError, setCrmTimelineError] = useState(null);
  const [editingDealInfo, setEditingDealInfo] = useState(false);
  const [dealInfoDraft, setDealInfoDraft] = useState(null);
  const [savingDealInfo, setSavingDealInfo] = useState(false);
  const [dealInfoSaveError, setDealInfoSaveError] = useState('');
  const [dealLinkedContacts, setDealLinkedContacts] = useState([]);
  const [dealContactsLoading, setDealContactsLoading] = useState(false);
  const [dealContactActionMenu, setDealContactActionMenu] = useState(null);
  const [dealAddContactOpen, setDealAddContactOpen] = useState(false);
  const [dealAddContactForm, setDealAddContactForm] = useState({ ...initialDealAddContactForm });
  const [dealAddContactErrors, setDealAddContactErrors] = useState({});
  const [dealAddContactSubmitting, setDealAddContactSubmitting] = useState(false);
  const [dealTasks, setDealTasks] = useState([]);
  const [dealTasksLoading, setDealTasksLoading] = useState(false);
  const [dealMeetingsCount, setDealMeetingsCount] = useState(0);
  const canEditDeal = canEditCRMRecord('deals', deal);
  const canManageDeals = canManageCRM('deals');
  const canWriteDeals = canWriteCRM('deals');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await dealService.getOne(id);
        if (!cancelled && res?.data) setDeal(res.data);
        else if (!cancelled) setDeal(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setDealMeetingsCount(0);
    (async () => {
      try {
        const n = await meetingService.countByDeal(id);
        if (!cancelled) setDealMeetingsCount(typeof n === 'number' && !Number.isNaN(n) ? n : 0);
      } catch {
        if (!cancelled) setDealMeetingsCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const leadCompanyId = useMemo(() => {
    const lc = deal?.leadCompany;
    if (!lc || typeof lc !== 'object') return null;
    const raw = lc.id ?? lc.documentId;
    return raw != null ? String(raw) : null;
  }, [deal]);

  const clientAccountId = useMemo(() => {
    const ca = deal?.clientAccount;
    if (!ca || typeof ca !== 'object') return null;
    const raw = ca.id ?? ca.documentId;
    return raw != null ? String(raw) : null;
  }, [deal]);

  const loadDealContacts = useCallback(async () => {
    if (!deal) {
      setDealLinkedContacts([]);
      return;
    }
    setDealContactsLoading(true);
    const populate = ['assignedTo', 'leadCompany', 'clientAccount'];
    const mergedById = new Map();

    const fetchByLead = async (lcid) => {
      const idEq = Number.isNaN(Number(lcid)) ? lcid : Number(lcid);
      try {
        const contactsRes = await contactService.getAll({
          'pagination[pageSize]': 100,
          sort: 'createdAt:desc',
          populate,
          filters: { leadCompany: { id: { $eq: idEq } } },
        });
        for (const c of contactsRes.data || []) {
          if (c?.id != null) mergedById.set(String(c.id), c);
        }
      } catch (err) {
        console.warn('Deal contacts filter (lead company) failed, falling back', err);
        const contactsRes = await contactService.getAll({
          'pagination[pageSize]': 100,
          sort: 'createdAt:desc',
          populate,
        });
        const all = contactsRes.data || [];
        for (const c of all) {
          const lc = c.leadCompany;
          const lid = lc && typeof lc === 'object' ? lc.id : lc;
          if (lid != null && String(lid) === String(lcid) && c?.id != null) {
            mergedById.set(String(c.id), c);
          }
        }
      }
    };

    const fetchByClient = async (caid) => {
      const idEq = Number.isNaN(Number(caid)) ? caid : Number(caid);
      try {
        const contactsRes = await contactService.getAll({
          'pagination[pageSize]': 100,
          sort: 'createdAt:desc',
          populate,
          filters: { clientAccount: { id: { $eq: idEq } } },
        });
        for (const c of contactsRes.data || []) {
          if (c?.id != null) mergedById.set(String(c.id), c);
        }
      } catch (err) {
        console.warn('Deal contacts filter (client account) failed, falling back', err);
        const contactsRes = await contactService.getAll({
          'pagination[pageSize]': 100,
          sort: 'createdAt:desc',
          populate,
        });
        const all = contactsRes.data || [];
        for (const c of all) {
          const acc = c.clientAccount;
          const aid = acc && typeof acc === 'object' ? acc.id : acc;
          if (aid != null && String(aid) === String(caid) && c?.id != null) {
            mergedById.set(String(c.id), c);
          }
        }
      }
    };

    try {
      if (leadCompanyId) await fetchByLead(leadCompanyId);
      if (clientAccountId) await fetchByClient(clientAccountId);

      const pc = deal.contact;
      if (pc && typeof pc === 'object' && (pc.id ?? pc.documentId) != null) {
        const pid = String(pc.id ?? pc.documentId);
        if (!mergedById.has(pid)) {
          try {
            const one = await contactService.getOne(pid, { populate });
            if (one?.data?.id != null) mergedById.set(String(one.data.id), one.data);
          } catch {
            mergedById.set(pid, { ...pc });
          }
        }
      }

      const merged = Array.from(mergedById.values());
      const primaryDealContactId =
        deal.contact && typeof deal.contact === 'object'
          ? String(deal.contact.id ?? deal.contact.documentId ?? '')
          : '';

      merged.sort((a, b) => {
        const aDealPrimary = primaryDealContactId && String(a.id) === primaryDealContactId;
        const bDealPrimary = primaryDealContactId && String(b.id) === primaryDealContactId;
        if (aDealPrimary !== bDealPrimary) return aDealPrimary ? -1 : 1;
        return Number(!!b.isPrimaryContact) - Number(!!a.isPrimaryContact);
      });

      setDealLinkedContacts(merged);
    } catch (e) {
      console.error(e);
      setDealLinkedContacts([]);
    } finally {
      setDealContactsLoading(false);
    }
  }, [deal, leadCompanyId, clientAccountId]);

  useEffect(() => {
    void loadDealContacts();
  }, [loadDealContacts]);

  useEffect(() => {
    // Use loaded deal.id (numeric PK) for task filters; route `id` may be documentId in Strapi 5.
    const dealPk = deal?.id;
    if (dealPk == null) {
      setDealTasks([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setDealTasksLoading(true);
      try {
        const { data } = await taskService.getByDealId(dealPk);
        if (!cancelled) setDealTasks(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setDealTasks([]);
      } finally {
        if (!cancelled) setDealTasksLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deal?.id]);

  const reloadTimeline = useCallback(
    async (silent) => {
      if (!leadCompanyId) {
        setCrmTimeline([]);
        setCrmTimelineError(null);
        return;
      }
      if (!silent) {
        setCrmTimelineLoading(true);
        setCrmTimelineError(null);
      }
      try {
        const { data } = await fetchActivityTimeline({ leadCompanyId, limit: 50 });
        setCrmTimeline(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!silent) setCrmTimelineError(e?.message || 'Could not load activities');
        setCrmTimeline([]);
      } finally {
        if (!silent) setCrmTimelineLoading(false);
      }
    },
    [leadCompanyId]
  );

  useEffect(() => {
    reloadTimeline(false);
  }, [reloadTimeline]);

  const name = deal?.name || 'Deal';
  const stageUpper = (deal?.stage || '—').toString().toUpperCase();
  const subtitle = deal
    ? `${formatCurrency(deal.value)} • ${stageUpper} deal`
    : undefined;

  const probability = Math.min(100, Math.max(0, Number(deal?.probability) || 0));
  const dClose = daysToClose(deal?.expectedCloseDate);

  const dealHealthVisual = useMemo(() => {
    const p = probability;
    if (p >= 80)
      return {
        barClass: 'bg-emerald-500',
        accentClass: 'text-emerald-600',
        chipClass: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
        summary: 'Strong outlook',
      };
    if (p >= 60)
      return {
        barClass: 'bg-lime-500',
        accentClass: 'text-lime-700',
        chipClass: 'bg-lime-50 text-lime-900 ring-lime-200',
        summary: 'On track',
      };
    if (p >= 40)
      return {
        barClass: 'bg-amber-500',
        accentClass: 'text-amber-700',
        chipClass: 'bg-amber-50 text-amber-900 ring-amber-200',
        summary: 'Needs attention',
      };
    return {
      barClass: 'bg-red-500',
      accentClass: 'text-red-600',
      chipClass: 'bg-red-50 text-red-800 ring-red-200',
      summary: 'At risk',
    };
  }, [probability]);

  const activityCount = crmTimeline.length;

  const lastActivityDisplay = useMemo(() => {
    if (!deal) return '—';
    const latest = crmTimeline?.[0]?.createdAt;
    if (latest) {
      const rel = formatRelativeTime(latest);
      return rel || formatDate(latest);
    }
    if (deal.updatedAt) {
      const rel = formatRelativeTime(deal.updatedAt);
      if (rel) return `Updated ${rel}`;
      return `Updated ${formatDate(deal.updatedAt)}`;
    }
    return 'No recent activity';
  }, [deal, crmTimeline]);

  const stageSelectOptions = useMemo(() => {
    const raw = dealInfoDraft?.stage?.trim().toLowerCase();
    if (!raw) return DEAL_STAGE_OPTIONS;
    if (DEAL_STAGE_OPTIONS.some((o) => o.value === raw)) return DEAL_STAGE_OPTIONS;
    return [{ value: raw, label: stageLabel(raw) }, ...DEAL_STAGE_OPTIONS];
  }, [dealInfoDraft?.stage]);

  const prioritySelectOptions = useMemo(() => {
    const raw = dealInfoDraft?.priority?.trim().toLowerCase();
    if (!raw) return PRIORITY_OPTIONS;
    if (PRIORITY_OPTIONS.some((o) => o.value === raw)) return PRIORITY_OPTIONS;
    return [{ value: raw, label: priorityLabel(raw) }, ...PRIORITY_OPTIONS];
  }, [dealInfoDraft?.priority]);

  const openDealInfoEdit = () => {
    if (!canEditDeal) return;
    if (!deal) return;
    setDealInfoDraft({
      name: deal.name ?? '',
      stage: String(deal.stage ?? 'discovery').toLowerCase(),
      priority: String(deal.priority ?? 'medium').toLowerCase(),
      expectedCloseDate: deal.expectedCloseDate ? String(deal.expectedCloseDate).slice(0, 10) : '',
      description: deal.description ?? '',
    });
    setDealInfoSaveError('');
    setEditingDealInfo(true);
  };

  const cancelDealInfoEdit = () => {
    setEditingDealInfo(false);
    setDealInfoDraft(null);
    setDealInfoSaveError('');
  };

  const setDealInfoField = (field, value) => {
    setDealInfoDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const saveDealInfo = async () => {
    if (!id || !dealInfoDraft) return;
    if (!canEditDeal) return;
    const name = dealInfoDraft.name.trim();
    if (!name) {
      setDealInfoSaveError('Deal name is required.');
      return;
    }
    setSavingDealInfo(true);
    setDealInfoSaveError('');
    try {
      const payload = {
        name,
        stage: dealInfoDraft.stage,
        priority: dealInfoDraft.priority,
        expectedCloseDate: dealInfoDraft.expectedCloseDate?.trim() || null,
        description: dealInfoDraft.description?.trim() ?? '',
      };
      const res = await dealService.update(id, payload);
      if (res?.data) {
        setDeal((prev) => {
          if (!prev) return res.data;
          const merged = { ...prev, ...res.data };
          for (const key of ['leadCompany', 'clientAccount', 'contact', 'assignedTo']) {
            const incoming = res.data[key];
            if (incoming != null && typeof incoming === 'object') merged[key] = incoming;
            else if (prev[key] && typeof prev[key] === 'object') merged[key] = prev[key];
          }
          return merged;
        });
      }
      setEditingDealInfo(false);
      setDealInfoDraft(null);
    } catch (e) {
      setDealInfoSaveError(e?.message || 'Could not save deal details.');
    } finally {
      setSavingDealInfo(false);
    }
  };

  const dealPrimaryContactIdStr = useMemo(() => {
    const c = deal?.contact;
    if (!c || typeof c !== 'object') return '';
    return String(c.id ?? c.documentId ?? '');
  }, [deal?.contact]);

  const dealCompanyEntityForContact = useMemo(() => {
    if (deal?.clientAccount && typeof deal.clientAccount === 'object') return deal.clientAccount;
    if (deal?.leadCompany && typeof deal.leadCompany === 'object') return deal.leadCompany;
    return null;
  }, [deal]);

  const canAddDealContacts = canEditDeal && Boolean(leadCompanyId || clientAccountId);

  const closeDealAddContactModal = () => {
    if (dealAddContactSubmitting) return;
    setDealAddContactOpen(false);
    setDealAddContactForm({ ...initialDealAddContactForm });
    setDealAddContactErrors({});
  };

  const openDealAddContactModal = () => {
    if (!canEditDeal) return;
    setDealAddContactForm({ ...initialDealAddContactForm });
    setDealAddContactErrors({});
    setDealAddContactOpen(true);
  };

  const setDealAddContactField = (field, value) => {
    setDealAddContactForm((prev) => ({ ...prev, [field]: value }));
    setDealAddContactErrors((prev) => {
      if (!prev[field] && !prev.submit) return prev;
      const next = { ...prev, submit: null };
      if (prev[field]) next[field] = null;
      return next;
    });
  };

  const validateDealAddContact = () => {
    const next = {};
    if (!dealAddContactForm.firstName.trim()) next.firstName = 'First name is required';
    if (!dealAddContactForm.lastName.trim()) next.lastName = 'Last name is required';
    if (!dealAddContactForm.email.trim()) {
      next.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(dealAddContactForm.email.trim())) {
      next.email = 'Please enter a valid email address';
    }
    setDealAddContactErrors(next);
    return Object.keys(next).length === 0;
  };

  const submitDealAddContact = async (e) => {
    e.preventDefault();
    if (!deal || !id) return;
    if (!canEditDeal) return;
    if (!canAddDealContacts) return;
    if (!validateDealAddContact()) return;
    setDealAddContactSubmitting(true);
    setDealAddContactErrors((prev) => ({ ...prev, submit: null }));
    try {
      const payload = {
        firstName: dealAddContactForm.firstName.trim(),
        lastName: dealAddContactForm.lastName.trim(),
        email: dealAddContactForm.email.trim(),
        status: 'ACTIVE',
        source: leadCompanyId ? 'LEAD_COMPANY' : 'OTHER',
        contactRole: (dealAddContactForm.contactRole || 'TECHNICAL_CONTACT').trim(),
        isPrimaryContact: dealAddContactForm.contactRole === 'PRIMARY_CONTACT',
        companyName: (dealCompanyEntityForContact?.companyName || dealCompanyEntityForContact?.name || '').trim(),
      };
      if (dealAddContactForm.phone.trim()) payload.phone = dealAddContactForm.phone.trim();
      if (dealAddContactForm.jobTitle.trim()) payload.jobTitle = dealAddContactForm.jobTitle.trim();
      if (dealAddContactForm.department.trim()) payload.department = dealAddContactForm.department.trim();

      if (leadCompanyId) {
        const n = parseInt(leadCompanyId, 10);
        payload.leadCompany = Number.isNaN(n) ? leadCompanyId : n;
      } else if (clientAccountId) {
        const n = parseInt(clientAccountId, 10);
        payload.clientAccount = Number.isNaN(n) ? clientAccountId : n;
      }

      const ownerId =
        deal?.assignedTo && typeof deal.assignedTo === 'object' ? deal.assignedTo.id : deal?.assignedTo;
      if (ownerId != null && String(ownerId).trim() !== '') {
        const n = parseInt(String(ownerId), 10);
        if (!Number.isNaN(n)) payload.assignedTo = n;
      }

      await contactService.create(payload);
      setDealAddContactOpen(false);
      setDealAddContactForm({ ...initialDealAddContactForm });
      setDealAddContactErrors({});
      await loadDealContacts();
      if (leadCompanyId) {
        setCrmTimelineLoading(true);
        try {
          const { data } = await fetchActivityTimeline({ leadCompanyId, limit: 50 });
          setCrmTimeline(Array.isArray(data) ? data : []);
        } catch {
          /* keep existing timeline */
        } finally {
          setCrmTimelineLoading(false);
        }
      }
    } catch (err) {
      setDealAddContactErrors({
        submit: err?.message || 'Failed to add contact. Please try again.',
      });
    } finally {
      setDealAddContactSubmitting(false);
    }
  };

  const dealContactsColumns = useMemo(
    () => [
      {
        key: 'contact',
        label: 'CONTACT',
        render: (_, contact) => (
          <div className="flex min-w-[200px] items-center gap-3">
            <Avatar
              fallback={contactInitials(contact)}
              alt={contactDisplayName(contact)}
              size="sm"
              className="flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="truncate font-semibold text-gray-900">{contactDisplayName(contact)}</div>
              <div className="truncate text-sm text-gray-500">
                {contact.jobTitle ||
                  (contact.contactRole ? humanizeToken(contact.contactRole) : '') ||
                  '—'}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'contact-info',
        label: 'CONTACT INFO',
        render: (_, contact) => (
          <div className="min-w-[220px] space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <Mail className="h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden />
              <span className="truncate">{contact.email || 'No email'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Phone className="h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden />
              <span className="truncate">{contact.phone || 'No phone'}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'role',
        label: 'ROLE',
        render: (_, contact) => {
          if (dealPrimaryContactIdStr && String(contact.id) === dealPrimaryContactIdStr) {
            return (
              <Badge variant="success" className="whitespace-nowrap font-medium">
                DEAL CONTACT
              </Badge>
            );
          }
          if (contact.isPrimaryContact) {
            return (
              <Badge variant="success" className="whitespace-nowrap font-medium">
                PRIMARY CONTACT
              </Badge>
            );
          }
          if (contact.contactRole?.trim()) {
            return (
              <span className="inline-flex rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-gray-700">
                {contact.contactRole.trim()}
              </span>
            );
          }
          return <span className="text-sm text-gray-400">—</span>;
        },
      },
      {
        key: 'owner',
        label: 'OWNER',
        render: (_, contact) => {
          const u = contact.assignedTo;
          const ownerLabel = assigneeName(u);
          return (
            <div className="flex min-w-[180px] items-center gap-2">
              <Avatar
                fallback={assigneeInitials(u)}
                alt={ownerLabel}
                size="sm"
                className="flex-shrink-0 bg-gray-600"
              />
              <span className="truncate font-semibold text-gray-900">{ownerLabel}</span>
              <User className="h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden />
            </div>
          );
        },
      },
      {
        key: 'createdAt',
        label: 'CREATED',
        render: (_, contact) => (
          <div className="min-w-[130px]">
            <div className="whitespace-nowrap text-sm font-medium text-gray-900">
              {formatDate(contact.createdAt)}
            </div>
            <div className="text-sm text-gray-500">{formatRelativeTime(contact.createdAt) || '—'}</div>
          </div>
        ),
      },
      {
        key: 'status',
        label: 'STATUS',
        render: (_, contact) => {
          const s = (contact.status || 'ACTIVE').toString().toUpperCase();
          const isActive = s === 'ACTIVE';
          return (
            <span
              className={`inline-flex rounded-lg border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                isActive
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-300 bg-gray-50 text-gray-700'
              }`}
            >
              {s}
            </span>
          );
        },
      },
      {
        key: 'actions',
        label: 'ACTIONS',
        render: (_, contact) => (
          <div className="flex min-w-[148px] items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="p-2 text-teal-600 hover:bg-teal-50"
              title="More options"
              onClick={(e) => {
                e.stopPropagation();
                const r = e.currentTarget.getBoundingClientRect();
                setDealContactActionMenu((prev) =>
                  String(prev?.id) === String(contact.id)
                    ? null
                    : { id: contact.id, top: r.bottom + 4, left: r.left, triggerEl: e.currentTarget }
                );
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="p-2 text-slate-700 hover:bg-slate-100"
              title="View"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/sales/contacts/${contact.id}`);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="p-2 text-emerald-600 hover:bg-emerald-50"
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/sales/contacts/${contact.id}/edit`);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="p-2 text-orange-600 hover:bg-orange-50 disabled:opacity-40"
              title="Send mail"
              disabled={!contact.email}
              onClick={(e) => {
                e.stopPropagation();
                if (contact.email) {
                  window.location.href = `mailto:${encodeURIComponent(contact.email)}`;
                }
              }}
            >
              <Mail className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [router, dealPrimaryContactIdStr]
  );

  const detailTabs = useMemo(
    () => [
      { key: 'overview', label: 'Overview' },
      { key: 'contacts', label: 'Contacts', badge: dealLinkedContacts.length || undefined },
      { key: 'meetings', label: 'Meetings', badge: dealMeetingsCount || undefined },
      { key: 'products', label: 'Products' },
      { key: 'documents', label: 'Documents' },
      { key: 'activities', label: 'Activities' },
    ],
    [dealLinkedContacts.length, dealMeetingsCount]
  );

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) await navigator.share({ title: name, url });
      else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
  };

  const handleDownload = () => {
    if (!deal || typeof window === 'undefined') return;
    const blob = new Blob([JSON.stringify(deal, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `deal-${deal.id || id}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const lc = deal?.leadCompany;
  const ca = deal?.clientAccount;
  const ct = deal?.contact;
  const leadCompanyHref =
    lc && typeof lc === 'object' && (lc.id ?? lc.documentId) != null
      ? `/sales/lead-companies/${lc.id ?? lc.documentId}`
      : null;
  const clientAccountHref =
    ca && typeof ca === 'object' && (ca.id ?? ca.documentId) != null
      ? `/clients/accounts/${ca.id ?? ca.documentId}`
      : null;
  const contactHref =
    ct && typeof ct === 'object' && (ct.id ?? ct.documentId) != null
      ? `/sales/contacts/${ct.id ?? ct.documentId}`
      : null;

  const companyEntity =
    ca && typeof ca === 'object' ? ca : lc && typeof lc === 'object' ? lc : null;
  const companyKind = ca && typeof ca === 'object' ? 'client' : 'lead';
  const companyAddressLines = companyEntity ? formatAddressLines(companyEntity) : null;
  const contactAddressLines = ct && typeof ct === 'object' ? formatAddressLines(ct) : null;
  const ownerEmail = assigneeEmailLine(deal?.assignedTo);

  const sortedDealTasks = useMemo(() => {
    const terminal = new Set(['COMPLETED', 'CANCELLED']);
    const open = dealTasks.filter((t) => t && !terminal.has(t.status));
    const done = dealTasks.filter((t) => t && terminal.has(t.status));
    return [...open, ...done];
  }, [dealTasks]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <CRMPageHeader
        title={loading ? 'Loading…' : name}
        subtitle={subtitle}
        breadcrumb={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sales', href: '/sales' },
          { label: 'Deals', href: '/sales/deals' },
          { label: name, href: id ? `/sales/deals/${id}` : '/sales/deals' },
        ]}
        showProfile
      >
        <div className="flex flex-wrap items-center justify-end gap-2">
          {canEditDeal ? (
            <Link href={id ? `/sales/deals/${id}/edit` : '#'} className={headerIconBtnClass} title="Edit">
              <Edit className="h-5 w-5" />
            </Link>
          ) : null}
          <button type="button" className={headerIconBtnClass} title="Share" onClick={handleShare}>
            <Share2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            className={headerIconBtnClass}
            title="Download"
            onClick={handleDownload}
            disabled={!deal}
          >
            <Download className="h-5 w-5" />
          </button>
        </div>
      </CRMPageHeader>

      {loading ? (
        <Card variant="elevated" className="flex justify-center p-12">
          <LoadingSpinner message="Loading deal…" />
        </Card>
      ) : !deal ? (
        <Card variant="elevated" className="p-12 text-center">
          <p className="text-gray-600">Deal not found.</p>
          <Link href="/sales/deals" className="mt-4 inline-block">
            <Button variant="primary">Back to deals</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              compact
              title="Stage"
              value={stageLabel(deal.stage)}
              icon={dealStageKpiIcon(deal.stage)}
              colorScheme={dealStageKpiColorScheme(deal.stage)}
              className={dealStageKpiCardClass(deal.stage)}
            />
            <KPICard
              compact
              title="Value"
              value={formatCurrency(deal.value)}
              icon={IndianRupee}
              colorScheme="orange"
            />
            <KPICard
              compact
              title="Probability"
              value={`${probability}%`}
              icon={BarChart3}
              colorScheme="orange"
            />
            <KPICard compact title="Created" value={formatDate(deal.createdAt)} icon={Calendar} colorScheme="orange" />
          </div>

          <TabsWithActions variant="pill" tabs={detailTabs} activeTab={detailTab} onTabChange={setDetailTab} />

          {detailTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <Card variant="elevated" className="rounded-xl p-6">
                  <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                      <h2 className="text-xl font-semibold text-gray-900" id="deal-info-heading">
                        Deal information
                      </h2>
                      <p className="mt-1.5 text-base text-gray-600">
                        Pipeline stage, priority, and close date. Use edit to update without leaving this page.
                      </p>
                    </div>
                    {!editingDealInfo ? (
                      <div
                        className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-start sm:justify-end sm:gap-2.5"
                        role="group"
                        aria-label="Pipeline stage"
                      >
                        <DealStageHeaderPill stage={deal.stage} />
                      </div>
                    ) : null}
                  </header>

                  {editingDealInfo && dealInfoDraft ? (
                    <div
                      className="space-y-4"
                      role="region"
                      aria-labelledby="deal-info-heading"
                      aria-describedby="deal-info-edit-hint"
                    >
                      <p id="deal-info-edit-hint" className="sr-only">
                        Editing deal summary and pipeline fields. Save to apply or cancel to discard.
                      </p>
                      <Input
                        label="Deal name"
                        value={dealInfoDraft.name}
                        onChange={(e) => setDealInfoField('name', e.target.value)}
                        required
                        autoComplete="off"
                      />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Select
                          label="Stage"
                          value={dealInfoDraft.stage}
                          onChange={(v) => setDealInfoField('stage', v)}
                          options={stageSelectOptions}
                          placeholder="Select stage"
                          icon={Target}
                        />
                        <Select
                          label="Priority"
                          value={dealInfoDraft.priority}
                          onChange={(v) => setDealInfoField('priority', v)}
                          options={prioritySelectOptions}
                          placeholder="Select priority"
                          icon={BarChart3}
                        />
                        <Input
                          label="Expected close"
                          type="date"
                          value={dealInfoDraft.expectedCloseDate}
                          onChange={(e) => setDealInfoField('expectedCloseDate', e.target.value)}
                          icon={Calendar}
                        />
                      </div>
                      <Textarea
                        label="Description"
                        rows={4}
                        value={dealInfoDraft.description}
                        onChange={(e) => setDealInfoField('description', e.target.value)}
                        placeholder="Context for your team (optional)"
                      />
                      {dealInfoSaveError ? (
                        <p className="text-sm text-red-600" role="alert">
                          {dealInfoSaveError}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap items-center justify-center gap-3 border-t border-gray-100 pt-4">
                        <Button
                          type="button"
                          variant="primary"
                          disabled={savingDealInfo}
                          onClick={() => void saveDealInfo()}
                        >
                          {savingDealInfo ? 'Saving…' : 'Save changes'}
                        </Button>
                        <Button type="button" variant="secondary" disabled={savingDealInfo} onClick={cancelDealInfoEdit}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <InfoSection title="Deal summary" icon={Target} isFirst>
                        <InfoRow label="Deal name" icon={Target} bodyClassName="mt-2.5">
                          <p
                            className={`mb-6 text-2xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-3xl ${!(deal.name || '').trim() ? 'font-normal text-gray-400' : ''
                              }`}
                          >
                            {(deal.name || '').trim() || '—'}
                          </p>
                        </InfoRow>
                      </InfoSection>

                      <InfoSection title="Pipeline" icon={BarChart3}>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                          <InfoRow label="Priority" icon={BarChart3}>
                            <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-900 ring-1 ring-orange-200">
                              {priorityLabel(deal.priority)}
                            </span>
                          </InfoRow>
                          <InfoRow
                            label="Expected close"
                            value={formatDate(deal.expectedCloseDate)}
                            icon={Calendar}
                          />
                        </div>
                      </InfoSection>

                      <section className="border-t border-gray-100 pt-4">
                        <div className="mb-2 flex items-center gap-2">
                          <Target className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600">Description</h3>
                        </div>
                        {isPresent(deal.description) ? (
                          <p className="mt-2.5 whitespace-pre-wrap text-base font-normal leading-relaxed text-gray-800">
                            {deal.description}
                          </p>
                        ) : (
                          <p className="mt-2.5 text-base text-gray-500">No description yet.</p>
                        )}
                      </section>

                      {canEditDeal ? (
                        <p className="mt-4 border-t border-gray-100 pt-3 text-center text-sm text-gray-600">
                          <button
                            type="button"
                            onClick={openDealInfoEdit}
                            className="font-semibold text-orange-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                          >
                            Edit deal details
                          </button>
                          <span className="mx-2 text-gray-300" aria-hidden>
                            ·
                          </span>
                          <Link
                            href={id ? `/sales/deals/${id}/edit` : '#'}
                            className="font-medium text-gray-600 underline-offset-2 hover:text-orange-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                          >
                            Full edit page
                          </Link>
                        </p>
                      ) : null}
                    </>
                  )}
                </Card>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Card variant="elevated" className="flex h-full min-h-0 flex-col rounded-xl p-6">
                    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <Building2 className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
                        <h2 className="text-lg font-semibold text-gray-900">Company</h2>
                      </div>
                      <div className="flex shrink-0 flex-wrap justify-end gap-2">
                        {leadCompanyHref ? (
                          <Link href={leadCompanyHref}>
                            <Button variant="outline" size="sm" className={outlineAccentBtnClass}>
                              View lead company
                              <ExternalLink className="ml-2 inline h-3.5 w-3.5" aria-hidden />
                            </Button>
                          </Link>
                        ) : null}
                        {clientAccountHref ? (
                          <Link href={clientAccountHref}>
                            <Button variant="outline" size="sm" className={outlineAccentBtnClass}>
                              View client account
                              <ExternalLink className="ml-2 inline h-3.5 w-3.5" aria-hidden />
                            </Button>
                          </Link>
                        ) : null}
                      </div>
                    </header>

                    {companyEntity ? (
                      <>
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-gray-100 pb-4">
                          <p className="text-lg font-semibold text-gray-900">{companyLine(deal)}</p>
                          {ca ? (
                            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-800 ring-1 ring-sky-200">
                              Client
                            </span>
                          ) : lc ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
                              Lead
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-1 flex-1 space-y-0">
                          {isPresent(companyEntity.industry) ? (
                            <SidebarDetailRow label="Industry">{companyEntity.industry}</SidebarDetailRow>
                          ) : null}
                          {isPresent(companyEntity.type) && (
                            <SidebarDetailRow label="Type">{companyEntity.type}</SidebarDetailRow>
                          )}
                          {isPresent(companyEntity.website) ? (
                            <SidebarDetailRow label="Website">
                              <a
                                href={websiteHref(companyEntity.website)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 break-all text-orange-700 hover:underline"
                              >
                                <Globe className="h-3.5 w-3.5 shrink-0 text-orange-600" aria-hidden />
                                {String(companyEntity.website).replace(/^https?:\/\//i, '')}
                              </a>
                            </SidebarDetailRow>
                          ) : null}
                          {isPresent(companyEntity.phone) ? (
                            <SidebarDetailRow label="Phone">
                              <a
                                href={`tel:${String(companyEntity.phone).replace(/\s/g, '')}`}
                                className="inline-flex items-center gap-1.5 text-orange-700 hover:underline"
                              >
                                <Phone className="h-3.5 w-3.5 shrink-0 text-orange-600" aria-hidden />
                                {companyEntity.phone}
                              </a>
                            </SidebarDetailRow>
                          ) : null}
                          {isPresent(companyEntity.email) ? (
                            <SidebarDetailRow label="Email">
                              <a
                                href={`mailto:${companyEntity.email}`}
                                className="inline-flex items-center gap-1.5 break-all text-orange-700 hover:underline"
                              >
                                <Mail className="h-3.5 w-3.5 shrink-0 text-orange-600" aria-hidden />
                                {companyEntity.email}
                              </a>
                            </SidebarDetailRow>
                          ) : null}
                          {companyAddressLines ? (
                            <SidebarDetailRow label="Location">
                              <span className="inline-flex items-start gap-1.5">
                                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                                <span className="whitespace-pre-line">{companyAddressLines.join('\n')}</span>
                              </span>
                            </SidebarDetailRow>
                          ) : null}
                          {isPresent(companyEntity.employees) ? (
                            <SidebarDetailRow label="Employees">{companyEntity.employees}</SidebarDetailRow>
                          ) : null}
                          {companyKind === 'lead' && isPresent(companyEntity.status) ? (
                            <SidebarDetailRow label="Status">{humanizeToken(companyEntity.status)}</SidebarDetailRow>
                          ) : null}
                          {companyKind === 'lead' && isPresent(companyEntity.segment) ? (
                            <SidebarDetailRow label="Segment">{humanizeToken(companyEntity.segment)}</SidebarDetailRow>
                          ) : null}
                          {companyKind === 'lead' && companyEntity.score != null && companyEntity.score !== '' ? (
                            <SidebarDetailRow label="Score">{String(companyEntity.score)}</SidebarDetailRow>
                          ) : null}
                          {companyKind === 'client' && isPresent(companyEntity.status) ? (
                            <SidebarDetailRow label="Status">{humanizeToken(companyEntity.status)}</SidebarDetailRow>
                          ) : null}
                          {companyKind === 'client' && isPresent(companyEntity.accountType) ? (
                            <SidebarDetailRow label="Account">{humanizeToken(companyEntity.accountType)}</SidebarDetailRow>
                          ) : null}
                          {isPresent(companyEntity.linkedIn) ? (
                            <SidebarDetailRow label="LinkedIn">
                              <a
                                href={websiteHref(companyEntity.linkedIn)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-orange-700 hover:underline"
                              >
                                <Linkedin className="h-3.5 w-3.5 shrink-0 text-orange-600" aria-hidden />
                                Profile
                              </a>
                            </SidebarDetailRow>
                          ) : null}
                        </div>

                        {isPresent(companyEntity.description) ? (
                          <div className="mt-4 border-t border-gray-100 pt-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">About</p>
                            <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-gray-700">
                              {companyEntity.description}
                            </p>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No company linked to this deal.</p>
                    )}
                  </Card>

                  <Card variant="elevated" className="flex h-full min-h-0 flex-col rounded-xl p-6">
                    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <User className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
                        <h2 className="text-lg font-semibold text-gray-900">Primary contact</h2>
                      </div>
                      {contactHref ? (
                        <Link href={contactHref} className="shrink-0">
                          <Button variant="outline" size="sm" className={outlineAccentBtnClass}>
                            View contact
                            <ExternalLink className="ml-2 inline h-3.5 w-3.5" aria-hidden />
                          </Button>
                        </Link>
                      ) : null}
                    </header>

                    {ct && typeof ct === 'object' ? (
                      <>
                        <div className="flex gap-4 border-b border-gray-100 pb-4">
                          <Avatar
                            fallback={assigneeInitials(ct)}
                            alt={contactDisplayName(ct)}
                            size="lg"
                            className="shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-lg font-semibold text-gray-900">{contactDisplayName(ct) || '—'}</p>
                            {isPresent(ct.jobTitle) ? (
                              <p className="mt-0.5 text-sm text-gray-600">{ct.jobTitle}</p>
                            ) : null}
                            {isPresent(ct.email) ? (
                              <a
                                href={`mailto:${ct.email}`}
                                className="mt-2 inline-flex max-w-full items-center gap-1.5 break-all text-sm font-medium text-orange-700 hover:underline"
                              >
                                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                {ct.email}
                              </a>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-1 space-y-0">
                          {isPresent(ct.phone) ? (
                            <SidebarDetailRow label="Phone">
                              <a
                                href={`tel:${String(ct.phone).replace(/\s/g, '')}`}
                                className="inline-flex items-center gap-1.5 text-orange-700 hover:underline"
                              >
                                <Phone className="h-3.5 w-3.5 shrink-0 text-orange-600" aria-hidden />
                                {ct.phone}
                              </a>
                            </SidebarDetailRow>
                          ) : null}
                          {isPresent(ct.department) ? (
                            <SidebarDetailRow label="Department">{ct.department}</SidebarDetailRow>
                          ) : null}
                          {isPresent(ct.contactRole) ? (
                            <SidebarDetailRow label="Role">{ct.contactRole}</SidebarDetailRow>
                          ) : null}
                          {isPresent(ct.preferredContactMethod) ? (
                            <SidebarDetailRow label="Prefers">
                              {humanizeToken(ct.preferredContactMethod)}
                            </SidebarDetailRow>
                          ) : null}
                          {isPresent(ct.status) ? (
                            <SidebarDetailRow label="Status">{humanizeToken(ct.status)}</SidebarDetailRow>
                          ) : null}
                          {isPresent(ct.source) ? (
                            <SidebarDetailRow label="Source">{humanizeToken(ct.source)}</SidebarDetailRow>
                          ) : null}
                          {contactAddressLines ? (
                            <SidebarDetailRow label="Location">
                              <span className="inline-flex items-start gap-1.5">
                                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                                <span className="whitespace-pre-line">{contactAddressLines.join('\n')}</span>
                              </span>
                            </SidebarDetailRow>
                          ) : null}
                          {isPresent(ct.companyName) ? (
                            <SidebarDetailRow label="Company">{ct.companyName}</SidebarDetailRow>
                          ) : null}
                          {isPresent(ct.companyWebsite) ? (
                            <SidebarDetailRow label="Co. website">
                              <a
                                href={websiteHref(ct.companyWebsite)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 break-all text-orange-700 hover:underline"
                              >
                                <Globe className="h-3.5 w-3.5 shrink-0 text-orange-600" aria-hidden />
                                {String(ct.companyWebsite).replace(/^https?:\/\//i, '')}
                              </a>
                            </SidebarDetailRow>
                          ) : null}
                          {isPresent(ct.linkedIn) ? (
                            <SidebarDetailRow label="LinkedIn">
                              <a
                                href={websiteHref(ct.linkedIn)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-orange-700 hover:underline"
                              >
                                <Linkedin className="h-3.5 w-3.5 shrink-0 text-orange-600" aria-hidden />
                                Profile
                              </a>
                            </SidebarDetailRow>
                          ) : null}
                          {isPresent(ct.twitter) ? (
                            <SidebarDetailRow label="Twitter">
                              <a
                                href={twitterHref(ct.twitter)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex break-all text-orange-700 hover:underline"
                              >
                                {ct.twitter}
                              </a>
                            </SidebarDetailRow>
                          ) : null}
                        </div>

                        {isPresent(ct.notes) ? (
                          <div className="mt-4 border-t border-gray-100 pt-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Notes</p>
                            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-700">{ct.notes}</p>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No primary contact linked.</p>
                    )}
                  </Card>
                </div>
              </div>

              <div className="space-y-4">
                <Card variant="elevated" className="rounded-xl">
                  <h2 className="mb-3 text-xl font-semibold text-gray-900">Deal owner</h2>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar
                        fallback={assigneeInitials(deal.assignedTo)}
                        alt={assigneeName(deal.assignedTo)}
                        size="lg"
                        className="!bg-brand-primary font-semibold text-white shadow-sm ring-2 ring-brand-primary/25"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-gray-900">
                          {assigneeName(deal.assignedTo)}
                        </p>
                        <p className="text-sm text-gray-500">{assigneeRole(deal.assignedTo)}</p>
                        {ownerEmail ? (
                          <a
                            href={`mailto:${ownerEmail}`}
                            className="mt-0.5 flex items-center gap-1 text-sm text-gray-600 hover:text-orange-700 hover:underline"
                          >
                            <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                            <span className="truncate">{ownerEmail}</span>
                          </a>
                        ) : null}
                      </div>
                    </div>
                    {canManageDeals ? (
                      <Button
                        as={Link}
                        href={id ? `/sales/deals/${id}/edit` : '#'}
                        variant="outline"
                        size="sm"
                        className="w-full shrink-0 gap-2 !border-gray-300 bg-white !text-gray-700 shadow-sm hover:bg-gray-50 hover:!text-gray-900 sm:w-auto"
                      >
                        <User className="h-4 w-4 shrink-0 text-gray-600" strokeWidth={1.75} aria-hidden />
                        Change assignee
                      </Button>
                    ) : null}
                  </div>
                </Card>

                <Card variant="elevated" className="rounded-xl">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                    <h2 className="text-xl font-semibold text-gray-900">Deal health</h2>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${dealHealthVisual.chipClass}`}
                    >
                      {dealHealthVisual.summary}
                    </span>
                  </div>

                  <div className="rounded-xl bg-gradient-to-br from-slate-50 to-gray-50/90 p-4 ring-1 ring-gray-100">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-stretch sm:gap-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 sm:hidden">
                          Win probability
                        </p>
                        <div
                          className={`flex min-w-[5.5rem] flex-col items-center justify-center rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-100/80 ${dealHealthVisual.accentClass}`}
                        >
                          <span className="text-3xl font-bold tabular-nums leading-none">{probability}%</span>
                          <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Probability
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="hidden text-xs font-medium uppercase tracking-wide text-gray-500 sm:block">
                          Win probability
                        </p>
                        <p className="mt-0 text-sm text-gray-600 sm:mt-1">
                          Based on the win probability set for this deal. Update it in deal details or the full edit
                          page.
                        </p>
                        <div
                          className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/90 shadow-inner ring-1 ring-gray-100/80"
                          role="progressbar"
                          aria-valuenow={probability}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label="Win probability"
                        >
                          <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${dealHealthVisual.barClass}`}
                            style={{ width: `${probability}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-5">
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
                          <p className="text-xs font-medium text-gray-500">Total activities</p>
                          <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900">{activityCount}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-5">
                      <h3 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                        Pipeline & record
                      </h3>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="rounded-lg border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
                          <p className="text-xs font-medium text-gray-500">Created</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(deal.createdAt)}</p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
                          <p className="text-xs font-medium text-gray-500">Expected close</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            {formatDate(deal.expectedCloseDate)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
                          <p className="text-xs font-medium text-gray-500">Stage</p>
                          <div className="mt-1.5">
                            <Badge
                              variant="primary"
                              className="border border-orange-200 bg-orange-50 text-orange-800"
                            >
                              {stageLabel(deal.stage)}
                            </Badge>
                          </div>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
                          <p className="text-xs font-medium text-gray-500">Days to close</p>
                          <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900">
                            {dClose == null ? '—' : dClose}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card variant="elevated" className="rounded-xl p-6">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Next steps</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Tasks linked to this deal and company when the deal was created.
                      </p>
                    </div>
                    <Link
                      href="/clients/tasks"
                      className="shrink-0 text-sm font-semibold text-orange-700 hover:underline"
                    >
                      My tasks
                    </Link>
                  </div>
                  {dealTasksLoading ? (
                    <div className="flex justify-center py-10">
                      <LoadingSpinner message="Loading tasks…" />
                    </div>
                  ) : sortedDealTasks.length === 0 ? (
                    <EmptyState
                      icon={Clock}
                      title="No tasks yet"
                      description="Tasks are created automatically when a new deal is saved. Older deals may not have them—create tasks from My tasks if needed."
                    />
                  ) : (
                    <ul className="divide-y divide-gray-100" role="list">
                      {sortedDealTasks.map((t) => {
                        const done = t.status === 'COMPLETED' || t.status === 'CANCELLED';
                        return (
                          <li key={t.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                            <Clock
                              className={`mt-0.5 h-5 w-5 shrink-0 ${done ? 'text-gray-300' : 'text-orange-500'}`}
                              aria-hidden
                            />
                            <div className="min-w-0 flex-1">
                              <p
                                className={`font-medium leading-snug text-gray-900 ${done ? 'text-gray-500 line-through' : ''}`}
                              >
                                {t.name || 'Task'}
                              </p>
                              {isPresent(t.description) ? (
                                <p className="mt-1 line-clamp-2 text-sm text-gray-600">{t.description}</p>
                              ) : null}
                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                <span
                                  className={`rounded-md px-2 py-0.5 font-medium ring-1 ring-inset ${
                                    done
                                      ? 'bg-gray-50 text-gray-600 ring-gray-200'
                                      : 'bg-orange-50 text-orange-900 ring-orange-200/80'
                                  }`}
                                >
                                  {taskStatusLabel(t.status)}
                                </span>
                                {t.priority ? (
                                  <span className="capitalize">Priority: {t.priority}</span>
                                ) : null}
                                {t.scheduledDate ? (
                                  <span>Due {formatDate(t.scheduledDate)}</span>
                                ) : null}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>
              </div>
            </div>
          )}

          {detailTab === 'contacts' && (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-h-[1.25rem] text-sm text-gray-600">
                  {dealContactsLoading ? (
                    <span className="text-gray-400">Loading contacts…</span>
                  ) : (
                    <>
                      Showing{' '}
                      <span className="font-semibold text-gray-900">{dealLinkedContacts.length}</span> result
                      {dealLinkedContacts.length !== 1 ? 's' : ''}
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={openDealAddContactModal}
                  disabled={!canAddDealContacts}
                  className={`inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity sm:w-auto ${canAddDealContacts ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-95' : 'cursor-not-allowed bg-gray-300 opacity-70'}`}
                >
                  <Plus className="h-4 w-4 shrink-0" aria-hidden />
                  Add Contact
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {dealContactsLoading ? (
                  <div className="flex flex-col items-center justify-center p-12">
                    <LoadingSpinner size="lg" message="Loading contacts..." />
                  </div>
                ) : dealLinkedContacts.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      icon={Users}
                      title="No contacts yet"
                      description={
                        canAddDealContacts
                          ? 'Add a contact for this deal’s company, or manage them from the company record.'
                          : 'Link a lead company or client account to this deal to load and add contacts.'
                      }
                      action={
                        <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
                          {canAddDealContacts ? (
                            <Button
                              type="button"
                              onClick={openDealAddContactModal}
                              className="w-full border-0 bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md hover:opacity-95 sm:w-auto"
                            >
                              <Plus className="mr-2 inline h-4 w-4 shrink-0 align-text-bottom" aria-hidden />
                              Add contact
                            </Button>
                          ) : null}
                          {canEditDeal ? (
                            <Link href={id ? `/sales/deals/${id}/edit` : '#'} className="w-full sm:w-auto">
                              <Button type="button" variant="outline" className="w-full sm:w-auto">
                                Edit deal
                              </Button>
                            </Link>
                          ) : null}
                        </div>
                      }
                    />
                  </div>
                ) : (
                  <Table
                    columns={dealContactsColumns}
                    data={dealLinkedContacts}
                    keyField="id"
                    variant="modern"
                    onRowClick={(row) => router.push(`/sales/contacts/${row.id}`)}
                  />
                )}
              </div>
            </div>
          )}

          {detailTab === 'meetings' && (
            <Card variant="elevated" className="rounded-xl p-5">
              <MeetingsEmbedList
                fetchFn={() => meetingService.getByDeal(id)}
                scheduleHref={`/meetings/new?deal=${id}`}
                emptyTitle="No meetings for this deal"
                entityLabel="this deal"
              />
            </Card>
          )}

          {(detailTab === 'products' || detailTab === 'documents') && (
            <Card variant="elevated" className="rounded-xl p-10">
              <EmptyState
                icon={Briefcase}
                title="Coming soon"
                description="This section will be connected in a future update."
              />
            </Card>
          )}

          {detailTab === 'activities' && (
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
                      <span className="text-lg font-bold text-orange-900 tabular-nums">{activityCount}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                      <span className="text-xs font-medium text-gray-600">Last activity</span>
                      <span className="text-xs font-semibold text-gray-800">{lastActivityDisplay}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                      <span className="text-xs font-medium text-gray-600">Stage</span>
                      <span className="text-xs font-semibold text-gray-800 capitalize">{deal?.stage || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                      <span className="text-xs font-medium text-gray-600">Value</span>
                      <span className="text-xs font-semibold text-gray-800">{formatCurrency(deal?.value)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                      <span className="text-xs font-medium text-gray-600">Created</span>
                      <span className="text-xs font-semibold text-gray-800">{formatDate(deal?.createdAt)}</span>
                    </div>
                  </div>
                  {!leadCompanyId && (
                    <p className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                      Link a lead company to this deal to see related company activity.
                    </p>
                  )}
                </Card>
              </div>

              {/* Right: Activity + Chat panel */}
              <div className="lg:col-span-3">
                <EntityActivityPanel
                  entityType="deal"
                  entityId={deal?.id ?? id}
                  entityName={deal?.name || 'Deal'}
                  crmTimeline={crmTimeline}
                  crmTimelineLoading={crmTimelineLoading}
                  crmTimelineError={crmTimelineError}
                  activityCount={activityCount}
                  fetchCommentsFn={({ entityId }) =>
                    fetchDealComments({ dealId: entityId, limit: 80 })
                  }
                  addCommentFn={
                    canWriteDeals
                      ? ({ entityId, comment }) => addDealComment({ dealId: entityId, comment })
                      : null
                  }
                  fetchMentionUsers={fetchChatMentionUsers}
                />
              </div>
            </div>
          )}

          {dealContactActionMenu &&
            (() => {
              const row = dealLinkedContacts.find(
                (c) => String(c.id) === String(dealContactActionMenu.id)
              );
              if (!row) return null;
              return (
                <TableRowActionMenuPortal
                  open
                  anchor={{
                    top: dealContactActionMenu.top,
                    left: dealContactActionMenu.left,
                    triggerEl: dealContactActionMenu.triggerEl,
                  }}
                  onClose={() => setDealContactActionMenu(null)}
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                    onClick={() => {
                      setDealContactActionMenu(null);
                    }}
                  >
                    <Video className="h-4 w-4 shrink-0 text-teal-600" aria-hidden />
                    Create Meet
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                    onClick={() => {
                      setDealContactActionMenu(null);
                    }}
                  >
                    <ClipboardList className="h-4 w-4 shrink-0 text-teal-600" aria-hidden />
                    Create Task
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                    onClick={() => {
                      setDealContactActionMenu(null);
                      if (typeof window !== 'undefined') {
                        void navigator.clipboard?.writeText(`${window.location.origin}/sales/contacts/${row.id}`);
                      }
                    }}
                  >
                    <Link2 className="h-4 w-4 shrink-0 text-teal-600" aria-hidden />
                    Copy URL
                  </button>
                </TableRowActionMenuPortal>
              );
            })()}

          <Modal
            isOpen={dealAddContactOpen}
            onClose={closeDealAddContactModal}
            title="Add Contact"
            size="lg"
            closeOnBackdrop={!dealAddContactSubmitting}
          >
            <form onSubmit={submitDealAddContact} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  label="First Name"
                  required
                  value={dealAddContactForm.firstName}
                  onChange={(e) => setDealAddContactField('firstName', e.target.value)}
                  error={dealAddContactErrors.firstName}
                />
                <Input
                  label="Last Name"
                  required
                  value={dealAddContactForm.lastName}
                  onChange={(e) => setDealAddContactField('lastName', e.target.value)}
                  error={dealAddContactErrors.lastName}
                />
              </div>
              <Input
                label="Email"
                type="email"
                required
                value={dealAddContactForm.email}
                onChange={(e) => setDealAddContactField('email', e.target.value)}
                error={dealAddContactErrors.email}
              />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  label="Phone"
                  value={dealAddContactForm.phone}
                  onChange={(e) => setDealAddContactField('phone', e.target.value)}
                />
                <Input
                  label="Job Title"
                  value={dealAddContactForm.jobTitle}
                  onChange={(e) => setDealAddContactField('jobTitle', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  label="Department"
                  value={dealAddContactForm.department}
                  onChange={(e) => setDealAddContactField('department', e.target.value)}
                />
                <Select
                  label="Role"
                  placeholder="Select role"
                  options={dealAddContactRoleOptions}
                  value={dealAddContactForm.contactRole}
                  onChange={(value) => setDealAddContactField('contactRole', value)}
                />
              </div>
              {dealAddContactErrors.submit ? (
                <p className="text-center text-sm text-red-600">{dealAddContactErrors.submit}</p>
              ) : null}
              <div className="mt-1 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="muted"
                  disabled={dealAddContactSubmitting}
                  onClick={closeDealAddContactModal}
                  className="w-full rounded-xl border-[1.5px] border-gray-400 bg-gray-300 px-5 py-2.5 sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={dealAddContactSubmitting || !canAddDealContacts}
                  rounded="default"
                  className="w-full min-w-[8.5rem] rounded-xl border-0 bg-gradient-to-r from-orange-500 to-pink-500 py-2.5 font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-60 sm:w-auto"
                >
                  {dealAddContactSubmitting ? 'Adding…' : 'Add Contact'}
                </Button>
              </div>
            </form>
          </Modal>
        </>
      )}
    </div>
  );
}
