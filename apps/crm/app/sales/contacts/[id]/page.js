'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Edit,
  Share2,
  Download,
  Mail,
  MapPin,
  Phone,
  User,
  UserRound,
  Star,
  Activity,
  Calendar,
  CheckCircle2,
  Building2,
  AlignLeft,
  Linkedin,
  Twitter,
  Target,
  Eye,
  ExternalLink,
} from 'lucide-react';
import {
  Button,
  Card,
  Badge,
  Avatar,
  KPICard,
  TabsWithActions,
  LoadingSpinner,
  Input,
  Textarea,
  ActivitiesTimeline,
  EntityActivityPanel,
} from '@webfudge/ui';
import CRMPageHeader from '../../../../components/CRMPageHeader';
import contactService from '../../../../lib/api/contactService';
import { fetchActivityTimeline, fetchContactComments, addContactComment } from '../../../../lib/api/crmActivityService';
import { canEditCRMRecord, canManageCRM } from '../../../../lib/rbac';
import { fetchChatMentionUsers } from '../../../../lib/chatMentionUsers';

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

/** Returns a safe https URL for external links, or null if empty. */
function normalizeExternalHref(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
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

function isPresent(value) {
  if (value == null) return false;
  const s = String(value).trim();
  return s.length > 0 && s !== '—';
}

function InfoSection({ title, icon: Icon, children, isFirst = false, className = '' }) {
  const base = isFirst ? 'pt-0' : 'border-t border-gray-100 pt-4';
  return (
    <section className={`${base} ${className}`.trim()}>
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

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailTab, setDetailTab] = useState('overview');
  const [editingContactInfo, setEditingContactInfo] = useState(false);
  const [contactInfoDraft, setContactInfoDraft] = useState(null);
  const [savingContactInfo, setSavingContactInfo] = useState(false);
  const [contactInfoSaveError, setContactInfoSaveError] = useState('');
  const [editingAddressInfo, setEditingAddressInfo] = useState(false);
  const [addressDraft, setAddressDraft] = useState(null);
  const [savingAddressInfo, setSavingAddressInfo] = useState(false);
  const [addressSaveError, setAddressSaveError] = useState('');
  const [crmTimeline, setCrmTimeline] = useState([]);
  const [crmTimelineTotal, setCrmTimelineTotal] = useState(0);
  const [crmTimelineLoading, setCrmTimelineLoading] = useState(false);
  const [crmTimelineError, setCrmTimelineError] = useState(null);
  const canEditContact = canEditCRMRecord('contacts', contact);
  const canManageContacts = canManageCRM('contacts');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await contactService.getOne(id);
        if (!cancelled && res?.data) setContact(res.data);
        else if (!cancelled) setContact(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const reloadCrmTimeline = useCallback(
    async (opts = {}) => {
      const silent = opts.silent === true;
      if (!id) return;
      if (!silent) {
        setCrmTimelineLoading(true);
        setCrmTimelineError(null);
      }
      try {
        const { data, total } = await fetchActivityTimeline({ contactId: id, limit: 80 });
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

  const name = useMemo(() => {
    if (!contact) return 'Contact';
    if (contact.firstName || contact.lastName) {
      return [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim() || 'Contact';
    }
    return contact.name || 'Contact';
  }, [contact]);

  const subtitle = useMemo(() => {
    if (!contact || loading) return null;
    const title =
      contact.jobTitle ||
      contact.title ||
      contact.roleLabel ||
      contact.department ||
      '';
    const status = (contact.status || 'ACTIVE').toString().replace(/_/g, ' ');
    const statusBit = `${status} Contact`;
    if (title) return `${title} • ${statusBit}`;
    return statusBit;
  }, [contact, loading]);

  const locationLine = useMemo(() => {
    if (!contact) return '';
    if (contact.location && String(contact.location).trim()) return String(contact.location).trim();
    const parts = [contact.city, contact.state, contact.country].filter(Boolean);
    return parts.length ? parts.join(', ') : '';
  }, [contact]);

  const activitiesCount = crmTimelineTotal;

  const healthPercent = useMemo(() => {
    if (!contact) return 0;
    const h = contact.healthScore ?? contact.score ?? 0;
    const n = Number(h);
    if (Number.isNaN(n)) return 0;
    return Math.min(100, Math.max(0, n));
  }, [contact]);

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

  const lastActivityDisplay = useMemo(() => {
    if (!contact) return '—';
    const latest = crmTimeline?.[0]?.createdAt;
    if (latest) {
      const rel = formatRelativeTime(latest);
      return rel || formatDate(latest);
    }
    if (contact.lastActivityAt) {
      const rel = formatRelativeTime(contact.lastActivityAt);
      return rel || formatDate(contact.lastActivityAt);
    }
    if (contact.updatedAt) {
      const rel = formatRelativeTime(contact.updatedAt);
      if (rel) return `Updated ${rel}`;
      return `Updated ${formatDate(contact.updatedAt)}`;
    }
    return 'No recent activity';
  }, [contact, crmTimeline]);

  /** Strapi entity id for API + routes (matches `/sales/lead-companies` list links). Prefer `id` over `documentId` — findOne expects numeric id, not documentId string. */
  const leadCompanyId = useMemo(() => {
    if (!contact?.leadCompany) return null;
    const lc = contact.leadCompany;
    if (typeof lc !== 'object') return null;
    const raw = lc.id ?? lc.documentId;
    return raw != null ? String(raw) : null;
  }, [contact]);

  const leadCompanyName = useMemo(() => {
    if (!contact) return '';
    if (contact.leadCompany && typeof contact.leadCompany === 'object') {
      return contact.leadCompany.companyName || contact.leadCompany.name || '';
    }
    return contact.companyName || contact.company || '';
  }, [contact]);

  const clientAccountId = useMemo(() => {
    if (!contact?.clientAccount) return null;
    const ca = contact.clientAccount;
    if (typeof ca !== 'object') {
      return ca != null ? String(ca) : null;
    }
    const raw = ca.id ?? ca.documentId;
    return raw != null ? String(raw) : null;
  }, [contact]);

  const clientAccountName = useMemo(() => {
    if (!contact?.clientAccount || typeof contact.clientAccount !== 'object') return '';
    return contact.clientAccount.companyName || contact.clientAccount.name || '';
  }, [contact]);

  const isLeadConvertedToClient = useMemo(() => {
    const lc = contact?.leadCompany;
    if (!lc || typeof lc !== 'object') return false;
    const status = (lc.status || '').toString().toUpperCase();
    return status === 'CONVERTED' || status === 'CLIENT' || lc.convertedAccount != null;
  }, [contact]);

  const companyIndustry = useMemo(() => {
    if (!contact) return '—';
    if (contact.clientAccount && typeof contact.clientAccount === 'object') {
      return humanizeSource(contact.clientAccount.industry || '');
    }
    if (contact.leadCompany && typeof contact.leadCompany === 'object') {
      return humanizeSource(contact.leadCompany.industry || '');
    }
    return humanizeSource(contact.industry || '');
  }, [contact]);

  const isLinkedLeadCompany = Boolean(
    contact?.leadCompany && typeof contact.leadCompany === 'object' && leadCompanyId
  );
  const isLinkedClientAccount = Boolean(
    contact?.clientAccount && typeof contact.clientAccount === 'object' && clientAccountId
  );
  const companyStatusLabel = isLinkedClientAccount || isLeadConvertedToClient ? 'Client' : isLinkedLeadCompany ? 'Lead' : null;

  const linkedinHref = useMemo(
    () => normalizeExternalHref(contact?.linkedinUrl || contact?.linkedin || contact?.linkedIn),
    [contact]
  );
  const twitterHref = useMemo(
    () => normalizeExternalHref(contact?.twitterUrl || contact?.twitter),
    [contact]
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
    if (!contact || typeof window === 'undefined') return;
    const blob = new Blob([JSON.stringify(contact, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `contact-${contact.id || id}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const openContactInfoEdit = () => {
    if (!canEditContact) return;
    if (!contact) return;
    setContactInfoDraft({
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      address: contact.address ?? '',
      city: contact.city ?? '',
      state: contact.state ?? '',
      country: contact.country ?? '',
      zipCode: contact.zipCode ?? '',
      department: contact.department ?? '',
      preferredContactMethod: contact.preferredContactMethod ?? contact.preferredChannel ?? '',
      source: contact.source ?? '',
      notes: contact.notes ?? contact.about ?? contact.bio ?? contact.description ?? '',
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
    if (!canEditContact) return;
    setContactInfoSaveError('');
    if (!contactInfoDraft.email.trim()) {
      setContactInfoSaveError('Email is required.');
      return;
    }
    setSavingContactInfo(true);
    try {
      const payload = {
        email: contactInfoDraft.email.trim(),
        phone: contactInfoDraft.phone.trim(),
        address: contactInfoDraft.address.trim(),
        city: contactInfoDraft.city.trim(),
        state: contactInfoDraft.state.trim(),
        country: contactInfoDraft.country.trim(),
        zipCode: contactInfoDraft.zipCode.trim(),
        department: contactInfoDraft.department.trim(),
        preferredContactMethod: contactInfoDraft.preferredContactMethod.trim(),
        source: contactInfoDraft.source.trim(),
        notes: contactInfoDraft.notes.trim(),
      };
      const res = await contactService.update(id, payload);
      if (res?.data) {
        setContact((prev) => (prev ? { ...prev, ...res.data } : res.data));
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

  const openAddressEdit = () => {
    if (!canEditContact) return;
    if (!contact) return;
    setAddressDraft({
      address: contact.address ?? '',
      city: contact.city ?? '',
      state: contact.state ?? '',
      country: contact.country ?? '',
      zipCode: contact.zipCode ?? '',
    });
    setAddressSaveError('');
    setEditingAddressInfo(true);
  };

  const cancelAddressEdit = () => {
    setEditingAddressInfo(false);
    setAddressDraft(null);
    setAddressSaveError('');
  };

  const setAddressDraftField = (field, value) => {
    setAddressDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const saveAddressInfo = async () => {
    if (!id || !addressDraft) return;
    if (!canEditContact) return;
    setAddressSaveError('');
    setSavingAddressInfo(true);
    try {
      const payload = {
        address: addressDraft.address.trim(),
        city: addressDraft.city.trim(),
        state: addressDraft.state.trim(),
        country: addressDraft.country.trim(),
        zipCode: addressDraft.zipCode.trim(),
      };
      const res = await contactService.update(id, payload);
      if (res?.data) {
        setContact((prev) => (prev ? { ...prev, ...res.data } : res.data));
      }
      setEditingAddressInfo(false);
      setAddressDraft(null);
      void reloadCrmTimeline({ silent: true });
    } catch (e) {
      setAddressSaveError(e?.message || 'Failed to save address');
    } finally {
      setSavingAddressInfo(false);
    }
  };

  const statusDisplay = (contact?.status || 'ACTIVE').toString().replace(/_/g, ' ').toUpperCase();
  const sourceKpi =
    isLinkedClientAccount || isLeadConvertedToClient
      ? 'Client'
      : humanizeSource(contact?.source || contact?.leadSource || 'MANUAL');

  const companyDisplayName =
    (isLinkedClientAccount ? clientAccountName : '') ||
    leadCompanyName.trim() ||
    '—';

  const detailTabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'activities', label: 'Activities' },
    { key: 'details', label: 'Details' },
  ];

  const preferredMethod = contact?.preferredContactMethod || contact?.preferredChannel;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <CRMPageHeader
        title={loading ? 'Loading...' : name}
        subtitle={subtitle || undefined}
        breadcrumb={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sales', href: '/sales' },
          { label: 'Contacts', href: '/sales/contacts' },
          { label: name, href: `/sales/contacts/${id}` },
        ]}
        showProfile
      >
        <div className="flex flex-wrap items-center justify-end gap-2">
          {canEditContact ? (
            <Link href={`/sales/contacts/${id}/edit`} className={headerIconBtnClass} title="Edit">
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
            disabled={!contact}
          >
            <Download className="h-5 w-5" />
          </button>
        </div>
      </CRMPageHeader>

      {loading ? (
        <Card variant="elevated" className="flex justify-center p-12">
          <LoadingSpinner message="Loading contact..." />
        </Card>
      ) : !contact ? (
        <Card variant="elevated" className="p-12 text-center">
          <p className="text-gray-600">Contact not found.</p>
          <Link href="/sales/contacts" className="mt-4 inline-block">
            <Button variant="primary">Back to contacts</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              compact
              title="Status"
              value={statusDisplay}
              icon={CheckCircle2}
              colorScheme="orange"
            />
            <KPICard
              compact
              title="Activities"
              value={activitiesCount}
              icon={Activity}
              colorScheme="orange"
            />
            <KPICard compact title="Source" value={sourceKpi} icon={User} colorScheme="orange" />
            <KPICard
              compact
              title="Created"
              value={formatDate(contact.createdAt)}
              icon={Calendar}
              colorScheme="orange"
            />
          </div>

          <TabsWithActions variant="pill" tabs={detailTabs} activeTab={detailTab} onTabChange={setDetailTab} />

          {detailTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <Card variant="elevated" className="rounded-xl">
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                      <h2 className="text-xl font-semibold text-gray-900">Contact information</h2>
                      <p className="mt-1.5 text-base text-gray-500">
                        How to reach this person and where they sit in the organization.
                      </p>
                    </div>
                    <div
                      className="flex shrink-0 sm:justify-end"
                      title={`Status: ${(contact.status || 'ACTIVE').toString().replace(/_/g, ' ')}`}
                    >
                      <span
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/90 bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-100 px-4 py-2.5 text-sm font-bold uppercase tracking-widest text-emerald-900 shadow-md ring-2 ring-emerald-200/70"
                        role="status"
                      >
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2.25} aria-hidden />
                        {(contact.status || 'ACTIVE').toString().replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {editingContactInfo && contactInfoDraft ? (
                    <>
                      <InfoSection title="Basic information" icon={UserRound} className="pb-2 mb-4" isFirst>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                          <Input
                            label="Email"
                            type="email"
                            value={contactInfoDraft.email}
                            onChange={(e) => setContactInfoDraftField('email', e.target.value)}
                            icon={Mail}
                          />
                          <Input
                            label="Phone"
                            value={contactInfoDraft.phone}
                            onChange={(e) => setContactInfoDraftField('phone', e.target.value)}
                            icon={Phone}
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
                            label="Country"
                            value={contactInfoDraft.country}
                            onChange={(e) => setContactInfoDraftField('country', e.target.value)}
                          />
                          <Input
                            label="ZIP / postal"
                            value={contactInfoDraft.zipCode}
                            onChange={(e) => setContactInfoDraftField('zipCode', e.target.value)}
                          />
                          <Input
                            label="Department"
                            value={contactInfoDraft.department}
                            onChange={(e) => setContactInfoDraftField('department', e.target.value)}
                            icon={Building2}
                          />
                          <Input
                            label="Preferred contact method"
                            value={contactInfoDraft.preferredContactMethod}
                            onChange={(e) =>
                              setContactInfoDraftField('preferredContactMethod', e.target.value)
                            }
                            icon={Phone}
                          />
                          <Input
                            label="Source"
                            value={contactInfoDraft.source}
                            onChange={(e) => setContactInfoDraftField('source', e.target.value)}
                            icon={Target}
                          />
                        </div>
                      </InfoSection>

                      <InfoSection title="About" icon={AlignLeft} isFirst={false} className="pb-2 mb-4">
                        <Textarea
                          rows={5}
                          value={contactInfoDraft.notes}
                          onChange={(e) => setContactInfoDraftField('notes', e.target.value)}
                          className="mt-1 text-base"
                          placeholder="Notes or description"
                        />
                      </InfoSection>

                      {contactInfoSaveError ? (
                        <p className="mb-3 text-center text-sm text-red-600">{contactInfoSaveError}</p>
                      ) : null}

                      <div className="mb-4 flex flex-wrap items-center justify-center gap-3 border-t border-gray-100 pt-4">
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
                      <InfoSection title="Basic information" icon={UserRound} className="pb-2 mb-4" isFirst>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                          <InfoRow label="Email" icon={Mail} value={contact.email || ''} />
                          <InfoRow label="Phone" icon={Phone} value={contact.phone || ''} />
                          <InfoRow label="Location" icon={MapPin} value={locationLine} />
                          <InfoRow
                            label="Department"
                            icon={Building2}
                            value={contact.department || ''}
                          />
                          <InfoRow
                            label="Preferred contact method"
                            icon={Phone}
                            value={preferredMethod ? humanizeSource(preferredMethod) : ''}
                          />
                          <InfoRow label="Source" icon={Target} value={sourceKpi} />
                        </div>
                      </InfoSection>

                      <InfoSection title="About" icon={AlignLeft} isFirst={false} className="pb-2 mb-4">
                        {isPresent(contact.about || contact.bio || contact.description || contact.notes) ? (
                          <p className="mt-2.5 whitespace-pre-wrap text-base font-normal leading-relaxed text-gray-800">
                            {contact.notes || contact.about || contact.bio || contact.description}
                          </p>
                        ) : (
                          <p className="mt-2.5 text-base font-normal text-gray-400">—</p>
                        )}
                      </InfoSection>
                    </>
                  )}

                  {!editingContactInfo && canEditContact ? (
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
                        href={`/sales/contacts/${id}/edit`}
                        className="font-medium text-gray-500 hover:text-orange-600 hover:underline"
                      >
                        Full edit page
                      </Link>
                    </p>
                  ) : null}
                </Card>

                <Card
                  variant="outlined"
                  className="rounded-xl border border-gray-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.06)]"
                >
                  <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                    Company Information
                  </h2>

                  <div className="mt-5 flex gap-3.5 sm:gap-4">
                    <div
                      className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-sky-500 to-violet-600 p-0 shadow-sm ring-1 ring-black/5"
                      aria-hidden
                    >
                      <Building2 className="h-12 w-12 text-white" strokeWidth={1.25} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-4">
                      <div>
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <p className="text-lg font-bold leading-tight text-slate-900 sm:text-xl">
                            {companyDisplayName}
                          </p>
                          {companyStatusLabel ? (
                            <span className="text-sm font-normal text-gray-400">{companyStatusLabel}</span>
                          ) : null}
                        </div>
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-500">Industry</p>
                          <p className="mt-1 text-base font-normal text-slate-900">{companyIndustry}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-gray-100 pt-4">
                    {isLinkedClientAccount ? (
                      <Link href={`/clients/accounts/${clientAccountId}`} className="inline-flex">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2 rounded-lg px-4 py-2 font-semibold shadow-sm hover:shadow"
                        >
                          <Eye className="h-4 w-4 shrink-0" strokeWidth={2} />
                          View Client Account
                        </Button>
                      </Link>
                    ) : leadCompanyId ? (
                      <Link href={`/sales/lead-companies/${leadCompanyId}`} className="inline-flex">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2 rounded-lg px-4 py-2 font-semibold shadow-sm hover:shadow"
                        >
                          <Eye className="h-4 w-4 shrink-0" strokeWidth={2} />
                          {isLeadConvertedToClient ? 'View Source Lead Company' : 'View Lead Company'}
                        </Button>
                      </Link>
                    ) : canEditContact ? (
                      <Link href={`/sales/contacts/${id}/edit`} className="inline-flex">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2 rounded-lg px-4 py-2 font-semibold shadow-sm hover:shadow"
                        >
                          <Building2 className="h-4 w-4 shrink-0" strokeWidth={2} />
                          Add company / link lead
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </Card>

                <Card variant="elevated" className="rounded-xl">
                  <h2 className="mb-2 text-xl font-semibold text-gray-900">Address information</h2>
                  <p className="mb-4 text-base text-gray-500">Primary location on file.</p>
                  {editingAddressInfo && addressDraft ? (
                    <>
                      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <Input
                            label="Street address"
                            value={addressDraft.address}
                            onChange={(e) => setAddressDraftField('address', e.target.value)}
                            icon={MapPin}
                          />
                        </div>
                        <Input
                          label="City"
                          value={addressDraft.city}
                          onChange={(e) => setAddressDraftField('city', e.target.value)}
                        />
                        <Input
                          label="State / region"
                          value={addressDraft.state}
                          onChange={(e) => setAddressDraftField('state', e.target.value)}
                        />
                        <Input
                          label="ZIP / postal"
                          value={addressDraft.zipCode}
                          onChange={(e) => setAddressDraftField('zipCode', e.target.value)}
                        />
                        <Input
                          label="Country"
                          value={addressDraft.country}
                          onChange={(e) => setAddressDraftField('country', e.target.value)}
                        />
                      </div>
                      {addressSaveError ? (
                        <p className="mt-3 text-sm text-red-600">{addressSaveError}</p>
                      ) : null}
                      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
                        <Button
                          type="button"
                          variant="primary"
                          disabled={savingAddressInfo}
                          onClick={saveAddressInfo}
                        >
                          {savingAddressInfo ? 'Saving…' : 'Save changes'}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={savingAddressInfo}
                          onClick={cancelAddressEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <InfoRow label="Location" icon={MapPin} value={locationLine} />
                  )}
                  {!editingAddressInfo && canEditContact ? (
                    <p className="mt-4 border-t border-gray-100 pt-3 text-center text-sm text-gray-500">
                      <button
                        type="button"
                        onClick={openAddressEdit}
                        className="font-medium text-orange-600 hover:underline"
                      >
                        Edit address details
                      </button>
                      <span className="mx-2 text-gray-300" aria-hidden>
                        ·
                      </span>
                      <Link
                        href={`/sales/contacts/${id}/edit`}
                        className="font-medium text-gray-500 hover:text-orange-600 hover:underline"
                      >
                        Full edit page
                      </Link>
                    </p>
                  ) : null}
                </Card>
              </div>

              <div className="space-y-4">
                <Card variant="elevated" className="rounded-xl">
                  <h2 className="mb-3 text-xl font-semibold text-gray-900">Contact owner</h2>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar
                        fallback={assigneeInitials(contact.assignedTo)}
                        alt={assigneeName(contact.assignedTo)}
                        size="lg"
                        className="!bg-brand-primary font-semibold text-white shadow-sm ring-2 ring-brand-primary/25"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-gray-900">
                          {assigneeName(contact.assignedTo)}
                        </p>
                        <p className="text-sm text-gray-500">{assigneeRole(contact.assignedTo)}</p>
                        <div className="mt-0.5 flex items-center gap-1 text-sm text-gray-600">
                          <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                          <span className="font-medium">4.9 rating</span>
                        </div>
                      </div>
                    </div>
                    {canManageContacts ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full shrink-0 gap-2 !border-gray-300 bg-white !text-gray-700 shadow-sm hover:bg-gray-50 hover:!text-gray-900 sm:w-auto"
                        onClick={() => router.push(`/sales/contacts/${id}/edit`)}
                      >
                        <User className="h-4 w-4 shrink-0 text-gray-600" strokeWidth={1.75} />
                        Change assignee
                      </Button>
                    ) : null}
                  </div>
                </Card>

                <Card variant="elevated" className="rounded-xl">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                    <h2 className="text-xl font-semibold text-gray-900">Contact health</h2>
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
                          Derived from the health score stored on this contact.
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
                            {activitiesCount}
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
                          <p className="text-xs font-medium text-gray-500">Created</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            {formatDate(contact.createdAt)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
                          <p className="text-xs font-medium text-gray-500">Segment</p>
                          <div className="mt-1.5">
                            {contact.segment ? (
                              <Badge
                                variant="primary"
                                className="border border-orange-200 bg-orange-50 text-orange-800"
                              >
                                {(contact.segment || '').toString()}
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

                <Card variant="elevated" className="rounded-xl">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Quick links</h2>
                    <p className="mt-1 text-sm leading-relaxed text-gray-500">
                      Email, social profiles, and other one-tap shortcuts.
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {contact.email ? (
                      <li>
                        <a
                          href={`mailto:${contact.email}`}
                          className="group flex items-center gap-3 rounded-xl border border-gray-200/90 bg-white p-3 shadow-sm transition-colors hover:border-orange-200 hover:bg-orange-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                        >
                          <span
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600 ring-1 ring-orange-100/80"
                            aria-hidden
                          >
                            <Mail className="h-5 w-5" strokeWidth={2} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-gray-900">Send email</span>
                            <span className="mt-0.5 block truncate text-xs text-gray-500">{contact.email}</span>
                          </span>
                          <ExternalLink
                            className="h-4 w-4 shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
                            aria-hidden
                          />
                        </a>
                      </li>
                    ) : null}
                  </ul>

                  <div className="mt-5 border-t border-gray-100 pt-5">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Social profiles
                    </h3>
                    <div className="flex flex-wrap gap-3" role="list">
                      {linkedinHref ? (
                        <a
                          href={linkedinHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          role="listitem"
                          title="Open LinkedIn"
                          aria-label="Open LinkedIn profile"
                          className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0A66C2]/10 text-[#0A66C2] shadow-sm ring-1 ring-[#0A66C2]/20 transition-colors hover:bg-[#0A66C2]/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A66C2]"
                        >
                          <Linkedin className="h-6 w-6" strokeWidth={2} aria-hidden />
                        </a>
                      ) : (
                        <span
                          role="listitem"
                          title="LinkedIn not added"
                          aria-label="LinkedIn not added"
                          className="flex h-12 w-12 cursor-default items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-300 select-none"
                        >
                          <Linkedin className="h-6 w-6" strokeWidth={2} aria-hidden />
                        </span>
                      )}
                      {twitterHref ? (
                        <a
                          href={twitterHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          role="listitem"
                          title="Open X (Twitter)"
                          aria-label="Open X or Twitter profile"
                          className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 shadow-sm ring-1 ring-sky-500/25 transition-colors hover:bg-sky-500/16 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                        >
                          <Twitter className="h-6 w-6" strokeWidth={2} aria-hidden />
                        </a>
                      ) : (
                        <span
                          role="listitem"
                          title="X (Twitter) not added"
                          aria-label="X or Twitter not added"
                          className="flex h-12 w-12 cursor-default items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-300 select-none"
                        >
                          <Twitter className="h-6 w-6" strokeWidth={2} aria-hidden />
                        </span>
                      )}
                    </div>
                  </div>

                  {!contact.email && !linkedinHref && !twitterHref && canEditContact ? (
                    <p className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-3 py-3 text-center text-sm text-gray-500">
                      Add email or social URLs on the{' '}
                      <Link
                        href={`/sales/contacts/${id}/edit`}
                        className="font-medium text-orange-600 underline-offset-2 hover:underline"
                      >
                        full edit page
                      </Link>{' '}
                      to enable shortcuts here.
                    </p>
                  ) : null}
                </Card>
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
                      <span className="text-lg font-bold text-orange-900 tabular-nums">{activitiesCount}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                      <span className="text-xs font-medium text-gray-600">Last activity</span>
                      <span className="text-xs font-semibold text-gray-800">{lastActivityDisplay}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                      <span className="text-xs font-medium text-gray-600">Status</span>
                      <span className="text-xs font-semibold text-gray-800">
                        {(contact.status || 'ACTIVE').replace(/_/g, ' ')}
                      </span>
                    </div>
                    {contact.email && (
                      <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                        <span className="text-xs font-medium text-gray-600">Email</span>
                        <span className="text-xs font-semibold text-gray-800 truncate max-w-[180px]">{contact.email}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                      <span className="text-xs font-medium text-gray-600">Created</span>
                      <span className="text-xs font-semibold text-gray-800">{formatDate(contact.createdAt)}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right: Activity + Chat panel */}
              <div className="lg:col-span-3">
                <EntityActivityPanel
                  entityType="contact"
                  entityId={id}
                  entityName={name}
                  crmTimeline={crmTimeline}
                  crmTimelineLoading={crmTimelineLoading}
                  crmTimelineError={crmTimelineError}
                  activityCount={activitiesCount}
                  fetchCommentsFn={({ entityId }) =>
                    fetchContactComments({ contactId: entityId, limit: 80 })
                  }
                  addCommentFn={({ entityId, comment }) =>
                    addContactComment({ contactId: entityId, comment })
                  }
                  fetchMentionUsers={fetchChatMentionUsers}
                />
              </div>
            </div>
          )}

          {detailTab === 'details' && (
            <Card variant="elevated" className="rounded-xl">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Record details</h2>
                <p className="mt-1.5 text-base text-gray-500">Internal identifiers and extended fields.</p>
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <InfoRow label="First name" value={contact.firstName || ''} />
                <InfoRow label="Last name" value={contact.lastName || ''} />
                <InfoRow label="Document ID" value={contact.documentId != null ? String(contact.documentId) : ''} />
                <InfoRow label="Record ID" value={contact.id != null ? String(contact.id) : ''} />
                <InfoRow label="Job title" value={contact.jobTitle || contact.title || ''} />
                <InfoRow label="Timezone" value={contact.timezone || ''} />
              </div>
              {canEditContact ? (
                <p className="mt-4 border-t border-gray-100 pt-3 text-center text-sm text-gray-500">
                  <Link href={`/sales/contacts/${id}/edit`} className="font-medium text-orange-600 hover:underline">
                    Edit all fields
                  </Link>
                </p>
              ) : null}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
