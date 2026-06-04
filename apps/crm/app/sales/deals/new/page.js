'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Button,
  Card,
  Input,
  Select,
  Textarea,
  FormSectionCard,
  LoadingSpinner,
  Modal,
} from '@webfudge/ui';
import CRMPageHeader from '../../../../components/CRMPageHeader';
import dealService from '../../../../lib/api/dealService';
import leadCompanyService from '../../../../lib/api/leadCompanyService';
import clientAccountService from '../../../../lib/api/clientAccountService';
import contactService from '../../../../lib/api/contactService';
import { canWriteCRM } from '../../../../lib/rbac';
import {
  DEAL_STAGE_OPTIONS,
  PRIORITY_OPTIONS,
  VISIBILITY_OPTIONS,
  DEAL_GROUP_OPTIONS,
  isConvertedLeadCompany,
  contactDisplayName,
  filterContactsForCompany,
  defaultPrimaryContactId,
  contactOptionValue,
  contactRowMatchesId,
} from '../../../../lib/dealFormOptions';
import {
  Briefcase,
  LineChart,
  Building2,
  FileText,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  Calendar,
  Target,
  FolderOpen,
  Percent,
  Eye,
  Users,
} from 'lucide-react';

/** Matches lead-company add page `FormSectionCard` shell. */
const SECTION_CARD_CLASS =
  'rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6';

const initialForm = {
  name: '',
  stage: 'discovery',
  value: '',
  expectedCloseDate: '',
  priority: 'medium',
  description: '',
  probability: '25',
  visibility: 'public',
  dealGroup: '',
  leadCompany: '',
  clientAccount: '',
  contact: '',
  notes: '',
};

