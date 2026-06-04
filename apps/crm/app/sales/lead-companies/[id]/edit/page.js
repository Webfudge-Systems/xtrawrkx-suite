'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Avatar,
  Badge,
  Button,
  Card,
  FormSectionCard,
  Input,
  LoadingSpinner,
  Modal,
  Select,
  Table,
  Textarea,
  useIndustrySelectOptions,
  toDateInputValue,
} from '@webfudge/ui';
import CRMPageHeader from '../../../../../components/CRMPageHeader';
import leadCompanyService from '../../../../../lib/api/leadCompanyService';
import contactService from '../../../../../lib/api/contactService';
import {
  canonicalCompanyTypeValue,
  canonicalIndustryValue,
  companyTypeSelectOptions,
} from '@webfudge/utils';
import { fetchStoredIndustriesForCrm } from '../../../../../lib/industryOptionsLoader';
import { canEditCRMRecord } from '../../../../../lib/rbac';
import {
  AlignLeft,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  Globe,
  Layers,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Save,
  Trash2,
  Users,
} from 'lucide-react';

export default function EditLeadCompanyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [lead, setLead] = useState(null);

  const [draft, setDraft] = useState({
    companyName: '',
    industry: '',
    type: '',
    website: '',
    phone: '',
    email: '',
    employees: '',
    founded: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    dealValue: '',
    status: 'NEW',
    linkedIn: '',
    twitter: '',
    description: '',
    notes: '',
    nextConnectDate: '',
  });

  const [contactsLoading, setContactsLoading] = useState(false);
  const [linkedContacts, setLinkedContacts] = useState([]);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addContactForm, setAddContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: '',
    contactRole: 'TECHNICAL_CONTACT',
  });
  const [addContactErrors, setAddContactErrors] = useState({});
  const [addContactSubmitting, setAddContactSubmitting] = useState(false);
  const [deleteContactId, setDeleteContactId] = useState(null);
  const [deleteContactSubmitting, setDeleteContactSubmitting] = useState(false);
  const canEditLeadCompany = lead ? canEditCRMRecord('leads', lead) : false;

  const statusOptions = useMemo(
    () => [
      { value: 'NEW', label: 'New' },
      { value: 'CONTACTED', label: 'Contacted' },
      { value: 'QUALIFIED', label: 'Qualified' },
      { value: 'PROPOSAL_SENT', label: 'Proposal Sent' },
      { value: 'LOST', label: 'Lost' },
    ],
    []
  );

  const employeeSizeOptions = useMemo(
    () => [
      { value: 'SIZE_1_10', label: '1-10 employees' },
      { value: 'SIZE_11_50', label: '11-50 employees' },
      { value: 'SIZE_51_200', label: '51-200 employees' },
      { value: 'SIZE_201_500', label: '201-500 employees' },
      { value: 'SIZE_501_1000', label: '501-1000 employees' },
      { value: 'SIZE_1000_PLUS', label: '1000+ employees' },
    ],
    []
  );

  const contactRoleOptions = useMemo(
    () => [
      { value: 'PRIMARY_CONTACT', label: 'Primary contact' },
      { value: 'TECHNICAL_CONTACT', label: 'Technical contact' },
      { value: 'DECISION_MAKER', label: 'Decision maker' },
      { value: 'INFLUENCER', label: 'Influencer' },
      { value: 'CONTACT', label: 'Contact' },
      { value: 'GATEKEEPER', label: 'Gatekeeper' },
    ],
    []
  );

  const { options: industrySelectOptions, onIndustrySaved } = useIndustrySelectOptions({
    fetchStoredIndustries: fetchStoredIndustriesForCrm,
    seedIndustries: draft.industry ? [draft.industry] : [],
  });

  const typeSelectOptions = useMemo(() => {
    const v = draft.type?.trim();
    if (!v) return companyTypeSelectOptions;
    if (companyTypeSelectOptions.some((o) => o.value === v)) return companyTypeSelectOptions;
    return [{ value: v, label: v }, ...companyTypeSelectOptions];
  }, [draft.type]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await leadCompanyService.getOne(id);
        if (!cancelled && res?.data) {
          const d = res.data;
          setLead(d);
          setDraft({
            companyName: d.companyName ?? d.name ?? '',
            industry: canonicalIndustryValue(d.industry ?? ''),
            type: canonicalCompanyTypeValue(d.type ?? ''),
            website: d.website ?? '',
            phone: d.phone ?? '',
            email: d.email ?? '',
            employees: d.employees ?? '',
            founded: d.founded ?? '',
            address: d.address ?? '',
            city: d.city ?? '',
            state: d.state ?? '',
            country: d.country ?? '',
            zipCode: d.zipCode ?? '',
            dealValue: d.dealValue != null ? String(d.dealValue) : '',
            status: d.status ?? 'NEW',
            linkedIn: d.linkedIn ?? '',
            twitter: d.twitter ?? '',
            description: d.description ?? '',
            notes: d.notes ?? '',
            nextConnectDate: toDateInputValue(d.nextConnectDate),
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const reloadLinkedContacts = useCallback(async () => {
    if (!id) return;
    setContactsLoading(true);
    try {
      const idEq = Number.isNaN(Number(id)) ? id : Number(id);
      let contactsList = [];
      try {
        const contactsRes = await contactService.getAll({
          'pagination[pageSize]': 100,
          sort: 'createdAt:desc',
          populate: ['assignedTo', 'leadCompany'],
          filters: {
            leadCompany: { id: { $eq: idEq } },
          },
        });
        contactsList = Array.isArray(contactsRes.data) ? contactsRes.data : [];
      } catch (filterErr) {
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

      contactsList.sort((a, b) => Number(!!b.isPrimaryContact) - Number(!!a.isPrimaryContact));
      setLinkedContacts(contactsList);
    } catch (e) {
      console.error(e);
      setLinkedContacts([]);
    } finally {
      setContactsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void reloadLinkedContacts();
  }, [id, reloadLinkedContacts]);

  const setDraftField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
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
    e?.preventDefault?.();
    if (!id) return;
    if (!lead) return;
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

      const ownerId = lead?.assignedTo && typeof lead.assignedTo === 'object' ? lead.assignedTo.id : lead?.assignedTo;
      if (ownerId != null && String(ownerId).trim() !== '') {
        const n = parseInt(String(ownerId), 10);
        if (!Number.isNaN(n)) payload.assignedTo = n;
      }

      await contactService.create(payload);
      setAddContactOpen(false);
      setAddContactForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobTitle: '',
        department: '',
        contactRole: 'TECHNICAL_CONTACT',
      });
      setAddContactErrors({});
      await reloadLinkedContacts();
    } catch (err) {
      setAddContactErrors({
        submit: err?.message || 'Failed to add contact. Please try again.',
      });
    } finally {
      setAddContactSubmitting(false);
    }
  };

  const contactDisplayName = (contact) => {
    if (!contact) return 'Unnamed';
    if (contact.firstName && contact.lastName) return `${contact.firstName} ${contact.lastName}`;
    if (contact.name) return contact.name;
    return contact.email || 'Unnamed';
  };

  const contactInitials = (contact) => {
    const fn = contact?.firstName?.trim();
    const ln = contact?.lastName?.trim();
    if (fn && ln) return `${fn[0]}${ln[0]}`.toUpperCase();
    const name = contactDisplayName(contact);
    if (name && name.length >= 2) return name.slice(0, 2).toUpperCase();
    return (name?.[0] || contact?.email?.[0] || 'C').toUpperCase();
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!canEditLeadCompany) {
      setSubmitError('You can only edit lead companies assigned to you.');
      return;
    }

    if (!draft.companyName.trim()) {
      setSubmitError('Company name is required');
      return;
    }
    if (!draft.industry.trim()) {
      setSubmitError('Industry is required');
      return;
    }
    if (!draft.email.trim()) {
      setSubmitError('Company email is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(draft.email.trim())) {
      setSubmitError('Please enter a valid company email address');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        companyName: draft.companyName.trim(),
        industry: draft.industry.trim(),
        type: draft.type.trim(),
        website: draft.website.trim(),
        phone: draft.phone.trim(),
        email: draft.email.trim(),
        address: draft.address.trim(),
        city: draft.city.trim(),
        state: draft.state.trim(),
        country: draft.country.trim(),
        zipCode: draft.zipCode.trim(),
        employees: draft.employees.trim(),
        founded: draft.founded.trim(),
        status: draft.status,
        linkedIn: draft.linkedIn.trim(),
        twitter: draft.twitter.trim(),
        description: draft.description.trim(),
        notes: draft.notes.trim(),
      };

      if (draft.nextConnectDate.trim()) {
        payload.nextConnectDate = draft.nextConnectDate.trim();
      } else {
        payload.nextConnectDate = null;
      }

      if (payload.type === '') delete payload.type;
      if (payload.website === '') delete payload.website;
      if (payload.phone === '') delete payload.phone;
      if (payload.address === '') delete payload.address;
      if (payload.city === '') delete payload.city;
      if (payload.state === '') delete payload.state;
      if (payload.country === '') delete payload.country;
      if (payload.zipCode === '') delete payload.zipCode;
      if (payload.employees === '') delete payload.employees;
      if (payload.founded === '') delete payload.founded;

      const dv = draft.dealValue.trim();
      if (dv) {
        const n = parseFloat(dv);
        if (!Number.isNaN(n)) payload.dealValue = n;
      }
      await leadCompanyService.update(id, payload);
      onIndustrySaved(payload.industry);
      setShowSuccess(true);
      window.setTimeout(() => {
        router.push(`/sales/lead-companies/${id}`);
      }, 1200);
    } catch (err) {
      setSubmitError(err?.message || 'Failed to update lead company');
    } finally {
      setSaving(false);
    }
  };

  const deleteContact = useCallback(
    (contactId) => {
      if (!canEditLeadCompany) return;
      if (!contactId) return;
      setDeleteContactId(contactId);
    },
    [canEditLeadCompany]
  );

  const confirmDeleteContact = useCallback(
    async () => {
      if (!deleteContactId || deleteContactSubmitting) return;
      if (!canEditLeadCompany) return;
      try {
        setDeleteContactSubmitting(true);
        await contactService.delete(deleteContactId);
        setDeleteContactId(null);
        await reloadLinkedContacts();
      } catch (e) {
        // eslint-disable-next-line no-alert
        alert(e?.message || 'Failed to delete contact');
      } finally {
        setDeleteContactSubmitting(false);
      }
    },
    [canEditLeadCompany, deleteContactId, deleteContactSubmitting, reloadLinkedContacts]
  );

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
          <div className="min-w-[160px] text-sm text-gray-600 truncate">{contact.phone || '—'}</div>
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
        key: 'status',
        label: 'STATUS',
        render: (_, contact) => {
          const s = (contact.status || 'ACTIVE').toString().toUpperCase();
          const isActive = s === 'ACTIVE';
          return (
            <span
              className={`inline-flex rounded-lg border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                isActive ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : 'border-gray-300 text-gray-700 bg-gray-50'
              }`}
            >
              {s}
            </span>
          );
        },
      },
      {
        key: 'actions',
        label: 'ACTION',
        render: (_, contact) => (
          <div className="flex items-center gap-0.5 min-w-[140px]" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-slate-700 hover:bg-slate-100"
              title="View"
              onClick={() => router.push(`/sales/contacts/${contact.id}`)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-emerald-600 hover:bg-emerald-50"
              title="Edit"
              onClick={() => router.push(`/sales/contacts/${contact.id}/edit`)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-red-600 hover:bg-red-50"
              title="Delete"
              onClick={() => deleteContact(contact.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    [deleteContact, router]
  );

  const submitButtonClassName =
    'min-w-[180px] rounded-xl border-0 bg-gradient-to-r from-orange-500 to-pink-500 py-2.5 font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-60';

  if (showSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Success!</h2>
          <p className="mb-4 text-gray-600">Lead company updated successfully</p>
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-orange-500" />
          <p className="mt-2 text-sm text-gray-500">Redirecting…</p>
        </div>
      </div>
    );
  }

  if (!loading && lead && !canEditLeadCompany) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <CRMPageHeader
          title="View-only access"
          subtitle={lead.companyName || lead.name || 'Lead company editing is restricted for your role.'}
          showSearch={false}
          showActions={false}
          breadcrumb={[
            { label: 'Sales', href: '/sales' },
            { label: 'Lead companies', href: '/sales/lead-companies' },
            { label: lead.companyName || lead.name || 'Lead', href: `/sales/lead-companies/${id}` },
          ]}
        />
        <Card variant="elevated" className="rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            You can view this lead company, but cannot edit it.
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">
            Members can edit only lead companies assigned to them. Managers and admins can manage leads across the team.
          </p>
          <Link href={`/sales/lead-companies/${id}`} className="mt-6 inline-flex">
            <Button type="button" variant="primary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to lead company
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <form onSubmit={handleSubmitUpdate}>
        <CRMPageHeader
          title="Edit Lead Company"
          subtitle={loading ? undefined : lead?.companyName || lead?.name || undefined}
          showSearch={false}
          showActions={false}
          breadcrumb={[
            { label: 'Sales', href: '/sales' },
            { label: 'Lead companies', href: '/sales/lead-companies' },
            { label: 'Edit', href: `/sales/lead-companies/${id}/edit` },
          ]}
        >
          <div className="flex items-center justify-end gap-3">
            <Link href={`/sales/lead-companies/${id}`}>
              <Button type="button" variant="secondary" className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-gray-700">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              disabled={saving || loading}
              className={submitButtonClassName}
            >
              {!saving ? <Save className="mr-2 h-4 w-4" /> : null}
              {saving ? 'Updating…' : 'Update Lead Company'}
            </Button>
          </div>
        </CRMPageHeader>

        {loading ? (
          <Card variant="elevated" className="mt-6 p-12 flex justify-center rounded-xl">
            <LoadingSpinner message="Loading lead company..." />
          </Card>
        ) : (
          <div className="mt-6 space-y-6">
            <FormSectionCard
              icon={Building2}
              title="Company Information"
              description="Update company details and contact info"
              cardClassName="rounded-xl p-6"
              iconContainerClassName="bg-brand-primary shadow-sm"
            >

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Input
                    label="Company Name *"
                    value={draft.companyName}
                    onChange={(e) => setDraftField('companyName', e.target.value)}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div>
                  <Select
                    label="Industry"
                    value={draft.industry}
                    onChange={(v) => setDraftField('industry', v)}
                    options={industrySelectOptions}
                    placeholder="Select industry"
                    icon={Building2}
                    allowCustom
                    searchable
                  />
                </div>
                <div>
                  <Select
                    label="Company type"
                    value={draft.type}
                    onChange={(v) => setDraftField('type', v)}
                    options={typeSelectOptions}
                    placeholder="Select company type"
                    icon={Layers}
                  />
                </div>
                <div>
                  <Input
                    label="Website"
                    value={draft.website}
                    onChange={(e) => setDraftField('website', e.target.value)}
                    placeholder="https://company.com"
                    icon={Globe}
                  />
                </div>
                <div>
                  <Input
                    label="Phone"
                    value={draft.phone}
                    onChange={(e) => setDraftField('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    icon={Phone}
                  />
                </div>
                <div>
                  <Input
                    label="Email *"
                    value={draft.email}
                    onChange={(e) => setDraftField('email', e.target.value)}
                    type="email"
                    placeholder="contact@company.com"
                    icon={Mail}
                    required
                  />
                </div>
                <div>
                  <Select
                    label="Company size"
                    value={draft.employees}
                    onChange={(v) => setDraftField('employees', v)}
                    options={employeeSizeOptions}
                    placeholder="Select company size"
                  />
                </div>
              </div>
            </FormSectionCard>

            <FormSectionCard
              icon={MapPin}
              title="Address Information"
              description="Primary location on file"
              cardClassName="rounded-xl p-6"
              iconContainerClassName="bg-brand-primary shadow-sm"
            >

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Input
                    label="Address"
                    value={draft.address}
                    onChange={(e) => setDraftField('address', e.target.value)}
                    placeholder="123 Business District"
                  />
                </div>
                <Input label="City" value={draft.city} onChange={(e) => setDraftField('city', e.target.value)} />
                <Input
                  label="State / region"
                  value={draft.state}
                  onChange={(e) => setDraftField('state', e.target.value)}
                />
                <Input label="Country" value={draft.country} onChange={(e) => setDraftField('country', e.target.value)} />
                <Input label="ZIP / postal code" value={draft.zipCode} onChange={(e) => setDraftField('zipCode', e.target.value)} />
              </div>
            </FormSectionCard>

            <FormSectionCard
              icon={Calendar}
              title="Lead Information"
              description="Status, value, and timing"
              cardClassName="rounded-xl p-6"
              iconContainerClassName="bg-brand-primary shadow-sm"
            >

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Input
                  label="Deal Value"
                  value={draft.dealValue}
                  onChange={(e) => setDraftField('dealValue', e.target.value)}
                  placeholder="250000"
                  type="number"
                  step="0.01"
                />
                <Select
                  label="Status"
                  value={draft.status}
                  onChange={(v) => setDraftField('status', v)}
                  options={statusOptions}
                  placeholder="Select status"
                />
                <Input
                  label="Next connect date"
                  type="date"
                  value={draft.nextConnectDate}
                  onChange={(e) => setDraftField('nextConnectDate', e.target.value)}
                  icon={Calendar}
                />
                <Input
                  label="Founded Year"
                  value={draft.founded}
                  onChange={(e) => setDraftField('founded', e.target.value)}
                  placeholder="2020"
                  type="number"
                  min={1800}
                  max={new Date().getFullYear()}
                />
              </div>
            </FormSectionCard>

            <FormSectionCard
              icon={AlignLeft}
              title="Social & Additional Information"
              description="Social profiles and notes"
              cardClassName="rounded-xl p-6"
              iconContainerClassName="bg-brand-primary shadow-sm"
            >

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Input
                  label="LinkedIn"
                  value={draft.linkedIn}
                  onChange={(e) => setDraftField('linkedIn', e.target.value)}
                  placeholder="https://www.linkedin.com/company/..."
                />
                <Input
                  label="Twitter / X"
                  value={draft.twitter}
                  onChange={(e) => setDraftField('twitter', e.target.value)}
                  placeholder="https://twitter.com/..."
                />
                <div className="md:col-span-2">
                  <Textarea
                    label="Company Description"
                    rows={3}
                    value={draft.description}
                    onChange={(e) => setDraftField('description', e.target.value)}
                    placeholder="Brief description of the company..."
                  />
                </div>
                <div className="md:col-span-2">
                  <Textarea
                    label="Notes"
                    rows={3}
                    value={draft.notes}
                    onChange={(e) => setDraftField('notes', e.target.value)}
                    placeholder="Additional notes about this lead..."
                  />
                </div>
              </div>
            </FormSectionCard>

            {submitError ? (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                {submitError}
              </p>
            ) : null}

            <FormSectionCard
              icon={Users}
              title="Contacts"
              description="Manage contacts linked to this lead company"
              cardClassName="rounded-xl p-6"
              iconContainerClassName="bg-brand-primary shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div />
                <Button
                  type="button"
                  variant="primary"
                  className="shrink-0 rounded-xl border-0 bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-60"
                  onClick={() => {
                    setAddContactForm({
                      firstName: '',
                      lastName: '',
                      email: '',
                      phone: '',
                      jobTitle: '',
                      department: '',
                      contactRole: 'TECHNICAL_CONTACT',
                    });
                    setAddContactErrors({});
                    setAddContactOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {contactsLoading ? (
                  <div className="p-12 flex justify-center">
                    <LoadingSpinner size="lg" message="Loading contacts..." />
                  </div>
                ) : linkedContacts.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No contacts linked yet.
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
            </FormSectionCard>
          </div>
        )}

      </form>

      <Modal
        isOpen={addContactOpen}
        onClose={() => {
          if (addContactSubmitting) return;
          setAddContactOpen(false);
          setAddContactErrors({});
        }}
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
              onChange={(e) => setAddContactForm((p) => ({ ...p, firstName: e.target.value }))}
              error={addContactErrors.firstName}
            />
            <Input
              label="Last Name"
              required
              value={addContactForm.lastName}
              onChange={(e) => setAddContactForm((p) => ({ ...p, lastName: e.target.value }))}
              error={addContactErrors.lastName}
            />
          </div>

          <Input
            label="Email"
            required
            type="email"
            value={addContactForm.email}
            onChange={(e) => setAddContactForm((p) => ({ ...p, email: e.target.value }))}
            error={addContactErrors.email}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Phone"
              value={addContactForm.phone}
              onChange={(e) => setAddContactForm((p) => ({ ...p, phone: e.target.value }))}
            />
            <Input
              label="Job Title"
              value={addContactForm.jobTitle}
              onChange={(e) => setAddContactForm((p) => ({ ...p, jobTitle: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Department"
              value={addContactForm.department}
              onChange={(e) => setAddContactForm((p) => ({ ...p, department: e.target.value }))}
            />
            <Select
              label="Role"
              value={addContactForm.contactRole}
              onChange={(v) => setAddContactForm((p) => ({ ...p, contactRole: v }))}
              options={contactRoleOptions}
              placeholder="Select role"
            />
          </div>

          {addContactErrors.submit ? (
            <p className="text-sm text-red-600 text-center">{addContactErrors.submit}</p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="muted"
              disabled={addContactSubmitting}
              onClick={() => {
                if (addContactSubmitting) return;
                setAddContactOpen(false);
                setAddContactErrors({});
              }}
              className="w-full sm:w-auto rounded-xl bg-gray-300 border-[1.5px] border-gray-400 px-5 py-2.5"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={addContactSubmitting}
              className="w-full sm:w-auto min-w-[10rem] rounded-xl border-0 bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-60"
            >
              {addContactSubmitting ? 'Adding…' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteContactId}
        onClose={() => {
          if (deleteContactSubmitting) return;
          setDeleteContactId(null);
        }}
        title="Delete Contact"
        size="md"
        closeOnBackdrop={!deleteContactSubmitting}
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <p className="text-sm text-red-900">
              <span className="font-semibold">This action cannot be undone</span>
            </p>
          </div>
          <p className="text-sm text-gray-700">Are you sure you want to delete this contact?</p>
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="muted"
              disabled={deleteContactSubmitting}
              onClick={() => setDeleteContactId(null)}
              className="w-full sm:w-auto rounded-xl bg-gray-300 border-[1.5px] border-gray-400 px-5 py-2.5"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={deleteContactSubmitting}
              onClick={confirmDeleteContact}
              className="w-full sm:w-auto min-w-[9rem] rounded-xl py-2.5"
            >
              {deleteContactSubmitting ? 'Deleting…' : 'Delete Contact'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
