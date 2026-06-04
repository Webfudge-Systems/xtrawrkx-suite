'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button, Input, Select, Textarea, FormSectionCard, LoadingSpinner, Badge,
} from '@webfudge/ui';
import CRMPageHeader from '../../../../../components/CRMPageHeader';
import proposalService from '../../../../../lib/api/proposalService';
import leadCompanyService from '../../../../../lib/api/leadCompanyService';
import clientAccountService from '../../../../../lib/api/clientAccountService';
import contactService from '../../../../../lib/api/contactService';
import { isConvertedLeadCompany, relationEntityId } from '../../../../../lib/dealFormOptions';
import { mapEntityToProposalClientFields } from '../../../../../lib/proposalClientAutofill';
import { useAuth } from '@webfudge/auth';
import {
  Plus, Trash2, ArrowLeft, Save, FileText, Building2,
  User, Layers, Flag, Shield, List, Target, AlertCircle,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value, currency = 'INR') => {
  const num = parseFloat(value) || 0;
  if (currency === 'INR') return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(num);
};

const uid = () => Math.random().toString(36).slice(2);

const defaultModule     = () => ({ id: uid(), name: '', price: '', deliverables: '', acceptanceCriteria: '' });
const defaultMilestone  = () => ({ id: uid(), name: '', paymentPercent: '', description: '' });

const documentTypeOptions = [
  { value: 'SOW',      label: 'Statement of Work (SOW)' },
  { value: 'PROPOSAL', label: 'Project Proposal' },
  { value: 'QUOTE',    label: 'Project Quote' },
];
const statusOptions = [
  { value: 'DRAFT',    label: 'Draft' },
  { value: 'SENT',     label: 'Sent' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'EXPIRED',  label: 'Expired' },
];
const currencyOptions = [
  { value: 'INR', label: '₹ Indian Rupee (INR)' },
  { value: 'USD', label: '$ US Dollar (USD)' },
  { value: 'EUR', label: '€ Euro (EUR)' },
  { value: 'GBP', label: '£ British Pound (GBP)' },
];

// ─── Edit Page ────────────────────────────────────────────────────────────────

