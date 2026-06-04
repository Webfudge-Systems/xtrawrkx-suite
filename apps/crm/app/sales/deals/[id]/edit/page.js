'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  Card,
  Input,
  Select,
  Textarea,
  FormSectionCard,
  LoadingSpinner,
} from '@webfudge/ui';
import CRMPageHeader from '../../../../../components/CRMPageHeader';
import WonDealProjectModal from '../../../../../components/WonDealProjectModal';
import dealService from '../../../../../lib/api/dealService';
import { shouldPromptDeliveryProjectOnWon } from '../../../../../lib/wonDealProjectPrompt';
import leadCompanyService from '../../../../../lib/api/leadCompanyService';
import clientAccountService from '../../../../../lib/api/clientAccountService';
import contactService from '../../../../../lib/api/contactService';
import strapiClient from '../../../../../lib/strapiClient';
import {
  DEAL_STAGE_OPTIONS,
  PRIORITY_OPTIONS,
  VISIBILITY_OPTIONS,
  SOURCE_OPTIONS,
  contactDisplayName,
  isConvertedLeadCompany,
  filterContactsForCompany,
  defaultPrimaryContactId,
  contactOptionValue,
  contactRowMatchesId,
} from '../../../../../lib/dealFormOptions';
import { canEditCRMRecord, canManageCRM } from '../../../../../lib/rbac';
import {
  AlignLeft,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Save,
  Target,
} from 'lucide-react';

function relId(rel) {
  if (rel == null) return '';
  if (typeof rel === 'object') return String(rel.id ?? rel.documentId ?? '');
  return String(rel);
}

