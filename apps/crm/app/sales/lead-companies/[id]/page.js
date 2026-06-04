'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Edit,
  Share2,
  Download,
  Globe,
  Phone,
  Mail,
  MapPin,
  Users,
  Briefcase,
  CheckCircle2,
  User,
  Star,
  Activity,
  FileText,
  Video,
  Building2,
  Layers,
  Calendar,
  AlignLeft,
  Target,
  Eye,
  Pencil,
  Plus,
  MoreHorizontal,
  ClipboardList,
  Link2,
} from 'lucide-react';
import {
  Button,
  Card,
  Badge,
  Avatar,
  TabsWithActions,
  EmptyState,
  LoadingSpinner,
  Table,
  Input,
  Textarea,
  Modal,
  Select,
  TableRowActionMenuPortal,
  ActivitiesTimeline,
  EntityActivityPanel,
  useIndustrySelectOptions,
  TableCellNextConnect,
} from '@webfudge/ui';
import CRMPageHeader from '../../../../components/CRMPageHeader';
import { InlineEditableNextConnect } from '../../../../components/InlineEditableNextConnect';
import leadCompanyService from '../../../../lib/api/leadCompanyService';
import contactService from '../../../../lib/api/contactService';
import dealService from '../../../../lib/api/dealService';
import proposalService from '../../../../lib/api/proposalService';
import { fetchActivityTimeline, fetchLeadCompanyComments, addLeadCompanyComment } from '../../../../lib/api/crmActivityService';
import strapiClient from '../../../../lib/strapiClient';
import { MeetingsEmbedList } from '@webfudge/ui';
import meetingService from '../../../../lib/api/meetingService';
import { fetchChatMentionUsers } from '../../../../lib/chatMentionUsers';
import {
  companyTypeSelectOptions,
  canonicalIndustryValue,
  canonicalCompanyTypeValue,
} from '@webfudge/utils';
import { fetchStoredIndustriesForCrm } from '../../../../lib/industryOptionsLoader';
import { canEditCRMRecord, canManageCRM } from '../../../../lib/rbac';

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
  return date.toLocaleDateString('en-US', {
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

function contactDisplayName(contact) {
  if (!contact) return 'Unnamed';
  if (contact.firstName && contact.lastName) return `${contact.firstName} ${contact.lastName}`;
  if (contact.name) return contact.name;
  return contact.email || 'Unnamed';
}

function contactInitials(contact) {
  const fn = contact?.firstName?.trim();
  const ln = contact?.lastName?.trim();
  if (fn && ln) return `${fn[0]}${ln[0]}`.toUpperCase();
  const name = contactDisplayName(contact);
  if (name && name.length >= 2) return name.slice(0, 2).toUpperCase();
  return (name?.[0] || contact?.email?.[0] || 'C').toUpperCase();
}

function humanizeSource(source) {
  if (!source) return '—';
  return String(source)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const PROPOSAL_STATUS_BADGE = {
  DRAFT: { variant: 'default', label: 'Draft' },
  SENT: { variant: 'info', label: 'Sent' },
  ACCEPTED: { variant: 'success', label: 'Accepted' },
  REJECTED: { variant: 'danger', label: 'Rejected' },
  EXPIRED: { variant: 'warning', label: 'Expired' },
};

function isPresent(value) {
  if (value == null) return false;
  const s = String(value).trim();
  return s.length > 0 && s !== '—';
}

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

const infoLabelClass =
  'flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500 sm:text-sm';

/** Stacked label + value; optional children override value. `emphasize` highlights key facts (e.g. industry). */
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
    <div
      className={`min-w-0 ${className}`}
      role="group"
      aria-label={`${label}: ${empty ? 'empty' : display}`}
    >
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
          <p
            className={`text-base leading-snug ${empty ? 'font-normal text-gray-400' : 'font-semibold text-gray-900'
              }`}
          >
            {display}
          </p>
        )}
      </div>
    </div>
  );
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
  if (!user || typeof user !== 'object') return 'Sales';
  const r = user.primaryRole ?? user.role;
  if (r && typeof r === 'object') {
    return r.name || r.type || 'Sales';
  }
  if (typeof r === 'string' && r.trim()) return r;
  return 'Sales';
}

const headerIconBtnClass =
  'p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg text-brand-text-light';

const addContactRoleOptions = [
  { value: 'PRIMARY_CONTACT', label: 'Primary contact' },
  { value: 'TECHNICAL_CONTACT', label: 'Technical contact' },
  { value: 'DECISION_MAKER', label: 'Decision maker' },
  { value: 'INFLUENCER', label: 'Influencer' },
  { value: 'CONTACT', label: 'Contact' },
  { value: 'GATEKEEPER', label: 'Gatekeeper' },
];

const initialAddContactForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  jobTitle: '',
  department: '',
  contactRole: 'TECHNICAL_CONTACT',
};

