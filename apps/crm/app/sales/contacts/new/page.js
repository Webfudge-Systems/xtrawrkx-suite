'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Select, Textarea, Modal, FormSectionCard } from '@webfudge/ui';
import CRMPageHeader from '../../../../components/CRMPageHeader';
import contactService from '../../../../lib/api/contactService';
import leadCompanyService from '../../../../lib/api/leadCompanyService';
import clientAccountService from '../../../../lib/api/clientAccountService';
import strapiClient from '../../../../lib/strapiClient';
import { isLeadCompanyConverted } from '../../../../lib/meetingCrmLink';
import {
  contactFieldsFromClientAccount,
  contactFieldsFromLeadCompany,
} from '@webfudge/utils';
import { useAuth } from '@webfudge/auth';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Globe,
  MapPin,
  Calendar,
  Linkedin,
  Hash,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'LEAD', label: 'Lead' },
];

const preferredContactOptions = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
];

const sourceOptions = [
  { value: 'WEBSITE', label: 'Website' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'EMAIL_CAMPAIGN', label: 'Email Campaign' },
  { value: 'COLD_CALL', label: 'Cold Call' },
  { value: 'TRADE_SHOW', label: 'Trade Show' },
  { value: 'PARTNER', label: 'Partner' },
  { value: 'OTHER', label: 'Manual entry' },
];

const initialForm = {
  firstName: '',
  lastName: '',
  status: 'ACTIVE',
  assignedTo: '',
  email: '',
  phone: '',
  preferredContactMethod: 'EMAIL',
  birthDate: '',
  timezone: '',
  source: 'OTHER',
  jobTitle: '',
  department: '',
  companyName: '',
  companyWebsite: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  linkedinUrl: '',
  twitter: '',
  notes: '',
  leadCompany: '',
  clientAccount: '',
};

