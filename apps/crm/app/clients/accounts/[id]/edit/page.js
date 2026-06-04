'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  Button,
  Input,
  LoadingSpinner,
  Select,
  Textarea,
  FormSectionCard,
  useIndustrySelectOptions,
} from '@webfudge/ui';
import CRMPageHeader from '../../../../../components/CRMPageHeader';
import clientAccountService from '../../../../../lib/api/clientAccountService';
import strapiClient from '../../../../../lib/strapiClient';
import { canWriteCRM } from '../../../../../lib/rbac';
import {
  companyTypes,
  INDUSTRY_OTHER_VALUE,
  industryFormFromStored,
  resolveIndustryForSave,
  canonicalCompanyTypeValue,
} from '@webfudge/utils';
import { fetchStoredIndustriesForCrm } from '../../../../../lib/industryOptionsLoader';
import {
  ArrowLeft,
  AtSign,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  Globe,
  Hash,
  Layers,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Save,
  TrendingUp,
} from 'lucide-react';

const employeeSizeOptions = [
  { value: 'SIZE_1_10', label: '1-10 employees' },
  { value: 'SIZE_11_50', label: '11-50 employees' },
  { value: 'SIZE_51_200', label: '51-200 employees' },
  { value: 'SIZE_201_500', label: '201-500 employees' },
  { value: 'SIZE_501_1000', label: '501-1000 employees' },
  { value: 'SIZE_1000_PLUS', label: '1000+ employees' },
];

const accountTypeOptions = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
  { value: 'PARTNER', label: 'Partner' },
];

const accountStatusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const billingCycleOptions = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUALLY', label: 'Annually' },
  { value: 'PROJECT_BASIS', label: 'Project basis' },
];

const paymentTermsOptions = [
  { value: 'NET_30', label: 'Net 30 days' },
  { value: 'NET_15', label: 'Net 15 days' },
  { value: 'NET_60', label: 'Net 60 days' },
  { value: 'DUE_ON_RECEIPT', label: 'Due on receipt' },
];

function toDateInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

const initialForm = {
  companyName: '',
  industry: '',
  industryOther: '',
  type: '',
  website: '',
  phone: '',
  email: '',
  description: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  accountType: 'STANDARD',
  status: 'ACTIVE',
  employees: '',
  dealValue: '',
  healthScore: '75',
  founded: '',
  onboardingDate: '',
  conversionDate: '',
  contractStartDate: '',
  contractEndDate: '',
  billingCycle: 'MONTHLY',
  paymentTerms: 'NET_30',
  linkedIn: '',
  twitter: '',
  notes: '',
  assignedTo: '',
};