export default function NewDealPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState(() => {
    const prefilledLeadCompany = searchParams?.get('leadCompany') || '';
    const prefilledClientAccount = searchParams?.get('clientAccount') || '';
    return {
      ...initialForm,
      leadCompany: prefilledLeadCompany,
      clientAccount: prefilledClientAccount,
    };
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);

  const [leadCompanies, setLeadCompanies] = useState([]);
  const [clientAccounts, setClientAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const canCreateDeals = canWriteCRM('deals');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingRefs(true);
      try {
        const [lcRes, caRes, cRes] = await Promise.allSettled([
          leadCompanyService.getAll({
            sort: 'companyName:asc',
            'pagination[pageSize]': 100,
            populate: ['convertedAccount'],
          }),
          clientAccountService.getAll({
            sort: 'companyName:asc',
            'pagination[pageSize]': 100,
          }),
          contactService.getAll({
            sort: 'createdAt:desc',
            'pagination[pageSize]': 500,
            populate: ['leadCompany', 'clientAccount'],
          }),
        ]);
        if (cancelled) return;
        if (lcRes.status === 'fulfilled') {
          setLeadCompanies(lcRes.value.data || []);
        } else {
          console.error('Lead companies failed to load', lcRes.reason);
          setLeadCompanies([]);
        }
        if (caRes.status === 'fulfilled') {
          setClientAccounts(caRes.value.data || []);
        } else {
          console.error('Client accounts failed to load', caRes.reason);
          setClientAccounts([]);
        }
        if (cRes.status === 'fulfilled') {
          setContacts(cRes.value.data || []);
        } else {
          console.error('Contacts failed to load', cRes.reason);
          setContacts([]);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setLeadCompanies([]);
          setClientAccounts([]);
          setContacts([]);
        }
      } finally {
        if (!cancelled) setLoadingRefs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Mirror edit-deal: default/fill contact when company changes and contacts finish loading. */
  useEffect(() => {
    if (loadingRefs) return;
    setForm((prev) => {
      if (!prev.leadCompany && !prev.clientAccount) {
        if (!prev.contact) return prev;
        return { ...prev, contact: '' };
      }
      if (!contacts.length) return prev;

      const list = filterContactsForCompany(contacts, prev.leadCompany, prev.clientAccount);
      const prevC = prev.contact ? String(prev.contact).trim() : '';

      if (prevC) {
        const inList = list.some((c) => contactRowMatchesId(c, prevC));
        if (inList) {
          const row = list.find((c) => contactRowMatchesId(c, prevC));
          const canon = row ? contactOptionValue(row) : prevC;
          if (canon && canon !== prevC) return { ...prev, contact: canon };
          return prev;
        }
      }

      const pid = defaultPrimaryContactId(list) || '';
      if (pid === prevC) return prev;
      if (!pid && !prevC) return prev;
      return { ...prev, contact: pid };
    });
  }, [loadingRefs, contacts, form.leadCompany, form.clientAccount]);

  const leadCompanyOptions = useMemo(
    () =>
      leadCompanies
        .filter((c) => !isConvertedLeadCompany(c))
        .map((c) => {
          const value = String(c.id ?? c.documentId ?? '');
          if (!value) return null;
          return {
            value,
            label: c.companyName || c.name || `Company #${value}`,
          };
        })
        .filter(Boolean),
    [leadCompanies]
  );

  const clientAccountOptions = useMemo(
    () =>
      clientAccounts
        .map((a) => {
          const value = String(a.id ?? a.documentId ?? '');
          if (!value) return null;
          return {
            value,
            label: a.companyName || a.name || `Account #${value}`,
          };
        })
        .filter(Boolean),
    [clientAccounts]
  );

  const filteredContacts = useMemo(
    () => filterContactsForCompany(contacts, form.leadCompany, form.clientAccount),
    [contacts, form.leadCompany, form.clientAccount]
  );

  const contactOptions = useMemo(
    () =>
      filteredContacts.map((c) => ({
        value: contactOptionValue(c),
        label: contactDisplayName(c) || `Contact #${contactOptionValue(c)}`,
      })),
    [filteredContacts]
  );

  const dealGroupSelectOptions = useMemo(
    () => DEAL_GROUP_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    []
  );

  const setField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'leadCompany') {
        if (value) next.clientAccount = '';
        next.leadCompany = value;
        const list = filterContactsForCompany(contacts, next.leadCompany, next.clientAccount);
        next.contact = defaultPrimaryContactId(list);
        return next;
      }
      if (field === 'clientAccount') {
        if (value) next.leadCompany = '';
        next.clientAccount = value;
        const list = filterContactsForCompany(contacts, next.leadCompany, next.clientAccount);
        next.contact = defaultPrimaryContactId(list);
        return next;
      }
      return next;
    });
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }));
    if (errors.submit) setErrors((e) => ({ ...e, submit: null }));
  };

  const validateForm = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Deal name is required';
    if (form.value === '' || form.value == null) {
      next.value = 'Deal value is required';
    } else if (Number.isNaN(Number(form.value))) {
      next.value = 'Enter a valid amount';
    }
    if (!form.expectedCloseDate?.trim()) next.expectedCloseDate = 'Expected close date is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canCreateDeals) {
      setErrors({ submit: 'You only have read access to deals.' });
      return;
    }
    if (!validateForm()) {
      setShowValidationModal(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        stage: form.stage,
        value: form.value,
        expectedCloseDate: form.expectedCloseDate,
        priority: form.priority,
        description: form.description,
        probability: form.probability,
        visibility: form.visibility,
        dealGroup: form.dealGroup || undefined,
        notes: form.notes,
        leadCompany: form.leadCompany || null,
        clientAccount: form.clientAccount || null,
        contact: form.contact || null,
      };
      const res = await dealService.create(payload);
      const newId = res?.data?.id ?? res?.id;
      setShowSuccess(true);
      setTimeout(() => {
        router.push(newId != null ? `/sales/deals/${newId}` : '/sales/deals');
      }, 2000);
    } catch (err) {
      const message = err?.message || 'Failed to create deal. Please try again.';
      setErrors({ submit: message });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Success!</h2>
          <p className="mb-4 text-gray-600">Deal created successfully</p>
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-orange-500" />
          <p className="mt-2 text-sm text-gray-500">Redirecting to deal details...</p>
        </div>
      </div>
    );
  }

  if (!canCreateDeals) {
    return (
      <div className="min-h-screen bg-white">
        <div className="space-y-6 p-4">
          <CRMPageHeader
            title="View-only access"
            subtitle="Members can read deals, but cannot create or update them."
            breadcrumb={[
              { label: 'Sales', href: '/sales' },
              { label: 'Deals', href: '/sales/deals' },
              { label: 'New Deal', href: '/sales/deals/new' },
            ]}
            showSearch={false}
            showActions={false}
          />
          <Card variant="elevated" className="rounded-xl p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900">You cannot create deals with your current role.</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">
              Deal creation, editing, stage changes, and deletion require write or manage access.
            </p>
            <Button type="button" variant="primary" className="mt-6" onClick={() => router.push('/sales/deals')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to deals
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Modal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title="Validation Error"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h4 className="mb-2 text-lg font-semibold text-gray-900">Please fill in all required fields</h4>
              <p className="mb-4 text-gray-600">The following information is required to create a deal:</p>
              <ul className="list-inside list-disc space-y-2 text-gray-700">
                {errors.name && <li className="font-medium text-red-700">Deal name</li>}
                {errors.value && <li className="font-medium text-red-700">Deal value</li>}
                {errors.expectedCloseDate && <li className="font-medium text-red-700">Expected close date</li>}
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

      <div className="space-y-6 p-4">
        <CRMPageHeader
          title="Add New Deal"
          subtitle="Create a new deal and add it to your sales pipeline."
          breadcrumb={[
            { label: 'Dashboard', href: '/' },
            { label: 'Sales', href: '/sales' },
            { label: 'Deals', href: '/sales/deals' },
            { label: 'Add New', href: '/sales/deals/new' },
          ]}
          showProfile
          showSearch={false}
          showActions={false}
        />

        {loadingRefs ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <LoadingSpinner size="lg" message="Loading form…" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {Object.keys(errors).length > 0 && !errors.submit && (
              <div className="rounded-xl border-2 border-red-300 bg-red-50 p-5 shadow-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
                  <div className="flex-1">
                    <h4 className="mb-2 text-lg font-semibold text-red-900">
                      Validation Error - Please fill in all required fields
                    </h4>
                    <p className="mb-3 text-red-700">The following fields are required or contain invalid information:</p>
                    <ul className="list-inside list-disc space-y-1 text-red-700">
                      {errors.name && <li className="font-medium">Deal name is required</li>}
                      {errors.value && <li className="font-medium">{errors.value}</li>}
                      {errors.expectedCloseDate && <li className="font-medium">{errors.expectedCloseDate}</li>}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <FormSectionCard
              icon={Briefcase}
              title="Deal Information"
              description="Basic details about the deal opportunity."
              cardClassName={SECTION_CARD_CLASS}
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Input
                    label="Deal name"
                    required
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    error={errors.name}
                    placeholder="Enter deal name"
                  />
                </div>
                <div>
                  <Select
                    label="Stage"
                    value={form.stage}
                    onChange={(v) => setField('stage', v)}
                    options={DEAL_STAGE_OPTIONS}
                    placeholder="Select stage"
                    icon={Target}
                  />
                </div>

                <div>
                  <Input
                    label="Deal value (₹)"
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    value={form.value}
                    onChange={(e) => setField('value', e.target.value)}
                    error={errors.value}
                    placeholder="0"
                    icon={IndianRupee}
                  />
                </div>
                <div>
                  <Input
                    label="Expected close date"
                    type="date"
                    required
                    value={form.expectedCloseDate}
                    onChange={(e) => setField('expectedCloseDate', e.target.value)}
                    error={errors.expectedCloseDate}
                    icon={Calendar}
                  />
                  <p className="mt-1 text-xs text-gray-500">dd-mm-yyyy</p>
                </div>
                <div>
                  <Select
                    label="Priority"
                    value={form.priority}
                    onChange={(v) => setField('priority', v)}
                    options={PRIORITY_OPTIONS}
                    placeholder="Select priority"
                  />
                </div>

                <div className="lg:col-span-3">
                  <Textarea
                    label="Description"
                    value={form.description}
                    onChange={(e) => setField('description', e.target.value)}
                    placeholder="Describe the deal opportunity..."
                    rows={4}
                  />
                </div>
              </div>
            </FormSectionCard>

            <FormSectionCard
              icon={LineChart}
              title="Sales Information"
              description="Sales metrics and probability details."
              cardClassName={SECTION_CARD_CLASS}
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <Input
                    label="Probability (%)"
                    type="number"
                    min={0}
                    max={100}
                    value={form.probability}
                    onChange={(e) => setField('probability', e.target.value)}
                    icon={Percent}
                  />
                </div>
                <div>
                  <Select
                    label="Visibility"
                    value={form.visibility}
                    onChange={(v) => setField('visibility', v)}
                    options={VISIBILITY_OPTIONS}
                    placeholder="Select visibility"
                    icon={Eye}
                  />
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <Select
                    label="Deal group"
                    value={form.dealGroup}
                    onChange={(v) => setField('dealGroup', v)}
                    options={dealGroupSelectOptions}
                    placeholder="Select group (optional)"
                    icon={FolderOpen}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-[42px] shrink-0 border-orange-300 text-orange-700 hover:bg-orange-50"
                  onClick={() => {}}
                >
                  <FolderOpen className="mr-2 inline h-4 w-4" />
                  Manage
                </Button>
              </div>
            </FormSectionCard>

            <FormSectionCard
              icon={Building2}
              title="Company & Contact"
              description="Associate deal with a company and contact."
              cardClassName={SECTION_CARD_CLASS}
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Select
                  label="Lead company"
                  value={form.leadCompany}
                  onChange={(v) => setField('leadCompany', v)}
                  options={leadCompanyOptions}
                  placeholder="Select lead company"
                  disabled={Boolean(form.clientAccount)}
                  icon={Building2}
                />
                <Select
                  label="Client account"
                  value={form.clientAccount}
                  onChange={(v) => setField('clientAccount', v)}
                  options={clientAccountOptions}
                  placeholder="Select client account"
                  disabled={Boolean(form.leadCompany)}
                  icon={Building2}
                />
              </div>
              <p className="mt-3 text-sm text-gray-500">Clear one side to select the other.</p>
              <div className="mt-6">
                <Select
                  label="Primary contact"
                  value={form.contact}
                  onChange={(v) => setField('contact', v)}
                  options={contactOptions}
                  placeholder={
                    form.leadCompany || form.clientAccount
                      ? 'Select primary contact'
                      : 'Select a lead company or client account first'
                  }
                  disabled={!form.leadCompany && !form.clientAccount}
                  icon={Users}
                />
                {(form.leadCompany || form.clientAccount) && contactOptions.length === 0 ? (
                  <p className="mt-1 text-sm text-gray-500">No contacts linked to this company yet.</p>
                ) : null}
              </div>
            </FormSectionCard>

            <FormSectionCard
              icon={FileText}
              title="Additional Information"
              description="Notes and additional details about the deal."
              cardClassName={SECTION_CARD_CLASS}
            >
              <Textarea
                label="Notes"
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="Add any additional notes about this deal..."
                rows={4}
              />
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
                className="flex min-w-[140px] items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Deal
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