export default function NewContactPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledClientAccount = searchParams?.get('clientAccount') || '';
  const prefilledLeadCompany = searchParams?.get('leadCompany') || '';
  const { user } = useAuth();
  const [form, setForm] = useState(() => ({
    ...initialForm,
    clientAccount: prefilledClientAccount,
    leadCompany: prefilledLeadCompany,
  }));
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [leadCompanies, setLeadCompanies] = useState([]);
  const [clientAccounts, setClientAccounts] = useState([]);
  const prefilledEntityApplied = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingUsers(true);
        let allUsers = [];
        let page = 1;
        let hasMore = true;
        const pageSize = 100;

        while (hasMore && !cancelled) {
          const queryParams = {
            'pagination[page]': page,
            'pagination[pageSize]': pageSize,
            populate: 'primaryRole,userRoles',
          };
          const response = await strapiClient.getXtrawrkxUsers(queryParams);
          const usersData = response?.data ?? response ?? [];
          const arr = Array.isArray(usersData) ? usersData : [];
          const extracted = arr.map((u) =>
            u.attributes ? { id: u.id, documentId: u.id, ...u.attributes } : u
          );
          allUsers = [...allUsers, ...extracted];
          const pageCount = response?.meta?.pagination?.pageCount ?? 1;
          hasMore = page < pageCount && arr.length === pageSize;
          page += 1;
        }

        if (cancelled) return;
        setUsers(allUsers);

        if (user?.email && allUsers.length > 0) {
          const currentUser = allUsers.find((u) => u.email === user.email);
          if (currentUser) {
            setForm((prev) => ({
              ...prev,
              assignedTo: String(currentUser.id),
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingRefs(true);
      try {
        const [lcRes, caRes] = await Promise.allSettled([
          leadCompanyService.getAll({ sort: 'companyName:asc', 'pagination[pageSize]': 200 }),
          clientAccountService.getAll({ sort: 'companyName:asc', 'pagination[pageSize]': 200 }),
        ]);
        if (cancelled) return;
        setLeadCompanies(lcRes.status === 'fulfilled' ? (lcRes.value.data || []) : []);
        setClientAccounts(caRes.status === 'fulfilled' ? (caRes.value.data || []) : []);
      } catch (err) {
        console.error('Error loading company references:', err);
        if (!cancelled) {
          setLeadCompanies([]);
          setClientAccounts([]);
        }
      } finally {
        if (!cancelled) setLoadingRefs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (prefilledEntityApplied.current) return;
    const caId = String(prefilledClientAccount || '').trim();
    const lcId = String(prefilledLeadCompany || '').trim();
    if (!caId && !lcId) return;

    let cancelled = false;
    (async () => {
      try {
        if (caId) {
          const res = await clientAccountService.getOne(caId);
          if (cancelled || !res?.data) return;
          prefilledEntityApplied.current = true;
          const fields = contactFieldsFromClientAccount(res.data);
          setForm((prev) => ({
            ...prev,
            clientAccount: caId,
            leadCompany: '',
            source: 'CLIENT_ACCOUNT',
            ...fields,
          }));
          return;
        }
        if (lcId) {
          const res = await leadCompanyService.getOne(lcId);
          if (cancelled || !res?.data) return;
          prefilledEntityApplied.current = true;
          const fields = contactFieldsFromLeadCompany(res.data);
          setForm((prev) => ({
            ...prev,
            leadCompany: lcId,
            clientAccount: '',
            source: 'LEAD_COMPANY',
            ...fields,
          }));
        }
      } catch (err) {
        console.error('Error pre-filling company from URL:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [prefilledClientAccount, prefilledLeadCompany]);

  const leadCompanyOptions = useMemo(() => {
    const open = (leadCompanies || []).filter((c) => !isLeadCompanyConverted(c));
    const base = [
      { value: '', label: 'No lead company' },
      ...open.map((lc) => ({
        value: String(lc.id ?? lc.documentId),
        label: lc.companyName || lc.name || `Lead company ${lc.id ?? ''}`.trim(),
      })),
    ];
    const sel = String(form.leadCompany || '').trim();
    if (sel && !base.some((o) => o.value === sel)) {
      const row = leadCompanies.find((c) => String(c.id ?? c.documentId) === sel);
      if (row) {
        return [
          { value: sel, label: `${row.companyName || row.name || 'Lead'} (converted)` },
          ...base.filter((o) => o.value !== sel),
        ];
      }
    }
    return base.filter((o) => o.value !== 'undefined');
  }, [leadCompanies, form.leadCompany]);

  const clientAccountOptions = useMemo(
    () => [
      { value: '', label: 'No client account' },
      ...(clientAccounts || []).map((a) => ({
        value: String(a.id ?? a.documentId),
        label: a.companyName || a.name || `Account #${a.id ?? ''}`,
      })),
    ].filter((o) => o.value !== 'undefined'),
    [clientAccounts]
  );

  const onClientAccountChange = (v) => {
    const id = v ? String(v) : '';
    if (!id) {
      setForm((prev) => ({ ...prev, clientAccount: '' }));
      return;
    }
    const acc =
      clientAccounts.find((a) => String(a.id ?? a.documentId) === id) || null;
    setForm((prev) => ({
      ...prev,
      clientAccount: id,
      leadCompany: '',
      source: 'CLIENT_ACCOUNT',
      ...(acc ? contactFieldsFromClientAccount(acc) : {}),
    }));
  };

  const onLeadCompanyChange = (v) => {
    const id = v ? String(v) : '';
    if (!id) {
      setForm((prev) => ({ ...prev, leadCompany: '' }));
      return;
    }
    const lc = leadCompanies.find((c) => String(c.id ?? c.documentId) === id) || null;
    setForm((prev) => ({
      ...prev,
      leadCompany: id,
      clientAccount: '',
      source: 'LEAD_COMPANY',
      ...(lc ? contactFieldsFromLeadCompany(lc) : {}),
    }));
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
    if (errors.submit) {
      setErrors((prev) => ({ ...prev, submit: null }));
    }
  };

  const validateForm = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required';
    if (!form.lastName.trim()) next.lastName = 'Last name is required';
    if (!form.email.trim()) {
      next.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      next.email = 'Please enter a valid email address';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setShowValidationModal(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        companyName: form.companyName.trim(),
        status: form.status,
        source: form.source,
      };
      if (form.assignedTo) payload.assignedTo = parseInt(form.assignedTo, 10);
      if (form.preferredContactMethod) payload.preferredContactMethod = form.preferredContactMethod;
      if (form.birthDate) payload.birthDate = form.birthDate;
      if (form.timezone.trim()) payload.timezone = form.timezone.trim();
      if (form.jobTitle.trim()) payload.jobTitle = form.jobTitle.trim();
      if (form.department.trim()) payload.department = form.department.trim();
      if (form.companyWebsite.trim()) payload.companyWebsite = form.companyWebsite.trim();
      if (form.address.trim()) payload.address = form.address.trim();
      if (form.city.trim()) payload.city = form.city.trim();
      if (form.state.trim()) payload.state = form.state.trim();
      if (form.zipCode.trim()) payload.zipCode = form.zipCode.trim();
      if (form.country.trim()) payload.country = form.country.trim();
      if (form.linkedinUrl.trim()) payload.linkedinUrl = form.linkedinUrl.trim();
      if (form.twitter.trim()) payload.twitter = form.twitter.trim();
      if (form.notes.trim()) payload.notes = form.notes.trim();

      if (form.leadCompany) {
        const n = parseInt(form.leadCompany, 10);
        payload.leadCompany = Number.isNaN(n) ? form.leadCompany : n;
        payload.source = 'LEAD_COMPANY';
      } else if (form.clientAccount) {
        const n = parseInt(form.clientAccount, 10);
        payload.clientAccount = Number.isNaN(n) ? form.clientAccount : n;
        payload.source = 'CLIENT_ACCOUNT';
      }

      const res = await contactService.create(payload);
      const created = res?.data ?? res;
      const newId = created?.id ?? created?.documentId;

      setShowSuccess(true);
      setTimeout(() => {
        router.push(newId ? `/sales/contacts/${newId}` : '/sales/contacts');
      }, 1500);
    } catch (err) {
      const message = err?.message || 'Failed to create contact. Please try again.';
      setErrors({ submit: message });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const userSelectOptions = [
    { value: '', label: 'Unassigned' },
    ...users.map((u) => ({
      value: String(u.id),
      label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
    })),
  ];

  if (showSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Success!</h2>
          <p className="mb-4 text-gray-600">Contact created successfully</p>
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-orange-500" />
          <p className="mt-2 text-sm text-gray-500">Redirecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Modal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title="Validation error"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h4 className="mb-2 text-lg font-semibold text-gray-900">Please fix the following</h4>
              <p className="mb-4 text-gray-600">Required fields must be completed before creating a contact.</p>
              <ul className="list-inside list-disc space-y-2 text-gray-700">
                {errors.firstName && <li className="font-medium text-red-700">First name</li>}
                {errors.lastName && <li className="font-medium text-red-700">Last name</li>}
                {errors.email && <li className="font-medium text-red-700">{errors.email}</li>}
              </ul>
            </div>
          </div>
          <div className="flex justify-end border-t border-gray-200 pt-4">
            <Button
              type="button"
              onClick={() => setShowValidationModal(false)}
              className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
            >
              Got it
            </Button>
          </div>
        </div>
      </Modal>

      <div className="space-y-6 p-4">
        <CRMPageHeader
          title="Add New Contact"
          subtitle="Create a new contact with detailed information"
          breadcrumb={[
            { label: 'Dashboard', href: '/' },
            { label: 'Sales', href: '/sales' },
            { label: 'Contacts', href: '/sales/contacts' },
            { label: 'Add New', href: '/sales/contacts/new' },
          ]}
          showProfile
          showSearch={false}
          showActions={false}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {Object.keys(errors).length > 0 && !errors.submit && (
            <div className="rounded-xl border-2 border-red-300 bg-red-50 p-5 shadow-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
                <div className="flex-1">
                  <h4 className="mb-2 text-lg font-semibold text-red-900">Validation error</h4>
                  <p className="mb-3 text-red-700">Please correct the fields below.</p>
                  <ul className="list-inside list-disc space-y-1 text-red-700">
                    {errors.firstName && <li className="font-medium">First name is required</li>}
                    {errors.lastName && <li className="font-medium">Last name is required</li>}
                    {errors.email && <li className="font-medium">{errors.email}</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Basic information */}
          <FormSectionCard
            icon={User}
            title="Basic information"
            description="Essential contact details and personal information"
            cardClassName="rounded-2xl border border-white/30 bg-gradient-to-br from-white/70 to-white/40 p-6 shadow-xl backdrop-blur-xl"
          >

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Input
                label="First name"
                required
                value={form.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                error={errors.firstName}
                placeholder="First name"
              />
              <Input
                label="Last name"
                required
                value={form.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                error={errors.lastName}
                placeholder="Last name"
              />
              <Select
                label="Status"
                value={form.status}
                onChange={(value) => handleChange('status', value)}
                options={statusOptions}
                placeholder="Select status"
              />
              <Select
                label="Assigned to"
                value={form.assignedTo}
                onChange={(value) => handleChange('assignedTo', value)}
                options={userSelectOptions}
                disabled={loadingUsers}
                placeholder="Select user"
              />
              <Input
                label="Email address"
                required
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
                placeholder="name@company.com"
                icon={Mail}
              />
              <Input
                label="Phone number"
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                icon={Phone}
              />
              <Select
                label="Preferred contact method"
                value={form.preferredContactMethod}
                onChange={(value) => handleChange('preferredContactMethod', value)}
                options={preferredContactOptions}
                placeholder="Select method"
              />
              <Input
                label="Birth date"
                type="date"
                value={form.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                icon={Calendar}
              />
              <Input
                label="Timezone"
                value={form.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                placeholder="e.g. Asia/Kolkata"
              />
              <div className="lg:col-span-3">
                <Select
                  label="Source"
                  value={form.source}
                  onChange={(value) => handleChange('source', value)}
                  options={sourceOptions}
                  placeholder="Select source"
                />
              </div>
            </div>
          </FormSectionCard>

          {/* Company association */}
          <FormSectionCard
            icon={Building2}
            title="Company association"
            description="Link this contact to a lead company or client account (select one)"
            cardClassName="rounded-2xl border border-white/30 bg-gradient-to-br from-white/70 to-white/40 p-6 shadow-xl backdrop-blur-xl"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Select
                label="Lead company"
                value={form.leadCompany}
                onChange={onLeadCompanyChange}
                options={leadCompanyOptions}
                placeholder="Select lead company"
                disabled={loadingRefs || Boolean(form.clientAccount)}
              />
              <Select
                label="Client account"
                value={form.clientAccount}
                onChange={onClientAccountChange}
                options={clientAccountOptions}
                placeholder="Select client account"
                disabled={loadingRefs || Boolean(form.leadCompany)}
              />
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Choose either a lead company or a client account. Company details below update from your selection.
            </p>
          </FormSectionCard>

          {/* Professional information */}
          <FormSectionCard
            icon={Briefcase}
            title="Professional information"
            description="Work-related details and company information"
            cardClassName="rounded-2xl border border-white/30 bg-gradient-to-br from-white/70 to-white/40 p-6 shadow-xl backdrop-blur-xl"
          >

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Input
                label="Job title"
                value={form.jobTitle}
                onChange={(e) => handleChange('jobTitle', e.target.value)}
                placeholder="Job title"
                icon={Briefcase}
              />
              <Input
                label="Department"
                value={form.department}
                onChange={(e) => handleChange('department', e.target.value)}
                placeholder="Department"
              />
              <Input
                label="Company name"
                value={form.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="Company name"
                icon={Building2}
              />
              <div className="lg:col-span-3">
                <Input
                  label="Company website"
                  type="url"
                  value={form.companyWebsite}
                  onChange={(e) => handleChange('companyWebsite', e.target.value)}
                  placeholder="https://company.com"
                  icon={Globe}
                />
              </div>
            </div>
          </FormSectionCard>

          {/* Address information */}
          <FormSectionCard
            icon={MapPin}
            title="Address information"
            description="Location and contact address details"
            cardClassName="rounded-2xl border border-white/30 bg-gradient-to-br from-white/70 to-white/40 p-6 shadow-xl backdrop-blur-xl"
          >

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-3">
                <Input
                  label="Street address"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Street address"
                  icon={MapPin}
                />
              </div>
              <Input
                label="City"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="City"
              />
              <Input
                label="State / province"
                value={form.state}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="State or province"
              />
              <Input
                label="ZIP / postal code"
                value={form.zipCode}
                onChange={(e) => handleChange('zipCode', e.target.value)}
                placeholder="ZIP or postal code"
              />
              <div className="lg:col-span-3">
                <Input
                  label="Country"
                  value={form.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  placeholder="Country"
                />
              </div>
            </div>
          </FormSectionCard>

          {/* Social & additional */}
          <FormSectionCard
            icon={MessageSquare}
            title="Social &amp; additional information"
            description="Social media profiles and additional notes"
            cardClassName="rounded-2xl border border-white/30 bg-gradient-to-br from-white/70 to-white/40 p-6 shadow-xl backdrop-blur-xl"
          >

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input
                label="LinkedIn profile"
                value={form.linkedinUrl}
                onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                placeholder="https://linkedin.com/in/…"
                icon={Linkedin}
              />
              <Input
                label="Twitter handle"
                value={form.twitter}
                onChange={(e) => handleChange('twitter', e.target.value)}
                placeholder="@handle or profile URL"
                icon={Hash}
              />
              <div className="md:col-span-2">
                <Textarea
                  label="Notes"
                  value={form.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Additional notes about this contact…"
                  rows={4}
                />
              </div>
            </div>
          </FormSectionCard>

          {errors.submit && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
              <p className="text-red-700">{errors.submit}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-6">
            <Button
              type="button"
              onClick={() => router.back()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex min-w-[160px] items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  Creating…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create contact
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