export default function EditDealPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [deal, setDeal] = useState(null);
  const [dealName, setDealName] = useState('');
  const canEditDeal = deal ? canEditCRMRecord('deals', deal) : false;
  const canManageDeals = canManageCRM('deals');

  const [form, setForm] = useState({
    name: '',
    stage: 'discovery',
    value: '',
    expectedCloseDate: '',
    priority: 'medium',
    description: '',
    probability: '0',
    visibility: 'public',
    dealGroup: '',
    source: 'OTHER',
    leadCompany: '',
    clientAccount: '',
    contact: '',
    assignedTo: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  const [leadCompanies, setLeadCompanies] = useState([]);
  const [clientAccounts, setClientAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [notFound, setNotFound] = useState(false);
  /** Snapshot from server for “first transition to won” project prompt */
  const [dealWonBaseline, setDealWonBaseline] = useState(null);
  const [wonProjectModalOpen, setWonProjectModalOpen] = useState(false);
  const normalizedConvertedLeadRef = useRef(false);

  useEffect(() => {
    normalizedConvertedLeadRef.current = false;
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingRefs(true);
      const [lcRes, caRes, cRes] = await Promise.allSettled([
        leadCompanyService.getAll({
          sort: 'companyName:asc',
          'pagination[pageSize]': 500,
          populate: ['convertedAccount'],
        }),
        clientAccountService.getAll({
          sort: 'companyName:asc',
          'pagination[pageSize]': 500,
        }),
        contactService.getAll({
          sort: 'createdAt:desc',
          'pagination[pageSize]': 500,
          populate: ['leadCompany', 'clientAccount'],
        }),
      ]);

      if (cancelled) {
        setLoadingRefs(false);
        return;
      }

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

      // Assignee users: isolate failures — a throw here used to clear lead/accounts/contacts and empty every dropdown.
      try {
        let allUsers = [];
        let page = 1;
        let hasMore = true;
        while (hasMore && !cancelled) {
          const response = await strapiClient.getXtrawrkxUsers({
            'pagination[page]': page,
            'pagination[pageSize]': 100,
            populate: 'primaryRole,userRoles',
          });
          const usersData = response?.data ?? response ?? [];
          const arr = Array.isArray(usersData) ? usersData : [];
          const extracted = arr.map((u) =>
            u.attributes ? { id: u.id, documentId: u.id, ...u.attributes } : u
          );
          allUsers = [...allUsers, ...extracted];
          const pageCount = response?.meta?.pagination?.pageCount ?? 1;
          hasMore = page < pageCount && arr.length === 100;
          page += 1;
        }
        if (!cancelled) setUsers(allUsers);
      } catch (e) {
        console.error('Assigned users failed to load (deal form still usable)', e);
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoadingRefs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await dealService.getOne(id);
        if (cancelled) return;
        if (!res?.data) {
          setNotFound(true);
          return;
        }
        const d = res.data;
        setDeal(d);
        setDealName(d.name || 'Deal');
        const close = d.expectedCloseDate
          ? String(d.expectedCloseDate).slice(0, 10)
          : '';
        setForm({
          name: d.name ?? '',
          stage: d.stage ?? 'discovery',
          value: d.value != null ? String(d.value) : '',
          expectedCloseDate: close,
          priority: d.priority ?? 'medium',
          description: d.description ?? '',
          probability: d.probability != null ? String(d.probability) : '0',
          visibility: d.visibility ?? 'public',
          dealGroup: d.dealGroup ?? '',
          source: d.source ?? 'OTHER',
          leadCompany: relId(d.leadCompany),
          clientAccount: relId(d.clientAccount),
          contact: relId(d.contact),
          assignedTo: relId(d.assignedTo),
          notes: d.notes ?? '',
        });
        const st = String(d.stage ?? 'discovery').toLowerCase();
        const dp = d.deliveryProject;
        const hasDp = !!(
          dp &&
          (typeof dp === 'object' ? dp.id != null || dp.documentId != null : dp)
        );
        setDealWonBaseline({ stage: st, hasDeliveryProject: hasDp });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  /** If the deal still points at a lead that was converted, move association to the client account. */
  useEffect(() => {
    if (loading || loadingRefs) return;
    if (normalizedConvertedLeadRef.current) return;
    const lcId = form.leadCompany?.trim();
    if (!lcId) {
      normalizedConvertedLeadRef.current = true;
      return;
    }
    const company = leadCompanies.find(
      (c) => String(c.id ?? c.documentId ?? '') === String(lcId)
    );
    if (!company) {
      if (leadCompanies.length > 0) normalizedConvertedLeadRef.current = true;
      return;
    }
    if (!isConvertedLeadCompany(company)) {
      normalizedConvertedLeadRef.current = true;
      return;
    }
    const ca = company.convertedAccount;
    let caId = '';
    if (ca && typeof ca === 'object') {
      caId = String(ca.id ?? ca.documentId ?? '');
    } else if (ca != null && ca !== false) {
      caId = String(ca);
    }
    normalizedConvertedLeadRef.current = true;
    setForm((prev) => {
      const next = {
        ...prev,
        leadCompany: '',
        clientAccount: caId || prev.clientAccount,
      };
      const filtered = filterContactsForCompany(contacts, next.leadCompany, next.clientAccount);
      const prevC = prev.contact ? String(prev.contact) : '';
      const stillValid =
        prevC && filtered.some((c) => contactRowMatchesId(c, prevC));
      next.contact = stillValid ? prev.contact : defaultPrimaryContactId(filtered);
      return next;
    });
  }, [loading, loadingRefs, form.leadCompany, leadCompanies, contacts]);

  /** Keep contact in sync with loaded rows (same idea as new deal + validate API id vs option values). */
  useEffect(() => {
    if (loading || loadingRefs) return;
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
  }, [loading, loadingRefs, contacts, form.leadCompany, form.clientAccount]);

  const leadCompanyOptions = useMemo(() => {
    const eligible = leadCompanies.filter((c) => !isConvertedLeadCompany(c));
    return eligible
      .map((c) => {
        const value = String(c.id ?? c.documentId ?? '');
        if (!value) return null;
        return {
          value,
          label: c.companyName || c.name || `Company #${value}`,
        };
      })
      .filter(Boolean);
  }, [leadCompanies]);

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

  const contactOptions = useMemo(() => {
    const base = filteredContacts.map((c) => ({
      value: contactOptionValue(c),
      label: contactDisplayName(c) || `Contact #${contactOptionValue(c)}`,
    }));
    const sel = form.contact ? String(form.contact).trim() : '';
    if (!sel || base.some((o) => o.value === sel)) return base;
    const orphan = contacts.find((c) => contactRowMatchesId(c, sel));
    if (!orphan) return base;
    const ov = contactOptionValue(orphan);
    return [
      {
        value: ov || sel,
        label: contactDisplayName(orphan) || `Contact #${ov || sel}`,
      },
      ...base,
    ];
  }, [filteredContacts, form.contact, contacts]);

  const userOptions = useMemo(
    () =>
      users.map((u) => {
        const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
        return {
          value: String(u.id),
          label: name || u.username || u.email || `User #${u.id}`,
        };
      }),
    [users]
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
    setSubmitError('');
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Deal name is required';
    if (form.value === '' || form.value == null) next.value = 'Deal value is required';
    else if (Number.isNaN(Number(form.value))) next.value = 'Enter a valid amount';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    stage: form.stage,
    value: form.value,
    expectedCloseDate: form.expectedCloseDate || null,
    priority: form.priority,
    description: form.description,
    probability: form.probability,
    visibility: form.visibility,
    dealGroup: form.dealGroup,
    source: form.source,
    notes: form.notes,
    leadCompany: form.leadCompany ? form.leadCompany : null,
    clientAccount: form.clientAccount ? form.clientAccount : null,
    contact: form.contact ? form.contact : null,
    ...(canManageDeals ? { assignedTo: form.assignedTo ? form.assignedTo : null } : {}),
  });

  const commitDealUpdate = async (withProject) => {
    if (!id) return;
    if (!canEditDeal) {
      setSubmitError('You can only edit deals assigned to you.');
      return;
    }
    setSaving(true);
    setSubmitError('');
    try {
      await dealService.update(id, buildPayload());
      if (withProject) {
        try {
          await dealService.createDeliveryProject(id);
        } catch (pe) {
          if (typeof window !== 'undefined') {
            window.alert(pe?.message || 'Deal saved as won, but the project could not be created.');
          }
        }
      }
      setWonProjectModalOpen(false);
      setShowSuccess(true);
      window.setTimeout(() => {
        router.push(`/sales/deals/${id}`);
      }, 1200);
    } catch (err) {
      setSubmitError(err?.message || 'Failed to update deal');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id) return;
    setSubmitError('');
    if (!canEditDeal) {
      setSubmitError('You can only edit deals assigned to you.');
      return;
    }
    if (!validate()) return;

    const baselineDeal = dealWonBaseline
      ? {
          stage: dealWonBaseline.stage,
          deliveryProject: dealWonBaseline.hasDeliveryProject ? { id: 1 } : null,
        }
      : { stage: 'discovery', deliveryProject: null };

    if (shouldPromptDeliveryProjectOnWon(baselineDeal, form.stage)) {
      setWonProjectModalOpen(true);
      return;
    }

    await commitDealUpdate(false);
  };

  const busy = loading || loadingRefs;

  const submitButtonClassName =
    'min-w-[180px] rounded-xl border-0 bg-gradient-to-r from-orange-500 to-pink-500 py-2.5 font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-60';

  if (showSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Success!</h2>
          <p className="mb-4 text-gray-600">Deal updated successfully</p>
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-orange-500" />
          <p className="mt-2 text-sm text-gray-500">Redirecting…</p>
        </div>
      </div>
    );
  }

  if (!loading && deal && !canEditDeal) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <CRMPageHeader
          title="View-only access"
          subtitle={dealName || 'Deal editing is restricted for your role.'}
          showSearch={false}
          showActions={false}
          breadcrumb={[
            { label: 'Sales', href: '/sales' },
            { label: 'Deals', href: '/sales/deals' },
            { label: dealName || 'Deal', href: `/sales/deals/${id}` },
          ]}
        />
        <Card variant="elevated" className="rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900">You can view this deal, but cannot edit it.</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">
            Members can edit only deals assigned to them. Managers and admins can manage deals across the team.
          </p>
          <Link href={`/sales/deals/${id}`} className="mt-6 inline-flex">
            <Button type="button" variant="primary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to deal
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <form onSubmit={handleSubmit}>
        <CRMPageHeader
          title="Edit Deal"
          subtitle={loading ? undefined : dealName || undefined}
          showSearch={false}
          showActions={false}
          breadcrumb={[
            { label: 'Sales', href: '/sales' },
            { label: 'Deals', href: '/sales/deals' },
            { label: 'Edit', href: id ? `/sales/deals/${id}/edit` : '/sales/deals' },
          ]}
        >
          {!notFound ? (
            <div className="flex items-center justify-end gap-3">
              <Link href={id ? `/sales/deals/${id}` : '/sales/deals'}>
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
                disabled={saving || busy}
                className={submitButtonClassName}
              >
                {!saving ? <Save className="mr-2 h-4 w-4" /> : null}
                {saving ? 'Updating…' : 'Update Deal'}
              </Button>
            </div>
          ) : null}
        </CRMPageHeader>

        {loading ? (
          <Card variant="elevated" className="mt-6 flex justify-center rounded-xl p-12">
            <LoadingSpinner message="Loading deal…" />
          </Card>
        ) : notFound ? (
          <Card variant="default" className="mx-auto mt-6 max-w-lg rounded-xl p-10 text-center">
            <p className="text-gray-600">This deal could not be found.</p>
            <Link href="/sales/deals" className="mt-4 inline-block">
              <Button variant="primary" className={submitButtonClassName}>
                Back to deals
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="mt-6 space-y-6">
            {submitError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
                {submitError}
              </p>
            ) : null}

            <FormSectionCard
              icon={Target}
              title="Deal Information"
              description="Basic deal details and status."
              cardClassName="rounded-xl p-6"
              iconContainerClassName="bg-brand-primary shadow-sm"
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-3">
                  <Input
                    label="Deal name"
                    required
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    error={errors.name}
                    placeholder="Enter deal name"
                  />
                </div>
                <Select
                  label="Stage"
                  value={form.stage}
                  onChange={(v) => setField('stage', v)}
                  options={DEAL_STAGE_OPTIONS}
                  placeholder="Stage"
                />
                <Select
                  label="Priority"
                  value={form.priority}
                  onChange={(v) => setField('priority', v)}
                  options={PRIORITY_OPTIONS}
                  placeholder="Priority"
                />
                <Input
                  label="Value (₹)"
                  required
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.value}
                  onChange={(e) => setField('value', e.target.value)}
                  error={errors.value}
                  placeholder="0.00"
                />
                <Input
                  label="Probability (%)"
                  type="number"
                  min={0}
                  max={100}
                  value={form.probability}
                  onChange={(e) => setField('probability', e.target.value)}
                />
                <Select
                  label="Visibility"
                  value={form.visibility}
                  onChange={(v) => setField('visibility', v)}
                  options={VISIBILITY_OPTIONS}
                  placeholder="Visibility"
                />
                <Input
                  label="Deal group"
                  value={form.dealGroup}
                  onChange={(e) => setField('dealGroup', e.target.value)}
                  placeholder="Optional"
                />
                <Input
                  label="Expected close date"
                  type="date"
                  value={form.expectedCloseDate}
                  onChange={(e) => setField('expectedCloseDate', e.target.value)}
                />
                <Select
                  label="Source"
                  value={form.source}
                  onChange={(v) => setField('source', v)}
                  options={SOURCE_OPTIONS}
                  placeholder="Source"
                />
                {canManageDeals ? (
                  <Select
                    label="Assigned to"
                    value={form.assignedTo}
                    onChange={(v) => setField('assignedTo', v)}
                    options={userOptions}
                    placeholder="Unassigned"
                  />
                ) : null}
              </div>
              <div className="mt-6">
                <Textarea
                  label="Description"
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  rows={5}
                  placeholder="Describe this deal…"
                />
              </div>
            </FormSectionCard>

            <FormSectionCard
              icon={Building2}
              title="Company & contact association"
              description="Link the deal to companies and contacts."
              cardClassName="rounded-xl p-6"
              iconContainerClassName="bg-brand-primary shadow-sm"
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Select
                  label="Lead company"
                  value={form.leadCompany}
                  onChange={(v) => setField('leadCompany', v)}
                  options={leadCompanyOptions}
                  placeholder="Select lead company"
                  disabled={Boolean(form.clientAccount)}
                />
                <div>
                  <Select
                    label="Client account"
                    value={form.clientAccount}
                    onChange={(v) => setField('clientAccount', v)}
                    options={clientAccountOptions}
                    placeholder="Select client account"
                    disabled={Boolean(form.leadCompany)}
                  />
                  <p className="mt-1 text-xs text-gray-500">Clear lead company to select client account.</p>
                </div>
                <div className="md:col-span-2">
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
                  />
                  {(form.leadCompany || form.clientAccount) && contactOptions.length === 0 ? (
                    <p className="mt-1 text-xs text-gray-500">No contacts linked to this company yet.</p>
                  ) : null}
                </div>
              </div>
            </FormSectionCard>

            <FormSectionCard
              icon={AlignLeft}
              title="Additional information"
              description="Internal notes and context."
              cardClassName="rounded-xl p-6"
              iconContainerClassName="bg-brand-primary shadow-sm"
            >
              <Textarea
                label="Notes"
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                rows={4}
                placeholder="Additional notes…"
              />
            </FormSectionCard>
          </div>
        )}
      </form>

      <WonDealProjectModal
        open={wonProjectModalOpen}
        dealName={dealName}
        busy={saving}
        onClose={() => {
          if (!saving) setWonProjectModalOpen(false);
        }}
        onSkipProject={() => void commitDealUpdate(false)}
        onCreateProject={() => void commitDealUpdate(true)}
      />
    </div>
  );
}