export default function LeadCompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linkedContacts, setLinkedContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [detailTab, setDetailTab] = useState('overview');
  const [editingCompanyInfo, setEditingCompanyInfo] = useState(false);
  const [companyInfoDraft, setCompanyInfoDraft] = useState(null);
  const [savingCompanyInfo, setSavingCompanyInfo] = useState(false);
  const [companyInfoSaveError, setCompanyInfoSaveError] = useState('');
  const [editingContactInfo, setEditingContactInfo] = useState(false);
  const [contactInfoDraft, setContactInfoDraft] = useState(null);
  const [savingContactInfo, setSavingContactInfo] = useState(false);
  const [contactInfoSaveError, setContactInfoSaveError] = useState('');
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addContactForm, setAddContactForm] = useState(initialAddContactForm);
  const [addContactErrors, setAddContactErrors] = useState({});
  const [addContactSubmitting, setAddContactSubmitting] = useState(false);
  const [contactActionMenu, setContactActionMenu] = useState(null);

  const { options: industrySelectOptions, onIndustrySaved } = useIndustrySelectOptions({
    fetchStoredIndustries: fetchStoredIndustriesForCrm,
    seedIndustries: lead?.industry ? [lead.industry] : [],
  });

  const [assigneeModalOpen, setAssigneeModalOpen] = useState(false);
  const [assigneeUsers, setAssigneeUsers] = useState([]);
  const [assigneeUsersLoading, setAssigneeUsersLoading] = useState(false);
  const [assigneePickUserId, setAssigneePickUserId] = useState('');
  const [assigneeModalError, setAssigneeModalError] = useState('');
  const [savingAssignee, setSavingAssignee] = useState(false);
  const [savingNextConnect, setSavingNextConnect] = useState(false);

  const [crmTimeline, setCrmTimeline] = useState([]);
  const [crmTimelineTotal, setCrmTimelineTotal] = useState(0);
  const [crmTimelineLoading, setCrmTimelineLoading] = useState(false);
  const [crmTimelineError, setCrmTimelineError] = useState(null);

  const [linkedDeals, setLinkedDeals] = useState([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [linkedProposals, setLinkedProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [meetingsCount, setMeetingsCount] = useState(0);

  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState('');

  const isAlreadyConverted = lead?.status === 'CONVERTED' || lead?.convertedAccount != null;
  const canEditLeadCompany = canEditCRMRecord('leads', lead);
  const canManageLeadCompanies = canManageCRM('leads');

  const handleConvertToClient = useCallback(async () => {
    if (!id || converting) return;
    if (!canEditLeadCompany) {
      setConvertError('You can only convert lead companies assigned to you.');
      return;
    }
    setConverting(true);
    setConvertError('');
    try {
      const res = await leadCompanyService.convertToClient(id);
      const clientAccount = res?.data?.clientAccount;
      setLead((prev) =>
        prev ? { ...prev, status: 'CONVERTED', convertedAccount: clientAccount } : prev
      );
      setConvertModalOpen(false);
      const newId = clientAccount?.id ?? clientAccount?.documentId;
      if (newId) {
        router.push(`/clients/accounts/${newId}`);
      }
    } catch (err) {
      setConvertError(err?.message || 'Failed to convert. Please try again.');
    } finally {
      setConverting(false);
    }
  }, [canEditLeadCompany, id, converting, router]);

  const loadLinkedContacts = useCallback(
    async (showLoadingSpinner = false) => {
      if (!id) return;
      if (showLoadingSpinner) setContactsLoading(true);
      try {
        let contactsList = [];
        try {
          const idEq = Number.isNaN(Number(id)) ? id : Number(id);
          const contactsRes = await contactService.getAll({
            'pagination[pageSize]': 100,
            sort: 'createdAt:desc',
            populate: ['assignedTo', 'leadCompany'],
            filters: {
              leadCompany: {
                id: { $eq: idEq },
              },
            },
          });
          contactsList = Array.isArray(contactsRes.data) ? contactsRes.data : [];
        } catch (filterErr) {
          console.warn('Contacts filter by lead company failed, using client filter', filterErr);
          const contactsRes = await contactService.getAll({
            'pagination[pageSize]': 100,
            sort: 'createdAt:desc',
            populate: ['assignedTo', 'leadCompany'],
          });
          const all = Array.isArray(contactsRes.data) ? contactsRes.data : [];
          contactsList = all.filter((c) => {
            const lc = c.leadCompany;
            const lid = lc && typeof lc === 'object' ? lc.id : lc;
            return lid != null && String(lid) === String(id);
          });
        }
        contactsList.sort(
          (a, b) => Number(!!b.isPrimaryContact) - Number(!!a.isPrimaryContact)
        );
        setLinkedContacts(contactsList);
      } catch (e) {
        console.error(e);
        setLinkedContacts([]);
      } finally {
        if (showLoadingSpinner) setContactsLoading(false);
      }
    },
    [id]
  );

  const loadLinkedDeals = useCallback(
    async (showLoadingSpinner = false) => {
      if (!id) return;
      if (showLoadingSpinner) setDealsLoading(true);
      try {
        const idEq = Number.isNaN(Number(id)) ? id : Number(id);
        const dealsRes = await dealService.getAll({
          'pagination[pageSize]': 100,
          sort: 'createdAt:desc',
          populate: ['assignedTo', 'leadCompany'],
          filters: {
            leadCompany: {
              id: { $eq: idEq },
            },
          },
        });
        setLinkedDeals(Array.isArray(dealsRes.data) ? dealsRes.data : []);
      } catch (e) {
        console.error(e);
        setLinkedDeals([]);
      } finally {
        if (showLoadingSpinner) setDealsLoading(false);
      }
    },
    [id]
  );

  const loadLinkedProposals = useCallback(
    async (showLoadingSpinner = false) => {
      if (!id) return;
      if (showLoadingSpinner) setProposalsLoading(true);
      try {
        const idEq = Number.isNaN(Number(id)) ? id : Number(id);
        const targetId = String(id);
        const isRelatedToLead = (p) => {
          const lc = p?.leadCompany;
          if (lc == null) return false;
          if (typeof lc !== 'object') return String(lc) === targetId;
          const lid = lc.id ?? lc.documentId ?? null;
          return lid != null && String(lid) === targetId;
        };
        try {
          const res = await proposalService.getAll({
            'pagination[pageSize]': 100,
            sort: 'createdAt:desc',
            populate: ['assignedTo', 'leadCompany', 'deal'],
            filters: {
              leadCompany: {
                id: { $eq: idEq },
              },
            },
          });
          const raw = Array.isArray(res.data) ? res.data : [];
          setLinkedProposals(raw.filter(isRelatedToLead));
        } catch {
          const res = await proposalService.getAll({
            'pagination[pageSize]': 100,
            sort: 'createdAt:desc',
            populate: ['assignedTo', 'leadCompany', 'deal'],
          });
          const all = Array.isArray(res.data) ? res.data : [];
          setLinkedProposals(all.filter(isRelatedToLead));
        }
      } catch (e) {
        console.error(e);
        setLinkedProposals([]);
      } finally {
        if (showLoadingSpinner) setProposalsLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setContactsLoading(true);
      setDealsLoading(true);
      setProposalsLoading(true);
      setLinkedContacts([]);
      setLinkedProposals([]);
      setMeetingsCount(0);
      try {
        const leadRes = await leadCompanyService.getOne(id);
        if (!cancelled && leadRes?.data) setLead(leadRes.data);
        else if (!cancelled) setLead(null);

        await loadLinkedContacts(false);
        await loadLinkedDeals(false);
        await loadLinkedProposals(false);
        try {
          const n = await meetingService.countByLeadCompany(id);
          if (!cancelled) setMeetingsCount(typeof n === 'number' && !Number.isNaN(n) ? n : 0);
        } catch {
          if (!cancelled) setMeetingsCount(0);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setLead(null);
          setLinkedContacts([]);
          setLinkedDeals([]);
          setLinkedProposals([]);
          setMeetingsCount(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setContactsLoading(false);
          setDealsLoading(false);
          setProposalsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, loadLinkedContacts, loadLinkedDeals, loadLinkedProposals]);

  const reloadCrmTimeline = useCallback(
    async (opts = {}) => {
      const silent = opts.silent === true;
      if (!id) return;
      if (!silent) {
        setCrmTimelineLoading(true);
        setCrmTimelineError(null);
      }
      try {
        const { data, total } = await fetchActivityTimeline({ leadCompanyId: id, limit: 80 });
        setCrmTimeline(Array.isArray(data) ? data : []);
        setCrmTimelineTotal(typeof total === 'number' ? total : 0);
        if (!silent) setCrmTimelineError(null);
      } catch (e) {
        if (!silent) {
          setCrmTimelineError(e?.message || 'Could not load activities');
          setCrmTimeline([]);
          setCrmTimelineTotal(0);
        }
      } finally {
        if (!silent) setCrmTimelineLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    reloadCrmTimeline({ silent: false });
  }, [reloadCrmTimeline]);

  const name = lead?.companyName || lead?.name || 'Lead company';

  const contactsCount = useMemo(() => {
    if (linkedContacts.length > 0) return linkedContacts.length;
    if (lead?.contactName) return 1;
    return 0;
  }, [linkedContacts.length, lead?.contactName]);

  const subtitle = useMemo(() => {
    if (!lead || loading) return null;
    const typeBit = humanizeSource(lead.type || lead.industry || 'Lead');
    const isConverted = lead?.status === 'CONVERTED' || lead?.status === 'CLIENT' || lead?.convertedAccount != null;
    const status = isConverted ? 'CLIENT' : (lead.status || 'NEW').toString().replace(/_/g, ' ');
    return `${typeBit} • ${status} ${isConverted ? '' : 'Lead'}`.trim();
  }, [lead, loading]);

  const leadStatusDisplay = useMemo(() => {
    if (!lead) return 'NEW';
    const isConverted =
      lead?.status === 'CONVERTED' ||
      lead?.status === 'CLIENT' ||
      lead?.convertedAccount != null;
    if (isConverted) return lead?.convertedAccount?.id ? 'CLIENT' : 'CONVERTED';
    return (lead.status || 'NEW').toString().replace(/_/g, ' ').trim();
  }, [lead]);

  const isLeadStatusConverted = useMemo(
    () => leadStatusDisplay === 'CLIENT' || leadStatusDisplay === 'CONVERTED',
    [leadStatusDisplay]
  );

  const headquarters = useMemo(() => {
    if (!lead) return '';
    const parts = [lead.city, lead.state, lead.country].filter(Boolean);
    return parts.length ? parts.join(', ') : '';
  }, [lead]);

  const healthPercent = useMemo(() => {
    if (!lead) return 0;
    const h = lead.healthScore ?? lead.score ?? 0;
    const n = Number(h);
    if (Number.isNaN(n)) return 0;
    return Math.min(100, Math.max(0, n));
  }, [lead]);

  const healthVisual = useMemo(() => {
    const p = healthPercent;
    if (p >= 80)
      return {
        barClass: 'bg-emerald-500',
        accentClass: 'text-emerald-600',
        chipClass: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
        summary: 'Strong engagement',
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
  }, [healthPercent]);

  const activityCount = crmTimelineTotal;

  const lastActivityDisplay = useMemo(() => {
    if (!lead) return '—';
    const latest = crmTimeline?.[0]?.createdAt;
    if (latest) {
      const rel = formatRelativeTime(latest);
      return rel || formatDate(latest);
    }
    if (lead.lastActivityAt) {
      const rel = formatRelativeTime(lead.lastActivityAt);
      return rel || formatDate(lead.lastActivityAt);
    }
    if (lead.updatedAt) {
      const rel = formatRelativeTime(lead.updatedAt);
      if (rel) return `Updated ${rel}`;
      return `Updated ${formatDate(lead.updatedAt)}`;
    }
    return 'No recent activity';
  }, [lead, crmTimeline]);

  const assigneeModalUserOptions = useMemo(
    () =>
      assigneeUsers.map((u) => {
        const label = assigneeName(u);
        const fallback =
          u.email || u.username || (u.id != null ? `User ${u.id}` : 'User');
        const display =
          label && label !== 'Team member' && label !== 'Unassigned' ? label : fallback;
        return { value: String(u.id), label: display };
      }),
    [assigneeUsers]
  );

  const openChangeAssigneeModal = useCallback(async () => {
    if (!canManageLeadCompanies) return;
    if (!lead || !id) return;
    const currentId =
      lead.assignedTo && typeof lead.assignedTo === 'object'
        ? lead.assignedTo.id
        : lead.assignedTo;
    setAssigneePickUserId(currentId != null ? String(currentId) : '');
    setAssigneeModalError('');
    setAssigneeModalOpen(true);
    setAssigneeUsersLoading(true);
    try {
      if (typeof window !== 'undefined' && !strapiClient.getCurrentOrgId()) {
        setAssigneeModalError('No active organization. Select an organization or sign in again.');
        setAssigneeUsers([]);
        return;
      }
      const response = await strapiClient.getXtrawrkxUsers({
        'pagination[page]': 1,
        'pagination[pageSize]': 200,
        populate: 'primaryRole,userRoles',
      });
      const usersData = response?.data ?? response ?? [];
      const arr = Array.isArray(usersData) ? usersData : [];
      const extracted = arr.map((u) =>
        u.attributes ? { id: u.id, documentId: u.id, ...u.attributes } : u
      );
      setAssigneeUsers(extracted);
    } catch (err) {
      console.error('Assignee users fetch error:', err);
      setAssigneeModalError(
        err?.message?.includes('403') || err?.message?.includes('401')
          ? 'You do not have access to load team members for this organization.'
          : 'Could not load team members for your organization.'
      );
      setAssigneeUsers([]);
    } finally {
      setAssigneeUsersLoading(false);
    }
  }, [canManageLeadCompanies, lead, id]);

  const closeAssigneeModal = useCallback(() => {
    if (savingAssignee) return;
    setAssigneeModalOpen(false);
    setAssigneeModalError('');
  }, [savingAssignee]);

  const saveAssigneePick = useCallback(async () => {
    if (!canManageLeadCompanies) return;
    if (!id || !assigneePickUserId) {
      setAssigneeModalError('Select a team member.');
      return;
    }
    const n = parseInt(assigneePickUserId, 10);
    if (Number.isNaN(n)) {
      setAssigneeModalError('Invalid selection.');
      return;
    }
    setSavingAssignee(true);
    setAssigneeModalError('');
    try {
      await leadCompanyService.update(id, { assignedTo: n });
      const refreshed = await leadCompanyService.getOne(id, {
        populate: ['assignedTo', 'organization', 'contacts'],
      });
      if (refreshed?.data) setLead(refreshed.data);
      setAssigneeModalOpen(false);
      void reloadCrmTimeline({ silent: true });
    } catch (e) {
      setAssigneeModalError(e?.message || 'Failed to update assignee');
    } finally {
      setSavingAssignee(false);
    }
  }, [assigneePickUserId, canManageLeadCompanies, id, reloadCrmTimeline]);

  const saveNextConnectDate = useCallback(
    async (value) => {
      if (!id || !canEditLeadCompany || savingNextConnect) return;
      setSavingNextConnect(true);
      try {
        const payload =
          value && String(value).trim()
            ? { nextConnectDate: String(value).trim() }
            : { nextConnectDate: null };
        const res = await leadCompanyService.update(id, payload);
        if (res?.data) {
          setLead((prev) => (prev ? { ...prev, ...res.data } : res.data));
        } else {
          setLead((prev) => (prev ? { ...prev, nextConnectDate: payload.nextConnectDate } : prev));
        }
        void reloadCrmTimeline({ silent: true });
      } catch (e) {
        console.error(e);
        alert(e?.message || 'Failed to update next connect date.');
      } finally {
        setSavingNextConnect(false);
      }
    },
    [canEditLeadCompany, id, reloadCrmTimeline, savingNextConnect]
  );

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* ignore */
    }
  };

  const handleDownload = () => {
    if (!lead || typeof window === 'undefined') return;
    const blob = new Blob([JSON.stringify(lead, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lead-company-${lead.id || id}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const openCompanyInfoEdit = () => {
    if (!canEditLeadCompany) return;
    if (!lead) return;
    setCompanyInfoDraft({
      industry: canonicalIndustryValue(lead.industry ?? ''),
      type: canonicalCompanyTypeValue(lead.type ?? ''),
      employees: lead.employees != null ? String(lead.employees) : '',
      founded: lead.founded != null ? String(lead.founded) : '',
      city: lead.city ?? '',
      state: lead.state ?? '',
      country: lead.country ?? '',
      description: lead.description ?? '',
    });
    setCompanyInfoSaveError('');
    setEditingCompanyInfo(true);
  };

  const cancelCompanyInfoEdit = () => {
    setEditingCompanyInfo(false);
    setCompanyInfoDraft(null);
    setCompanyInfoSaveError('');
  };

  const setDraftField = (field, value) => {
    setCompanyInfoDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const typeSelectOptions = useMemo(() => {
    const v = companyInfoDraft?.type?.trim();
    if (!v) return companyTypeSelectOptions;
    if (companyTypeSelectOptions.some((o) => o.value === v)) return companyTypeSelectOptions;
    return [{ value: v, label: humanizeSource(v) }, ...companyTypeSelectOptions];
  }, [companyInfoDraft?.type]);

  const saveCompanyInfo = async () => {
    if (!id || !companyInfoDraft) return;
    if (!canEditLeadCompany) return;
    setSavingCompanyInfo(true);
    setCompanyInfoSaveError('');
    try {
      const payload = {
        industry: companyInfoDraft.industry.trim(),
        type: companyInfoDraft.type.trim(),
        employees: companyInfoDraft.employees.trim(),
        founded: companyInfoDraft.founded.trim(),
        city: companyInfoDraft.city.trim(),
        state: companyInfoDraft.state.trim(),
        country: companyInfoDraft.country.trim(),
        description: companyInfoDraft.description.trim(),
      };
      const res = await leadCompanyService.update(id, payload);
      onIndustrySaved(payload.industry);
      if (res?.data) {
        setLead((prev) => (prev ? { ...prev, ...res.data } : res.data));
      }
      setEditingCompanyInfo(false);
      setCompanyInfoDraft(null);
      void reloadCrmTimeline({ silent: true });
    } catch (e) {
      setCompanyInfoSaveError(e?.message || 'Failed to save company details');
    } finally {
      setSavingCompanyInfo(false);
    }
  };

  const openContactInfoEdit = () => {
    if (!canEditLeadCompany) return;
    if (!lead) return;
    setContactInfoDraft({
      website: lead.website ?? '',
      phone: lead.phone ?? '',
      email: lead.email ?? '',
      address: lead.address ?? '',
      city: lead.city ?? '',
      state: lead.state ?? '',
      zipCode: lead.zipCode ?? '',
      country: lead.country ?? '',
    });
    setContactInfoSaveError('');
    setEditingContactInfo(true);
  };

  const cancelContactInfoEdit = () => {
    setEditingContactInfo(false);
    setContactInfoDraft(null);
    setContactInfoSaveError('');
  };

  const setContactInfoDraftField = (field, value) => {
    setContactInfoDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const saveContactInfo = async () => {
    if (!id || !contactInfoDraft) return;
    if (!canEditLeadCompany) return;
    setSavingContactInfo(true);
    setContactInfoSaveError('');
    try {
      const payload = {
        website: contactInfoDraft.website.trim(),
        phone: contactInfoDraft.phone.trim(),
        email: contactInfoDraft.email.trim(),
        address: contactInfoDraft.address.trim(),
        city: contactInfoDraft.city.trim(),
        state: contactInfoDraft.state.trim(),
        zipCode: contactInfoDraft.zipCode.trim(),
        country: contactInfoDraft.country.trim(),
      };
      const res = await leadCompanyService.update(id, payload);
      if (res?.data) {
        setLead((prev) => (prev ? { ...prev, ...res.data } : res.data));
      }
      setEditingContactInfo(false);
      setContactInfoDraft(null);
      void reloadCrmTimeline({ silent: true });
    } catch (e) {
      setContactInfoSaveError(e?.message || 'Failed to save contact details');
    } finally {
      setSavingContactInfo(false);
    }
  };

  const closeAddContactModal = () => {
    if (addContactSubmitting) return;
    setAddContactOpen(false);
    setAddContactForm({ ...initialAddContactForm });
    setAddContactErrors({});
  };

  const openAddContactModal = () => {
    if (!canEditLeadCompany) return;
    setAddContactForm({ ...initialAddContactForm });
    setAddContactErrors({});
    setAddContactOpen(true);
  };

  const setAddContactField = (field, value) => {
    setAddContactForm((prev) => ({ ...prev, [field]: value }));
    setAddContactErrors((prev) => {
      if (!prev[field] && !prev.submit) return prev;
      const next = { ...prev, submit: null };
      if (prev[field]) next[field] = null;
      return next;
    });
  };

  const validateAddContact = () => {
    const next = {};
    if (!addContactForm.firstName.trim()) next.firstName = 'First name is required';
    if (!addContactForm.lastName.trim()) next.lastName = 'Last name is required';
    if (!addContactForm.email.trim()) {
      next.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(addContactForm.email.trim())) {
      next.email = 'Please enter a valid email address';
    }
    setAddContactErrors(next);
    return Object.keys(next).length === 0;
  };

  const submitAddContact = async (e) => {
    e.preventDefault();
    if (!id || !lead) return;
    if (!canEditLeadCompany) return;
    if (!validateAddContact()) return;
    setAddContactSubmitting(true);
    setAddContactErrors((prev) => ({ ...prev, submit: null }));
    try {
      const idEq = Number.isNaN(Number(id)) ? id : Number(id);
      const payload = {
        firstName: addContactForm.firstName.trim(),
        lastName: addContactForm.lastName.trim(),
        email: addContactForm.email.trim(),
        status: 'ACTIVE',
        source: 'LEAD_COMPANY',
        leadCompany: idEq,
        contactRole: (addContactForm.contactRole || 'TECHNICAL_CONTACT').trim(),
        isPrimaryContact: addContactForm.contactRole === 'PRIMARY_CONTACT',
        companyName: (lead.companyName || lead.name || '').trim(),
      };
      if (addContactForm.phone.trim()) payload.phone = addContactForm.phone.trim();
      if (addContactForm.jobTitle.trim()) payload.jobTitle = addContactForm.jobTitle.trim();
      if (addContactForm.department.trim()) payload.department = addContactForm.department.trim();

      const ownerId =
        lead?.assignedTo && typeof lead.assignedTo === 'object'
          ? lead.assignedTo.id
          : lead?.assignedTo;
      if (ownerId != null && String(ownerId).trim() !== '') {
        const n = parseInt(String(ownerId), 10);
        if (!Number.isNaN(n)) payload.assignedTo = n;
      }

      await contactService.create(payload);
      setAddContactOpen(false);
      setAddContactForm({ ...initialAddContactForm });
      setAddContactErrors({});
      await loadLinkedContacts(true);
      void reloadCrmTimeline({ silent: true });
    } catch (err) {
      setAddContactErrors({
        submit: err?.message || 'Failed to add contact. Please try again.',
      });
    } finally {
      setAddContactSubmitting(false);
    }
  };

  const leadContactsColumns = useMemo(
    () => [
      {
        key: 'contact',
        label: 'CONTACT',
        render: (_, contact) => (
          <div className="flex items-center gap-3 min-w-[200px]">
            <Avatar
              fallback={contactInitials(contact)}
              alt={contactDisplayName(contact)}
              size="sm"
              className="flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 truncate">{contactDisplayName(contact)}</div>
              <div className="text-sm text-gray-500 truncate">
                {contact.jobTitle || (contact.contactRole ? humanizeSource(contact.contactRole) : '') || '—'}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'contact-info',
        label: 'CONTACT INFO',
        render: (_, contact) => (
          <div className="space-y-1 min-w-[220px]">
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{contact.email || 'No email'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{contact.phone || 'No phone'}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'role',
        label: 'ROLE',
        render: (_, contact) => {
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
            <div className="flex items-center gap-2 min-w-[180px]">
              <Avatar
                fallback={assigneeInitials(u)}
                alt={ownerLabel}
                size="sm"
                className="flex-shrink-0 bg-gray-600"
              />
              <span className="font-semibold text-gray-900 truncate">{ownerLabel}</span>
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden />
            </div>
          );
        },
      },
      {
        key: 'createdAt',
        label: 'CREATED',
        render: (_, contact) => (
          <div className="min-w-[130px]">
            <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
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
              className={`inline-flex rounded-lg border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${isActive
                ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                : 'border-gray-300 text-gray-700 bg-gray-50'
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
          <div className="flex items-center gap-0.5 min-w-[148px]" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-teal-600 hover:bg-teal-50"
              title="More options"
              onClick={(e) => {
                e.stopPropagation();
                const r = e.currentTarget.getBoundingClientRect();
                setContactActionMenu((prev) =>
                  prev?.id === contact.id
                    ? null
                    : { id: contact.id, top: r.bottom + 4, left: r.left, triggerEl: e.currentTarget }
                );
              }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-slate-700 hover:bg-slate-100"
              title="View"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/sales/contacts/${contact.id}`);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-emerald-600 hover:bg-emerald-50"
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/sales/contacts/${contact.id}/edit`);
              }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
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
              <Mail className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    [router]
  );

  const leadDealsColumns = useMemo(
    () => [
      {
        key: 'deal',
        label: 'DEAL',
        render: (_, deal) => (
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-orange-600" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 truncate">{deal.name || 'Unnamed deal'}</div>
              <div className="text-sm text-gray-500 truncate">{deal.dealGroup || '—'}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'value',
        label: 'VALUE',
        render: (_, deal) => (
          <span className="font-semibold text-gray-900 tabular-nums whitespace-nowrap">
            {formatCurrency(deal.value)}
          </span>
        ),
      },
      {
        key: 'stage',
        label: 'STAGE',
        render: (_, deal) => {
          const s = (deal.stage || 'discovery').toLowerCase();
          const stageMap = {
            discovery: 'border-sky-200 bg-sky-50 text-sky-900',
            prospect: 'border-slate-200 bg-slate-50 text-slate-800',
            proposal: 'border-violet-200 bg-violet-50 text-violet-900',
            negotiation: 'border-amber-200 bg-amber-50 text-amber-900',
            won: 'border-emerald-200 bg-emerald-50 text-emerald-900',
            lost: 'border-red-200 bg-red-50 text-red-900',
          };
          const cls = stageMap[s] || stageMap.discovery;
          const label = s.charAt(0).toUpperCase() + s.slice(1);
          return (
            <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${cls}`}>
              {label}
            </span>
          );
        },
      },
      {
        key: 'priority',
        label: 'PRIORITY',
        render: (_, deal) => {
          const p = (deal.priority || 'medium').toLowerCase();
          const priorityMap = {
            low: 'border-gray-200 bg-gray-50 text-gray-700',
            medium: 'border-amber-200 bg-amber-50 text-amber-800',
            high: 'border-red-200 bg-red-50 text-red-800',
          };
          const cls = priorityMap[p] || priorityMap.medium;
          const label = p.charAt(0).toUpperCase() + p.slice(1);
          return (
            <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${cls}`}>
              {label}
            </span>
          );
        },
      },
      {
        key: 'owner',
        label: 'OWNER',
        render: (_, deal) => {
          const u = deal.assignedTo;
          const ownerLabel = assigneeName(u);
          return (
            <div className="flex items-center gap-2 min-w-[160px]">
              <Avatar
                fallback={assigneeInitials(u)}
                alt={ownerLabel}
                size="sm"
                className="flex-shrink-0 bg-gray-600"
              />
              <span className="font-semibold text-gray-900 truncate">{ownerLabel}</span>
            </div>
          );
        },
      },
      {
        key: 'expectedCloseDate',
        label: 'CLOSE DATE',
        render: (_, deal) => (
          <div className="min-w-[110px]">
            <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
              {formatDate(deal.expectedCloseDate)}
            </div>
          </div>
        ),
      },
      {
        key: 'actions',
        label: 'ACTIONS',
        render: (_, deal) => (
          <div className="flex items-center gap-0.5 min-w-[80px]" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-slate-700 hover:bg-slate-100"
              title="View"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/sales/deals/${deal.id}`);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-emerald-600 hover:bg-emerald-50"
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/sales/deals/${deal.id}/edit`);
              }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    [router]
  );

  const leadProposalsColumns = useMemo(
    () => [
      {
        key: 'proposal',
        label: 'PROPOSAL',
        render: (_, p) => {
          const title = p.title || p.projectName || 'Untitled';
          return (
            <div className="flex min-w-[220px] items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50">
                <FileText className="h-4 w-4 text-violet-600" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold text-gray-900">{title}</div>
                <div className="truncate text-sm text-gray-500">
                  {`${p.proposalNumber || '—'} · ${humanizeSource(p.documentType || 'PROPOSAL')}`}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: 'value',
        label: 'VALUE',
        render: (_, p) => (
          <span className="whitespace-nowrap font-semibold tabular-nums text-gray-900">
            {formatCurrency(p.totalValue)}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'STATUS',
        render: (_, p) => {
          const st = (p.status || 'DRAFT').toUpperCase();
          const cfg = PROPOSAL_STATUS_BADGE[st] || PROPOSAL_STATUS_BADGE.DRAFT;
          return (
            <Badge variant={cfg.variant} className="whitespace-nowrap font-semibold uppercase">
              {cfg.label}
            </Badge>
          );
        },
      },
      {
        key: 'date',
        label: 'DATE',
        render: (_, p) => (
          <div className="min-w-[100px] whitespace-nowrap text-sm font-medium text-gray-900">
            {formatDate(p.date || p.createdAt)}
          </div>
        ),
      },
      {
        key: 'validUntil',
        label: 'VALID UNTIL',
        render: (_, p) => (
          <div className="min-w-[100px] whitespace-nowrap text-sm text-gray-700">
            {formatDate(p.validUntil)}
          </div>
        ),
      },
      {
        key: 'deal',
        label: 'DEAL',
        render: (_, p) => {
          const d = p.deal;
          if (d && typeof d === 'object') {
            const dn = d.name || 'Deal';
            return (
              <button
                type="button"
                className="max-w-[180px] truncate text-left text-sm font-medium text-orange-700 hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  if (d.id != null) router.push(`/sales/deals/${d.id}`);
                }}
              >
                {dn}
              </button>
            );
          }
          return <span className="text-sm text-gray-400">—</span>;
        },
      },
      {
        key: 'actions',
        label: 'ACTIONS',
        render: (_, p) => (
          <div className="flex min-w-[80px] items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-slate-700 hover:bg-slate-100"
              title="View"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/clients/proposals/${p.id}`);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-emerald-600 hover:bg-emerald-50"
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/clients/proposals/${p.id}/edit`);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [router]
  );

  const detailTabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'contacts', label: 'Contacts', badge: contactsCount || undefined },
    { key: 'activities', label: 'Activities' },
    { key: 'deals', label: 'Deals', badge: linkedDeals.length || undefined },
    { key: 'proposals', label: 'Proposals', badge: linkedProposals.length || undefined },
    { key: 'meetings', label: 'Meetings', badge: meetingsCount || undefined },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <CRMPageHeader
        title={loading ? 'Loading...' : name}
        subtitle={subtitle || undefined}
        breadcrumb={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sales', href: '/sales' },
          { label: 'Lead Companies', href: '/sales/lead-companies' },
          { label: name, href: `/sales/lead-companies/${id}` },
        ]}
        showProfile
      >
        <div className="flex flex-wrap items-center justify-end gap-2">
          {isAlreadyConverted ? (
            lead?.convertedAccount?.id ? (
              <Link
                href={`/clients/accounts/${lead.convertedAccount.id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 shadow-sm hover:bg-emerald-100 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                View Client Account
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Converted
              </span>
            )
          ) : canEditLeadCompany ? (
            <button
              type="button"
              onClick={() => { setConvertError(''); setConvertModalOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg hover:opacity-95 transition-opacity"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Convert to Client
            </button>
          ) : null}
          {canEditLeadCompany ? (
            <Link href={`/sales/lead-companies/${id}/edit`} className={headerIconBtnClass} title="Edit">
              <Edit className="w-5 h-5" />
            </Link>
          ) : null}
          <button type="button" className={headerIconBtnClass} title="Share" onClick={handleShare}>
            <Share2 className="w-5 h-5" />
          </button>
          <button
            type="button"
            className={headerIconBtnClass}
            title="Download"
            onClick={handleDownload}
            disabled={!lead}
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </CRMPageHeader>

      {loading ? (
        <Card variant="elevated" className="p-12 flex justify-center">
          <LoadingSpinner message="Loading lead company..." />
        </Card>
      ) : !lead ? (
        <Card variant="elevated" className="p-12 text-center">
          <p className="text-gray-600">Lead company not found.</p>
          <Link href="/sales/lead-companies" className="mt-4 inline-block">
            <Button variant="primary">Back to lead companies</Button>
          </Link>
        </Card>
      ) : (
        <>
          <TabsWithActions
            variant="pill"
            tabs={detailTabs}
            activeTab={detailTab}
            onTabChange={setDetailTab}
          />

          {detailTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card variant="elevated" className="rounded-xl">
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                      <h2 className="text-xl font-semibold text-gray-900">Company information</h2>
                      <p className="mt-1.5 text-base text-gray-500">
                        Profile, location, and where this lead came from.
                      </p>
                    </div>
                    <div
                      className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-start sm:justify-end sm:gap-2.5"
                      role="group"
                      aria-label="Lead source and status"
                    >
                      <InlineEditableNextConnect
                        date={lead.nextConnectDate}
                        canEdit={canEditLeadCompany}
                        saving={savingNextConnect}
                        onSave={saveNextConnectDate}
                      />
                      <span
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-300/90 bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100/90 px-4 py-2.5 text-sm font-bold uppercase tracking-widest text-orange-900 shadow-md ring-2 ring-orange-200/70"
                        title="Lead source"
                      >
                        <Target className="h-5 w-5 shrink-0 text-orange-600" strokeWidth={2.25} aria-hidden />
                        {humanizeSource(lead.source)}
                      </span>
                      <span
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-widest shadow-md ring-2 ${
                          isLeadStatusConverted
                            ? 'border border-emerald-300/90 bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-100/90 text-emerald-950 ring-emerald-200/70'
                            : 'border border-amber-300/90 bg-gradient-to-br from-amber-50 via-amber-50 to-amber-100/90 text-amber-950 ring-amber-200/70'
                        }`}
                        role="status"
                        title="Status"
                      >
                        {isLeadStatusConverted ? (
                          <Building2
                            className="h-5 w-5 shrink-0 text-emerald-600"
                            strokeWidth={2.25}
                            aria-hidden
                          />
                        ) : (
                          <CheckCircle2
                            className="h-5 w-5 shrink-0 text-amber-600"
                            strokeWidth={2.25}
                            aria-hidden
                          />
                        )}
                        {leadStatusDisplay}
                      </span>
                    </div>
                  </div>

                  {editingCompanyInfo && companyInfoDraft ? (
                    <>
                      <InfoSection title="Company profile" icon={Building2} isFirst>
                        <div className="mb-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                          <Select
                            label="Industry"
                            value={companyInfoDraft.industry}
                            onChange={(value) => setDraftField('industry', value)}
                            options={industrySelectOptions}
                            placeholder="Select industry"
                            icon={Building2}
                            allowCustom
                            searchable
                          />
                          <Select
                            label="Company type"
                            value={companyInfoDraft.type}
                            onChange={(value) => setDraftField('type', value)}
                            options={typeSelectOptions}
                            placeholder="Select company type"
                            icon={Layers}
                          />
                          <Input
                            label="Employees"
                            value={companyInfoDraft.employees}
                            onChange={(e) => setDraftField('employees', e.target.value)}
                            icon={Users}
                          />
                          <Input
                            label="Founded"
                            value={companyInfoDraft.founded}
                            onChange={(e) => setDraftField('founded', e.target.value)}
                            icon={Calendar}
                          />
                        </div>
                      </InfoSection>

                      <InfoSection title="Location" icon={MapPin}>
                        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                          Headquarters
                        </p>
                        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <Input
                            label="City"
                            value={companyInfoDraft.city}
                            onChange={(e) => setDraftField('city', e.target.value)}
                          />
                          <Input
                            label="State / region"
                            value={companyInfoDraft.state}
                            onChange={(e) => setDraftField('state', e.target.value)}
                          />
                          <Input
                            label="Country"
                            value={companyInfoDraft.country}
                            onChange={(e) => setDraftField('country', e.target.value)}
                          />
                        </div>
                      </InfoSection>

                      <section className="border-t border-gray-100 pt-4">
                        <div className="mb-2 flex items-center gap-2">
                          <AlignLeft className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                            About
                          </h3>
                        </div>
                        <Textarea
                          rows={5}
                          value={companyInfoDraft.description}
                          onChange={(e) => setDraftField('description', e.target.value)}
                          className="mt-1 text-base"
                          placeholder="Brief description of the company"
                        />
                      </section>

                      {companyInfoSaveError ? (
                        <p className="mt-3 text-center text-sm text-red-600">{companyInfoSaveError}</p>
                      ) : null}

                      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 border-t border-gray-100 pt-4">
                        <Button
                          type="button"
                          variant="primary"
                          disabled={savingCompanyInfo}
                          onClick={saveCompanyInfo}
                        >
                          {savingCompanyInfo ? 'Saving…' : 'Save changes'}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={savingCompanyInfo}
                          onClick={cancelCompanyInfoEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {(() => {
                        const profileRows = [
                          {
                            label: 'Industry',
                            value: lead.industry ? humanizeSource(lead.industry) : '',
                            icon: Building2,
                          },
                          {
                            label: 'Company type',
                            value: lead.type ? humanizeSource(lead.type) : '',
                            icon: Layers,
                          },
                          {
                            label: 'Employees',
                            value:
                              lead.employees != null && String(lead.employees).trim() ? lead.employees : '',
                            icon: Users,
                          },
                          {
                            label: 'Founded',
                            value:
                              lead.founded != null && String(lead.founded).trim() ? lead.founded : '',
                            icon: Calendar,
                          },
                        ];

                        return (
                          <>
                            <InfoSection title="Company profile" icon={Building2} isFirst>
                              <div className="mb-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                                {profileRows.map((row) => (
                                  <InfoRow
                                    key={row.label}
                                    label={row.label}
                                    value={row.value}
                                    icon={row.icon}
                                    emphasize={row.label === 'Industry'}
                                  />
                                ))}
                              </div>
                            </InfoSection>

                            <InfoSection title="Location" icon={MapPin}>
                              <InfoRow
                                label="Headquarters"
                                value={headquarters}
                                className="mb-4"
                              />
                            </InfoSection>

                            <section className="border-t border-gray-100 pt-4">
                              <div className="mb-2 flex items-center gap-2">
                                <AlignLeft className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                                  About
                                </h3>
                              </div>
                              {isPresent(lead.description) ? (
                                <p className="mt-2.5 whitespace-pre-wrap text-base font-normal leading-relaxed text-gray-800">
                                  {lead.description}
                                </p>
                              ) : (
                                <p className="mt-2.5 text-base font-normal text-gray-400">—</p>
                              )}
                            </section>

                            {canEditLeadCompany ? (
                              <p className="mt-4 border-t border-gray-100 pt-3 text-center text-sm text-gray-500">
                                <button
                                  type="button"
                                  onClick={openCompanyInfoEdit}
                                  className="font-medium text-orange-600 hover:underline"
                                >
                                  Edit company details
                                </button>
                                <span className="mx-2 text-gray-300" aria-hidden>
                                  ·
                                </span>
                                <Link
                                  href={`/sales/lead-companies/${id}/edit`}
                                  className="font-medium text-gray-500 hover:text-orange-600 hover:underline"
                                >
                                  Full edit page
                                </Link>
                              </p>
                            ) : null}
                          </>
                        );
                      })()}
                    </>
                  )}
                </Card>

                <Card variant="elevated" className="rounded-xl">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Contact information</h2>
                    <p className="mt-1.5 text-base text-gray-500">
                      Phone, email, web, and address used to reach this lead.
                    </p>
                  </div>
                  {editingContactInfo && contactInfoDraft ? (
                    <>
                      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <Input
                          label="Website"
                          value={contactInfoDraft.website}
                          onChange={(e) => setContactInfoDraftField('website', e.target.value)}
                          icon={Globe}
                        />
                        <Input
                          label="Phone"
                          value={contactInfoDraft.phone}
                          onChange={(e) => setContactInfoDraftField('phone', e.target.value)}
                          icon={Phone}
                        />
                        <Input
                          label="Email"
                          type="email"
                          value={contactInfoDraft.email}
                          onChange={(e) => setContactInfoDraftField('email', e.target.value)}
                          icon={Mail}
                        />
                        <Input
                          label="Street address"
                          value={contactInfoDraft.address}
                          onChange={(e) => setContactInfoDraftField('address', e.target.value)}
                          icon={MapPin}
                        />
                        <Input
                          label="City"
                          value={contactInfoDraft.city}
                          onChange={(e) => setContactInfoDraftField('city', e.target.value)}
                        />
                        <Input
                          label="State / region"
                          value={contactInfoDraft.state}
                          onChange={(e) => setContactInfoDraftField('state', e.target.value)}
                        />
                        <Input
                          label="ZIP / postal"
                          value={contactInfoDraft.zipCode}
                          onChange={(e) => setContactInfoDraftField('zipCode', e.target.value)}
                        />
                        <Input
                          label="Country"
                          value={contactInfoDraft.country}
                          onChange={(e) => setContactInfoDraftField('country', e.target.value)}
                        />
                      </div>
                      {contactInfoSaveError ? (
                        <p className="mt-3 text-center text-sm text-red-600">{contactInfoSaveError}</p>
                      ) : null}
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 border-t border-gray-100 pt-4">
                        <Button
                          type="button"
                          variant="primary"
                          disabled={savingContactInfo}
                          onClick={saveContactInfo}
                        >
                          {savingContactInfo ? 'Saving…' : 'Save changes'}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={savingContactInfo}
                          onClick={cancelContactInfoEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <InfoRow label="Website" icon={Globe}>
                          {lead.website ? (
                            <a
                              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-orange-600 hover:underline"
                            >
                              {lead.website}
                            </a>
                          ) : (
                            <span className="font-normal text-gray-400">—</span>
                          )}
                        </InfoRow>
                        <InfoRow label="Phone" icon={Phone} value={lead.phone || ''} />
                        <InfoRow label="Email" icon={Mail} value={lead.email || ''} />
                        <InfoRow
                          label="Location"
                          icon={MapPin}
                          value={
                            [lead.address, lead.city, lead.state, lead.zipCode, lead.country]
                              .filter(Boolean)
                              .join(', ') || ''
                          }
                        />
                      </div>
                      {canEditLeadCompany ? (
                        <p className="mt-4 border-t border-gray-100 pt-3 text-center text-sm text-gray-500">
                          <button
                            type="button"
                            onClick={openContactInfoEdit}
                            className="font-medium text-orange-600 hover:underline"
                          >
                            Edit contact details
                          </button>
                          <span className="mx-2 text-gray-300" aria-hidden>
                            ·
                          </span>
                          <Link
                            href={`/sales/lead-companies/${id}/edit`}
                            className="font-medium text-gray-500 hover:text-orange-600 hover:underline"
                          >
                            Full edit page
                          </Link>
                        </p>
                      ) : null}
                    </>
                  )}
                </Card>
              </div>

              <div className="space-y-4">
                <Card variant="elevated" className="rounded-xl">
                  <h2 className="mb-3 text-xl font-semibold text-gray-900">Lead Owner</h2>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar
                        fallback={assigneeInitials(lead.assignedTo)}
                        alt={assigneeName(lead.assignedTo)}
                        size="lg"
                        className="!bg-brand-primary font-semibold text-white shadow-sm ring-2 ring-brand-primary/25"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-gray-900">
                          {assigneeName(lead.assignedTo)}
                        </p>
                        <p className="text-sm text-gray-500">{assigneeRole(lead.assignedTo)}</p>
                        <div className="mt-0.5 flex items-center gap-1 text-sm text-gray-600">
                          <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                          <span className="font-medium">4.9 rating</span>
                        </div>
                      </div>
                    </div>
                    {canManageLeadCompanies ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full shrink-0 gap-2 !border-gray-300 bg-white !text-gray-700 shadow-sm hover:bg-gray-50 hover:!text-gray-900 sm:w-auto"
                        onClick={openChangeAssigneeModal}
                      >
                        <User className="h-4 w-4 shrink-0 text-gray-600" strokeWidth={1.75} />
                        Change Assignee
                      </Button>
                    ) : null}
                  </div>
                </Card>

                <Card variant="elevated" className="rounded-xl">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                    <h2 className="text-xl font-semibold text-gray-900">Lead Health</h2>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${healthVisual.chipClass}`}
                    >
                      {healthVisual.summary}
                    </span>
                  </div>

                  <div className="rounded-xl bg-gradient-to-br from-slate-50 to-gray-50/90 p-4 ring-1 ring-gray-100">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-stretch sm:gap-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 sm:hidden">
                          Health score
                        </p>
                        <div
                          className={`flex min-w-[5.5rem] flex-col items-center justify-center rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-100/80 ${healthVisual.accentClass}`}
                        >
                          <span className="text-3xl font-bold tabular-nums leading-none">
                            {healthPercent}%
                          </span>
                          <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Score
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="hidden text-xs font-medium uppercase tracking-wide text-gray-500 sm:block">
                          Health score
                        </p>
                        <p className="mt-0 text-sm text-gray-600 sm:mt-1">
                          Derived from the health score stored on this lead.
                        </p>
                        <div
                          className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/90 shadow-inner ring-1 ring-gray-100/80"
                          role="progressbar"
                          aria-valuenow={healthPercent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label="Health score"
                        >
                          <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${healthVisual.barClass}`}
                            style={{ width: `${healthPercent}%` }}
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
                          <p className="mt-1 text-sm font-semibold leading-snug text-gray-900">
                            {lastActivityDisplay}
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
                          <p className="text-xs font-medium text-gray-500">Total activities</p>
                          <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900">
                            {activityCount}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-5">
                      <h3 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                        Record & segment
                      </h3>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="rounded-lg border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
                          <p className="text-xs font-medium text-gray-500">Next connect</p>
                          <div className="mt-1.5">
                            {lead.nextConnectDate ? (
                              <TableCellNextConnect date={lead.nextConnectDate} />
                            ) : (
                              <span className="text-sm font-semibold text-gray-400">Not scheduled</span>
                            )}
                          </div>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
                          <p className="text-xs font-medium text-gray-500">Created</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            {formatDate(lead.createdAt)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
                          <p className="text-xs font-medium text-gray-500">Segment</p>
                          <div className="mt-1.5">
                            {lead.segment ? (
                              <Badge
                                variant="primary"
                                className="border border-orange-200 bg-orange-50 text-orange-800"
                              >
                                {(lead.segment || '').toString()}
                              </Badge>
                            ) : (
                              <span className="text-sm font-semibold text-gray-400">—</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {detailTab === 'contacts' && (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-600 min-h-[1.25rem]">
                  {contactsLoading ? (
                    <span className="text-gray-400">Loading contacts…</span>
                  ) : (
                    <>
                      Showing{' '}
                      <span className="font-semibold text-gray-900">{linkedContacts.length}</span> result
                      {linkedContacts.length !== 1 ? 's' : ''}
                    </>
                  )}
                </div>
                {canEditLeadCompany ? (
                  <button
                    type="button"
                    onClick={openAddContactModal}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-pink-500 shadow-md hover:opacity-95 transition-opacity shrink-0 w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 shrink-0" aria-hidden />
                    Add Contact
                  </button>
                ) : null}
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {contactsLoading ? (
                  <div className="p-12 flex flex-col items-center justify-center">
                    <LoadingSpinner size="lg" message="Loading contacts..." />
                  </div>
                ) : linkedContacts.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      icon={Users}
                      title="No contacts yet"
                      description="Add a contact for this lead company, or attach more from the company editor."
                      action={
                        canEditLeadCompany ? (
                          <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
                            <Button
                              type="button"
                              onClick={openAddContactModal}
                              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-pink-500 border-0 text-white shadow-md hover:opacity-95"
                            >
                              <Plus className="h-4 w-4 shrink-0 inline mr-2 align-text-bottom" aria-hidden />
                              Add contact
                            </Button>
                            <Link href={`/sales/lead-companies/${id}/edit`} className="w-full sm:w-auto">
                              <Button type="button" variant="outline" className="w-full sm:w-auto">
                                Edit company
                              </Button>
                            </Link>
                          </div>
                        ) : null
                      }
                    />
                  </div>
                ) : (
                  <Table
                    columns={leadContactsColumns}
                    data={linkedContacts}
                    keyField="id"
                    variant="modern"
                    onRowClick={(row) => router.push(`/sales/contacts/${row.id}`)}
                  />
                )}
              </div>
            </div>
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
                      <span className="text-xs font-medium text-gray-600">Contacts</span>
                      <span className="text-xs font-semibold text-gray-800">{contactsCount}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                      <span className="text-xs font-medium text-gray-600">Active deals</span>
                      <span className="text-xs font-semibold text-gray-800">
                        {linkedDeals.filter((d) => d.stage !== 'won' && d.stage !== 'lost').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                      <span className="text-xs font-medium text-gray-600">Created</span>
                      <span className="text-xs font-semibold text-gray-800">{formatDate(lead?.createdAt)}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 text-center">
                      Activity and chat messages are linked to the{' '}
                      <button
                        type="button"
                        className="text-orange-500 font-medium hover:underline"
                        onClick={() => setDetailTab('contacts')}
                      >
                        quick-chat
                      </button>{' '}
                      on the lead companies table.
                    </p>
                  </div>
                </Card>
              </div>

              {/* Right: Activity + Chat panel */}
              <div className="lg:col-span-3">
                <EntityActivityPanel
                  entityType="lead_company"
                  entityId={id}
                  entityName={name}
                  crmTimeline={crmTimeline}
                  crmTimelineLoading={crmTimelineLoading}
                  crmTimelineError={crmTimelineError}
                  activityCount={activityCount}
                  fetchCommentsFn={({ entityId }) =>
                    fetchLeadCompanyComments({ leadCompanyId: entityId, limit: 80 })
                  }
                  addCommentFn={({ entityId, comment }) =>
                    addLeadCompanyComment({ leadCompanyId: entityId, comment })
                  }
                  fetchMentionUsers={fetchChatMentionUsers}
                />
              </div>
            </div>
          )}

          {detailTab === 'deals' && (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-600 min-h-[1.25rem]">
                  {dealsLoading ? (
                    <span className="text-gray-400">Loading deals…</span>
                  ) : (
                    <>
                      Showing{' '}
                      <span className="font-semibold text-gray-900">{linkedDeals.length}</span> result
                      {linkedDeals.length !== 1 ? 's' : ''}
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/sales/deals/new?leadCompany=${id}`)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-pink-500 shadow-md hover:opacity-95 transition-opacity shrink-0 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 shrink-0" aria-hidden />
                  Add Deal
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {dealsLoading ? (
                  <div className="p-12 flex flex-col items-center justify-center">
                    <LoadingSpinner size="lg" message="Loading deals..." />
                  </div>
                ) : linkedDeals.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      icon={Briefcase}
                      title="No deals yet"
                      description="Create a deal for this lead company to start tracking your pipeline."
                      action={
                        <Button
                          type="button"
                          onClick={() => router.push(`/sales/deals/new?leadCompany=${id}`)}
                          className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-pink-500 border-0 text-white shadow-md hover:opacity-95"
                        >
                          <Plus className="h-4 w-4 shrink-0 inline mr-2 align-text-bottom" aria-hidden />
                          Add deal
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  <Table
                    columns={leadDealsColumns}
                    data={linkedDeals}
                    keyField="id"
                    variant="modern"
                    onRowClick={(row) => router.push(`/sales/deals/${row.id}`)}
                  />
                )}
              </div>
            </div>
          )}

          {detailTab === 'proposals' && (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-h-[1.25rem] text-sm text-gray-600">
                  {proposalsLoading ? (
                    <span className="text-gray-400">Loading proposals…</span>
                  ) : (
                    <>
                      Showing{' '}
                      <span className="font-semibold text-gray-900">{linkedProposals.length}</span> result
                      {linkedProposals.length !== 1 ? 's' : ''}
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/clients/proposals/new?leadCompany=${id}`)}
                  className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-95 sm:w-auto"
                >
                  <Plus className="h-4 w-4 shrink-0" aria-hidden />
                  New proposal
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {proposalsLoading ? (
                  <div className="flex flex-col items-center justify-center p-12">
                    <LoadingSpinner size="lg" message="Loading proposals..." />
                  </div>
                ) : linkedProposals.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      icon={FileText}
                      title="No proposals"
                      description="Proposals linked to this lead company will appear here. Create one to send a quote or SOW."
                      action={
                        <Button
                          type="button"
                          onClick={() => router.push(`/clients/proposals/new?leadCompany=${id}`)}
                          className="w-full border-0 bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md hover:opacity-95 sm:w-auto"
                        >
                          <Plus className="mr-2 inline h-4 w-4 shrink-0 align-text-bottom" aria-hidden />
                          New proposal
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  <Table
                    columns={leadProposalsColumns}
                    data={linkedProposals}
                    keyField="id"
                    variant="modern"
                    onRowClick={(row) => router.push(`/clients/proposals/${row.id}`)}
                  />
                )}
              </div>
            </div>
          )}

          {detailTab === 'meetings' && (
            <Card variant="elevated" className="rounded-xl p-5">
              <MeetingsEmbedList
                fetchFn={() => meetingService.getByLeadCompany(id)}
                scheduleHref={`/meetings/new?leadCompany=${id}`}
                emptyTitle="No meetings for this lead"
                entityLabel="this lead"
              />
            </Card>
          )}

          {contactActionMenu &&
            (() => {
              const row = linkedContacts.find((c) => c.id === contactActionMenu.id);
              if (!row) return null;
              return (
                <TableRowActionMenuPortal
                  open
                  anchor={{
                    top: contactActionMenu.top,
                    left: contactActionMenu.left,
                    triggerEl: contactActionMenu.triggerEl,
                  }}
                  onClose={() => setContactActionMenu(null)}
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                    onClick={() => {
                      setContactActionMenu(null);
                      console.log('Create meet for contact', row.id);
                    }}
                  >
                    <Video className="h-4 w-4 shrink-0 text-teal-600" />
                    Create Meet
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                    onClick={() => {
                      setContactActionMenu(null);
                      console.log('Create task for contact', row.id);
                    }}
                  >
                    <ClipboardList className="h-4 w-4 shrink-0 text-teal-600" />
                    Create Task
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                    onClick={() => {
                      setContactActionMenu(null);
                      navigator.clipboard.writeText(`${window.location.origin}/sales/contacts/${row.id}`);
                    }}
                  >
                    <Link2 className="h-4 w-4 shrink-0 text-teal-600" />
                    Copy URL
                  </button>
                </TableRowActionMenuPortal>
              );
            })()}

          <Modal
            isOpen={assigneeModalOpen}
            onClose={closeAssigneeModal}
            title="Change Assignee"
            size="lg"
            closeOnBackdrop={!savingAssignee}
          >
            <div className="space-y-5">
              <p className="text-sm text-gray-500">Assign lead to a team member</p>
              <p className="text-sm text-gray-700">
                Select a user to assign{' '}
                <span className="font-semibold text-gray-900">{name}</span> to:
              </p>
              {assigneeUsersLoading ? (
                <div className="flex justify-center py-10">
                  <LoadingSpinner />
                </div>
              ) : (
                <Select
                  label="Assign To"
                  value={assigneePickUserId}
                  onChange={(v) => setAssigneePickUserId(v)}
                  options={assigneeModalUserOptions}
                  placeholder="Select user"
                />
              )}
              {assigneeModalError ? (
                <p className="text-sm text-red-600 text-center" role="alert">
                  {assigneeModalError}
                </p>
              ) : null}
              <div className="mt-1 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="muted"
                  disabled={savingAssignee}
                  onClick={closeAssigneeModal}
                  className="w-full rounded-xl border-[1.5px] border-gray-400 bg-gray-300 px-5 py-2.5 sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={savingAssignee || assigneeUsersLoading || !assigneePickUserId}
                  rounded="default"
                  onClick={saveAssigneePick}
                  className="w-full min-w-[8.5rem] rounded-xl border-0 bg-gradient-to-r from-orange-500 to-pink-500 py-2.5 font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-60 sm:w-auto"
                >
                  {savingAssignee ? 'Updating…' : 'Update Assignee'}
                </Button>
              </div>
            </div>
          </Modal>

          {/* Convert to Client confirmation modal */}
          <Modal
            isOpen={convertModalOpen}
            onClose={() => { if (!converting) { setConvertModalOpen(false); setConvertError(''); } }}
            title="Convert to Client Account"
            size="md"
            closeOnBackdrop={!converting}
          >
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                <p className="text-sm text-orange-900">
                  <span className="font-semibold">This action cannot be undone</span>
                </p>
              </div>
              <p className="text-sm text-gray-700">
                Are you sure you want to convert{' '}
                <span className="font-semibold text-gray-900">{name}</span> to a client account?
              </p>
              <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-orange-700">
                  ✨ This will:
                </p>
                <ul className="space-y-1 text-sm text-orange-900">
                  <li>• Move the company to Client Accounts section</li>
                  <li>• Preserve all contacts and their information</li>
                  <li>• Maintain all deals and proposals</li>
                  <li>• Keep activity history and notes</li>
                  <li>• Enable client-specific features and billing</li>
                </ul>
              </div>
              {convertError ? (
                <p className="text-sm text-red-600 text-center" role="alert">
                  {convertError}
                </p>
              ) : null}
              <div className="mt-1 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="muted"
                  disabled={converting}
                  onClick={() => { setConvertModalOpen(false); setConvertError(''); }}
                  className="w-full rounded-xl border-[1.5px] border-gray-400 bg-gray-300 px-5 py-2.5 sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={converting}
                  onClick={handleConvertToClient}
                  rounded="default"
                  className="w-full min-w-[10rem] rounded-xl border-0 bg-gradient-to-r from-orange-500 to-pink-500 py-2.5 font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-60 sm:w-auto"
                >
                  {converting ? (
                    'Converting…'
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Convert to Client
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Modal>

          <Modal
            isOpen={addContactOpen}
            onClose={closeAddContactModal}
            title="Add Contact"
            size="lg"
            closeOnBackdrop={!addContactSubmitting}
          >
            <form onSubmit={submitAddContact} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  label="First Name"
                  required
                  value={addContactForm.firstName}
                  onChange={(e) => setAddContactField('firstName', e.target.value)}
                  error={addContactErrors.firstName}
                />
                <Input
                  label="Last Name"
                  required
                  value={addContactForm.lastName}
                  onChange={(e) => setAddContactField('lastName', e.target.value)}
                  error={addContactErrors.lastName}
                />
              </div>
              <Input
                label="Email"
                type="email"
                required
                value={addContactForm.email}
                onChange={(e) => setAddContactField('email', e.target.value)}
                error={addContactErrors.email}
              />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  label="Phone"
                  value={addContactForm.phone}
                  onChange={(e) => setAddContactField('phone', e.target.value)}
                />
                <Input
                  label="Job Title"
                  value={addContactForm.jobTitle}
                  onChange={(e) => setAddContactField('jobTitle', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  label="Department"
                  value={addContactForm.department}
                  onChange={(e) => setAddContactField('department', e.target.value)}
                />
                <Select
                  label="Role"
                  placeholder="Select role"
                  options={addContactRoleOptions}
                  value={addContactForm.contactRole}
                  onChange={(value) => setAddContactField('contactRole', value)}
                />
              </div>
              {addContactErrors.submit ? (
                <p className="text-sm text-red-600 text-center">{addContactErrors.submit}</p>
              ) : null}
              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 mt-1 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="muted"
                  disabled={addContactSubmitting}
                  onClick={closeAddContactModal}
                  className="w-full sm:w-auto rounded-xl bg-gray-300 border-[1.5px] border-gray-400 px-5 py-2.5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addContactSubmitting}
                  rounded="default"
                  className="w-full sm:w-auto min-w-[8.5rem] rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 border-0 text-white font-semibold shadow-md hover:opacity-95 disabled:opacity-60 py-2.5"
                >
                  {addContactSubmitting ? 'Adding…' : 'Add Contact'}
                </Button>
              </div>
            </form>
          </Modal>
        </>
      )}
    </div>
  );
}
