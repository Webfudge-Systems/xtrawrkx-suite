'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  Input,
  Select,
  Textarea,
  FormSectionCard,
  LoadingSpinner,
  Modal,
} from '@webfudge/ui';
import CRMPageHeader from '../../../../components/CRMPageHeader';
import meetingService from '../../../../lib/api/meetingService';
import leadCompanyService from '../../../../lib/api/leadCompanyService';
import clientAccountService from '../../../../lib/api/clientAccountService';
import contactService from '../../../../lib/api/contactService';
import dealService from '../../../../lib/api/dealService';
import {
  isLeadCompanyConverted,
  relationId,
  filterDealsForAnchor,
} from '../../../../lib/meetingCrmLink';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  FileText,
  Users,
  Building2,
  Briefcase,
  User,
  Bell,
  Eye,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Hash,
  AlignLeft,
} from 'lucide-react';

const SECTION_CARD_CLASS =
  'rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6';

const MEETING_TYPE_OPTIONS = [
  { value: 'discovery', label: 'Discovery' },
  { value: 'demo', label: 'Demo' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'check_in', label: 'Check-in' },
  { value: 'review', label: 'Review' },
  { value: 'internal', label: 'Internal' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No-show' },
];

const OUTCOME_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
];

const REMINDER_OPTIONS = [
  { value: 'none', label: 'No reminder' },
  { value: 'tenMin', label: '10 minutes before' },
  { value: 'thirtyMin', label: '30 minutes before' },
  { value: 'oneHour', label: '1 hour before' },
  { value: 'oneDay', label: '1 day before' },
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public (everyone)' },
  { value: 'team', label: 'Team only' },
  { value: 'private', label: 'Private' },
];