export default function EditProposalPage() {
  const params = useParams();
  const router = useRouter();
  const { currentOrg, user } = useAuth();
  const id = params?.id;

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors]     = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const [proposalData, setProposalData] = useState({
    title: '', proposalNumber: '', documentType: 'PROPOSAL', status: 'DRAFT',
    date: '', validUntil: '', currency: 'INR',
    clientCompanyName: '', clientContactName: '', clientEmail: '', clientPhone: '', clientAddress: '',
    preparedByCompany: '', preparedByName: '', preparedByEmail: '', preparedByPhone: '',
    projectName: '', projectOverview: '',
    estimatedTimeline: '', outOfScopeRate: '', outOfScopeRateUnit: 'hour', warrantyDays: '',
    paymentTerms: '', taxInfo: '', totalValue: '',
    acceptanceNotes: '', notes: '',
  });
  const [modules, setModules]               = useState([defaultModule()]);
  const [milestones, setMilestones]         = useState([defaultMilestone()]);
  const [assumptions, setAssumptions]       = useState(['']);
  const [securityItems, setSecurityItems]   = useState(['']);
  const [outOfScope, setOutOfScope]         = useState(['']);
  const [handoverDeliverables, setHandoverDeliverables] = useState(['']);

  const [leadCompanyId, setLeadCompanyId] = useState('');
  const [clientAccountId, setClientAccountId] = useState('');
  const [leadCompanies, setLeadCompanies] = useState([]);
  const [clientAccounts, setClientAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  // Pre-fill org
  useEffect(() => {
    if (currentOrg || user) {
      setProposalData((prev) => ({
        ...prev,
        preparedByCompany: prev.preparedByCompany || currentOrg?.name || '',
        preparedByEmail:   prev.preparedByEmail   || currentOrg?.email  || user?.email || '',
        preparedByPhone:   prev.preparedByPhone   || currentOrg?.phone  || '',
        preparedByName:    prev.preparedByName    || (user ? `${user.firstName||''} ${user.lastName||''}`.trim() : ''),
      }));
    }
  }, [currentOrg, user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingRefs(true);
      try {
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
        if (cancelled) return;
        if (lcRes.status === 'fulfilled') setLeadCompanies(lcRes.value.data || []);
        else setLeadCompanies([]);
        if (caRes.status === 'fulfilled') setClientAccounts(caRes.value.data || []);
        else setClientAccounts([]);
        if (cRes.status === 'fulfilled') setContacts(cRes.value.data || []);
        else setContacts([]);
      } catch {
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

  const leadCompanyOptions = useMemo(
    () =>
      leadCompanies
        .filter((c) => !isConvertedLeadCompany(c))
        .map((c) => {
          const value = String(c.id ?? c.documentId ?? '');
          if (!value) return null;
          return {
            value,
            label: c.companyName || c.name || `Lead #${value}`,
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

  // Load existing proposal
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await proposalService.getOne(id);
        const p = res?.data;
        if (!p) { setNotFound(true); return; }

        setProposalData({
          title:            p.title            || '',
          proposalNumber:   p.proposalNumber   || '',
          documentType:     p.documentType     || 'PROPOSAL',
          status:           p.status           || 'DRAFT',
          date:             p.date             || '',
          validUntil:       p.validUntil       || '',
          currency:         p.currency         || 'INR',
          clientCompanyName: p.clientCompanyName || '',
          clientContactName: p.clientContactName || '',
          clientEmail:      p.clientEmail      || '',
          clientPhone:      p.clientPhone      || '',
          clientAddress:    p.clientAddress    || '',
          preparedByCompany: p.preparedByCompany || currentOrg?.name || '',
          preparedByName:   p.preparedByName   || '',
          preparedByEmail:  p.preparedByEmail  || currentOrg?.email || user?.email || '',
          preparedByPhone:  p.preparedByPhone  || '',
          projectName:      p.projectName      || '',
          projectOverview:  p.projectOverview  || '',
          estimatedTimeline: p.estimatedTimeline || '',
          outOfScopeRate:   p.outOfScopeRate   || '',
          outOfScopeRateUnit: p.outOfScopeRateUnit || 'hour',
          warrantyDays:     p.warrantyDays     || '',
          paymentTerms:     p.paymentTerms     || '',
          taxInfo:          p.taxInfo          || '',
          totalValue:       p.totalValue       || '',
          acceptanceNotes:  p.acceptanceNotes  || '',
          notes:            p.notes            || '',
        });
        setLeadCompanyId(relationEntityId(p.leadCompany) || '');
        setClientAccountId(relationEntityId(p.clientAccount) || '');
        if (Array.isArray(p.modules)            && p.modules.length)            setModules(p.modules.map(m => ({ ...m, id: m.id || uid() })));
        if (Array.isArray(p.milestones)         && p.milestones.length)         setMilestones(p.milestones.map(m => ({ ...m, id: m.id || uid() })));
        if (Array.isArray(p.assumptions)        && p.assumptions.length)        setAssumptions(p.assumptions);
        if (Array.isArray(p.securityItems)      && p.securityItems.length)      setSecurityItems(p.securityItems);
        if (Array.isArray(p.outOfScope)         && p.outOfScope.length)         setOutOfScope(p.outOfScope);
        if (Array.isArray(p.handoverDeliverables)&& p.handoverDeliverables.length) setHandoverDeliverables(p.handoverDeliverables);
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const set = (field) => (e) => setProposalData((prev) => ({ ...prev, [field]: e.target?.value ?? e }));

  const clearClientDetailFields = () =>
    setProposalData((prev) => ({
      ...prev,
      clientCompanyName: '',
      clientContactName: '',
      clientEmail: '',
      clientPhone: '',
      clientAddress: '',
    }));

  const handleLeadCompanySelect = (value) => {
    const v = value ? String(value) : '';
    setLeadCompanyId(v);
    setClientAccountId('');
    if (errors.clientCompanyName) setErrors((prev) => ({ ...prev, clientCompanyName: null }));
    if (!v) {
      clearClientDetailFields();
      return;
    }
    const lead = leadCompanies.find((c) => String(c.id ?? c.documentId) === v);
    const fields = mapEntityToProposalClientFields('lead', lead || null, contacts);
    setProposalData((prev) => ({ ...prev, ...fields }));
  };

  const handleClientAccountSelect = (value) => {
    const v = value ? String(value) : '';
    setClientAccountId(v);
    setLeadCompanyId('');
    if (errors.clientCompanyName) setErrors((prev) => ({ ...prev, clientCompanyName: null }));
    if (!v) {
      clearClientDetailFields();
      return;
    }
    const acc = clientAccounts.find((a) => String(a.id ?? a.documentId) === v);
    const fields = mapEntityToProposalClientFields('client', acc || null, contacts);
    setProposalData((prev) => ({ ...prev, ...fields }));
  };

  const totalValue = modules.reduce((s, m) => s + (parseFloat(m.price) || 0), 0) || parseFloat(proposalData.totalValue) || 0;

  const validate = () => {
    const errs = {};
    if (!leadCompanyId && !clientAccountId && !proposalData.clientCompanyName.trim()) {
      errs.clientCompanyName = 'Select a lead company or client account';
    } else if (!proposalData.clientCompanyName.trim()) {
      errs.clientCompanyName = 'Required';
    }
    if (!proposalData.projectName.trim()) errs.projectName = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setSaving(true);
    try {
      const payload = {
        ...proposalData,
        status: proposalData.status || 'DRAFT',
        totalValue,
        modules,
        milestones,
        assumptions,
        securityItems,
        outOfScope,
        handoverDeliverables,
        leadCompany: leadCompanyId || null,
        clientAccount: clientAccountId || null,
      };
      await proposalService.update(id, payload);
      setShowSuccess(true);
      setTimeout(() => router.push(`/clients/proposals/${id}`), 1500);
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({ ...prev, submit: err?.message || 'Failed to save changes.' }));
    } finally {
      setSaving(false);
    }
  };

  // ── Dynamic list helpers ──────────────────────────────────────────────────
  const updateModule = (idx, field, value) =>
    setModules((p) => p.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  const updateMilestone = (idx, field, value) =>
    setMilestones((p) => p.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  const updateList = (setter) => (idx, value) =>
    setter((p) => p.map((v, i) => (i === idx ? value : v)));
  const addList = (setter, def) => () => setter((p) => [...p, def]);
  const removeList = (setter) => (idx) => setter((p) => p.filter((_, i) => i !== idx));

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" message="Loading..." /></div>;
  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Proposal not found</h2>
        <Button onClick={() => router.push('/clients/proposals')} variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <CRMPageHeader
        title="Edit Proposal"
        subtitle={proposalData.proposalNumber || 'Update proposal details'}
        breadcrumb={[
          { label: 'Dashboard', href: '/' },
          { label: 'Proposals', href: '/clients/proposals' },
          { label: proposalData.proposalNumber || 'Detail', href: `/clients/proposals/${id}` },
          { label: 'Edit', href: `/clients/proposals/${id}/edit` },
        ]}
        showProfile={true} showSearch={false} showActions={false}
      />

      {showSuccess && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><Save className="w-4 h-4 text-green-600" /></div>
          <p className="text-green-700 font-medium">Proposal saved! Redirecting…</p>
        </div>
      )}
      {errors.submit && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{errors.submit}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Proposal Info ──────────────────────────────────────────────────── */}
        <FormSectionCard title="Proposal Information" description="Document type, reference number and dates" icon={FileText}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <Input label="Proposal Title" value={proposalData.title} onChange={set('title')} placeholder="e.g. Web Platform Development SOW" />
            <Input label="Proposal Number" value={proposalData.proposalNumber} onChange={set('proposalNumber')} placeholder="e.g. PROP-2026-001" />
            <Select label="Document Type" value={proposalData.documentType} onChange={set('documentType')} options={documentTypeOptions} />
            <Select label="Status" value={proposalData.status} onChange={set('status')} options={statusOptions} />
            <Select label="Currency" value={proposalData.currency} onChange={set('currency')} options={currencyOptions} />
            <Input label="Date" type="date" value={proposalData.date} onChange={set('date')} />
            <Input label="Valid Until" type="date" value={proposalData.validUntil} onChange={set('validUntil')} />
          </div>
        </FormSectionCard>

        {/* ── Client Details ─────────────────────────────────────────────────── */}
        <FormSectionCard title="Client Details" description="Lead company or client account; contact fields fill from CRM" icon={Building2}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Select
                label="Lead Company"
                value={leadCompanyId}
                onChange={handleLeadCompanySelect}
                options={leadCompanyOptions}
                placeholder="— Select lead company —"
                disabled={loadingRefs || Boolean(clientAccountId)}
              />
              <p className="mt-1.5 text-xs text-gray-500">Converted leads are hidden — use Client Account.</p>
            </div>
            <div>
              <Select
                label="Client Account"
                value={clientAccountId}
                onChange={handleClientAccountSelect}
                options={clientAccountOptions}
                placeholder="— Select client account —"
                disabled={loadingRefs || Boolean(leadCompanyId)}
              />
            </div>
            <Input
              label="Company Name *"
              value={proposalData.clientCompanyName}
              onChange={set('clientCompanyName')}
              error={errors.clientCompanyName}
              required
            />
            <Input label="Contact Name" value={proposalData.clientContactName} onChange={set('clientContactName')} />
            <Input label="Email" type="email" value={proposalData.clientEmail} onChange={set('clientEmail')} />
            <Input label="Phone" value={proposalData.clientPhone} onChange={set('clientPhone')} />
            <div className="md:col-span-2"><Textarea label="Address" value={proposalData.clientAddress} onChange={set('clientAddress')} rows={3} /></div>
          </div>
        </FormSectionCard>

        {/* ── Prepared By ────────────────────────────────────────────────────── */}
        <FormSectionCard title="Prepared By" description="Your organization information" icon={User}>
          {currentOrg && (
            <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 p-3 flex items-center gap-3">
              <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <p className="text-sm text-blue-700">Sending as <strong>{currentOrg.name}</strong></p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Company Name" value={proposalData.preparedByCompany} onChange={set('preparedByCompany')} />
            <Input label="Contact Name" value={proposalData.preparedByName} onChange={set('preparedByName')} />
            <Input label="Email" type="email" value={proposalData.preparedByEmail} onChange={set('preparedByEmail')} />
            <Input label="Phone" value={proposalData.preparedByPhone} onChange={set('preparedByPhone')} />
          </div>
        </FormSectionCard>

        {/* ── Project Info ───────────────────────────────────────────────────── */}
        <FormSectionCard title="Project Information" description="Project name and overview" icon={Target}>
          <div className="grid grid-cols-1 gap-5">
            <Input label="Project Name *" value={proposalData.projectName} onChange={set('projectName')} error={errors.projectName} required />
            <Textarea label="Project Overview" value={proposalData.projectOverview} onChange={set('projectOverview')} rows={4} />
          </div>
        </FormSectionCard>

        {/* ── Scope of Work / Modules ────────────────────────────────────────── */}
        <FormSectionCard title="Scope of Work" description="Define modules, deliverables and pricing" icon={Layers}>
          <div className="space-y-5">
            {modules.map((mod, idx) => (
              <div key={mod.id} className="border border-gray-200 rounded-xl p-5 bg-gray-50 relative">
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className="text-xs text-orange-600 font-semibold bg-orange-100 px-2 py-0.5 rounded-full">Module {idx+1}</span>
                  {modules.length > 1 && <button type="button" onClick={() => setModules(p => p.filter((_,i)=>i!==idx))} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-28">
                  <Input label="Module Name" value={mod.name} onChange={e => updateModule(idx,'name',e.target.value)} placeholder="e.g. Admin Dashboard" />
                  <Input label="Price" type="number" value={mod.price} onChange={e => updateModule(idx,'price',e.target.value)} placeholder="0" />
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Textarea label="Deliverables" value={mod.deliverables} onChange={e => updateModule(idx,'deliverables',e.target.value)} rows={3} />
                  <Textarea label="Acceptance Criteria" value={mod.acceptanceCriteria} onChange={e => updateModule(idx,'acceptanceCriteria',e.target.value)} rows={3} />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setModules(p=>[...p,defaultModule()])} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Module
            </Button>
            {totalValue > 0 && (
              <div className="text-right font-bold text-orange-600 text-lg">Total: {formatCurrency(totalValue, proposalData.currency)}</div>
            )}
          </div>
        </FormSectionCard>

        {/* ── Milestones ─────────────────────────────────────────────────────── */}
        <FormSectionCard title="Timeline & Milestones" description="Payment milestones and delivery schedule" icon={Flag}>
          <div className="space-y-4">
            <Input label="Estimated Timeline" value={proposalData.estimatedTimeline} onChange={set('estimatedTimeline')} placeholder="e.g. 12 weeks from kickoff" />
            {milestones.map((ms, idx) => (
              <div key={ms.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border border-gray-200 rounded-xl p-4 bg-gray-50">
                <Input label="Milestone" value={ms.name} onChange={e => updateMilestone(idx,'name',e.target.value)} placeholder={`Milestone ${idx+1}`} />
                <Input label="Payment %" type="number" value={ms.paymentPercent} onChange={e => updateMilestone(idx,'paymentPercent',e.target.value)} placeholder="e.g. 30" />
                <Input label="Description" value={ms.description} onChange={e => updateMilestone(idx,'description',e.target.value)} />
                <div className="flex items-center justify-end gap-2">
                  {ms.paymentPercent && totalValue > 0 && (
                    <span className="text-sm font-semibold text-orange-600">{formatCurrency(totalValue * parseFloat(ms.paymentPercent)/100, proposalData.currency)}</span>
                  )}
                  {milestones.length > 1 && <button type="button" onClick={() => setMilestones(p => p.filter((_,i)=>i!==idx))} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setMilestones(p=>[...p,defaultMilestone()])} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Milestone
            </Button>
          </div>
        </FormSectionCard>

        {/* ── Billing ────────────────────────────────────────────────────────── */}
        <FormSectionCard title="Billing & Terms" description="Rate, warranty, and payment terms" icon={List}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <Input label="Out-of-scope Rate" type="number" value={proposalData.outOfScopeRate} onChange={set('outOfScopeRate')} placeholder="e.g. 2500" />
            <Select label="Rate Unit" value={proposalData.outOfScopeRateUnit} onChange={set('outOfScopeRateUnit')}
              options={['hour','day','week','month','story point','deliverable'].map(v=>({value:v,label:v}))} />
            <Input label="Warranty (days)" type="number" value={proposalData.warrantyDays} onChange={set('warrantyDays')} />
            <Input label="Payment Terms" value={proposalData.paymentTerms} onChange={set('paymentTerms')} placeholder="e.g. Net 30" />
            <Input label="Tax Info" value={proposalData.taxInfo} onChange={set('taxInfo')} placeholder="e.g. 18% GST applicable" />
          </div>
        </FormSectionCard>

        {/* ── Assumptions & Out of Scope ─────────────────────────────────────── */}
        <FormSectionCard title="Assumptions & Out of Scope" description="Constraints and exclusions" icon={Shield}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Assumptions</label>
              {assumptions.map((a, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Input value={a} onChange={e => updateList(setAssumptions)(idx, e.target.value)} placeholder={`Assumption ${idx+1}`} />
                  {assumptions.length > 1 && <button type="button" onClick={() => removeList(setAssumptions)(idx)} className="text-gray-400 hover:text-red-500 flex-shrink-0 mt-1"><Trash2 className="w-4 h-4" /></button>}
                </div>
              ))}
              <Button type="button" size="sm" variant="outline" onClick={addList(setAssumptions,'')} className="mt-1 flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add</Button>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Out of Scope</label>
              {outOfScope.map((o, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Input value={o} onChange={e => updateList(setOutOfScope)(idx, e.target.value)} placeholder={`Item ${idx+1}`} />
                  {outOfScope.length > 1 && <button type="button" onClick={() => removeList(setOutOfScope)(idx)} className="text-gray-400 hover:text-red-500 flex-shrink-0 mt-1"><Trash2 className="w-4 h-4" /></button>}
                </div>
              ))}
              <Button type="button" size="sm" variant="outline" onClick={addList(setOutOfScope,'')} className="mt-1 flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add</Button>
            </div>
          </div>
        </FormSectionCard>

        {/* ── Notes ──────────────────────────────────────────────────────────── */}
        <FormSectionCard title="Notes & Acceptance" description="Additional notes and acceptance criteria" icon={FileText}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Textarea label="Acceptance Notes" value={proposalData.acceptanceNotes} onChange={set('acceptanceNotes')} rows={4} />
            <Textarea label="Internal Notes" value={proposalData.notes} onChange={set('notes')} rows={4} />
          </div>
        </FormSectionCard>

        {/* ── Actions ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-4 pb-8">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" disabled={saving}
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white flex items-center gap-2 px-8">
            {saving ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