export default function EditClientAccountPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const canEditClientAccount = canWriteCRM('client_accounts');

  const { options: industrySelectOptions, onIndustrySaved } = useIndustrySelectOptions({
    fetchStoredIndustries: fetchStoredIndustriesForCrm,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [accountLabel, setAccountLabel] = useState('');

  const [form, setForm] = useState(initialForm);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const companyTypeSelectOptions = useMemo(
    () => companyTypes.map((t) => ({ value: t.id, label: t.name })),
    []
  );

  useEffect(() => {
    if (!canEditClientAccount) {
      setLoadingUsers(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoadingUsers(true);
      try {
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
        if (!cancelled) setUsers(allUsers);
      } catch (e) {
        console.error(e);
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canEditClientAccount]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await clientAccountService.getOne(id);
        if (!cancelled && res?.data) {
          const d = res.data;
          const name = d.companyName ?? d.name ?? '';
          setAccountLabel(name);
          const assigneeId =
            d.assignedTo && typeof d.assignedTo === 'object'
              ? d.assignedTo.id
              : d.assignedTo;
          const { industry, industryOther } = industryFormFromStored(d.industry ?? '');
          setForm({
            companyName: name,
            industry,
            industryOther,
            type: canonicalCompanyTypeValue(d.type ?? ''),
            website: d.website ?? '',
            phone: d.phone ?? '',
            email: d.email ?? '',
            description: d.description ?? '',
            address: d.address ?? '',
            city: d.city ?? '',
            state: d.state ?? '',
            zipCode: d.zipCode ?? '',
            country: d.country ?? '',
            accountType: d.accountType ?? 'STANDARD',
            status: d.status ?? 'ACTIVE',
            employees: d.employees ?? '',
            dealValue: d.dealValue != null && d.dealValue !== '' ? String(d.dealValue) : '',
            healthScore:
              d.healthScore != null && d.healthScore !== '' ? String(d.healthScore) : '75',
            founded: d.founded != null ? String(d.founded) : '',
            onboardingDate: toDateInput(d.onboardingDate),
            conversionDate: toDateInput(d.conversionDate),
            contractStartDate: toDateInput(d.contractStartDate),
            contractEndDate: toDateInput(d.contractEndDate),
            billingCycle: d.billingCycle ?? 'MONTHLY',
            paymentTerms: d.paymentTerms ?? 'NET_30',
            linkedIn: d.linkedIn ?? '',
            twitter: d.twitter ?? '',
            notes: d.notes ?? '',
            assignedTo: assigneeId != null ? String(assigneeId) : '',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'industry' && value !== INDUSTRY_OTHER_VALUE) {
        next.industryOther = '';
      }
      return next;
    });
    setSubmitError('');
  };

  const buildPayload = () => {
    const hsRaw = parseInt(String(form.healthScore), 10);
    const payload = {
      companyName: form.companyName.trim(),
      industry: resolveIndustryForSave(form.industry, form.industryOther),
      status: form.status,
      accountType: form.accountType,
      billingCycle: form.billingCycle,
      paymentTerms: form.paymentTerms,
      healthScore: Number.isNaN(hsRaw) ? 75 : Math.min(100, Math.max(0, hsRaw)),
    };

    if (form.type) payload.type = form.type;
    if (form.website?.trim()) payload.website = form.website.trim();
    if (form.phone?.trim()) payload.phone = form.phone.trim();
    if (form.email?.trim()) payload.email = form.email.trim();
    if (form.description?.trim()) payload.description = form.description.trim();
    if (form.address?.trim()) payload.address = form.address.trim();
    if (form.city?.trim()) payload.city = form.city.trim();
    if (form.state?.trim()) payload.state = form.state.trim();
    if (form.country?.trim()) payload.country = form.country.trim();
    if (form.zipCode?.trim()) payload.zipCode = form.zipCode.trim();
    if (form.employees) payload.employees = form.employees;
    if (form.founded?.trim()) payload.founded = form.founded.trim();
    if (form.dealValue !== '' && form.dealValue != null) {
      const n = parseFloat(String(form.dealValue));
      if (!Number.isNaN(n)) payload.dealValue = n;
    }
    if (form.linkedIn?.trim()) payload.linkedIn = form.linkedIn.trim();
    if (form.twitter?.trim()) payload.twitter = form.twitter.trim();
    if (form.notes?.trim()) payload.notes = form.notes.trim();

    if (form.onboardingDate) payload.onboardingDate = `${form.onboardingDate}T12:00:00.000Z`;
    if (form.conversionDate) payload.conversionDate = `${form.conversionDate}T12:00:00.000Z`;
    if (form.contractStartDate) payload.contractStartDate = `${form.contractStartDate}T12:00:00.000Z`;
    if (form.contractEndDate) payload.contractEndDate = `${form.contractEndDate}T12:00:00.000Z`;

    if (form.assignedTo) {
      const n = parseInt(form.assignedTo, 10);
      if (!Number.isNaN(n)) payload.assignedTo = n;
    }

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!canEditClientAccount) {
      setSubmitError('You do not have permission to edit client accounts.');
      return;
    }
    if (!form.companyName.trim()) {
      setSubmitError('Company name is required');
      return;
    }
    const resolvedIndustry = resolveIndustryForSave(form.industry, form.industryOther);
    if (!resolvedIndustry) {
      setSubmitError('Industry is required');
      return;
    }
    if (form.industry === INDUSTRY_OTHER_VALUE && !form.industryOther?.trim()) {
      setSubmitError('Please specify your industry');
      return;
    }
    if (!form.email.trim()) {
      setSubmitError('Company email is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
      setSubmitError('Please enter a valid company email address');
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      await clientAccountService.update(id, payload);
      onIndustrySaved(payload.industry);
      setShowSuccess(true);
      window.setTimeout(() => {
        router.push(`/clients/accounts/${id}`);
      }, 1200);
    } catch (err) {
      setSubmitError(err?.message || 'Failed to update client account');
    } finally {
      setSaving(false);
    }
  };

  const headerUpdateButtonClassName =
    'min-w-[200px] rounded-xl border-0 bg-gradient-to-r from-orange-500 to-pink-500 py-2.5 font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-60';

  if (showSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Success!</h2>
          <p className="mb-4 text-gray-600">Client account updated successfully</p>
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-orange-500" />
          <p className="mt-2 text-sm text-gray-500">Redirecting…</p>
        </div>
      </div>
    );
  }

  if (!canEditClientAccount) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <CRMPageHeader
          title="View-only access"
          subtitle={accountLabel || 'Client account editing is restricted for your role.'}
          breadcrumb={[
            { label: 'Dashboard', href: '/' },
            { label: 'Clients', href: '/clients' },
            { label: 'Accounts', href: '/clients/accounts' },
            { label: accountLabel || 'Account', href: id ? `/clients/accounts/${id}` : '/clients/accounts' },
          ]}
          showSearch={false}
          showActions={false}
        />
        <Card variant="elevated" className="rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900">You can view this client account, but cannot edit it.</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">
            Client account updates require CRM client account write access. Members keep read-only access by default.
          </p>
          <Link href={id ? `/clients/accounts/${id}` : '/clients/accounts'} className="mt-6 inline-flex">
            <Button type="button" variant="primary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to account
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <form onSubmit={handleSubmit}>
        <CRMPageHeader
          title="Edit Client Account"
          subtitle={loading ? undefined : accountLabel || undefined}
          breadcrumb={[
            { label: 'Dashboard', href: '/' },
            { label: 'Clients', href: '/clients' },
            { label: 'Accounts', href: '/clients/accounts' },
            { label: accountLabel || 'Account', href: id ? `/clients/accounts/${id}` : '/clients/accounts' },
            { label: 'Edit', href: id ? `/clients/accounts/${id}/edit` : '/clients/accounts' },
          ]}
          showSearch={false}
          showActions={false}
        >
          <div className="flex items-center justify-end gap-3">
            <Link href={id ? `/clients/accounts/${id}` : '/clients/accounts'}>
              <Button
                type="button"
                variant="secondary"
                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-gray-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              disabled={saving || loading}
              className={headerUpdateButtonClassName}
            >
              {!saving ? <Save className="mr-2 h-4 w-4" /> : null}
              {saving ? 'Updating…' : 'Update Client Account'}
            </Button>
          </div>
        </CRMPageHeader>

        {loading ? (
          <Card variant="elevated" className="mt-6 flex justify-center rounded-xl p-12">
            <LoadingSpinner message="Loading client account..." />
          </Card>
        ) : (
          <div className="mt-6 space-y-6">
            {submitError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
                {submitError}
              </p>
            ) : null}

            <FormSectionCard
              icon={Building2}
              title="Company Information"
              description="Basic information about the client company"
              cardClassName="rounded-xl p-6"
              iconContainerClassName="bg-brand-primary shadow-sm"
            >

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Input
                    label="Company name *"
                    value={form.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    required
                  />
                </div>
                <Select
                  label="Industry *"
                  value={form.industry}
                  onChange={(v) => handleChange('industry', v)}
                  options={industrySelectOptions}
                  placeholder="Select industry"
                  icon={Building2}
                  allowCustom
                  searchable
                />
                {form.industry === INDUSTRY_OTHER_VALUE ? (
                  <Input
                    label="Specify industry *"
                    value={form.industryOther}
                    onChange={(e) => handleChange('industryOther', e.target.value)}
                    placeholder="Enter your industry"
                    icon={Briefcase}
                  />
                ) : null}
                <Select
                  label="Company type"
                  value={form.type}
                  onChange={(v) => handleChange('type', v)}
                  options={companyTypeSelectOptions}
                  placeholder="Select company type"
                  icon={Layers}
                />
                <Input
                  label="Website"
                  type="url"
                  value={form.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://company.com"
                  icon={Globe}
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  icon={Phone}
                />
                <Input
                  label="Company email *"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  icon={Mail}
                />
                <Select
                  label="Company size"
                  value={form.employees}
                  onChange={(v) => handleChange('employees', v)}
                  options={employeeSizeOptions}
                  placeholder="Select company size"
                />
                <Input
                  label="Founded year"
                  type="number"
                  value={form.founded}
                  onChange={(e) => handleChange('founded', e.target.value)}
                  min={1800}
                  max={new Date().getFullYear()}
                  icon={Calendar}
                />
                <div className="md:col-span-2 lg:col-span-3">
                  <Textarea
                    label="Company description"
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
                    placeholder="Brief description of the company…"
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
                    value={form.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    icon={MapPin}
                  />
                </div>
                <Input label="City" value={form.city} onChange={(e) => handleChange('city', e.target.value)} />
                <Input
                  label="State / Province"
                  value={form.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                />
                <Input label="Country" value={form.country} onChange={(e) => handleChange('country', e.target.value)} />
                <Input
                  label="ZIP / Postal code"
                  value={form.zipCode}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                />
              </div>
            </FormSectionCard>

            <FormSectionCard
              icon={Briefcase}
              title="Account Details"
              description="Status, ownership, and commercial fields"
              cardClassName="rounded-xl p-6"
              iconContainerClassName="bg-brand-primary shadow-sm"
            >

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Select
                  label="Account type"
                  value={form.accountType}
                  onChange={(v) => handleChange('accountType', v)}
                  options={accountTypeOptions}
                />
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(v) => handleChange('status', v)}
                  options={accountStatusOptions}
                />
                <Select
                  label="Account manager"
                  value={form.assignedTo}
                  onChange={(v) => handleChange('assignedTo', v)}
                  options={[
                    { value: '', label: 'Unassigned' },
                    ...users.map((u) => ({
                      value: String(u.id),
                      label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
                    })),
                  ]}
                  disabled={loadingUsers}
                />
                <Input
                  label="Total deal value"
                  type="number"
                  value={form.dealValue}
                  onChange={(e) => handleChange('dealValue', e.target.value)}
                  min={0}
                  step="0.01"
                  icon={DollarSign}
                />
                <Input
                  label="Health score (%)"
                  type="number"
                  value={form.healthScore}
                  onChange={(e) => handleChange('healthScore', e.target.value)}
                  min={0}
                  max={100}
                  icon={TrendingUp}
                />
              </div>
            </FormSectionCard>

            <FormSectionCard
              icon={Calendar}
              title="Contract &amp; billing"
              description="Dates and billing preferences"
              cardClassName="rounded-xl p-6"
              iconContainerClassName="bg-brand-primary shadow-sm"
            >

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Input
                  label="Onboarding date"
                  type="date"
                  value={form.onboardingDate}
                  onChange={(e) => handleChange('onboardingDate', e.target.value)}
                  icon={Calendar}
                />
                <Input
                  label="Conversion date"
                  type="date"
                  value={form.conversionDate}
                  onChange={(e) => handleChange('conversionDate', e.target.value)}
                  icon={Calendar}
                />
                <Input
                  label="Contract start"
                  type="date"
                  value={form.contractStartDate}
                  onChange={(e) => handleChange('contractStartDate', e.target.value)}
                  icon={Calendar}
                />
                <Input
                  label="Contract end"
                  type="date"
                  value={form.contractEndDate}
                  onChange={(e) => handleChange('contractEndDate', e.target.value)}
                  icon={Calendar}
                />
                <Select
                  label="Billing cycle"
                  value={form.billingCycle}
                  onChange={(v) => handleChange('billingCycle', v)}
                  options={billingCycleOptions}
                />
                <Select
                  label="Payment terms"
                  value={form.paymentTerms}
                  onChange={(v) => handleChange('paymentTerms', v)}
                  options={paymentTermsOptions}
                />
              </div>
            </FormSectionCard>

            <FormSectionCard
              icon={Hash}
              title="Social &amp; additional information"
              description="Social profiles and notes"
              cardClassName="rounded-xl p-6"
              iconContainerClassName="bg-brand-primary shadow-sm"
            >

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Input
                  label="LinkedIn URL"
                  type="url"
                  value={form.linkedIn}
                  onChange={(e) => handleChange('linkedIn', e.target.value)}
                  placeholder="https://www.linkedin.com/company/…"
                  icon={Linkedin}
                />
                <Input
                  label="Twitter / X"
                  value={form.twitter}
                  onChange={(e) => handleChange('twitter', e.target.value)}
                  placeholder="https://twitter.com/…"
                  icon={AtSign}
                />
                <div className="md:col-span-2">
                  <Textarea
                    label="Notes"
                    value={form.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={4}
                    placeholder="Additional notes about this client account…"
                  />
                </div>
              </div>
            </FormSectionCard>

            <div className="flex flex-col-reverse items-center justify-end gap-3 pt-2 md:flex-row md:gap-3">
              <Link href={id ? `/clients/accounts/${id}` : '/clients/accounts'} className="w-full md:w-auto">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-gray-700 md:w-auto"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                disabled={saving || loading}
                className={headerUpdateButtonClassName}
              >
                {!saving ? <Save className="mr-2 h-4 w-4" /> : null}
                {saving ? 'Updating…' : 'Update Client Account'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
