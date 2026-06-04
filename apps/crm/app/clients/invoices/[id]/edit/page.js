'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button, Input, Select, Textarea, FormSectionCard, LoadingSpinner,
} from '@webfudge/ui';
import CRMPageHeader from '../../../../../components/CRMPageHeader';
import invoiceService from '../../../../../lib/api/invoiceService';
import clientAccountService from '../../../../../lib/api/clientAccountService';
import contactService from '../../../../../lib/api/contactService';
import {
  mergeBillToFromAccountAndContact,
  clientAccountApiId,
  formatContactDisplayName,
} from '../../../../../lib/invoiceClientAutofill';
import {
  filterContactsForCompany,
  defaultPrimaryContactId,
  contactOptionValue,
  contactRowMatchesId,
} from '../../../../../lib/dealFormOptions';
import { useAuth } from '@webfudge/auth';
import {
  Plus, Trash2, ArrowLeft, Save, Receipt, Building2,
  User, List, AlertCircle, Users,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value, currency = 'INR') => {
  const num = parseFloat(value) || 0;
  if (currency === 'INR') return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(num);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', minimumFractionDigits: 2 }).format(num);
};

const uid = () => Math.random().toString(36).slice(2);
const defaultItem = () => ({ id: uid(), name: '', description: '', qty: 1, rate: '', unit: '' });

const documentTypeOptions = [
  { value: 'INVOICE',          label: 'Invoice' },
  { value: 'PROFORMA_INVOICE', label: 'Proforma Invoice' },
  { value: 'CREDIT_NOTE',      label: 'Credit Note' },
  { value: 'RECEIPT',          label: 'Receipt' },
];
const statusOptions = [
  { value: 'DRAFT',     label: 'Draft' },
  { value: 'SENT',      label: 'Sent' },
  { value: 'PAID',      label: 'Paid' },
  { value: 'OVERDUE',   label: 'Overdue' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'PARTIAL',   label: 'Partial' },
];
const currencyOptions = [
  { value: 'INR', label: '₹ Indian Rupee (INR)' },
  { value: 'USD', label: '$ US Dollar (USD)' },
  { value: 'EUR', label: '€ Euro (EUR)' },
  { value: 'GBP', label: '£ British Pound (GBP)' },
];
const termsOptions = [
  { value: 'NET_7',  label: 'Net 7' },
  { value: 'NET_15', label: 'Net 15' },
  { value: 'NET_30', label: 'Net 30' },
  { value: 'NET_45', label: 'Net 45' },
  { value: 'NET_60', label: 'Net 60' },
  { value: 'DUE_ON_RECEIPT', label: 'Due on Receipt' },
  { value: 'CUSTOM', label: 'Custom' },
];