const ATTENDEE_ROLE_OPTIONS = [
  { value: 'required', label: 'Required' },
  { value: 'optional', label: 'Optional' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function toLocalDatetimeInput(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

function computeDurationLabel(start, end) {
  if (!start || !end) return null;
  const diffMs = new Date(end) - new Date(start);
  if (diffMs <= 0) return null;
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins} minutes`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hour${h > 1 ? 's' : ''}` : `${h}h ${m}m`;
}

function contactDisplayName(c) {
  const name = [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
  return name || c.email || `Contact #${c.id}`;
}

function relId(rel) {
  if (rel == null) return '';
  if (typeof rel === 'object') return String(rel.id ?? rel.documentId ?? '');
  return String(rel);
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function EditMeetingPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loadingMeeting, setLoadingMeeting] = useState(true);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [meetingTitle, setMeetingTitle] = useState('Meeting');

  const [form, setForm] = useState({
    title: '',
    meetingType: 'other',
    status: 'scheduled',
    outcome: 'pending',
    startTime: '',
    endTime: '',
    location: '',
    isVirtual: false,
    agenda: '',
    notes: '',
    reminderPreset: 'thirtyMin',
    visibility: 'public',
    deal: '',
    clientAccount: '',
    leadCompany: '',
    contact: '',
    attendees: [],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Reference data
  const [deals, setDeals] = useState([]);
  const [leadCompanies, setLeadCompanies] = useState([]);
  const [clientAccounts, setClientAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);

  // Attendee management
  const [attendeePickerContact, setAttendeePickerContact] = useState('');
  const [attendeePickerRole, setAttendeePickerRole] = useState('required');

  const crmAnchorBackfillRef = useRef(false);

  // ── Load existing meeting ─────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoadingMeeting(true);
      try {
        const res = await meetingService.getOne(id);
        const m = res?.data;
        if (!m || cancelled) return;

        setMeetingTitle(m.title || 'Meeting');

        // Build attendees list from attendees relation + attendeesMeta
        const meta = Array.isArray(m.attendeesMeta) ? m.attendeesMeta : [];
        const attendeesList = Array.isArray(m.attendees)
          ? m.attendees.map((c) => {
              const met = meta.find((a) => String(a.contactId) === String(c.id));
              return {
                contactId: String(c.id),
                role: met?.role || 'required',
                name: contactDisplayName(c),
              };
            })
          : [];

        setForm({
          title: m.title || '',
          meetingType: m.meetingType || 'other',
          status: m.status || 'scheduled',
          outcome: m.outcome || 'pending',
          startTime: toLocalDatetimeInput(m.startTime),
          endTime: toLocalDatetimeInput(m.endTime),
          location: m.location || '',
          isVirtual: m.isVirtual || false,
          agenda: m.agenda || '',
          notes: m.notes || '',
          reminderPreset: m.reminderPreset || 'thirtyMin',
          visibility: m.visibility || 'public',
          deal: relId(m.deal),
          clientAccount: relId(m.clientAccount),
          leadCompany: relId(m.leadCompany),
          contact: relId(m.contact),
          attendees: attendeesList,
        });
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoadingMeeting(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    crmAnchorBackfillRef.current = false;
  }, [id]);

  // ── Load reference data ───────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingRefs(true);
      try {
        const [dealsRes, lcRes, caRes, cRes] = await Promise.allSettled([
          dealService.getAll({
            sort: 'name:asc',
            'pagination[pageSize]': 100,
            populate: ['leadCompany', 'clientAccount'],
          }),
          leadCompanyService.getAll({ sort: 'companyName:asc', 'pagination[pageSize]': 100 }),
          clientAccountService.getAll({ sort: 'companyName:asc', 'pagination[pageSize]': 100 }),
          contactService.getAll({ sort: 'createdAt:desc', 'pagination[pageSize]': 500 }),
        ]);
        if (cancelled) return;
        setDeals(dealsRes.status === 'fulfilled' ? (dealsRes.value.data || []) : []);
        setLeadCompanies(lcRes.status === 'fulfilled' ? (lcRes.value.data || []) : []);
        setClientAccounts(caRes.status === 'fulfilled' ? (caRes.value.data || []) : []);
        setContacts(cRes.status === 'fulfilled' ? (cRes.value.data || []) : []);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoadingRefs(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Select options ────────────────────────────────────────────────────────

  const leadCompanyOptions = useMemo(() => {
    const open = leadCompanies.filter((c) => !isLeadCompanyConverted(c));
    const base = open.map((c) => ({
      value: String(c.id),
      label: c.companyName || c.name || `Lead #${c.id}`,
    }));
    const sel = String(form.leadCompany || '').trim();
    if (sel && !base.some((o) => o.value === sel)) {
      const row = leadCompanies.find((c) => String(c.id) === sel);
      if (row) {
        return [
          {
            value: sel,
            label: `${row.companyName || row.name || 'Lead'} (converted)`,
          },
          ...base,
        ];
      }
    }
    return base;
  }, [leadCompanies, form.leadCompany]);

  const filteredDealOptions = useMemo(
    () =>
      filterDealsForAnchor(deals, form.clientAccount, form.leadCompany).map((d) => ({
        value: String(d.id),
        label: d.name || `Deal #${d.id}`,
      })),
    [deals, form.clientAccount, form.leadCompany]
  );

  const hasCrmAnchor = Boolean(
    String(form.clientAccount || '').trim() || String(form.leadCompany || '').trim()
  );

  useEffect(() => {
    if (loadingMeeting || loadingRefs || !deals.length) return;
    setForm((prev) => {
      let next = { ...prev };
      if (!crmAnchorBackfillRef.current) {
        const noAnchor =
          !String(next.clientAccount || '').trim() && !String(next.leadCompany || '').trim();
        if (noAnchor && next.deal) {
          const d = deals.find((x) => String(x.id) === String(next.deal));
          if (d) {
            const ca = relationId(d.clientAccount);
            const lc = relationId(d.leadCompany);
            if (ca) next = { ...next, clientAccount: ca, leadCompany: '' };
            else if (lc) next = { ...next, leadCompany: lc, clientAccount: '' };
          }
        }
        crmAnchorBackfillRef.current = true;
      }
      const ca = String(next.clientAccount || '').trim();
      const lc = String(next.leadCompany || '').trim();
      const allowed = new Set(
        filterDealsForAnchor(deals, ca, lc).map((d) => String(d.id))
      );
      if (next.deal && (ca || lc) && !allowed.has(String(next.deal))) {
        next = { ...next, deal: '' };
      }
      return next;
    });
  }, [loadingMeeting, loadingRefs, deals, form.clientAccount, form.leadCompany]);

  const clientAccountOptions = useMemo(() =>
    clientAccounts.map((a) => ({ value: String(a.id), label: a.companyName || a.name || `Account #${a.id}` })),
    [clientAccounts]
  );

  const contactOptions = useMemo(() =>
    contacts.map((c) => ({ value: String(c.id), label: contactDisplayName(c) })),
    [contacts]
  );

  const availableAttendeeOptions = useMemo(() => {
    const usedIds = new Set([
      ...(form.contact ? [String(form.contact)] : []),
      ...form.attendees.map((a) => String(a.contactId)),
    ]);
    return contacts
      .filter((c) => !usedIds.has(String(c.id)))
      .map((c) => ({ value: String(c.id), label: contactDisplayName(c) }));
  }, [contacts, form.contact, form.attendees]);

  // ── Form helpers ──────────────────────────────────────────────────────────

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }));
    if (errors.submit) setErrors((e) => ({ ...e, submit: null }));
  };

  const onClientAccountChange = (v) => {
    setForm((prev) => ({
      ...prev,
      clientAccount: v,
      leadCompany: v ? '' : prev.leadCompany,
    }));
    setErrors((e) => ({
      ...e,
      clientAccount: null,
      leadCompany: null,
      crmLink: null,
      submit: null,
    }));
  };

  const onLeadCompanyChange = (v) => {
    setForm((prev) => ({
      ...prev,
      leadCompany: v,
      clientAccount: v ? '' : prev.clientAccount,
    }));
    setErrors((e) => ({
      ...e,
      clientAccount: null,
      leadCompany: null,
      crmLink: null,
      submit: null,
    }));
  };

  const durationLabel = useMemo(
    () => computeDurationLabel(form.startTime, form.endTime),
    [form.startTime, form.endTime]
  );

  // ── Conflict detection ────────────────────────────────────────────────────

  const [conflicts, setConflicts] = useState([]);
  const conflictTimerRef = useRef(null);

  useEffect(() => {
    clearTimeout(conflictTimerRef.current);
    setConflicts([]);
    if (!form.startTime || !form.endTime) return;
    if (new Date(form.endTime) <= new Date(form.startTime)) return;

    conflictTimerRef.current = setTimeout(async () => {
      try {
        const result = await meetingService.checkConflicts({
          startTime: new Date(form.startTime).toISOString(),
          endTime: new Date(form.endTime).toISOString(),
          excludeId: id,
        });
        setConflicts((result.data || []).filter((c) => String(c.id) !== String(id)));
      } catch {
        // silently ignore
      }
    }, 600);

    return () => clearTimeout(conflictTimerRef.current);
  }, [form.startTime, form.endTime, id]);

  // ── Attendees ─────────────────────────────────────────────────────────────

  const addAttendee = () => {
    if (!attendeePickerContact) return;
    if (form.attendees.some((a) => String(a.contactId) === String(attendeePickerContact))) return;
    const contact = contacts.find((c) => String(c.id) === String(attendeePickerContact));
    setForm((prev) => ({
      ...prev,
      attendees: [
        ...prev.attendees,
        {
          contactId: attendeePickerContact,
          role: attendeePickerRole,
          name: contact ? contactDisplayName(contact) : `Contact #${attendeePickerContact}`,
        },
      ],
    }));
    setAttendeePickerContact('');
    setAttendeePickerRole('required');
  };

  const removeAttendee = (contactId) => {
    setForm((prev) => ({
      ...prev,
      attendees: prev.attendees.filter((a) => String(a.contactId) !== String(contactId)),
    }));
  };

  // ── Validate ──────────────────────────────────────────────────────────────

  const validateForm = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Meeting title is required';
    if (!form.startTime) next.startTime = 'Start time is required';
    if (form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime)) {
      next.endTime = 'End time must be after start time';
    }
    const hasAnchor =
      Boolean(String(form.clientAccount || '').trim()) ||
      Boolean(String(form.leadCompany || '').trim());
    if (!hasAnchor) {
      next.crmLink = 'Select a client account or a lead company.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setShowValidationModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        meetingType: form.meetingType,
        status: form.status,
        outcome: form.outcome,
        startTime: form.startTime ? new Date(form.startTime).toISOString() : null,
        endTime: form.endTime ? new Date(form.endTime).toISOString() : null,
        location: form.location || null,
        isVirtual: form.isVirtual,
        agenda: form.agenda || '',
        notes: form.notes || '',
        reminderPreset: form.reminderPreset,
        visibility: form.visibility,
        deal: form.deal || null,
        clientAccount: form.clientAccount || null,
        leadCompany: form.leadCompany || null,
        contact: form.contact || null,
        attendees: form.attendees.map((a) => a.contactId),
        attendeesMeta: form.attendees.map((a) => ({
          contactId: a.contactId,
          role: a.role,
          rsvp: 'pending',
        })),
      };

      await meetingService.update(id, payload);
      setShowSuccess(true);
      setTimeout(() => {
        router.push(`/meetings/${id}`);
      }, 1500);
    } catch (err) {
      setErrors({ submit: err?.message || 'Failed to save meeting. Please try again.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────

  if (showSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Meeting Updated!</h2>
          <p className="mb-4 text-gray-600">Your changes have been saved successfully.</p>
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-orange-500" />
          <p className="mt-2 text-sm text-gray-500">Redirecting to meeting details…</p>
        </div>
      </div>
    );
  }

  const isLoading = loadingMeeting || loadingRefs;

  return (
    <div className="min-h-screen bg-white">
      {/* Validation modal */}
      <Modal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title="Fix Validation Errors"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h4 className="mb-2 text-lg font-semibold text-gray-900">Please fill in all required fields</h4>
              <ul className="list-inside list-disc space-y-1 text-gray-700">
                {errors.title && <li className="font-medium text-red-700">Meeting title</li>}
                {errors.startTime && <li className="font-medium text-red-700">Start time</li>}
                {errors.endTime && <li className="font-medium text-red-700">{errors.endTime}</li>}
                {errors.crmLink && <li className="font-medium text-red-700">CRM link (account or lead)</li>}
              </ul>
            </div>
          </div>
          <div className="flex justify-end border-t border-gray-200 pt-4">
            <Button
              onClick={() => setShowValidationModal(false)}
              className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
            >
              Got it, I&apos;ll fix these
            </Button>
          </div>
        </div>
      </Modal>

      <div className="space-y-6 p-4 md:p-6">
        <CRMPageHeader
          title={loadingMeeting ? 'Loading…' : `Edit: ${meetingTitle}`}
          subtitle="Update this meeting's details and linked CRM records."
          breadcrumb={[
            { label: 'Dashboard', href: '/' },
            { label: 'Meetings', href: '/meetings' },
            { label: meetingTitle, href: `/meetings/${id}` },
            { label: 'Edit', href: `/meetings/${id}/edit` },
          ]}
          showProfile
          showSearch={false}
          showActions={false}
        />

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <LoadingSpinner message="Loading meeting…" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                <p className="text-red-700">{errors.submit}</p>
              </div>
            )}

            {/* 1. Meeting Details */}
            <FormSectionCard
              icon={Hash}
              title="Meeting Details"
              description="Basic information about this meeting."
              cardClassName={SECTION_CARD_CLASS}
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-3">
                  <Input
                    label="Meeting title"
                    required
                    value={form.title}
                    onChange={(e) => setField('title', e.target.value)}
                    error={errors.title}
                    placeholder="e.g. Discovery call with Acme Corp"
                  />
                </div>
                <Select
                  label="Meeting type"
                  value={form.meetingType}
                  onChange={(v) => setField('meetingType', v)}
                  options={MEETING_TYPE_OPTIONS}
                  icon={Briefcase}
                />
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(v) => setField('status', v)}
                  options={STATUS_OPTIONS}
                />
                <Select
                  label="Outcome"
                  value={form.outcome}
                  onChange={(v) => setField('outcome', v)}
                  options={OUTCOME_OPTIONS}
                />
                <Select
                  label="Visibility"
                  value={form.visibility}
                  onChange={(v) => setField('visibility', v)}
                  options={VISIBILITY_OPTIONS}
                  icon={Eye}
                />
              </div>
            </FormSectionCard>

            {/* 2. Schedule */}
            <FormSectionCard
              icon={Calendar}
              title="Schedule"
              description="Set the date, time, and duration of the meeting."
              cardClassName={SECTION_CARD_CLASS}
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Start date &amp; time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(e) => setField('startTime', e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors ${
                      errors.startTime ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.startTime && (
                    <p className="mt-1 text-xs text-red-600">{errors.startTime}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    End date &amp; time
                  </label>
                  <input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={(e) => setField('endTime', e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors ${
                      errors.endTime ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.endTime && (
                    <p className="mt-1 text-xs text-red-600">{errors.endTime}</p>
                  )}
                </div>
              </div>

              {durationLabel && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5">
                  <Clock className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-xs font-semibold text-orange-700">Duration: {durationLabel}</span>
                </div>
              )}

              {conflicts.length > 0 && (
                <div className="mt-3 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-amber-800">Scheduling conflict detected</p>
                    <ul className="mt-1 space-y-0.5">
                      {conflicts.map((c) => (
                        <li key={c.id} className="text-xs text-amber-700">
                          &ldquo;{c.title || 'Untitled'}&rdquo; overlaps this time slot
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1 text-xs text-amber-600">You can still save — this is just a heads-up.</p>
                  </div>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <Select
                  label="Reminder"
                  value={form.reminderPreset}
                  onChange={(v) => setField('reminderPreset', v)}
                  options={REMINDER_OPTIONS}
                  icon={Bell}
                />
              </div>
            </FormSectionCard>

            {/* 3. Location */}
            <FormSectionCard
              icon={MapPin}
              title="Location"
              description="Where will the meeting take place? Physical address or video link."
              cardClassName={SECTION_CARD_CLASS}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isVirtual}
                      onChange={(e) => setField('isVirtual', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      <Video className="h-4 w-4 text-sky-500" />
                      Virtual / Online meeting
                    </span>
                  </label>
                </div>
                <Input
                  label={form.isVirtual ? 'Meeting link' : 'Location'}
                  value={form.location}
                  onChange={(e) => setField('location', e.target.value)}
                  placeholder={
                    form.isVirtual
                      ? 'https://meet.google.com/xxx-yyyy-zzz'
                      : 'e.g. Conference Room A, 3rd Floor'
                  }
                  icon={form.isVirtual ? Video : MapPin}
                />
              </div>
            </FormSectionCard>

            {/* 4. Agenda */}
            <FormSectionCard
              icon={AlignLeft}
              title="Agenda"
              description="Outline the topics and goals for this meeting."
              cardClassName={SECTION_CARD_CLASS}
            >
              <Textarea
                label="Agenda"
                value={form.agenda}
                onChange={(e) => setField('agenda', e.target.value)}
                placeholder="1. Introductions&#10;2. Review proposal&#10;3. Q&A&#10;4. Next steps"
                rows={5}
              />
            </FormSectionCard>

            {/* 5. Attendees */}
            <FormSectionCard
              icon={Users}
              title="Attendees"
              description="Add contacts attending this meeting. Select the primary contact first."
              cardClassName={SECTION_CARD_CLASS}
            >
              <div className="space-y-5">
                <Select
                  label="Primary contact (host / organiser from CRM)"
                  value={form.contact}
                  onChange={(v) => setField('contact', v)}
                  options={[{ value: '', label: 'No primary contact' }, ...contactOptions]}
                  icon={User}
                />

                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">Additional attendees</p>
                  <div className="flex items-end gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <Select
                        label=""
                        value={attendeePickerContact}
                        onChange={setAttendeePickerContact}
                        options={[{ value: '', label: 'Select contact…' }, ...availableAttendeeOptions]}
                        icon={User}
                      />
                    </div>
                    <div className="w-36">
                      <Select
                        label=""
                        value={attendeePickerRole}
                        onChange={setAttendeePickerRole}
                        options={ATTENDEE_ROLE_OPTIONS}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addAttendee}
                      disabled={!attendeePickerContact}
                      className="h-[42px] border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      + Add
                    </Button>
                  </div>
                </div>

                {form.attendees.length > 0 && (
                  <div className="space-y-2">
                    {form.attendees.map((a) => (
                      <div key={a.contactId} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-[10px] font-bold text-white">
                          {a.name?.slice(0, 2).toUpperCase() || 'AT'}
                        </div>
                        <span className="flex-1 truncate text-sm text-gray-700">{a.name}</span>
                        <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700 capitalize">
                          {a.role}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttendee(a.contactId)}
                          className="text-gray-400 hover:text-red-500 transition-colors text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormSectionCard>

            {/* 6. CRM Links */}
            <FormSectionCard
              icon={Building2}
              title="Link to CRM"
              description="Choose a client account or a lead company (required). Converted leads are hidden unless already linked. Optionally link a deal tied to that account or lead."
              cardClassName={SECTION_CARD_CLASS}
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Select
                  label="Client account"
                  placeholder="Select client account"
                  value={form.clientAccount}
                  onChange={onClientAccountChange}
                  options={clientAccountOptions}
                  icon={Building2}
                  error={errors.crmLink}
                />
                <Select
                  label="Lead company"
                  placeholder="Select lead company"
                  value={form.leadCompany}
                  onChange={onLeadCompanyChange}
                  options={leadCompanyOptions}
                  icon={Building2}
                />
                <Select
                  label="Deal"
                  placeholder="No deal (optional)"
                  value={form.deal}
                  onChange={(v) => setField('deal', v)}
                  options={filteredDealOptions}
                  disabled={!hasCrmAnchor}
                  icon={Briefcase}
                />
              </div>
              {!hasCrmAnchor && (
                <p className="mt-3 text-sm text-gray-500">
                  Pick a client account or a lead company to enable deal linking.
                </p>
              )}
            </FormSectionCard>

            {/* 7. Notes */}
            <FormSectionCard
              icon={FileText}
              title="Notes"
              description="Any notes or context for this meeting."
              cardClassName={SECTION_CARD_CLASS}
            >
              <Textarea
                label="Notes"
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="Add notes, context, or talking points…"
                rows={4}
              />
            </FormSectionCard>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <Link href={`/meetings/${id}`}>
                <Button type="button" variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Cancel
                </Button>
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-60 transition-opacity"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
