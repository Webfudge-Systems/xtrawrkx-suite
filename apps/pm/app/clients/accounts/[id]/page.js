'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Edit,
  Share2,
  Download,
  Building2,
  Users,
  Briefcase,
  Target,
  DollarSign,
  MapPin,
  Mail,
  Phone,
  Globe,
  AlignLeft,
  Calendar,
  Layers,
  User,
  Star,
  Eye,
  Pencil,
  Linkedin,
  ExternalLink,
  Video,
  FileText,
  MoreHorizontal,
  ClipboardList,
  Link2,
  Plus,
  Activity,
  Receipt,
  FolderKanban,
} from 'lucide-react';
import {
  Button,
  Card,
  Badge,
  Avatar,
  KPICard,
  TabsWithActions,
  LoadingSpinner,
  EmptyState,
  Table,
  Modal,
  Select,
  Input,
  Textarea,
  TableRowActionMenuPortal,
  ActivitiesTimeline,
  EntityActivityPanel,
  TableCellOrangePill,
  TableCellDealStageSelect,
  useIndustrySelectOptions,
} from '@webfudge/ui';
import PMPageHeader from '../../../../components/PMPageHeader';
import clientAccountService from '../../../../lib/api/clientAccountService';
import contactService from '../../../../lib/api/contactService';
import { usePmTableSort } from '../../../../hooks/usePmTableSort';
import dealService from '../../../../lib/api/dealService';
import invoiceService from '../../../../lib/api/invoiceService';
import projectService from '../../../../lib/api/projectServiceCrm';
import { fetchActivityTimeline, fetchClientAccountComments, addClientAccountComment } from '../../../../lib/api/crmActivityService';
import strapiClient from '../../../../lib/strapiClient';
import { MeetingsEmbedList } from '@webfudge/ui';
import meetingService from '../../../../lib/api/meetingService';
import { canWriteClientAccounts, canWriteCrmModule } from '../../../../lib/rbac';
import { fetchChatMentionUsers } from '../../../../lib/api/chatMentionUsers';
import { pmAddProjectUrl, pmProjectDetailUrl } from '../../../../lib/pmAppUrl';
import {
  crmContactUrl,
  crmContactEditUrl,
  crmDealUrl,
  crmDealEditUrl,
  crmNewDealUrl,
  crmNewContactUrl,
  crmLeadCompanyUrl,
  crmInvoiceUrl,
  crmInvoiceEditUrl,
  crmNewInvoiceUrl,
} from '../../../../lib/crmAppUrl';
import {
  companyTypeSelectOptions,
  INDUSTRY_OTHER_VALUE,
  industryFormFromStored,
  resolveIndustryForSave,
  canonicalCompanyTypeValue,
} from '@webfudge/utils';
import { fetchStoredIndustriesForPm } from '../../../../lib/industryOptionsLoader';
import { getIndustryVisual } from '@webfudge/ui/utils/industryVisuals';

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

