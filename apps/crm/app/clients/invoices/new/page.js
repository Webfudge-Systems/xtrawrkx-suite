'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Button,
  Input,
  Select,
  Textarea,
  Modal,
  FormSectionCard,
} from '@webfudge/ui';
import CRMPageHeader from '../../../../components/CRMPageHeader';
import invoiceService from '../../../../lib/api/invoiceService';
import clientAccountService from '../../../../lib/api/clientAccountService';
import contactService from '../../../../lib/api/contactService';
import {
  mergeBillToFromAccountAndContact,
  clientAccountApiId,
  formatContactDisplayName,
} from '../../../../lib/invoiceClientAutofill';
import {
  filterContactsForCompany,
  defaultPrimaryContactId,
  contactOptionValue,
  contactRowMatchesId,
} from '../../../../lib/dealFormOptions';
import { useAuth } from '@webfudge/auth';
import {
  Receipt,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Plus,
  Trash2,
  Eye,
  Download,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  FileText,
  Hash,
  Percent,
  Copy,
  Users,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value, currency = 'INR') => {
  const num = parseFloat(value) || 0;
  const locales = { INR: 'en-IN', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB' };
  return new Intl.NumberFormat(locales[currency] || 'en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const numberToWords = (num) => {
  if (!num || isNaN(num)) return '';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };
  const words = convert(Math.floor(num));
  return words ? words + ' only' : '';
};

// ─── Invoice Preview Document ─────────────────────────────────────────────────

function InvoicePreviewDocument({ data }) {
  const { invoiceData, lineItems, fromOrg } = data;
  const currency = invoiceData.currency || 'INR';

  const subtotal = lineItems.reduce((s, item) => s + (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0), 0);
  const taxAmount = subtotal * ((parseFloat(invoiceData.taxRate) || 0) / 100);
  const total = subtotal + taxAmount;
  const balanceDue = total - (parseFloat(invoiceData.amountPaid) || 0);

  const thStyle = {
    padding: '10px 12px',
    textAlign: 'left',
    fontWeight: '700',
    fontSize: '11px',
    color: '#fff',
    backgroundColor: '#1a1a2e',
    borderBottom: '1px solid #2d2d4e',
  };

  return (
    <div style={{ width: '794px', minWidth: '794px', fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: '11px', lineHeight: '1.6', color: '#1a1a2e', backgroundColor: '#ffffff' }}>

      {/* Header */}
      <div style={{ padding: '36px 40px 24px', borderBottom: '2px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* From / Logo */}
        <div>
          {fromOrg.logo && (
            <img
              src={fromOrg.logo}
              alt={fromOrg.name}
              crossOrigin="anonymous"
              style={{ maxHeight: '56px', maxWidth: '160px', marginBottom: '10px', objectFit: 'contain' }}
            />
          )}
          <div style={{ fontWeight: '800', fontSize: '18px', color: '#1a1a2e', marginBottom: '4px' }}>{fromOrg.name || 'Your Company'}</div>
          {fromOrg.address && <div style={{ color: '#6b7280', fontSize: '10.5px', whiteSpace: 'pre-line' }}>{fromOrg.address}</div>}
          {fromOrg.email && <div style={{ color: '#6b7280', fontSize: '10.5px' }}>{fromOrg.email}</div>}
          {fromOrg.phone && <div style={{ color: '#6b7280', fontSize: '10.5px' }}>{fromOrg.phone}</div>}
          {fromOrg.gstin && <div style={{ color: '#6b7280', fontSize: '10.5px' }}>GSTIN: {fromOrg.gstin}</div>}
        </div>

        {/* INVOICE label + meta */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px', color: '#1a1a2e', marginBottom: '16px' }}>
            {invoiceData.documentType || 'INVOICE'}
          </div>
          <table style={{ fontSize: '11px', borderCollapse: 'collapse', marginLeft: 'auto' }}>
            <tbody>
              <MetaRow label="Invoice #" value={invoiceData.invoiceNumber} />
              <MetaRow label="Invoice Date" value={invoiceData.invoiceDate} />
              {invoiceData.terms && <MetaRow label="Terms" value={invoiceData.terms} />}
              {invoiceData.dueDate && <MetaRow label="Due Date" value={invoiceData.dueDate} bold />}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill To / Ship To */}
      <div style={{ padding: '20px 40px', display: 'flex', gap: '40px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af', marginBottom: '8px' }}>Bill To</div>
          <div style={{ fontWeight: '700', color: '#1a1a2e', marginBottom: '2px' }}>{invoiceData.billToName || invoiceData.billToCompany}</div>
          {invoiceData.billToCompany && invoiceData.billToName && <div style={{ color: '#374151' }}>{invoiceData.billToCompany}</div>}
          {invoiceData.billToAddress && <div style={{ color: '#6b7280', whiteSpace: 'pre-line' }}>{invoiceData.billToAddress}</div>}
          {invoiceData.billToEmail && <div style={{ color: '#6b7280' }}>{invoiceData.billToEmail}</div>}
          {invoiceData.billToGstin && <div style={{ color: '#6b7280' }}>GSTIN: {invoiceData.billToGstin}</div>}
        </div>
        {!invoiceData.sameAsShipTo && (invoiceData.shipToName || invoiceData.shipToAddress) && (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af', marginBottom: '8px' }}>Ship To</div>
            <div style={{ fontWeight: '700', color: '#1a1a2e', marginBottom: '2px' }}>{invoiceData.shipToName}</div>
            {invoiceData.shipToAddress && <div style={{ color: '#6b7280', whiteSpace: 'pre-line' }}>{invoiceData.shipToAddress}</div>}
          </div>
        )}
        {invoiceData.sameAsShipTo && (invoiceData.billToName || invoiceData.billToAddress) && (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af', marginBottom: '8px' }}>Ship To</div>
            <div style={{ fontWeight: '700', color: '#1a1a2e', marginBottom: '2px' }}>{invoiceData.billToName || invoiceData.billToCompany}</div>
            {invoiceData.billToAddress && <div style={{ color: '#6b7280', whiteSpace: 'pre-line' }}>{invoiceData.billToAddress}</div>}
          </div>
        )}
      </div>

      {/* Line Items Table */}
      <div style={{ padding: '24px 40px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '36px', textAlign: 'center' }}>#</th>
              <th style={{ ...thStyle }}>Item &amp; Description</th>
              <th style={{ ...thStyle, textAlign: 'right', width: '70px' }}>Qty</th>
              <th style={{ ...thStyle, textAlign: 'right', width: '100px' }}>Rate</th>
              <th style={{ ...thStyle, textAlign: 'right', width: '110px' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.filter(i => i.name).map((item, idx) => {
              const amount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#9ca3af', fontWeight: '600' }}>{idx + 1}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: '600', color: '#1a1a2e' }}>{item.name}</div>
                    {item.description && <div style={{ color: '#6b7280', fontSize: '10px', marginTop: '2px' }}>{item.description}</div>}
                    {item.unit && <div style={{ color: '#9ca3af', fontSize: '10px' }}>{item.unit}</div>}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#374151' }}>{item.qty || '—'}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#374151' }}>
                    {item.rate ? formatCurrency(item.rate, currency) : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', color: '#1a1a2e' }}>
                    {amount ? formatCurrency(amount, currency) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0' }}>
          <table style={{ fontSize: '11px', borderCollapse: 'collapse', minWidth: '280px' }}>
            <tbody>
              <TotalRow label="Sub Total" value={formatCurrency(subtotal, currency)} />
              {invoiceData.taxRate && parseFloat(invoiceData.taxRate) > 0 && (
                <TotalRow label={`${invoiceData.taxLabel || 'Tax'} (${invoiceData.taxRate}%)`} value={formatCurrency(taxAmount, currency)} />
              )}
              {invoiceData.discount && parseFloat(invoiceData.discount) > 0 && (
                <TotalRow label="Discount" value={`-${formatCurrency(invoiceData.discount, currency)}`} />
              )}
              <TotalRow label="Total" value={formatCurrency(total, currency)} bold />
              {parseFloat(invoiceData.amountPaid) > 0 && (
                <TotalRow label="Amount Paid" value={`-${formatCurrency(invoiceData.amountPaid, currency)}`} />
              )}
              <TotalRow label="Balance Due" value={formatCurrency(balanceDue, currency)} highlight />
            </tbody>
          </table>
        </div>

        {/* Amount in words */}
        {balanceDue > 0 && (
          <div style={{ marginTop: '12px', fontSize: '10px', color: '#6b7280', fontStyle: 'italic' }}>
            Balance Due: {numberToWords(Math.ceil(balanceDue))} ({currency})
          </div>
        )}
      </div>

      {/* Footer — Notes & Terms */}
      {(invoiceData.notes || invoiceData.termsAndConditions) && (
        <div style={{ padding: '16px 40px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '40px' }}>
          {invoiceData.notes && (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#9ca3af', marginBottom: '6px' }}>Notes</div>
              <div style={{ color: '#374151', fontSize: '10.5px', whiteSpace: 'pre-line' }}>{invoiceData.notes}</div>
            </div>
          )}
          {invoiceData.termsAndConditions && (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#9ca3af', marginBottom: '6px' }}>Terms &amp; Conditions</div>
              <div style={{ color: '#374151', fontSize: '10.5px', whiteSpace: 'pre-line' }}>{invoiceData.termsAndConditions}</div>
            </div>
          )}
        </div>
      )}

      {/* Signature / Footer */}
      <div style={{ padding: '16px 40px 28px', borderTop: '2px solid #1a1a2e', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ fontSize: '10px', color: '#9ca3af' }}>
          {fromOrg.name} &nbsp;|&nbsp; {fromOrg.email} &nbsp;|&nbsp; {fromOrg.phone}
        </div>
        {invoiceData.showSignature && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #374151', paddingTop: '4px', minWidth: '160px', marginTop: '24px', fontSize: '10px', color: '#6b7280' }}>
              Authorized Signature
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetaRow({ label, value, bold }) {
  if (!value) return null;
  return (
    <tr>
      <td style={{ padding: '3px 8px 3px 0', color: '#6b7280', whiteSpace: 'nowrap', fontWeight: '500' }}>{label}</td>
      <td style={{ padding: '3px 0 3px 8px', textAlign: 'left', fontWeight: bold ? '700' : '600', color: bold ? '#1a1a2e' : '#374151' }}>: {value}</td>
    </tr>
  );
}

function TotalRow({ label, value, bold, highlight }) {
  return (
    <tr style={highlight ? { backgroundColor: '#1a1a2e', color: '#fff' } : {}}>
      <td style={{ padding: '8px 14px', color: highlight ? '#fff' : '#6b7280', fontWeight: bold || highlight ? '700' : '400', fontSize: bold || highlight ? '12px' : '11px', borderTop: bold ? '2px solid #e5e7eb' : 'none' }}>{label}</td>
      <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: bold || highlight ? '800' : '500', color: highlight ? '#f97316' : (bold ? '#1a1a2e' : '#374151'), fontSize: bold || highlight ? '13px' : '11px', borderTop: bold ? '2px solid #e5e7eb' : 'none' }}>{value}</td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientAccountFromUrlApplied = useRef(false);
  const previewRef = useRef(null);
  const { currentOrg, user } = useAuth();

  const [showPreview, setShowPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const [clientAccounts, setClientAccounts] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [allContacts, setAllContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [selectedClientAccountId, setSelectedClientAccountId] = useState('');
  const [selectedBillContactId, setSelectedBillContactId] = useState('');
  /** Latest full client row from getOne — used with contact picker to merge Bill To. */
  const [clientAccountSnapshot, setClientAccountSnapshot] = useState(null);

  // ── From Org (pre-filled, editable) ─────────────────────────────────────────
  const [fromOrg, setFromOrg] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    gstin: '',
    logo: '',
  });

  // Populate from currentOrg when it loads
  useEffect(() => {
    if (currentOrg) {
      setFromOrg({
        name: currentOrg.name || '',
        address: currentOrg.address || '',
        email: currentOrg.email || (user?.email || ''),
        phone: currentOrg.phone || '',
        website: currentOrg.website || '',
        gstin: currentOrg.gstin || currentOrg.taxId || '',
        logo: currentOrg.logo || '',
      });
    } else if (user) {
      setFromOrg((prev) => ({ ...prev, email: user.email || '' }));
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

  /** When contacts finish loading or account changes, keep contact id valid and refresh Bill To from snapshot. */
  useEffect(() => {
    if (refsLoading) return;
    if (!selectedClientAccountId) {
      if (selectedBillContactId) setSelectedBillContactId('');
      return;
    }
    const list = filterContactsForCompany(allContacts, '', selectedClientAccountId);
    const prevC = (selectedBillContactId || '').trim();

    if (!list.length) {
      if (prevC) setSelectedBillContactId('');
      return;
    }

    if (prevC) {
      const inList = list.some((c) => contactRowMatchesId(c, prevC));
      if (inList) {
        const row = list.find((c) => contactRowMatchesId(c, prevC));
        const canon = row ? contactOptionValue(row) : prevC;
        if (canon && canon !== prevC) setSelectedBillContactId(canon);
        return;
      }
    }

    const pid = defaultPrimaryContactId(list) || '';
    if (pid === prevC) return;
    setSelectedBillContactId(pid);
    const row = list.find((c) => contactOptionValue(c) === pid);
    if (
      clientAccountSnapshot &&
      clientAccountApiId(clientAccountSnapshot) === selectedClientAccountId
    ) {
      setInvoiceData((prev) => ({
        ...prev,
        ...mergeBillToFromAccountAndContact(clientAccountSnapshot, row),
      }));
    }
  }, [
    refsLoading,
    allContacts,
    selectedClientAccountId,
    selectedBillContactId,
    clientAccountSnapshot,
  ]);

  // ── Invoice data ─────────────────────────────────────────────────────────────
  const [invoiceData, setInvoiceData] = useState({
    documentType: 'INVOICE',
    invoiceNumber: `INV-${String(Date.now()).slice(-6)}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    terms: 'Due on Receipt',
    currency: 'INR',
    // Bill To
    billToCompany: '',
    billToName: '',
    billToEmail: '',
    billToPhone: '',
    billToAddress: '',
    billToGstin: '',
    // Ship To
    sameAsShipTo: true,
    shipToName: '',
    shipToAddress: '',
    // Pricing
    taxRate: '',
    taxLabel: 'GST',
    discount: '',
    amountPaid: '',
    // Footer
    notes: 'Thanks for your business.',
    termsAndConditions: 'Full payment is due upon receipt of this invoice. Late payments may incur additional charges or interest as per the applicable laws.',
    showSignature: true,
  });

  // ── Line Items ────────────────────────────────────────────────────────────────
  const [lineItems, setLineItems] = useState([
    { id: 1, name: '', description: '', qty: '1', rate: '', unit: '' },
  ]);

  // ── Computed ──────────────────────────────────────────────────────────────────
  const subtotal = lineItems.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0), 0);
  const taxAmount = subtotal * ((parseFloat(invoiceData.taxRate) || 0) / 100);
  const total = subtotal + taxAmount - (parseFloat(invoiceData.discount) || 0);
  const balanceDue = total - (parseFloat(invoiceData.amountPaid) || 0);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleChange = (field, value) => {
    setInvoiceData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleFromOrgChange = (field, value) => {
    setFromOrg((prev) => ({ ...prev, [field]: value }));
  };

  const handleClientAccountSelect = async (value) => {
    const idStr = (value || '').trim();
    if (!idStr || idStr === 'undefined' || idStr === 'null') {
      setSelectedClientAccountId('');
      setSelectedBillContactId('');
      setClientAccountSnapshot(null);
      return;
    }
    setSelectedClientAccountId(idStr);

    const fromList = clientAccounts.find((c) => clientAccountApiId(c) === idStr);

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

  useEffect(() => {
    if (refsLoading || clientAccountFromUrlApplied.current) return;
    const raw = searchParams.get('clientAccount')?.trim();
    if (!raw) return;
    clientAccountFromUrlApplied.current = true;
    void handleClientAccountSelect(raw);
  }, [refsLoading, searchParams]);

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

  const updateItem = (id, field, value) => {
    setLineItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const addItem = () => {
    const id = Math.max(...lineItems.map((i) => i.id), 0) + 1;
    setLineItems((prev) => [...prev, { id, name: '', description: '', qty: '1', rate: '', unit: '' }]);
  };

  const removeItem = (id) => {
    if (lineItems.length > 1) setLineItems((prev) => prev.filter((i) => i.id !== id));
  };

  // ── Validation ────────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!fromOrg.name.trim()) errs.fromName = 'Your company name is required';
    if (!invoiceData.billToName.trim() && !invoiceData.billToCompany.trim()) errs.billTo = 'Bill To name or company is required';
    if (lineItems.every((i) => !i.name.trim())) errs.lineItems = 'At least one line item is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Preview ───────────────────────────────────────────────────────────────────
  const handlePreview = () => {
    if (!validate()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setShowPreview(true);
  };

  // ── PDF ───────────────────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      const clientName = (invoiceData.billToCompany || invoiceData.billToName || 'client').replace(/\s+/g, '-');
      pdf.save(`${invoiceData.invoiceNumber}-${clientName}.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    try {
      const caRaw = (selectedClientAccountId || '').trim();
      const payload = {
        ...invoiceData,
        fromOrgName: fromOrg.name,
        fromOrgAddress: fromOrg.address,
        fromOrgEmail: fromOrg.email,
        fromOrgPhone: fromOrg.phone,
        fromOrgGstin: fromOrg.gstin,
        fromOrgLogo: fromOrg.logo,
        lineItems,
        subtotal,
        total,
        balanceDue,
        status: 'DRAFT',
        clientAccount: caRaw && caRaw !== 'undefined' && caRaw !== 'null' ? caRaw : null,
      };
      const result = await invoiceService.create(payload);
      const createdId = result?.id ?? result?.data?.id;
      setShowSuccess(true);
      setTimeout(() => router.push(createdId ? `/clients/invoices/${createdId}` : '/clients/invoices'), 2000);
    } catch (err) {
      console.error('Error saving invoice:', err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ── Options ───────────────────────────────────────────────────────────────────
  const documentTypeOptions = [
    { value: 'INVOICE', label: 'Invoice' },
    { value: 'PROFORMA INVOICE', label: 'Proforma Invoice' },
    { value: 'CREDIT NOTE', label: 'Credit Note' },
    { value: 'RECEIPT', label: 'Receipt' },
  ];

  const currencyOptions = [
    { value: 'INR', label: '₹ Indian Rupee (INR)' },
    { value: 'USD', label: '$ US Dollar (USD)' },
    { value: 'EUR', label: '€ Euro (EUR)' },
    { value: 'GBP', label: '£ British Pound (GBP)' },
  ];

  const termsOptions = [
    { value: 'Due on Receipt', label: 'Due on Receipt' },
    { value: 'Net 7', label: 'Net 7' },
    { value: 'Net 15', label: 'Net 15' },
    { value: 'Net 30', label: 'Net 30' },
    { value: 'Net 45', label: 'Net 45' },
    { value: 'Net 60', label: 'Net 60' },
  ];

  const taxLabelOptions = [
    { value: 'GST', label: 'GST' },
    { value: 'IGST', label: 'IGST' },
    { value: 'VAT', label: 'VAT' },
    { value: 'Tax', label: 'Tax' },
  ];

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Saved!</h2>
          <p className="text-gray-600 mb-4">Your invoice has been created successfully</p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Redirecting to invoices...</p>
        </div>
      </div>
    );
  }

  const previewData = { invoiceData, lineItems, fromOrg };

  return (
    <div className="min-h-screen bg-white">
      {/* ── Preview Modal ── */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Invoice Preview"
        size="2xl"
        className="max-h-[96vh] flex flex-col"
        contentClassName="flex flex-col flex-1 overflow-hidden !p-0"
      >
        <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white">
          <p className="text-sm text-gray-500">This is how your invoice will look when downloaded as PDF.</p>
          <Button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white flex items-center gap-2"
          >
            {isDownloading ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Generating PDF...</>
            ) : (
              <><Download className="w-4 h-4" /> Download PDF</>
            )}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-auto bg-gray-100 p-6">
          <div className="shadow-2xl mx-auto" style={{ width: '794px', minWidth: '794px' }}>
            <div ref={previewRef}>
              <InvoicePreviewDocument data={previewData} />
            </div>
          </div>
        </div>
      </Modal>

      <div className="p-4 space-y-6">
        <CRMPageHeader
          title="New Invoice"
          subtitle="Create a professional invoice for your client"
          breadcrumb={[
            { label: 'Dashboard', href: '/' },
            { label: 'Clients', href: '/clients' },
            { label: 'Invoices', href: '/clients/invoices' },
            { label: 'New Invoice', href: '/clients/invoices/new' },
          ]}
          showProfile={true}
          showSearch={false}
          showActions={false}
        />

        {/* Validation errors */}
        {Object.keys(errors).length > 0 && (
          <div className="rounded-xl bg-red-50 border-2 border-red-300 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-red-900 font-semibold text-base mb-1">Please fix the following errors:</h4>
                <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
                  {errors.fromName && <li>{errors.fromName}</li>}
                  {errors.billTo && <li>{errors.billTo}</li>}
                  {errors.lineItems && <li>{errors.lineItems}</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Section 1: Invoice Info ── */}
          <FormSectionCard
            icon={Receipt}
            title="Invoice Information"
            description="Document type, invoice number and dates"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Select
                  label="Document Type"
                  value={invoiceData.documentType}
                  onChange={(v) => handleChange('documentType', v)}
                  options={documentTypeOptions}
                  icon={FileText}
                />
              </div>
              <div>
                <Input
                  label="Invoice Number"
                  value={invoiceData.invoiceNumber}
                  onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                  placeholder="INV-000001"
                  icon={Hash}
                />
              </div>
              <div>
                <Select
                  label="Currency"
                  value={invoiceData.currency}
                  onChange={(v) => handleChange('currency', v)}
                  options={currencyOptions}
                  icon={IndianRupee}
                />
              </div>
              <div>
                <Input
                  label="Invoice Date"
                  type="date"
                  value={invoiceData.invoiceDate}
                  onChange={(e) => handleChange('invoiceDate', e.target.value)}
                  icon={Calendar}
                />
              </div>
              <div>
                <Select
                  label="Payment Terms"
                  value={invoiceData.terms}
                  onChange={(v) => handleChange('terms', v)}
                  options={termsOptions}
                />
              </div>
              <div>
                <Input
                  label="Due Date"
                  type="date"
                  value={invoiceData.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  icon={Calendar}
                />
              </div>
            </div>
          </FormSectionCard>

          {/* ── Section 2: Invoice From (Organization) ── */}
          <FormSectionCard
            icon={Building2}
            title="Invoice From (Your Organization)"
            description={currentOrg ? `Pre-filled from: ${currentOrg.name}` : 'Your company details that appear on the invoice'}
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >
            {currentOrg && (
              <div className="mb-5 flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900">{currentOrg.name}</p>
                  <p className="text-xs text-blue-600">Active organization — you can edit the details below if needed</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Input
                  label="Company / Organization Name *"
                  value={fromOrg.name}
                  onChange={(e) => handleFromOrgChange('name', e.target.value)}
                  error={errors.fromName}
                  placeholder="Webfudge Systems"
                  icon={Building2}
                />
              </div>
              <div>
                <Input
                  label="GSTIN / Tax ID"
                  value={fromOrg.gstin}
                  onChange={(e) => handleFromOrgChange('gstin', e.target.value)}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
              <div>
                <Input
                  label="Email"
                  type="email"
                  value={fromOrg.email}
                  onChange={(e) => handleFromOrgChange('email', e.target.value)}
                  icon={Mail}
                />
              </div>
              <div>
                <Input
                  label="Phone"
                  value={fromOrg.phone}
                  onChange={(e) => handleFromOrgChange('phone', e.target.value)}
                  icon={Phone}
                />
              </div>
              <div>
                <Input
                  label="Website"
                  value={fromOrg.website}
                  onChange={(e) => handleFromOrgChange('website', e.target.value)}
                  placeholder="https://webfudge.in"
                />
              </div>
              <div className="lg:col-span-3">
                <Textarea
                  label="Address"
                  value={fromOrg.address}
                  onChange={(e) => handleFromOrgChange('address', e.target.value)}
                  placeholder="Street, City, State, PIN, Country"
                  rows={2}
                />
              </div>
              <div>
                <Input
                  label="Logo URL (optional)"
                  value={fromOrg.logo}
                  onChange={(e) => handleFromOrgChange('logo', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </FormSectionCard>

          {/* ── Section 3: Bill To ── */}
          <FormSectionCard
            icon={User}
            title="Bill To (Client)"
            description="Client billing details"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >
            {errors.billTo && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errors.billTo}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-3">
                <Select
                  label="Client account"
                  placeholder="Select a client to autofill (optional)"
                  value={selectedClientAccountId}
                  onChange={handleClientAccountSelect}
                  options={clientAccounts
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
              <div className="lg:col-span-3">
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
              <div>
                <Input
                  label="Contact Name *"
                  value={invoiceData.billToName}
                  onChange={(e) => handleChange('billToName', e.target.value)}
                  error={errors.billTo}
                  placeholder="Ms. Jane Doe"
                  icon={User}
                />
              </div>
              <div>
                <Input
                  label="Company"
                  value={invoiceData.billToCompany}
                  onChange={(e) => handleChange('billToCompany', e.target.value)}
                  placeholder="Client Company Pvt. Ltd."
                  icon={Building2}
                />
              </div>
              <div>
                <Input
                  label="Email"
                  type="email"
                  value={invoiceData.billToEmail}
                  onChange={(e) => handleChange('billToEmail', e.target.value)}
                  icon={Mail}
                />
              </div>
              <div>
                <Input
                  label="Phone"
                  value={invoiceData.billToPhone}
                  onChange={(e) => handleChange('billToPhone', e.target.value)}
                  icon={Phone}
                />
              </div>
              <div>
                <Input
                  label="GSTIN / Tax ID"
                  value={invoiceData.billToGstin}
                  onChange={(e) => handleChange('billToGstin', e.target.value)}
                  placeholder="22BBBBB1111B1Z5"
                />
              </div>
              <div className="lg:col-span-3">
                <Textarea
                  label="Billing Address"
                  value={invoiceData.billToAddress}
                  onChange={(e) => handleChange('billToAddress', e.target.value)}
                  placeholder="Street, City, State, PIN"
                  rows={2}
                />
              </div>
            </div>
          </FormSectionCard>

          {/* ── Section 4: Ship To ── */}
          <FormSectionCard
            icon={MapPin}
            title="Ship To (Delivery Address)"
            description="Shipping address if different from billing"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >
            <div className="mb-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleChange('sameAsShipTo', !invoiceData.sameAsShipTo)}
                className={`relative w-11 h-6 rounded-full transition-colors ${invoiceData.sameAsShipTo ? 'bg-orange-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${invoiceData.sameAsShipTo ? 'translate-x-5' : ''}`} />
              </button>
              <span className="text-sm text-gray-700 font-medium">Same as billing address</span>
            </div>
            {!invoiceData.sameAsShipTo && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Contact / Company Name"
                    value={invoiceData.shipToName}
                    onChange={(e) => handleChange('shipToName', e.target.value)}
                    icon={User}
                  />
                </div>
                <div>
                  <Textarea
                    label="Shipping Address"
                    value={invoiceData.shipToAddress}
                    onChange={(e) => handleChange('shipToAddress', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            )}
          </FormSectionCard>

          {/* ── Section 5: Line Items ── */}
          <FormSectionCard
            icon={FileText}
            title="Line Items"
            description="Products or services being invoiced"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >
            {errors.lineItems && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errors.lineItems}
              </div>
            )}

            {/* Live total bar */}
            {subtotal > 0 && (
              <div className="mb-5 flex items-center justify-between rounded-xl bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 px-5 py-3">
                <span className="text-sm font-medium text-gray-700">Running Subtotal</span>
                <span className="text-xl font-bold text-orange-600">{formatCurrency(subtotal, invoiceData.currency)}</span>
              </div>
            )}

            {/* Items header */}
            <div className="hidden md:grid grid-cols-12 gap-3 mb-2 px-1">
              <div className="col-span-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Item Name</div>
              <div className="col-span-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</div>
              <div className="col-span-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</div>
              <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rate</div>
              <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</div>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, index) => {
                const amount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
                return (
                  <div key={item.id} className="grid grid-cols-12 gap-3 items-start bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                    <div className="col-span-12 md:col-span-4">
                      <Input
                        placeholder={`Item ${index + 1} name`}
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <Input
                        placeholder="Description (optional)"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-4 md:col-span-1">
                      <Input
                        placeholder="Qty"
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                        min={0}
                      />
                    </div>
                    <div className="col-span-8 md:col-span-2">
                      <Input
                        placeholder="Rate"
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                        min={0}
                        icon={IndianRupee}
                      />
                    </div>
                    <div className="col-span-10 md:col-span-2 flex items-center justify-between gap-2">
                      <div className="flex-1 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900">
                        {amount > 0 ? formatCurrency(amount, invoiceData.currency) : '—'}
                      </div>
                      {lineItems.length > 1 && (
                        <button type="button" onClick={() => removeItem(item.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4">
              <Button type="button" onClick={addItem} size="sm" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>
          </FormSectionCard>

          {/* ── Section 6: Pricing / Tax ── */}
          <FormSectionCard
            icon={IndianRupee}
            title="Pricing & Tax"
            description="Tax, discount and payment details"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div>
                <Select
                  label="Tax Label"
                  value={invoiceData.taxLabel}
                  onChange={(v) => handleChange('taxLabel', v)}
                  options={taxLabelOptions}
                />
              </div>
              <div>
                <Input
                  label="Tax Rate (%)"
                  type="number"
                  value={invoiceData.taxRate}
                  onChange={(e) => handleChange('taxRate', e.target.value)}
                  placeholder="18"
                  min={0}
                  max={100}
                  icon={Percent}
                />
              </div>
              <div>
                <Input
                  label="Discount Amount"
                  type="number"
                  value={invoiceData.discount}
                  onChange={(e) => handleChange('discount', e.target.value)}
                  placeholder="0.00"
                  min={0}
                  icon={IndianRupee}
                />
              </div>
              <div>
                <Input
                  label="Amount Already Paid"
                  type="number"
                  value={invoiceData.amountPaid}
                  onChange={(e) => handleChange('amountPaid', e.target.value)}
                  placeholder="0.00"
                  min={0}
                  icon={IndianRupee}
                />
              </div>
            </div>

            {/* Summary card */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-5 py-3 text-gray-600">Sub Total</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(subtotal, invoiceData.currency)}</td>
                  </tr>
                  {parseFloat(invoiceData.taxRate) > 0 && (
                    <tr className="border-b border-gray-100">
                      <td className="px-5 py-3 text-gray-600">{invoiceData.taxLabel} ({invoiceData.taxRate}%)</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(taxAmount, invoiceData.currency)}</td>
                    </tr>
                  )}
                  {parseFloat(invoiceData.discount) > 0 && (
                    <tr className="border-b border-gray-100">
                      <td className="px-5 py-3 text-gray-600">Discount</td>
                      <td className="px-5 py-3 text-right font-semibold text-red-600">-{formatCurrency(invoiceData.discount, invoiceData.currency)}</td>
                    </tr>
                  )}
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="px-5 py-3 font-bold text-gray-900">Total</td>
                    <td className="px-5 py-3 text-right font-bold text-gray-900 text-base">{formatCurrency(total, invoiceData.currency)}</td>
                  </tr>
                  {parseFloat(invoiceData.amountPaid) > 0 && (
                    <tr className="border-b border-gray-100">
                      <td className="px-5 py-3 text-gray-600">Amount Paid</td>
                      <td className="px-5 py-3 text-right font-semibold text-green-600">-{formatCurrency(invoiceData.amountPaid, invoiceData.currency)}</td>
                    </tr>
                  )}
                  <tr className="bg-gray-900 text-white">
                    <td className="px-5 py-3 font-bold text-base">Balance Due</td>
                    <td className="px-5 py-3 text-right font-extrabold text-orange-400 text-lg">{formatCurrency(balanceDue, invoiceData.currency)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </FormSectionCard>

          {/* ── Section 7: Notes & Terms ── */}
          <FormSectionCard
            icon={FileText}
            title="Notes & Terms"
            description="Message to client and payment terms"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Textarea
                  label="Notes to Client"
                  value={invoiceData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Thanks for your business."
                  rows={4}
                />
              </div>
              <div>
                <Textarea
                  label="Terms & Conditions"
                  value={invoiceData.termsAndConditions}
                  onChange={(e) => handleChange('termsAndConditions', e.target.value)}
                  placeholder="Payment terms, late fee policy..."
                  rows={4}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleChange('showSignature', !invoiceData.showSignature)}
                className={`relative w-11 h-6 rounded-full transition-colors ${invoiceData.showSignature ? 'bg-orange-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${invoiceData.showSignature ? 'translate-x-5' : ''}`} />
              </button>
              <span className="text-sm text-gray-700 font-medium">Show signature line</span>
            </div>
          </FormSectionCard>

          {/* ── Action Buttons ── */}
          <div className="flex items-center justify-between pt-6">
            <Button type="button" onClick={() => router.back()} variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Cancel
            </Button>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={handlePreview}
                variant="outline"
                className="flex items-center gap-2 border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                <Eye className="w-4 h-4" /> Preview Invoice
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white flex items-center gap-2 min-w-[150px]"
              >
                <Receipt className="w-4 h-4" /> Save Invoice
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