// ─── Edit Page ────────────────────────────────────────────────────────────────

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const { currentOrg, user } = useAuth();
  const id = params?.id;

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors]     = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const [fromOrg, setFromOrg] = useState({ name:'', address:'', email:'', phone:'', website:'', gstin:'', logo:'' });
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber:'', documentType:'INVOICE', status:'DRAFT',
    invoiceDate:'', dueDate:'', terms:'NET_30', currency:'INR',
    billToName:'', billToCompany:'', billToEmail:'', billToPhone:'', billToAddress:'', billToGstin:'',
    taxRate:'18', taxLabel:'GST', discount:'0', amountPaid:'0',
    notes:'', termsAndConditions:'', showSignature:true,
  });
  const [lineItems, setLineItems] = useState([defaultItem()]);

  const [clientAccounts, setClientAccounts] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [allContacts, setAllContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [selectedClientAccountId, setSelectedClientAccountId] = useState('');
  const [selectedBillContactId, setSelectedBillContactId] = useState('');
  const [clientAccountSnapshot, setClientAccountSnapshot] = useState(null);
  /** Ensures linked client appears in the dropdown if not returned in the list fetch. */
  const [invoiceLinkedClient, setInvoiceLinkedClient] = useState(null);
  const contactInitForIdRef = useRef(null);
  const savedBillForMatchRef = useRef({ name: '', email: '' });

  const clientAccountSelectOptions = useMemo(() => {
    const map = new Map();
    for (const c of clientAccounts) {
      const k = clientAccountApiId(c);
      if (k) map.set(k, c);
    }
    const lk = invoiceLinkedClient ? clientAccountApiId(invoiceLinkedClient) : '';
    if (lk && !map.has(lk)) {
      map.set(lk, invoiceLinkedClient);
    }
    return Array.from(map.values()).sort((a, b) =>
      (a.companyName || '').localeCompare(b.companyName || '', undefined, { sensitivity: 'base' })
    );
  }, [clientAccounts, invoiceLinkedClient]);

  // Calcs
  const subtotal = lineItems.reduce((s, i) => s + (parseFloat(i.qty)||0)*(parseFloat(i.rate)||0), 0);
  const taxAmount = subtotal * ((parseFloat(invoiceData.taxRate)||0)/100);
  const total = subtotal + taxAmount - (parseFloat(invoiceData.discount)||0);
  const balanceDue = total - (parseFloat(invoiceData.amountPaid)||0);

  // Pre-fill org once
  useEffect(() => {
    if (currentOrg) {
      setFromOrg(p => ({
        name:    p.name    || currentOrg.name    || '',
        address: p.address || currentOrg.address || '',
        email:   p.email   || currentOrg.email   || user?.email || '',
        phone:   p.phone   || currentOrg.phone   || '',
        website: p.website || currentOrg.website || '',
        gstin:   p.gstin   || currentOrg.gstin   || currentOrg.taxId || '',
        logo:    p.logo    || currentOrg.logo    || '',
      }));
    } else if (user) {
      setFromOrg(p => ({ ...p, email: p.email || user.email || '' }));
    }
  }, [currentOrg, user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setClientsLoading(true);
      setContactsLoading(true);
      try {
        const [caRes, ctRes] = await Promise.all([
          clientAccountService.getAll({
            sort: 'companyName:asc',
            'pagination[pageSize]': 200,
          }),
          contactService.getAll({
            sort: 'createdAt:desc',
            'pagination[pageSize]': 500,
            populate: ['leadCompany', 'clientAccount'],
          }),
        ]);
        if (!cancelled) {
          setClientAccounts(Array.isArray(caRes.data) ? caRes.data : []);
          setAllContacts(Array.isArray(ctRes.data) ? ctRes.data : []);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setClientAccounts([]);
          setAllContacts([]);
        }
      } finally {
        if (!cancelled) {
          setClientsLoading(false);
          setContactsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refsLoading = clientsLoading || contactsLoading;

  const filteredBillContacts = useMemo(
    () => filterContactsForCompany(allContacts, '', selectedClientAccountId),
    [allContacts, selectedClientAccountId]
  );

  const billContactOptions = useMemo(
    () =>
      filteredBillContacts.map((c) => ({
        value: contactOptionValue(c),
        label: formatContactDisplayName(c) || `Contact #${contactOptionValue(c)}`,
      })),
    [filteredBillContacts]
  );

  useEffect(() => {
    contactInitForIdRef.current = null;
  }, [id]);

  /**
   * Bind contact dropdown to saved invoice once per id; then keep selection valid when account or list changes.
   * Waits for `allContacts` so a late contacts fetch still runs the one-time match.
   */
  useEffect(() => {
    if (loading || contactsLoading) return;
    if (!id) return;

    if (!selectedClientAccountId) {
      if (selectedBillContactId) setSelectedBillContactId('');
      contactInitForIdRef.current = id;
      return;
    }

    if (!allContacts.length) return;

    const list = filterContactsForCompany(allContacts, '', selectedClientAccountId);

    if (!list.length) {
      if (selectedBillContactId) setSelectedBillContactId('');
      contactInitForIdRef.current = id;
      return;
    }

    const prevC = (selectedBillContactId || '').trim();

    if (contactInitForIdRef.current !== id) {
      contactInitForIdRef.current = id;
      const { name: bn, email: be } = savedBillForMatchRef.current;
      const bnT = (bn || '').trim();
      const beT = (be || '').trim();
      const match =
        (bnT && list.find((c) => formatContactDisplayName(c) === bnT)) ||
        (beT && list.find((c) => (c.email || '').trim() === beT)) ||
        null;
      const pid = match ? contactOptionValue(match) : defaultPrimaryContactId(list) || '';
      setSelectedBillContactId(pid);
      return;
    }

    if (prevC && list.some((c) => contactRowMatchesId(c, prevC))) {
      const row = list.find((c) => contactRowMatchesId(c, prevC));
      const canon = row ? contactOptionValue(row) : prevC;
      if (canon && canon !== prevC) setSelectedBillContactId(canon);
      return;
    }

    const pid = defaultPrimaryContactId(list) || '';
    if (pid !== prevC) setSelectedBillContactId(pid);
  }, [loading, contactsLoading, id, selectedClientAccountId, allContacts, selectedBillContactId]);

  // Load invoice
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setSelectedBillContactId('');
      setClientAccountSnapshot(null);
      try {
        const res = await invoiceService.getOne(id);
        const inv = res?.data;
        if (!inv) { setNotFound(true); return; }

        savedBillForMatchRef.current = {
          name: inv.billToName || '',
          email: inv.billToEmail || '',
        };

        setFromOrg({
          name:    inv.fromOrgName    || '',
          address: inv.fromOrgAddress || '',
          email:   inv.fromOrgEmail   || '',
          phone:   inv.fromOrgPhone   || '',
          website: inv.fromOrgWebsite || '',
          gstin:   inv.fromOrgGstin   || '',
          logo:    inv.fromOrgLogo    || '',
        });
        setInvoiceData({
          invoiceNumber:   inv.invoiceNumber   || '',
          documentType:    inv.documentType    || 'INVOICE',
          status:          inv.status          || 'DRAFT',
          invoiceDate:     inv.invoiceDate     || '',
          dueDate:         inv.dueDate         || '',
          terms:           inv.terms           || 'NET_30',
          currency:        inv.currency        || 'INR',
          billToName:      inv.billToName      || '',
          billToCompany:   inv.billToCompany   || '',
          billToEmail:     inv.billToEmail     || '',
          billToPhone:     inv.billToPhone     || '',
          billToAddress:   inv.billToAddress   || '',
          billToGstin:     inv.billToGstin     || '',
          taxRate:         inv.taxRate != null ? String(inv.taxRate) : '18',
          taxLabel:        inv.taxLabel        || 'GST',
          discount:        inv.discount != null ? String(inv.discount) : '0',
          amountPaid:      inv.amountPaid != null ? String(inv.amountPaid) : '0',
          notes:           inv.notes           || '',
          termsAndConditions: inv.termsAndConditions || '',
          showSignature:   inv.showSignature   ?? true,
        });
        if (Array.isArray(inv.lineItems) && inv.lineItems.length) {
          setLineItems(inv.lineItems.map(it => ({ ...it, id: it.id || uid() })));
        }

        const ca = inv.clientAccount;
        if (ca && typeof ca === 'object') {
          setSelectedClientAccountId(clientAccountApiId(ca));
          setClientAccountSnapshot(ca);
          setInvoiceLinkedClient({
            ...ca,
            companyName: ca.companyName || ca.name || '',
            email: ca.email || '',
          });
        } else if (ca != null && (typeof ca === 'number' || typeof ca === 'string')) {
          const caId = String(ca).trim();
          setSelectedClientAccountId(caId);
          setInvoiceLinkedClient(null);
          setClientAccountSnapshot(null);
          try {
            const caRes = await clientAccountService.getOne(caId, { populate: ['contacts'] });
            if (caRes?.data) setClientAccountSnapshot(caRes.data);
          } catch (e) {
            console.error(e);
          }
        } else {
          setSelectedClientAccountId('');
          setInvoiceLinkedClient(null);
          setClientAccountSnapshot(null);
        }
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const set = (field) => (e) => setInvoiceData(p => ({ ...p, [field]: e.target?.value ?? e }));
  const setOrg = (field) => (e) => setFromOrg(p => ({ ...p, [field]: e.target?.value ?? e }));

  const handleClientAccountSelect = async (value) => {
    const idStr = (value || '').trim();
    if (!idStr || idStr === 'undefined' || idStr === 'null') {
      setSelectedClientAccountId('');
      setSelectedBillContactId('');
      setClientAccountSnapshot(null);
      return;
    }
    setSelectedClientAccountId(idStr);

    const fromList = clientAccountSelectOptions.find((c) => clientAccountApiId(c) === idStr);

    try {
      const caRes = await clientAccountService.getOne(idStr, { populate: ['contacts'] });
      const acc = caRes?.data ?? fromList;
      if (!acc) return;
      setClientAccountSnapshot(acc);

      const list = filterContactsForCompany(allContacts, '', idStr);
      const pid = defaultPrimaryContactId(list) || '';
      setSelectedBillContactId(pid);
      const contactRow = pid ? list.find((c) => contactOptionValue(c) === pid) : null;
      const bill = mergeBillToFromAccountAndContact(acc, contactRow);
      setInvoiceData((prev) => ({ ...prev, ...bill }));
    } catch (err) {
      console.error(err);
      if (fromList) {
        setClientAccountSnapshot(fromList);
        const list = filterContactsForCompany(allContacts, '', idStr);
        const pid = defaultPrimaryContactId(list) || '';
        setSelectedBillContactId(pid);
        const contactRow = pid ? list.find((c) => contactOptionValue(c) === pid) : null;
        setInvoiceData((prev) => ({
          ...prev,
          ...mergeBillToFromAccountAndContact(fromList, contactRow),
        }));
      }
    }
  };

  const handleBillContactSelect = (value) => {
    const v = (value || '').trim();
    setSelectedBillContactId(v);
    if (!clientAccountSnapshot) return;
    const list = filterContactsForCompany(allContacts, '', selectedClientAccountId);
    const row = v ? list.find((c) => contactRowMatchesId(c, v)) : null;
    setInvoiceData((prev) => ({
      ...prev,
      ...mergeBillToFromAccountAndContact(clientAccountSnapshot, row),
    }));
  };

  const updateItem = (idx, field, value) =>
    setLineItems(p => p.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));

  const validate = () => {
    const errs = {};
    if (!invoiceData.invoiceNumber.trim()) errs.invoiceNumber = 'Required';
    if (!invoiceData.billToName.trim() && !invoiceData.billToCompany.trim()) errs.billTo = 'Bill To name or company is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setSaving(true);
    try {
      const caRaw = (selectedClientAccountId || '').trim();
      const payload = {
        ...invoiceData,
        fromOrgName:    fromOrg.name,
        fromOrgAddress: fromOrg.address,
        fromOrgEmail:   fromOrg.email,
        fromOrgPhone:   fromOrg.phone,
        fromOrgGstin:   fromOrg.gstin,
        fromOrgLogo:    fromOrg.logo,
        lineItems,
        subtotal,
        total,
        balanceDue,
        clientAccount: caRaw && caRaw !== 'undefined' && caRaw !== 'null' ? caRaw : null,
      };
      await invoiceService.update(id, payload);
      setShowSuccess(true);
      setTimeout(() => router.push(`/clients/invoices/${id}`), 1500);
    } catch (err) {
      console.error(err);
      setErrors(p => ({ ...p, submit: err?.message || 'Failed to save changes.' }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" message="Loading..." /></div>;
  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Invoice not found</h2>
        <Button onClick={() => router.push('/clients/invoices')} variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <CRMPageHeader
        title="Edit Invoice"
        subtitle={invoiceData.invoiceNumber || 'Update invoice details'}
        breadcrumb={[
          { label: 'Dashboard', href: '/' },
          { label: 'Invoices', href: '/clients/invoices' },
          { label: invoiceData.invoiceNumber || 'Detail', href: `/clients/invoices/${id}` },
          { label: 'Edit', href: `/clients/invoices/${id}/edit` },
        ]}
        showProfile={true} showSearch={false} showActions={false}
      />

      {showSuccess && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><Save className="w-4 h-4 text-green-600" /></div>
          <p className="text-green-700 font-medium">Invoice saved! Redirecting…</p>
        </div>
      )}
      {errors.submit && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{errors.submit}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Invoice Info ───────────────────────────────────────────────────── */}
        <FormSectionCard title="Invoice Information" description="Document type, number and dates" icon={Receipt}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <Input label="Invoice Number *" value={invoiceData.invoiceNumber} onChange={set('invoiceNumber')} error={errors.invoiceNumber} required />
            <Select label="Document Type" value={invoiceData.documentType} onChange={set('documentType')} options={documentTypeOptions} />
            <Select label="Status" value={invoiceData.status} onChange={set('status')} options={statusOptions} />
            <Select label="Currency" value={invoiceData.currency} onChange={set('currency')} options={currencyOptions} />
            <Input label="Invoice Date" type="date" value={invoiceData.invoiceDate} onChange={set('invoiceDate')} />
            <Input label="Due Date" type="date" value={invoiceData.dueDate} onChange={set('dueDate')} />
            <Select label="Terms" value={invoiceData.terms} onChange={set('terms')} options={termsOptions} />
          </div>
        </FormSectionCard>

        {/* ── Invoice From ───────────────────────────────────────────────────── */}
        <FormSectionCard title="Invoice From (Your Organization)" description="Your company details that appear on the invoice" icon={Building2}>
          {currentOrg && (
            <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 p-3 flex items-center gap-3">
              <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <p className="text-sm text-blue-700">Sending as <strong>{currentOrg.name}</strong></p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Company Name" value={fromOrg.name} onChange={setOrg('name')} />
            <Input label="Email" type="email" value={fromOrg.email} onChange={setOrg('email')} />
            <Input label="Phone" value={fromOrg.phone} onChange={setOrg('phone')} />
            <Input label="GSTIN / Tax ID" value={fromOrg.gstin} onChange={setOrg('gstin')} />
            <div className="md:col-span-2"><Textarea label="Address" value={fromOrg.address} onChange={setOrg('address')} rows={3} /></div>
          </div>
        </FormSectionCard>

        {/* ── Bill To ────────────────────────────────────────────────────────── */}
        <FormSectionCard title="Bill To" description="Client billing details" icon={User}>
          {errors.billTo && <p className="text-red-600 text-sm mb-3">{errors.billTo}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <Select
                label="Client account"
                placeholder="Select a client to autofill (optional)"
                value={selectedClientAccountId}
                onChange={handleClientAccountSelect}
                options={clientAccountSelectOptions
                  .map((ca) => {
                    const vid = clientAccountApiId(ca);
                    if (!vid) return null;
                    return {
                      value: vid,
                      label: ca.companyName
                        ? `${ca.companyName}${ca.email ? ` · ${ca.email}` : ''}`
                        : `Account #${vid}`,
                    };
                  })
                  .filter(Boolean)}
                icon={Building2}
                disabled={clientsLoading}
              />
              {clientsLoading || contactsLoading ? (
                <p className="mt-1 text-xs text-gray-500">Loading client accounts and contacts…</p>
              ) : null}
            </div>
            <div className="md:col-span-2">
              <Select
                label="Bill-to contact"
                placeholder={
                  !selectedClientAccountId
                    ? 'Select a client account first'
                    : 'Select contact for name, email & phone'
                }
                value={selectedBillContactId}
                onChange={handleBillContactSelect}
                options={billContactOptions}
                icon={Users}
                disabled={!selectedClientAccountId || refsLoading}
              />
              {selectedClientAccountId && !refsLoading && billContactOptions.length === 0 ? (
                <p className="mt-1 text-sm text-gray-500">No contacts linked to this client yet.</p>
              ) : null}
            </div>
            <Input label="Name *" value={invoiceData.billToName} onChange={set('billToName')} />
            <Input label="Company" value={invoiceData.billToCompany} onChange={set('billToCompany')} />
            <Input label="Email" type="email" value={invoiceData.billToEmail} onChange={set('billToEmail')} />
            <Input label="Phone" value={invoiceData.billToPhone} onChange={set('billToPhone')} />
            <Input label="GSTIN / Tax ID" value={invoiceData.billToGstin} onChange={set('billToGstin')} />
            <div className="md:col-span-2"><Textarea label="Address" value={invoiceData.billToAddress} onChange={set('billToAddress')} rows={3} /></div>
          </div>
        </FormSectionCard>

        {/* ── Line Items ─────────────────────────────────────────────────────── */}
        <FormSectionCard title="Line Items" description="Products or services being invoiced" icon={List}>
          <div className="space-y-3">
            {lineItems.map((item, idx) => (
              <div key={item.id} className="grid grid-cols-12 gap-3 items-end border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="col-span-12 md:col-span-3"><Input label={idx===0?'Item Name':undefined} value={item.name} onChange={e=>updateItem(idx,'name',e.target.value)} placeholder="Item name" /></div>
                <div className="col-span-12 md:col-span-4"><Input label={idx===0?'Description':undefined} value={item.description} onChange={e=>updateItem(idx,'description',e.target.value)} placeholder="Description (optional)" /></div>
                <div className="col-span-4 md:col-span-1"><Input label={idx===0?'Qty':undefined} type="number" value={item.qty} onChange={e=>updateItem(idx,'qty',e.target.value)} min={0} /></div>
                <div className="col-span-4 md:col-span-2"><Input label={idx===0?'Rate':undefined} type="number" value={item.rate} onChange={e=>updateItem(idx,'rate',e.target.value)} placeholder="0" /></div>
                <div className="col-span-3 md:col-span-1 flex items-end">
                  <span className="text-sm font-semibold text-gray-700 pb-2 whitespace-nowrap">
                    {item.qty && item.rate ? formatCurrency((parseFloat(item.qty)||0)*(parseFloat(item.rate)||0), invoiceData.currency) : '—'}
                  </span>
                </div>
                <div className="col-span-1 flex items-end justify-end pb-1">
                  {lineItems.length > 1 && (
                    <button type="button" onClick={() => setLineItems(p=>p.filter((_,i)=>i!==idx))} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setLineItems(p=>[...p,defaultItem()])} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Line Item
            </Button>
          </div>
          {/* Totals */}
          <div className="mt-6 border-t border-gray-200 pt-4 ml-auto w-full max-w-sm space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span className="font-medium">{formatCurrency(subtotal, invoiceData.currency)}</span></div>
            <div className="flex justify-between text-sm items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">{invoiceData.taxLabel || 'Tax'}</span>
                <Input type="number" value={invoiceData.taxRate} onChange={set('taxRate')} className="w-16 text-sm py-0.5" />
                <span className="text-gray-500 text-xs">%</span>
              </div>
              <span className="font-medium">{formatCurrency(taxAmount, invoiceData.currency)}</span>
            </div>
            <div className="flex justify-between text-sm items-center gap-3">
              <span className="text-gray-600">Discount</span>
              <Input type="number" value={invoiceData.discount} onChange={set('discount')} className="w-28 text-sm py-0.5 text-right" />
            </div>
            <div className="flex justify-between text-sm font-bold border-t pt-2"><span>Total</span><span>{formatCurrency(total, invoiceData.currency)}</span></div>
            <div className="flex justify-between text-sm items-center gap-3">
              <span className="text-gray-600">Amount Paid</span>
              <Input type="number" value={invoiceData.amountPaid} onChange={set('amountPaid')} className="w-28 text-sm py-0.5 text-right" />
            </div>
            <div className="flex justify-between text-base font-extrabold text-orange-600 border-t-2 border-gray-900 pt-2">
              <span>Balance Due</span><span>{formatCurrency(balanceDue, invoiceData.currency)}</span>
            </div>
          </div>
        </FormSectionCard>

        {/* ── Notes ──────────────────────────────────────────────────────────── */}
        <FormSectionCard title="Notes & Terms" description="Additional information" icon={List}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Textarea label="Notes (for client)" value={invoiceData.notes} onChange={set('notes')} rows={4} placeholder="e.g. Thank you for your business!" />
            <Textarea label="Terms & Conditions" value={invoiceData.termsAndConditions} onChange={set('termsAndConditions')} rows={4} placeholder="e.g. Payments are due within 30 days..." />
          </div>
        </FormSectionCard>

        {/* ── Actions ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-4 pb-8">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" disabled={saving}
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white flex items-center gap-2 px-8">
            {saving ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