function humanizeSource(source) {
  if (!source) return '—';
  return String(source)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isActiveProjectStatus(status) {
  const s = (status || 'PLANNING').toUpperCase();
  if (s === 'COMPLETED' || s === 'DONE' || s === 'CLOSED') return false;
  if (s === 'PLANNING' || s === 'DRAFT') return false;
  return true;
}

function projectTaskCount(project) {
  const t = project?.tasks;
  return Array.isArray(t) ? t.length : 0;
}

function openPmProject(project) {
  const slug = project?.slug || project?.id;
  if (!slug) return;
  window.location.href = pmProjectDetailUrl(slug);
}

function openPmAddProject(clientAccountId) {
  window.location.href = pmAddProjectUrl(clientAccountId);
}

const INVOICE_STATUS_BADGE = {
  DRAFT: { variant: 'default', label: 'Draft' },
  SENT: { variant: 'info', label: 'Sent' },
  PAID: { variant: 'success', label: 'Paid' },
  OVERDUE: { variant: 'danger', label: 'Overdue' },
  CANCELLED: { variant: 'default', label: 'Cancelled' },
  PARTIAL: { variant: 'warning', label: 'Partial' },
};

function isPresent(value) {
  if (value == null) return false;
  const s = String(value).trim();
  return s.length > 0 && s !== '—';
}

function normalizeExternalHref(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
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
          <p
            className={`text-base leading-snug ${empty ? 'font-normal text-gray-400' : 'font-semibold text-gray-900'}`}
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
  if (!user || typeof user !== 'object') return 'Account manager';
  const r = user.primaryRole ?? user.role;
  if (r && typeof r === 'object') {
    return r.name || r.type || 'Account manager';
  }
  if (typeof r === 'string' && r.trim()) return r;
  return 'Account manager';
}

const headerIconBtnClass =
  'p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg text-brand-text-light';

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

export default function ClientAccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linkedContacts, setLinkedContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [linkedDeals, setLinkedDeals] = useState([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [stageSavingId, setStageSavingId] = useState(null);
  const [linkedInvoices, setLinkedInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [linkedProjects, setLinkedProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [meetingsCount, setMeetingsCount] = useState(0);
  const [detailTab, setDetailTab] = useState('overview');

  const [assigneeModalOpen, setAssigneeModalOpen] = useState(false);
  const [assigneeUsers, setAssigneeUsers] = useState([]);
  const [assigneeUsersLoading, setAssigneeUsersLoading] = useState(false);
  const [assigneePickUserId, setAssigneePickUserId] = useState('');
  const [assigneeModalError, setAssigneeModalError] = useState('');
  const [savingAssignee, setSavingAssignee] = useState(false);

  const [crmTimeline, setCrmTimeline] = useState([]);
  const [crmTimelineTotal, setCrmTimelineTotal] = useState(0);
  const [crmTimelineLoading, setCrmTimelineLoading] = useState(false);
  const [crmTimelineError, setCrmTimelineError] = useState(null);
  const [contactActionMenu, setContactActionMenu] = useState(null);
  const canEditClientAccount = canWriteClientAccounts();
  const canCreateDeals = canWriteCrmModule('deals');
  const canCreateInvoices = canWriteCrmModule('client_invoices');
  const canCreateProjects = canWriteCrmModule('client_projects');

  const { options: industrySelectOptions, onIndustrySaved } = useIndustrySelectOptions({
    fetchStoredIndustries: fetchStoredIndustriesForPm,
    seedIndustries: account?.industry ? [account.industry] : [],
  });

  const [editingCompanyInfo, setEditingCompanyInfo] = useState(false);
  const [companyInfoDraft, setCompanyInfoDraft] = useState(null);
  const [savingCompanyInfo, setSavingCompanyInfo] = useState(false);
  const [companyInfoSaveError, setCompanyInfoSaveError] = useState('');

  const [editingContactInfo, setEditingContactInfo] = useState(false);
  const [contactInfoDraft, setContactInfoDraft] = useState(null);
  const [savingContactInfo, setSavingContactInfo] = useState(false);
  const [contactInfoSaveError, setContactInfoSaveError] = useState('');

  const leadCompanyIdForTimeline = useMemo(() => {
    const lead = account?.convertedFromLead;
    if (!lead) return null;
    if (typeof lead === 'object') {
      const raw = lead.id ?? lead.documentId;
      return raw != null ? String(raw) : null;
    }
    return String(lead);
  }, [account]);

  const loadLinkedContacts = useCallback(
    async (acct) => {
      if (!id || !acct) return;
      setContactsLoading(true);
      try {
        const fromPopulate = Array.isArray(acct.contacts) ? acct.contacts : [];
        if (fromPopulate.length > 0) {
          const sorted = [...fromPopulate].sort(
            (a, b) => Number(!!b.isPrimaryContact) - Number(!!a.isPrimaryContact)
          );
          setLinkedContacts(sorted);
          return;
        }
        const idEq = Number.isNaN(Number(id)) ? id : Number(id);
        const targetId = String(id);
        const isRelatedToClientAccount = (contact) => {
          const ca = contact?.clientAccount;
          if (ca == null) return false;
          if (typeof ca !== 'object') return String(ca) === targetId;
          const cid = ca.id ?? ca.documentId ?? ca.value ?? null;
          return cid != null && String(cid) === targetId;
        };
        let contactsList = [];
        try {
          const contactsRes = await contactService.getAll({
            'pagination[pageSize]': 100,
            sort: 'createdAt:desc',
            populate: ['assignedTo', 'clientAccount'],
            filters: {
              clientAccount: { id: { $eq: idEq } },
            },
          });
          const raw = Array.isArray(contactsRes.data) ? contactsRes.data : [];
          contactsList = raw.filter(isRelatedToClientAccount);
        } catch {
          const contactsRes = await contactService.getAll({
            'pagination[pageSize]': 100,
            sort: 'createdAt:desc',
            populate: ['assignedTo', 'clientAccount'],
          });
          const all = Array.isArray(contactsRes.data) ? contactsRes.data : [];
          contactsList = all.filter(isRelatedToClientAccount);
        }
        contactsList.sort((a, b) => Number(!!b.isPrimaryContact) - Number(!!a.isPrimaryContact));
        setLinkedContacts(contactsList);
      } catch (e) {
        console.error(e);
        setLinkedContacts([]);
      } finally {
        setContactsLoading(false);
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
        const targetId = String(id);
        const isRelatedToClientAccount = (deal) => {
          const ca = deal?.clientAccount;
          if (ca == null) return false;
          if (typeof ca !== 'object') return String(ca) === targetId;
          const cid = ca.id ?? ca.documentId ?? null;
          return cid != null && String(cid) === targetId;
        };
        try {
          const dealsRes = await dealService.getAll({
            'pagination[pageSize]': 100,
            sort: 'createdAt:desc',
            populate: ['assignedTo', 'clientAccount'],
            filters: {
              clientAccount: {
                id: { $eq: idEq },
              },
            },
          });
          const raw = Array.isArray(dealsRes.data) ? dealsRes.data : [];
          setLinkedDeals(raw.filter(isRelatedToClientAccount));
        } catch {
          const dealsRes = await dealService.getAll({
            'pagination[pageSize]': 100,
            sort: 'createdAt:desc',
            populate: ['assignedTo', 'clientAccount'],
          });
          const all = Array.isArray(dealsRes.data) ? dealsRes.data : [];
          setLinkedDeals(all.filter(isRelatedToClientAccount));
        }
      } catch (e) {
        console.error(e);
        setLinkedDeals([]);
      } finally {
        if (showLoadingSpinner) setDealsLoading(false);
      }
    },
    [id]
  );

  const loadLinkedInvoices = useCallback(
    async (showLoadingSpinner = false) => {
      if (!id) return;
      if (showLoadingSpinner) setInvoicesLoading(true);
      try {
        const idEq = Number.isNaN(Number(id)) ? id : Number(id);
        const targetId = String(id);
        const isRelatedToClientAccount = (inv) => {
          const ca = inv?.clientAccount;
          if (ca == null) return false;
          if (typeof ca !== 'object') return String(ca) === targetId;
          const cid = ca.id ?? ca.documentId ?? null;
          return cid != null && String(cid) === targetId;
        };
        try {
          const invRes = await invoiceService.getAll({
            'pagination[pageSize]': 100,
            sort: 'createdAt:desc',
            populate: ['assignedTo', 'clientAccount', 'deal'],
            filters: {
              clientAccount: {
                id: { $eq: idEq },
              },
            },
          });
          const raw = Array.isArray(invRes.data) ? invRes.data : [];
          setLinkedInvoices(raw.filter(isRelatedToClientAccount));
        } catch {
          const invRes = await invoiceService.getAll({
            'pagination[pageSize]': 100,
            sort: 'createdAt:desc',
            populate: ['assignedTo', 'clientAccount', 'deal'],
          });
          const all = Array.isArray(invRes.data) ? invRes.data : [];
          setLinkedInvoices(all.filter(isRelatedToClientAccount));
        }
      } catch (e) {
        console.error(e);
        setLinkedInvoices([]);
      } finally {
        if (showLoadingSpinner) setInvoicesLoading(false);
      }
    },
    [id]
  );

  const loadLinkedProjects = useCallback(
    async (showLoadingSpinner = false) => {
      if (!id) return;
      if (showLoadingSpinner) setProjectsLoading(true);
      try {
        const idEq = Number.isNaN(Number(id)) ? id : Number(id);
        const targetId = String(id);
        const isRelatedToClientAccount = (project) => {
          const ca = project?.clientAccount;
          if (ca == null) return false;
          if (typeof ca !== 'object') return String(ca) === targetId;
          const cid = ca.id ?? ca.documentId ?? null;
          return cid != null && String(cid) === targetId;
        };
        try {
          const projRes = await projectService.getAll({
            'pagination[pageSize]': 100,
            sort: 'updatedAt:desc',
            populate: ['projectManager', 'clientAccount', 'tasks', 'sourceDeal'],
            filters: {
              clientAccount: {
                id: { $eq: idEq },
              },
            },
          });
          const raw = Array.isArray(projRes.data) ? projRes.data : [];
          setLinkedProjects(raw.filter(isRelatedToClientAccount));
        } catch {
          const projRes = await projectService.getAll({
            'pagination[pageSize]': 100,
            sort: 'updatedAt:desc',
            populate: ['projectManager', 'clientAccount', 'tasks', 'sourceDeal'],
          });
          const all = Array.isArray(projRes.data) ? projRes.data : [];
          setLinkedProjects(all.filter(isRelatedToClientAccount));
        }
      } catch (e) {
        console.error(e);
        setLinkedProjects([]);
      } finally {
        if (showLoadingSpinner) setProjectsLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setDealsLoading(true);
      setInvoicesLoading(true);
      setProjectsLoading(true);
      setLinkedDeals([]);
      setLinkedInvoices([]);
      setLinkedProjects([]);
      setMeetingsCount(0);
      try {
        const res = await clientAccountService.getOne(id);
        if (!cancelled && res?.data) {
          setAccount(res.data);
          await loadLinkedContacts(res.data);
          await loadLinkedDeals(false);
          await loadLinkedInvoices(false);
          await loadLinkedProjects(false);
          try {
            const n = await meetingService.countByClientAccount(id);
            if (!cancelled) setMeetingsCount(typeof n === 'number' && !Number.isNaN(n) ? n : 0);
          } catch {
            if (!cancelled) setMeetingsCount(0);
          }
        } else if (!cancelled) {
          setAccount(null);
          setLinkedContacts([]);
          setLinkedDeals([]);
          setLinkedInvoices([]);
          setLinkedProjects([]);
          setMeetingsCount(0);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setAccount(null);
          setLinkedContacts([]);
          setLinkedDeals([]);
          setLinkedInvoices([]);
          setLinkedProjects([]);
          setMeetingsCount(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setDealsLoading(false);
          setInvoicesLoading(false);
          setProjectsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, loadLinkedContacts, loadLinkedDeals, loadLinkedInvoices, loadLinkedProjects]);

  const reloadCrmTimeline = useCallback(
    async (opts = {}) => {
      const silent = opts.silent === true;
      if (!leadCompanyIdForTimeline) {
        if (!silent) {
          setCrmTimeline([]);
          setCrmTimelineTotal(0);
          setCrmTimelineLoading(false);
          setCrmTimelineError(null);
        }
        return;
      }
      if (!silent) {
        setCrmTimelineLoading(true);
        setCrmTimelineError(null);
      }
      try {
        const { data, total } = await fetchActivityTimeline({
          leadCompanyId: leadCompanyIdForTimeline,
          limit: 80,
        });
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
    [leadCompanyIdForTimeline]
  );

  useEffect(() => {
    reloadCrmTimeline({ silent: false });
  }, [reloadCrmTimeline]);

  const name = account?.companyName || account?.name || 'Client account';

  const subtitle = useMemo(() => {
    if (!account || loading) return null;
    const typeBit = humanizeSource(account.type || account.industry || 'Client');
    const accType = humanizeSource(account.accountType || 'Customer');
    return `Client Account • ${typeBit} • ${accType}`;
  }, [account, loading]);

  const contactsCount = linkedContacts.length;

  const headquarters = useMemo(() => {
    if (!account) return '';
    const parts = [account.city, account.state, account.country].filter(Boolean);
    return parts.length ? parts.join(', ') : '';
  }, [account]);

  const industryVisual = useMemo(() => {
    const raw =
      editingCompanyInfo && companyInfoDraft?.industry != null
        ? companyInfoDraft.industry
        : account?.industry;
    return getIndustryVisual(raw);
  }, [account?.industry, editingCompanyInfo, companyInfoDraft?.industry]);
  const IndustryIcon = industryVisual.Icon;

  const statusUpper = (account?.status || 'ACTIVE').toString().replace(/_/g, ' ').toUpperCase();
  const activityCount = crmTimelineTotal;

  const lastActivityDisplay = useMemo(() => {
    if (!account) return '—';
    const latest = crmTimeline?.[0]?.createdAt;
    if (latest) {
      const rel = formatRelativeTime(latest);
      return rel || formatDate(latest);
    }
    if (account.updatedAt) {
      const rel = formatRelativeTime(account.updatedAt);
      if (rel) return `Updated ${rel}`;
      return `Updated ${formatDate(account.updatedAt)}`;
    }
    return 'No recent activity';
  }, [account, crmTimeline]);

  const assigneeModalUserOptions = useMemo(
    () =>
      assigneeUsers.map((u) => {
        const label = assigneeName(u);
        const fallback = u.email || u.username || (u.id != null ? `User ${u.id}` : 'User');
        const display =
          label && label !== 'Team member' && label !== 'Unassigned' ? label : fallback;
        return { value: String(u.id), label: display };
      }),
    [assigneeUsers]
  );

  const openCompanyInfoEdit = () => {
    if (!canEditClientAccount) return;
    if (!account) return;
    const { industry, industryOther } = industryFormFromStored(account.industry ?? '');
    setCompanyInfoDraft({
      industry,
      industryOther,
      type: canonicalCompanyTypeValue(account.type ?? ''),
      employees: account.employees != null ? String(account.employees) : '',
      billingCycle: account.billingCycle ?? '',
      accountType: account.accountType ?? '',
      founded: account.founded != null ? String(account.founded) : '',
      clientSince: account.onboardingDate || account.conversionDate || account.createdAt || '',
      description: account.description ?? '',
    });
    setCompanyInfoSaveError('');
    setEditingCompanyInfo(true);
  };

  const cancelCompanyInfoEdit = () => {
    setEditingCompanyInfo(false);
    setCompanyInfoDraft(null);
    setCompanyInfoSaveError('');
  };

  const setCompanyInfoDraftField = (field, value) => {
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
    if (!canEditClientAccount) return;
    setSavingCompanyInfo(true);
    setCompanyInfoSaveError('');
    try {
      const resolvedIndustry = resolveIndustryForSave(
        companyInfoDraft.industry,
        companyInfoDraft.industryOther
      );
      if (!resolvedIndustry) {
        setCompanyInfoSaveError('Industry is required');
        setSavingCompanyInfo(false);
        return;
      }
      if (
        companyInfoDraft.industry === INDUSTRY_OTHER_VALUE &&
        !companyInfoDraft.industryOther?.trim()
      ) {
        setCompanyInfoSaveError('Please specify your industry');
        setSavingCompanyInfo(false);
        return;
      }
      const payload = {
        industry: resolvedIndustry,
        type: companyInfoDraft.type.trim() || null,
        employees: companyInfoDraft.employees.trim() || null,
        billingCycle: companyInfoDraft.billingCycle.trim() || null,
        accountType: companyInfoDraft.accountType.trim() || null,
        founded: companyInfoDraft.founded.trim() || null,
        onboardingDate: companyInfoDraft.clientSince.trim() || null,
        description: companyInfoDraft.description.trim() || null,
      };
      await clientAccountService.update(id, payload);
      onIndustrySaved(resolvedIndustry);
      const refreshed = await clientAccountService.getOne(id);
      if (refreshed?.data) setAccount(refreshed.data);
      setEditingCompanyInfo(false);
      setCompanyInfoDraft(null);
    } catch (e) {
      setCompanyInfoSaveError(e?.message || 'Failed to save company details');
    } finally {
      setSavingCompanyInfo(false);
    }
  };

  const openContactInfoEdit = () => {
    if (!canEditClientAccount) return;
    if (!account) return;
    setContactInfoDraft({
      website: account.website ?? '',
      phone: account.phone ?? '',
      email: account.email ?? '',
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
    if (!canEditClientAccount) return;
    setSavingContactInfo(true);
    setContactInfoSaveError('');
    try {
      const payload = {
        website: contactInfoDraft.website.trim() || null,
        phone: contactInfoDraft.phone.trim() || null,
        email: contactInfoDraft.email.trim() || null,
      };
      await clientAccountService.update(id, payload);
      const refreshed = await clientAccountService.getOne(id);
      if (refreshed?.data) setAccount(refreshed.data);
      setEditingContactInfo(false);
      setContactInfoDraft(null);
    } catch (e) {
      setContactInfoSaveError(e?.message || 'Failed to save contact details');
    } finally {
      setSavingContactInfo(false);
    }
  };

  const openChangeAssigneeModal = useCallback(async () => {
    if (!canEditClientAccount) return;
    if (!account || !id) return;
    const currentId =
      account.assignedTo && typeof account.assignedTo === 'object'
        ? account.assignedTo.id
        : account.assignedTo;
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
      console.error(err);
      setAssigneeModalError(
        err?.message?.includes('403') || err?.message?.includes('401')
          ? 'You do not have access to load team members for this organization.'
          : 'Could not load team members for your organization.'
      );
      setAssigneeUsers([]);
    } finally {
      setAssigneeUsersLoading(false);
    }
  }, [account, canEditClientAccount, id]);

  const closeAssigneeModal = useCallback(() => {
    if (savingAssignee) return;
    setAssigneeModalOpen(false);
    setAssigneeModalError('');
  }, [savingAssignee]);

  const saveAssigneePick = useCallback(async () => {
    if (!canEditClientAccount) return;
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
      await clientAccountService.update(id, { assignedTo: n });
      const refreshed = await clientAccountService.getOne(id);
      if (refreshed?.data) setAccount(refreshed.data);
      setAssigneeModalOpen(false);
      void reloadCrmTimeline({ silent: true });
    } catch (e) {
      setAssigneeModalError(e?.message || 'Failed to update assignee');
    } finally {
      setSavingAssignee(false);
    }
  }, [assigneePickUserId, canEditClientAccount, id, reloadCrmTimeline]);

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
    if (!account || typeof window === 'undefined') return;
    const blob = new Blob([JSON.stringify(account, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `client-account-${account.id || id}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const linkedinHref = useMemo(
    () => normalizeExternalHref(account?.linkedIn || account?.linkedin),
    [account]
  );
  const twitterHref = useMemo(() => normalizeExternalHref(account?.twitter), [account]);

  const leadContactsColumns = useMemo(
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
                {contact.jobTitle || (contact.contactRole ? contact.contactRole.replace(/_/g, ' ') : '') || '—'}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'phone',
        label: 'PHONE',
        render: (_, contact) => (
          <div className="min-w-[160px] truncate text-sm text-gray-600">{contact.phone || '—'}</div>
        ),
      },
      {
        key: 'email',
        label: 'EMAIL',
        render: (_, contact) => (
          <div className="min-w-[180px] truncate text-sm text-gray-600">{contact.email || '—'}</div>
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
                {contact.contactRole.trim().replace(/_/g, ' ')}
              </span>
            );
          }
          return <span className="text-sm text-gray-400">—</span>;
        },
      },
      {
        key: 'actions',
        label: 'ACTIONS',
        render: (_, contact) => (
          <div className="flex min-w-[140px] items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
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
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-slate-700 hover:bg-slate-100"
              title="View"
              onClick={(e) => {
                e.stopPropagation();
                router.push(crmContactUrl(contact.id));
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
                router.push(crmContactEditUrl(contact.id));
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

  const handleDealStageChange = useCallback(async (dealId, newStage) => {
    if (!canWriteCrmModule('deals')) return;
    setStageSavingId(dealId);
    try {
      await dealService.update(dealId, { stage: newStage });
      setLinkedDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
      );
    } catch (e) {
      console.error(e);
      alert(e?.message || 'Failed to update deal stage.');
    } finally {
      setStageSavingId(null);
    }
  }, []);

  const clientAccountDealsColumns = useMemo(
    () => [
      {
        key: 'deal',
        label: 'DEAL',
        render: (_, deal) => (
          <div className="flex min-w-[200px] items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100">
              <Briefcase className="h-4 w-4 text-orange-600" />
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold text-gray-900">{deal.name || 'Unnamed deal'}</div>
              <div className="truncate text-sm text-gray-500">{deal.dealGroup || '—'}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'value',
        label: 'VALUE',
        render: (_, deal) => (
          <span className="whitespace-nowrap font-semibold tabular-nums text-gray-900">
            {formatCurrency(deal.value)}
          </span>
        ),
      },
      {
        key: 'stage',
        label: 'STAGE',
        render: (_, deal) => (
          <TableCellDealStageSelect
            stage={deal.stage}
            onStageChange={(next) => handleDealStageChange(deal.id, next)}
            saving={stageSavingId === deal.id}
            canEdit={canWriteCrmModule('deals')}
          />
        ),
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
            <span
              className={`inline-flex whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${cls}`}
            >
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
            <div className="flex min-w-[160px] items-center gap-2">
              <Avatar
                fallback={assigneeInitials(u)}
                alt={ownerLabel}
                size="sm"
                className="flex-shrink-0 bg-gray-600"
              />
              <span className="truncate font-semibold text-gray-900">{ownerLabel}</span>
            </div>
          );
        },
      },
      {
        key: 'expectedCloseDate',
        label: 'CLOSE DATE',
        render: (_, deal) => (
          <div className="min-w-[110px]">
            <div className="whitespace-nowrap text-sm font-medium text-gray-900">
              {formatDate(deal.expectedCloseDate)}
            </div>
          </div>
        ),
      },
      {
        key: 'actions',
        label: 'ACTIONS',
        render: (_, deal) => (
          <div className="flex min-w-[80px] items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-slate-700 hover:bg-slate-100"
              title="View"
              onClick={(e) => {
                e.stopPropagation();
                router.push(crmDealUrl(deal.id));
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
                router.push(crmDealEditUrl(deal.id));
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [router, stageSavingId, handleDealStageChange]
  );

  const clientAccountInvoicesColumns = useMemo(
    () => [
      {
        key: 'invoice',
        label: 'INVOICE',
        render: (_, inv) => (
          <div className="flex min-w-[200px] items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-sky-50">
              <Receipt className="h-4 w-4 text-sky-600" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold text-gray-900">{inv.invoiceNumber || '—'}</div>
              <div className="truncate text-sm text-gray-500">
                {humanizeSource(inv.documentType || 'INVOICE')}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'amount',
        label: 'AMOUNT',
        render: (_, inv) => (
          <span className="whitespace-nowrap font-semibold tabular-nums text-gray-900">
            {formatCurrency(inv.total)}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'STATUS',
        render: (_, inv) => {
          const st = (inv.status || 'DRAFT').toUpperCase();
          const cfg = INVOICE_STATUS_BADGE[st] || INVOICE_STATUS_BADGE.DRAFT;
          return (
            <Badge variant={cfg.variant} className="whitespace-nowrap font-semibold uppercase">
              {cfg.label}
            </Badge>
          );
        },
      },
      {
        key: 'invoiceDate',
        label: 'DATE',
        render: (_, inv) => (
          <div className="min-w-[100px] whitespace-nowrap text-sm font-medium text-gray-900">
            {formatDate(inv.invoiceDate || inv.createdAt)}
          </div>
        ),
      },
      {
        key: 'dueDate',
        label: 'DUE',
        render: (_, inv) => (
          <div className="min-w-[100px] whitespace-nowrap text-sm text-gray-700">
            {formatDate(inv.dueDate)}
          </div>
        ),
      },
      {
        key: 'deal',
        label: 'DEAL',
        render: (_, inv) => {
          const d = inv.deal;
          if (d && typeof d === 'object') {
            const dn = d.name || 'Deal';
            return (
              <button
                type="button"
                className="max-w-[180px] truncate text-left text-sm font-medium text-orange-700 hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  if (d.id != null) router.push(crmDealUrl(d.id));
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
        render: (_, inv) => (
          <div className="flex min-w-[80px] items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-slate-700 hover:bg-slate-100"
              title="View"
              onClick={(e) => {
                e.stopPropagation();
                router.push(crmInvoiceUrl(inv.id));
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
                router.push(crmInvoiceEditUrl(inv.id));
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

  const clientAccountProjectsColumns = useMemo(
    () => [
      {
        key: 'project',
        label: 'PROJECT',
        render: (_, project) => (
          <div className="flex min-w-[200px] items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100">
              <FolderKanban className="h-4 w-4 text-orange-600" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold text-gray-900">{project.name || 'Untitled project'}</div>
              <div className="truncate text-sm text-gray-500">{project.slug || '—'}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        label: 'STATUS',
        render: (_, project) => <TableCellOrangePill value={project.status} />,
      },
      {
        key: 'manager',
        label: 'MANAGER',
        render: (_, project) => {
          const u = project.projectManager;
          const label = assigneeName(u);
          return (
            <div className="flex min-w-[160px] items-center gap-2">
              <Avatar
                fallback={assigneeInitials(u)}
                alt={label}
                size="sm"
                className="flex-shrink-0 bg-gray-600"
              />
              <span className="truncate font-semibold text-gray-900">{label}</span>
            </div>
          );
        },
      },
      {
        key: 'budget',
        label: 'BUDGET',
        render: (_, project) => (
          <span className="whitespace-nowrap font-semibold tabular-nums text-gray-900">
            {formatCurrency(project.budget)}
          </span>
        ),
      },
      {
        key: 'dates',
        label: 'TIMELINE',
        render: (_, project) => (
          <div className="min-w-[140px] text-sm text-gray-700">
            <div className="whitespace-nowrap font-medium text-gray-900">
              {formatDate(project.startDate)} – {formatDate(project.endDate)}
            </div>
          </div>
        ),
      },
      {
        key: 'tasks',
        label: 'TASKS',
        render: (_, project) => (
          <span className="whitespace-nowrap text-sm tabular-nums text-gray-700">
            {projectTaskCount(project)}
          </span>
        ),
      },
      {
        key: 'sourceDeal',
        label: 'SOURCE DEAL',
        render: (_, project) => {
          const d = project.sourceDeal;
          if (d && typeof d === 'object') {
            const dn = d.name || 'Deal';
            return (
              <button
                type="button"
                className="max-w-[180px] truncate text-left text-sm font-medium text-orange-700 hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  if (d.id != null) router.push(crmDealUrl(d.id));
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
        render: (_, project) => (
          <div className="flex min-w-[80px] items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-slate-700 hover:bg-slate-100"
              title="Open in PM"
              onClick={(e) => {
                e.stopPropagation();
                openPmProject(project);
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [router]
  );

  const accountId = id != null ? String(id) : '';

  const contactsTableSort = usePmTableSort({
    entity: 'contact',
    storageKey: accountId ? `pm.accountDetail.${accountId}.contacts.sort` : undefined,
    data: linkedContacts,
  });
  const dealsTableSort = usePmTableSort({
    entity: 'deal',
    storageKey: accountId ? `pm.accountDetail.${accountId}.deals.sort` : undefined,
    data: linkedDeals,
  });
  const projectsTableSort = usePmTableSort({
    entity: 'accountProject',
    storageKey: accountId ? `pm.accountDetail.${accountId}.projects.sort` : undefined,
    data: linkedProjects,
  });
  const invoicesTableSort = usePmTableSort({
    entity: 'invoice',
    storageKey: accountId ? `pm.accountDetail.${accountId}.invoices.sort` : undefined,
    data: linkedInvoices,
  });

  const sortableLeadContactsColumns = useMemo(
    () => contactsTableSort.bindSortableColumns(leadContactsColumns),
    [leadContactsColumns, contactsTableSort.bindSortableColumns]
  );
  const sortableDealsColumns = useMemo(
    () => dealsTableSort.bindSortableColumns(clientAccountDealsColumns),
    [clientAccountDealsColumns, dealsTableSort.bindSortableColumns]
  );
  const sortableProjectsColumns = useMemo(
    () => projectsTableSort.bindSortableColumns(clientAccountProjectsColumns),
    [clientAccountProjectsColumns, projectsTableSort.bindSortableColumns]
  );
  const sortableInvoicesColumns = useMemo(
    () => invoicesTableSort.bindSortableColumns(clientAccountInvoicesColumns),
    [clientAccountInvoicesColumns, invoicesTableSort.bindSortableColumns]
  );

  const activeDealsCount = useMemo(
    () =>
      linkedDeals.filter((d) => {
        const s = (d.stage || '').toLowerCase();
        return s !== 'won' && s !== 'lost';
      }).length,
    [linkedDeals]
  );

  const wonDealsCount = useMemo(
    () => linkedDeals.filter((d) => (d.stage || '').toLowerCase() === 'won').length,
    [linkedDeals]
  );

  const activeProjectsCount = useMemo(
    () => linkedProjects.filter((p) => isActiveProjectStatus(p.status)).length,
    [linkedProjects]
  );

  const detailTabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'contacts', label: 'Contacts', badge: contactsCount || undefined },
    { key: 'activities', label: 'Activities' },
    { key: 'deals', label: 'Deals', badge: linkedDeals.length || undefined },
    { key: 'projects', label: 'Projects', badge: linkedProjects.length || undefined },
    { key: 'invoices', label: 'Invoices', badge: linkedInvoices.length || undefined },
    { key: 'meetings', label: 'Meetings', badge: meetingsCount || undefined },
  ];

  const convertedLead = account?.convertedFromLead;
  const convertedLeadId =
    convertedLead && typeof convertedLead === 'object'
      ? convertedLead.id ?? convertedLead.documentId
      : convertedLead;
  const convertedLeadName =
    convertedLead && typeof convertedLead === 'object'
      ? convertedLead.companyName || convertedLead.name
      : null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PMPageHeader
        title={loading ? 'Loading...' : name}
        subtitle={subtitle || undefined}
        breadcrumb={[
          { label: 'Dashboard', href: '/' },
          { label: 'Clients', href: '/clients' },
          { label: 'Accounts', href: '/clients/accounts' },
          { label: name, href: `/clients/accounts/${id}` },
        ]}
        showProfile
      >
        <div className="flex flex-wrap items-center justify-end gap-2">
          {canEditClientAccount ? (
            <Link href={`/clients/accounts/${id}/edit`} className={headerIconBtnClass} title="Edit">
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
            disabled={!account}
          >
            <Download className="h-5 w-5" />
          </button>
        </div>
      </PMPageHeader>

      {loading ? (
        <Card variant="elevated" className="flex justify-center p-12">
          <LoadingSpinner message="Loading client account..." />
        </Card>
      ) : !account ? (
        <Card variant="elevated" className="p-12 text-center">
          <p className="text-gray-600">Client account not found.</p>
          <Link href="/clients/accounts" className="mt-4 inline-block">
            <Button variant="primary">Back to client accounts</Button>
          </Link>
        </Card>
      ) : (
        <>
          <Card
            variant="elevated"
            className={`rounded-2xl border bg-gradient-to-r p-4 sm:p-5 ${industryVisual.cardBorderClass} ${industryVisual.cardGradientClass}`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-inner ring-1 ${industryVisual.iconBgClass} ${industryVisual.accentClass} ${industryVisual.iconRingClass}`}
                  aria-hidden
                >
                  <IndustryIcon className="h-8 w-8" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h2 className="min-w-0 text-xl font-semibold text-gray-900 sm:text-xl md:text-2xl">
                      {name}
                    </h2>
                    <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                      {statusUpper}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-900">
                      {humanizeSource(account.accountType || 'CUSTOMER')}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
                    <IndustryIcon className={`h-3.5 w-3.5 shrink-0 ${industryVisual.accentClass}`} aria-hidden />
                    <span className="font-medium text-gray-700">{industryVisual.label}</span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-0.5 border-t border-gray-100 pt-3 text-right lg:border-t-0 lg:pt-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                  TOTAL DEAL VALUE
                </p>
                <p className="text-xl font-bold tabular-nums text-gray-900 sm:text-2xl">
                  {formatCurrency(account.dealValue)}
                </p>
                <p className="text-xs text-gray-500 sm:text-sm">
                  Client since{' '}
                  <span className="font-semibold text-gray-800">
                    {formatDate(account.onboardingDate || account.conversionDate || account.createdAt)}
                  </span>
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <KPICard compact title="Total Contacts" value={contactsCount} icon={Users} colorScheme="orange" />
            <KPICard compact title="Active Deals" value={activeDealsCount} icon={DollarSign} colorScheme="orange" />
            <KPICard compact title="Won Deals" value={wonDealsCount} icon={Target} colorScheme="orange" />
            <KPICard
              compact
              title="Active Projects"
              value={projectsLoading ? '—' : activeProjectsCount}
              icon={Briefcase}
              colorScheme="orange"
            />
          </div>

          <TabsWithActions variant="pill" tabs={detailTabs} activeTab={detailTab} onTabChange={setDetailTab} />

          {detailTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <Card variant="elevated" className="rounded-xl">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Company information</h2>
                    <p className="mt-1.5 text-base text-gray-500">Profile, commercial data, and key dates.</p>
                  </div>

                  {editingCompanyInfo && companyInfoDraft ? (
                    <>
                      <InfoSection title="Company profile" icon={Building2} isFirst>
                        <div className="mb-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                          <Select
                            label="Industry"
                            value={companyInfoDraft.industry}
                            onChange={(value) => {
                              setCompanyInfoDraft((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      industry: value,
                                      industryOther:
                                        value === INDUSTRY_OTHER_VALUE ? prev.industryOther : '',
                                    }
                                  : prev
                              );
                            }}
                            options={industrySelectOptions}
                            placeholder="Select industry"
                            icon={IndustryIcon}
                            allowCustom
                            searchable
                          />
                          {companyInfoDraft.industry === INDUSTRY_OTHER_VALUE ? (
                            <Input
                              label="Specify industry"
                              value={companyInfoDraft.industryOther}
                              onChange={(e) =>
                                setCompanyInfoDraftField('industryOther', e.target.value)
                              }
                              placeholder="Enter your industry"
                            />
                          ) : null}
                          <Select
                            label="Company type"
                            value={companyInfoDraft.type}
                            onChange={(value) => setCompanyInfoDraftField('type', value)}
                            options={typeSelectOptions}
                            placeholder="Select company type"
                            icon={Layers}
                          />
                          <Input
                            label="Company size"
                            value={companyInfoDraft.employees}
                            onChange={(e) => setCompanyInfoDraftField('employees', e.target.value)}
                          />
                          <Input
                            label="Billing cycle"
                            value={companyInfoDraft.billingCycle}
                            onChange={(e) => setCompanyInfoDraftField('billingCycle', e.target.value)}
                          />
                          <Input
                            label="Account type"
                            value={companyInfoDraft.accountType}
                            onChange={(e) => setCompanyInfoDraftField('accountType', e.target.value)}
                          />
                          <Input
                            label="Founded"
                            value={companyInfoDraft.founded}
                            onChange={(e) => setCompanyInfoDraftField('founded', e.target.value)}
                          />
                          <Input
                            label="Client since"
                            value={companyInfoDraft.clientSince}
                            onChange={(e) => setCompanyInfoDraftField('clientSince', e.target.value)}
                            helperText="Stored as onboarding date for this account."
                          />
                        </div>
                      </InfoSection>

                      <InfoSection title="About" icon={AlignLeft}>
                        <Textarea
                          rows={5}
                          value={companyInfoDraft.description}
                          onChange={(e) => setCompanyInfoDraftField('description', e.target.value)}
                          className="mt-1 text-base"
                          placeholder="Brief description of the company"
                        />
                      </InfoSection>

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
                      <InfoSection title="Company profile" icon={Building2} isFirst>
                        <div className="mb-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                          <InfoRow
                            label="Industry"
                            value={industryVisual.label}
                            icon={IndustryIcon}
                            emphasize
                          />
                          <InfoRow
                            label="Company type"
                            value={account.type ? humanizeSource(account.type) : ''}
                            icon={Layers}
                          />
                          <InfoRow
                            label="Company size"
                            value={
                              account.employees != null && String(account.employees).trim()
                                ? account.employees
                                : ''
                            }
                            icon={Users}
                          />
                          <InfoRow
                            label="Billing cycle"
                            value={account.billingCycle ? humanizeSource(account.billingCycle) : ''}
                            icon={Calendar}
                          />
                          <InfoRow
                            label="Account type"
                            value={account.accountType ? humanizeSource(account.accountType) : ''}
                            icon={Briefcase}
                          />
                          <InfoRow
                            label="Founded"
                            value={
                              account.founded != null && String(account.founded).trim()
                                ? account.founded
                                : ''
                            }
                            icon={Calendar}
                          />
                          <InfoRow
                            label="Client since"
                            value={formatDate(
                              account.onboardingDate || account.conversionDate || account.createdAt
                            )}
                            icon={Calendar}
                          />
                        </div>
                      </InfoSection>

                      <InfoSection title="About" icon={AlignLeft}>
                        {isPresent(account.description) ? (
                          <p className="mt-2.5 whitespace-pre-wrap text-base font-normal leading-relaxed text-gray-800">
                            {account.description}
                          </p>
                        ) : (
                          <p className="mt-2.5 text-base text-gray-400">—</p>
                        )}
                      </InfoSection>

                      {canEditClientAccount ? (
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
                            href={`/clients/accounts/${id}/edit`}
                            className="font-medium text-gray-500 hover:text-orange-600 hover:underline"
                          >
                            Full edit page
                          </Link>
                        </p>
                      ) : null}
                    </>
                  )}
                </Card>

                <Card variant="elevated" className="rounded-xl">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Contact information</h2>
                    <p className="mt-1.5 text-base text-gray-500">
                      Phone, email, web, and headquarters used to reach this client.
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
                        <InfoRow label="Location" icon={MapPin} value={headquarters} />
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
                          {isPresent(account.website) ? (
                            <a
                              href={normalizeExternalHref(account.website)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:underline"
                            >
                              {account.website}
                              <ExternalLink className="h-4 w-4 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </InfoRow>
                        <InfoRow label="Phone" value={account.phone} icon={Phone} />
                        <InfoRow label="Email" value={account.email} icon={Mail} />
                        <InfoRow label="Location" value={headquarters} icon={MapPin} />
                      </div>
                      {canEditClientAccount ? (
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
                            href={`/clients/accounts/${id}/edit`}
                            className="font-medium text-gray-500 hover:text-orange-600 hover:underline"
                          >
                            Full edit page
                          </Link>
                        </p>
                      ) : null}
                    </>
                  )}
                </Card>

                {convertedLeadId ? (
                  <Card
                    variant="elevated"
                    className="rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50/90 to-amber-50/50"
                  >
                    <h2 className="text-lg font-semibold text-orange-950">Conversion history</h2>
                    <p className="mt-2 text-sm text-orange-900/90">
                      This account was converted from lead company{' '}
                      <Link
                        href={crmLeadCompanyUrl(convertedLeadId)}
                        className="font-semibold text-orange-700 underline decoration-orange-300 underline-offset-2 hover:text-orange-900"
                      >
                        {convertedLeadName || 'View lead'}
                      </Link>
                      {account.conversionDate ? (
                        <>
                          {' '}
                          on <span className="font-semibold">{formatDate(account.conversionDate)}</span>.
                        </>
                      ) : (
                        '.'
                      )}
                    </p>
                  </Card>
                ) : null}
              </div>

              <div className="space-y-4">
                <Card variant="elevated" className="rounded-xl">
                  <h2 className="mb-3 text-xl font-semibold text-gray-900">Account manager</h2>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar
                        fallback={assigneeInitials(account.assignedTo)}
                        alt={assigneeName(account.assignedTo)}
                        size="lg"
                        className="!bg-brand-primary font-semibold text-white shadow-sm ring-2 ring-brand-primary/25"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-gray-900">
                          {assigneeName(account.assignedTo)}
                        </p>
                        <p className="text-sm text-gray-500">{assigneeRole(account.assignedTo)}</p>
                        <div className="mt-0.5 flex items-center gap-1 text-sm text-gray-600">
                          <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                          <span className="font-medium">4.9 rating</span>
                        </div>
                      </div>
                    </div>
                    {canEditClientAccount ? (
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        className="w-full shrink-0 gap-2 !border-gray-300 bg-white !text-gray-700 shadow-sm hover:bg-gray-50 hover:!text-gray-900 sm:w-auto"
                        onClick={openChangeAssigneeModal}
                      >
                        <User className="h-4 w-4 shrink-0 text-gray-600" strokeWidth={1.75} />
                        Change assignee
                      </Button>
                    ) : null}
                  </div>
                </Card>

                <Card variant="elevated" className="rounded-xl">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Account activity</h2>
                    <p className="mt-1 text-sm text-gray-500">Recent engagement and timeline coverage.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-gray-100 bg-gradient-to-br from-slate-50 to-white px-3.5 py-3 shadow-sm">
                      <p className="text-xs font-medium text-gray-500">Last activity</p>
                      <p className="mt-1 text-sm font-semibold leading-snug text-gray-900">{lastActivityDisplay}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gradient-to-br from-slate-50 to-white px-3.5 py-3 shadow-sm">
                      <p className="text-xs font-medium text-gray-500">Timeline events</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900">
                        {leadCompanyIdForTimeline ? activityCount : '—'}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card variant="elevated" className="rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-gray-900">Quick links</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Email, social profiles, and other one-tap shortcuts.
                  </p>

                  <div className="mt-5 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <a
                      href={account?.email ? `mailto:${encodeURIComponent(account.email)}` : undefined}
                      className={`flex items-center gap-3 ${account?.email ? 'hover:opacity-90' : 'pointer-events-none'}`}
                      aria-disabled={!account?.email}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-200">
                        <Mail className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">Send email</p>
                        <p className={`truncate text-sm ${account?.email ? 'text-gray-600' : 'text-gray-400'}`}>
                          {account?.email || 'No email available'}
                        </p>
                      </div>
                    </a>
                  </div>

                  <div className="mt-5 border-t border-gray-100 pt-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Social profiles</p>
                    <div className="flex items-center gap-3">
                      <a
                        href={linkedinHref || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors ${linkedinHref
                            ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            : 'pointer-events-none border-slate-200 bg-slate-50 text-slate-300'
                          }`}
                        aria-disabled={!linkedinHref}
                        title={linkedinHref ? 'Open LinkedIn profile' : 'LinkedIn not available'}
                      >
                        <Linkedin className="h-6 w-6" />
                      </a>
                      <a
                        href={twitterHref || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-lg font-semibold transition-colors ${twitterHref
                            ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            : 'pointer-events-none border-slate-200 bg-slate-50 text-slate-300'
                          }`}
                        aria-disabled={!twitterHref}
                        title={twitterHref ? 'Open X / Twitter profile' : 'X / Twitter not available'}
                      >
                        <span aria-hidden>𝕏</span>
                      </a>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {detailTab === 'contacts' && (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-h-[1.25rem] text-sm text-gray-600">
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
                <Link
                  href={crmNewContactUrl(id)}
                  className="w-full shrink-0 sm:w-auto"
                >
                  <Button
                    type="button"
                    className="w-full bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-95 sm:w-auto"
                  >
                    Add contact
                  </Button>
                </Link>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {contactsLoading ? (
                  <div className="flex flex-col items-center justify-center p-12">
                    <LoadingSpinner size="lg" message="Loading contacts..." />
                  </div>
                ) : linkedContacts.length === 0 ? (
                  <div className="border-t border-gray-200 p-12 text-center">
                    <div className="mb-2 text-gray-400">
                      <Users className="mx-auto mb-3 h-12 w-12 opacity-50" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-700">No contacts found</h3>
                    <p className="mb-4 text-sm text-gray-500">Add your first contact to get started</p>
                    <Link href={crmNewContactUrl(id)}>
                      <Button variant="primary">
                        Add Contact
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Table
                    columns={sortableLeadContactsColumns}
                    data={contactsTableSort.sortedData}
                    keyField="id"
                    variant="modern"
                    onRowClick={(row) => router.push(crmContactUrl(row.id))}
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
                      <span className="text-lg font-bold text-orange-900 tabular-nums">
                        {leadCompanyIdForTimeline ? activityCount : '—'}
                      </span>
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
                      <span className="text-xs font-medium text-gray-600">Status</span>
                      <span className="text-xs font-semibold text-gray-800">{statusUpper}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                      <span className="text-xs font-medium text-gray-600">Created</span>
                      <span className="text-xs font-semibold text-gray-800">{formatDate(account.createdAt)}</span>
                    </div>
                  </div>
                  {!leadCompanyIdForTimeline && (
                    <p className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                      Activity timeline is linked from the original lead company. No lead link found.
                    </p>
                  )}
                </Card>
              </div>

              {/* Right: Activity + Chat panel */}
              <div className="lg:col-span-3">
                <EntityActivityPanel
                  entityType="client_account"
                  entityId={id}
                  entityName={name}
                  crmTimeline={crmTimeline}
                  crmTimelineLoading={crmTimelineLoading}
                  crmTimelineError={crmTimelineError}
                  activityCount={leadCompanyIdForTimeline ? activityCount : 0}
                  fetchCommentsFn={({ entityId }) =>
                    fetchClientAccountComments({ clientAccountId: entityId, limit: 80 })
                  }
                  addCommentFn={
                    canEditClientAccount
                      ? ({ entityId, comment }) => addClientAccountComment({ clientAccountId: entityId, comment })
                      : null
                  }
                  fetchMentionUsers={fetchChatMentionUsers}
                />
              </div>
            </div>
          )}

          {detailTab === 'deals' && (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-h-[1.25rem] text-sm text-gray-600">
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
                {canCreateDeals ? (
                  <button
                    type="button"
                    onClick={() => router.push(crmNewDealUrl(id))}
                    className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-95 sm:w-auto"
                  >
                    <Plus className="h-4 w-4 shrink-0" aria-hidden />
                    Add Deal
                  </button>
                ) : null}
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {dealsLoading ? (
                  <div className="flex flex-col items-center justify-center p-12">
                    <LoadingSpinner size="lg" message="Loading deals..." />
                  </div>
                ) : linkedDeals.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      icon={Briefcase}
                      title="No deals yet"
                      description={
                        canCreateDeals
                          ? 'Create a deal for this client account to track your pipeline.'
                          : 'No deals are linked to this client account yet.'
                      }
                      action={
                        canCreateDeals ? (
                          <Button
                            type="button"
                            onClick={() => router.push(crmNewDealUrl(id))}
                            className="w-full border-0 bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md hover:opacity-95 sm:w-auto"
                          >
                            <Plus
                              className="mr-2 inline h-4 w-4 shrink-0 align-text-bottom"
                              aria-hidden
                            />
                            Add deal
                          </Button>
                        ) : null
                      }
                    />
                  </div>
                ) : (
                  <Table
                    columns={sortableDealsColumns}
                    data={dealsTableSort.sortedData}
                    keyField="id"
                    variant="modern"
                    onRowClick={(row) => router.push(crmDealUrl(row.id))}
                  />
                )}
              </div>
            </div>
          )}

          {detailTab === 'projects' && (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-h-[1.25rem] text-sm text-gray-600">
                  {projectsLoading ? (
                    <span className="text-gray-400">Loading projects…</span>
                  ) : (
                    <>
                      Showing{' '}
                      <span className="font-semibold text-gray-900">{linkedProjects.length}</span> result
                      {linkedProjects.length !== 1 ? 's' : ''}
                    </>
                  )}
                </div>
                {canCreateProjects ? (
                  <button
                    type="button"
                    onClick={() => openPmAddProject(id)}
                    className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-95 sm:w-auto"
                  >
                    <Plus className="h-4 w-4 shrink-0" aria-hidden />
                    New project
                  </button>
                ) : null}
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {projectsLoading ? (
                  <div className="flex flex-col items-center justify-center p-12">
                    <LoadingSpinner size="lg" message="Loading projects..." />
                  </div>
                ) : linkedProjects.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      icon={FolderKanban}
                      title="No projects"
                      description={
                        canCreateProjects
                          ? 'Projects linked to this client account will appear here. Create one in PM to get started.'
                          : 'Projects linked to this client account will appear here.'
                      }
                      action={
                        canCreateProjects ? (
                          <Button
                            type="button"
                            onClick={() => openPmAddProject(id)}
                            className="w-full border-0 bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md hover:opacity-95 sm:w-auto"
                          >
                            <Plus
                              className="mr-2 inline h-4 w-4 shrink-0 align-text-bottom"
                              aria-hidden
                            />
                            New project
                          </Button>
                        ) : null
                      }
                    />
                  </div>
                ) : (
                  <Table
                    columns={sortableProjectsColumns}
                    data={projectsTableSort.sortedData}
                    keyField="id"
                    variant="modern"
                    onRowClick={(row) => openPmProject(row)}
                  />
                )}
              </div>
            </div>
          )}

          {detailTab === 'invoices' && (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-h-[1.25rem] text-sm text-gray-600">
                  {invoicesLoading ? (
                    <span className="text-gray-400">Loading invoices…</span>
                  ) : (
                    <>
                      Showing{' '}
                      <span className="font-semibold text-gray-900">{linkedInvoices.length}</span> result
                      {linkedInvoices.length !== 1 ? 's' : ''}
                    </>
                  )}
                </div>
                {canCreateInvoices ? (
                  <button
                    type="button"
                    onClick={() => router.push(crmNewInvoiceUrl(id))}
                    className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-95 sm:w-auto"
                  >
                    <Plus className="h-4 w-4 shrink-0" aria-hidden />
                    New invoice
                  </button>
                ) : null}
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {invoicesLoading ? (
                  <div className="flex flex-col items-center justify-center p-12">
                    <LoadingSpinner size="lg" message="Loading invoices..." />
                  </div>
                ) : linkedInvoices.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      icon={FileText}
                      title="No invoices"
                      description={
                        canCreateInvoices
                          ? 'Invoices linked to this client account will appear here. Create one to bill this client.'
                          : 'Invoices linked to this client account will appear here.'
                      }
                      action={
                        canCreateInvoices ? (
                          <Button
                            type="button"
                            onClick={() => router.push(crmNewInvoiceUrl(id))}
                            className="w-full border-0 bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md hover:opacity-95 sm:w-auto"
                          >
                            <Plus
                              className="mr-2 inline h-4 w-4 shrink-0 align-text-bottom"
                              aria-hidden
                            />
                            New invoice
                          </Button>
                        ) : null
                      }
                    />
                  </div>
                ) : (
                  <Table
                    columns={sortableInvoicesColumns}
                    data={invoicesTableSort.sortedData}
                    keyField="id"
                    variant="modern"
                    onRowClick={(row) => router.push(crmInvoiceUrl(row.id))}
                  />
                )}
              </div>
            </div>
          )}

          {detailTab === 'meetings' && (
            <Card variant="elevated" className="rounded-xl p-5">
              <MeetingsEmbedList
                fetchFn={() => meetingService.getByClientAccount(id)}
                scheduleHref={`/meetings/new?clientAccount=${id}`}
                emptyTitle="No meetings for this account"
                entityLabel="this account"
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
                      navigator.clipboard.writeText(crmContactUrl(row.id));
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
            title="Change assignee"
            size="lg"
            closeOnBackdrop={!savingAssignee}
          >
            <div className="space-y-5">
              <p className="text-sm text-gray-500">Assign this client account to a team member</p>
              <p className="text-sm text-gray-700">
                Select a user to assign <span className="font-semibold text-gray-900">{name}</span> to:
              </p>
              {assigneeUsersLoading ? (
                <div className="flex justify-center py-10">
                  <LoadingSpinner />
                </div>
              ) : (
                <Select
                  label="Assign to"
                  value={assigneePickUserId}
                  onChange={(v) => setAssigneePickUserId(v)}
                  options={assigneeModalUserOptions}
                  placeholder="Select user"
                />
              )}
              {assigneeModalError ? (
                <p className="text-center text-sm text-red-600" role="alert">
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
                  {savingAssignee ? 'Updating…' : 'Update assignee'}
                </Button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
