'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button, Card, LoadingSpinner, Modal } from '@webfudge/ui';
import CRMPageHeader from '../../../../components/CRMPageHeader';
import { InfoRow, DetailColumnHeading, SidebarCardTitle } from '@webfudge/ui';
import invoiceService from '../../../../lib/api/invoiceService';
import {
  Receipt, Eye, Pencil, Trash2, Download, ArrowLeft,
  Building2, User, Mail, Phone, MapPin, Calendar, Clock,
  IndianRupee, FileText,
} from 'lucide-react';

const formatCurrency = (value, currency = 'INR') => {
  const num = parseFloat(value) || 0;
  const locales = { INR: 'en-IN', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB' };
  return new Intl.NumberFormat(locales[currency] || 'en-IN', { style: 'currency', currency: currency || 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  SENT: { label: 'Sent', color: 'bg-blue-100 text-blue-700' },
  PAID: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  OVERDUE: { label: 'Overdue', color: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500' },
  PARTIAL: { label: 'Partial', color: 'bg-amber-100 text-amber-700' },
};

// ─── Inline Invoice Preview ────────────────────────────────────────────────────

function MetaRow({ label, value, bold }) {
  if (!value) return null;
  return (
    <tr>
      <td style={{ padding: '3px 8px 3px 0', color: '#6b7280', whiteSpace: 'nowrap', fontWeight: '500' }}>{label}</td>
      <td style={{ padding: '3px 0 3px 8px', fontWeight: bold ? '700' : '600', color: bold ? '#1a1a2e' : '#374151' }}>: {value}</td>
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

function InvoicePreviewDocument({ inv }) {
  const currency = inv.currency || 'INR';
  const lineItems = Array.isArray(inv.lineItems) ? inv.lineItems : [];
  const subtotal = lineItems.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0), 0);
  const taxAmount = subtotal * ((parseFloat(inv.taxRate) || 0) / 100);
  const total = subtotal + taxAmount - (parseFloat(inv.discount) || 0);
  const balanceDue = total - (parseFloat(inv.amountPaid) || 0);

  const thStyle = { padding: '10px 12px', textAlign: 'left', fontWeight: '700', fontSize: '11px', color: '#fff', backgroundColor: '#1a1a2e', borderBottom: '1px solid #2d2d4e' };

  return (
    <div style={{ width: '794px', minWidth: '794px', fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: '11px', lineHeight: '1.6', color: '#1a1a2e', backgroundColor: '#ffffff' }}>
      <div style={{ padding: '36px 40px 24px', borderBottom: '2px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: '800', fontSize: '18px', color: '#1a1a2e', marginBottom: '4px' }}>{inv.fromOrgName || 'Your Company'}</div>
          {inv.fromOrgAddress && <div style={{ color: '#6b7280', fontSize: '10.5px', whiteSpace: 'pre-line' }}>{inv.fromOrgAddress}</div>}
          {inv.fromOrgEmail && <div style={{ color: '#6b7280', fontSize: '10.5px' }}>{inv.fromOrgEmail}</div>}
          {inv.fromOrgPhone && <div style={{ color: '#6b7280', fontSize: '10.5px' }}>{inv.fromOrgPhone}</div>}
          {inv.fromOrgGstin && <div style={{ color: '#6b7280', fontSize: '10.5px' }}>GSTIN: {inv.fromOrgGstin}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px', color: '#1a1a2e', marginBottom: '16px' }}>{inv.documentType || 'INVOICE'}</div>
          <table style={{ fontSize: '11px', borderCollapse: 'collapse', marginLeft: 'auto' }}>
            <tbody>
              <MetaRow label="Invoice #" value={inv.invoiceNumber} />
              <MetaRow label="Invoice Date" value={formatDate(inv.invoiceDate)} />
              {inv.terms && <MetaRow label="Terms" value={inv.terms} />}
              {inv.dueDate && <MetaRow label="Due Date" value={formatDate(inv.dueDate)} bold />}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ padding: '20px 40px', display: 'flex', gap: '40px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af', marginBottom: '8px' }}>Bill To</div>
          <div style={{ fontWeight: '700', color: '#1a1a2e' }}>{inv.billToName || inv.billToCompany}</div>
          {inv.billToCompany && inv.billToName && <div style={{ color: '#374151' }}>{inv.billToCompany}</div>}
          {inv.billToAddress && <div style={{ color: '#6b7280', whiteSpace: 'pre-line' }}>{inv.billToAddress}</div>}
        </div>
      </div>
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
              const amt = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#9ca3af', fontWeight: '600' }}>{idx + 1}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: '600' }}>{item.name}</div>
                    {item.description && <div style={{ color: '#6b7280', fontSize: '10px' }}>{item.description}</div>}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{item.qty || '—'}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{item.rate ? formatCurrency(item.rate, currency) : '—'}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600' }}>{amt ? formatCurrency(amt, currency) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <table style={{ fontSize: '11px', borderCollapse: 'collapse', minWidth: '280px' }}>
            <tbody>
              <TotalRow label="Sub Total" value={formatCurrency(subtotal, currency)} />
              {inv.taxRate && parseFloat(inv.taxRate) > 0 && <TotalRow label={`${inv.taxLabel || 'Tax'} (${inv.taxRate}%)`} value={formatCurrency(taxAmount, currency)} />}
              {parseFloat(inv.discount) > 0 && <TotalRow label="Discount" value={`-${formatCurrency(inv.discount, currency)}`} />}
              <TotalRow label="Total" value={formatCurrency(total, currency)} bold />
              {parseFloat(inv.amountPaid) > 0 && <TotalRow label="Amount Paid" value={`-${formatCurrency(inv.amountPaid, currency)}`} />}
              <TotalRow label="Balance Due" value={formatCurrency(balanceDue, currency)} highlight />
            </tbody>
          </table>
        </div>
      </div>
      {(inv.notes || inv.termsAndConditions) && (
        <div style={{ padding: '16px 40px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '40px' }}>
          {inv.notes && <div style={{ flex: 1 }}><div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '6px' }}>Notes</div><div style={{ color: '#374151', whiteSpace: 'pre-line' }}>{inv.notes}</div></div>}
          {inv.termsAndConditions && <div style={{ flex: 1 }}><div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '6px' }}>Terms &amp; Conditions</div><div style={{ color: '#374151', whiteSpace: 'pre-line' }}>{inv.termsAndConditions}</div></div>}
        </div>
      )}
      <div style={{ padding: '16px 40px 28px', borderTop: '2px solid #1a1a2e', color: '#9ca3af', fontSize: '10px' }}>
        {inv.fromOrgName} &nbsp;|&nbsp; {inv.fromOrgEmail} &nbsp;|&nbsp; {inv.fromOrgPhone}
      </div>
    </div>
  );
}

// ─── Detail Page ──────────────────────────────────────────────────────────────

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const previewRef = useRef(null);
  const id = params?.id;

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await invoiceService.getOne(id);
        if (!res?.data) { setNotFound(true); return; }
        setInvoice(res.data);
      } catch (err) { console.error(err); setNotFound(true); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await invoiceService.delete(id);
      router.push('/clients/invoices');
    } catch (err) { console.error(err); setIsDeleting(false); setDeleteModal(false); }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await invoiceService.update(id, { status: newStatus });
      if (res?.data) setInvoice(res.data);
    } catch (err) { console.error(err); }
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth(), pdfH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pdfW) / canvas.width;
      let left = imgH, pos = 0;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, pos, pdfW, imgH);
      left -= pdfH;
      while (left > 0) { pos -= pdfH; pdf.addPage(); pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, pos, pdfW, imgH); left -= pdfH; }
      pdf.save(`${invoice?.invoiceNumber || 'invoice'}-${(invoice?.billToCompany || invoice?.billToName || 'client').replace(/\s+/g, '-')}.pdf`);
    } catch (err) { console.error(err); }
    finally { setIsDownloading(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" message="Loading invoice..." /></div>;
  if (notFound || !invoice) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Invoice not found</h2>
        <Button onClick={() => router.push('/clients/invoices')} variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Invoices</Button>
      </div>
    </div>
  );

  const lineItems = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];
  const subtotal = lineItems.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0), 0);
  const taxAmount = subtotal * ((parseFloat(invoice.taxRate) || 0) / 100);
  const total = subtotal + taxAmount - (parseFloat(invoice.discount) || 0);
  const balanceDue = total - (parseFloat(invoice.amountPaid) || 0);
  const statusCfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.DRAFT;
  const statusActions = Object.entries(STATUS_CONFIG).filter(([k]) => k !== invoice.status).map(([k, v]) => ({ key: k, label: `Mark as ${v.label}` }));

  return (
    <div className="min-h-screen">
      {/* Preview Modal */}
      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Invoice Preview" size="2xl"
        className="max-h-[96vh] flex flex-col" contentClassName="flex flex-col flex-1 overflow-hidden !p-0">
        <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-b bg-white">
          <p className="text-sm text-gray-500">Preview of invoice document</p>
          <Button onClick={handleDownloadPDF} disabled={isDownloading}
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white flex items-center gap-2">
            {isDownloading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Generating...</> : <><Download className="w-4 h-4" />Download PDF</>}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-auto bg-gray-100 p-6">
          <div className="shadow-2xl mx-auto" style={{ width: '794px', minWidth: '794px' }}>
            <div ref={previewRef}><InvoicePreviewDocument inv={invoice} /></div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteModal}
        onClose={() => {
          if (isDeleting) return;
          setDeleteModal(false);
        }}
        title="Delete Invoice"
        size="md"
        closeOnBackdrop={!isDeleting}
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <p className="text-sm text-red-900">
              <span className="font-semibold">This action cannot be undone</span>
            </p>
          </div>
          <p className="text-sm text-gray-700">Are you sure you want to delete this invoice?</p>
          <div className="mt-1 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="muted"
              disabled={isDeleting}
              onClick={() => setDeleteModal(false)}
              className="w-full rounded-xl border-[1.5px] border-gray-400 bg-gray-300 px-5 py-2.5 sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={isDeleting}
              onClick={handleDelete}
              className="w-full min-w-[9rem] rounded-xl py-2.5 sm:w-auto"
            >
              {isDeleting ? 'Deleting…' : 'Delete Invoice'}
            </Button>
          </div>
        </div>
      </Modal>

      <div className="p-4 md:p-6 space-y-6">
        <CRMPageHeader
          title={invoice.invoiceNumber || 'Invoice'}
          subtitle={`${invoice.documentType || 'INVOICE'} · ${invoice.billToCompany || invoice.billToName || ''}`}
          breadcrumb={[
            { label: 'Dashboard', href: '/' },
            { label: 'Clients', href: '/clients' },
            { label: 'Invoices', href: '/clients/invoices' },
            { label: invoice.invoiceNumber || 'Detail', href: `/clients/invoices/${id}` },
          ]}
          showProfile={true} showSearch={false} showActions={false}
        />

        {/* Action bar */}
        <Card variant="elevated" className="rounded-xl p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="inline-flex min-w-max items-center gap-1.5 rounded-xl border border-gray-100 bg-gray-50/70 p-1.5">
                  <span
                    className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm ${statusCfg.color}`}
                  >
                    {statusCfg.label}
                  </span>
                  {statusActions.map((a) => (
                    <button
                      key={a.key}
                      onClick={() => handleStatusChange(a.key)}
                      className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-all hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowPreview(true)}
                variant="outline"
                className="h-9 px-3 flex items-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <Eye className="w-4 h-4" /> Preview
              </Button>
              <Button
                onClick={() => router.push(`/clients/invoices/${id}/edit`)}
                className="h-9 px-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" /> Edit
              </Button>
              <button
                onClick={() => setDeleteModal(true)}
                className="h-9 w-9 inline-flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card variant="elevated" className="rounded-xl">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Line items</h2>
                <p className="mt-1.5 text-base text-gray-500">Products and services, quantities, and amounts.</p>
              </div>
              <div className="-mx-6 overflow-x-auto border-t border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['#', 'Item', 'Description', 'Qty', 'Rate', 'Amount'].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lineItems.filter((i) => i.name).map((item, idx) => {
                      const amt = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{item.name}</td>
                          <td className="px-4 py-3 text-gray-500">{item.description || '—'}</td>
                          <td className="px-4 py-3 text-gray-700">{item.qty}</td>
                          <td className="px-4 py-3 text-gray-700">
                            {item.rate ? formatCurrency(item.rate, invoice.currency) : '—'}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            {amt ? formatCurrency(amt, invoice.currency) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="-mx-6 border-t border-gray-200">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="px-6 py-2 text-gray-500">Sub Total</td>
                      <td className="px-6 py-2 text-right font-medium tabular-nums">
                        {formatCurrency(subtotal, invoice.currency)}
                      </td>
                    </tr>
                    {parseFloat(invoice.taxRate) > 0 && (
                      <tr className="border-b border-gray-100">
                        <td className="px-6 py-2 text-gray-500">
                          {invoice.taxLabel || 'Tax'} ({invoice.taxRate}%)
                        </td>
                        <td className="px-6 py-2 text-right font-medium tabular-nums">
                          {formatCurrency(taxAmount, invoice.currency)}
                        </td>
                      </tr>
                    )}
                    {parseFloat(invoice.discount) > 0 && (
                      <tr className="border-b border-gray-100">
                        <td className="px-6 py-2 text-gray-500">Discount</td>
                        <td className="px-6 py-2 text-right font-medium text-red-600 tabular-nums">
                          -{formatCurrency(invoice.discount, invoice.currency)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <td className="px-6 py-3 font-bold text-gray-900">Total</td>
                      <td className="px-6 py-3 text-right text-base font-bold text-gray-900 tabular-nums">
                        {formatCurrency(total, invoice.currency)}
                      </td>
                    </tr>
                    {parseFloat(invoice.amountPaid) > 0 && (
                      <tr className="border-b border-gray-100">
                        <td className="px-6 py-2 text-gray-500">Amount Paid</td>
                        <td className="px-6 py-2 text-right font-medium text-green-600 tabular-nums">
                          -{formatCurrency(invoice.amountPaid, invoice.currency)}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-gray-900">
                      <td className="px-6 py-3 font-bold text-white">Balance Due</td>
                      <td className="px-6 py-3 text-right text-lg font-extrabold text-orange-400 tabular-nums">
                        {formatCurrency(balanceDue, invoice.currency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {(invoice.notes || invoice.termsAndConditions) && (
              <Card variant="elevated" className="rounded-xl">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Notes &amp; terms</h2>
                  <p className="mt-1.5 text-base text-gray-500">Text shown on the invoice document.</p>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {invoice.notes ? (
                    <div className="min-w-0">
                      <DetailColumnHeading title="Notes" icon={FileText} />
                      <p className="mt-2.5 whitespace-pre-wrap text-base leading-relaxed text-gray-800">
                        {invoice.notes}
                      </p>
                    </div>
                  ) : null}
                  {invoice.termsAndConditions ? (
                    <div className="min-w-0">
                      <DetailColumnHeading title="Terms & conditions" icon={Receipt} />
                      <p className="mt-2.5 whitespace-pre-wrap text-base leading-relaxed text-gray-800">
                        {invoice.termsAndConditions}
                      </p>
                    </div>
                  ) : null}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card variant="elevated" className="rounded-xl">
              <SidebarCardTitle title="Invoice info" icon={Receipt} />
              <div className="space-y-4">
                <InfoRow icon={Calendar} label="Invoice date" value={formatDate(invoice.invoiceDate)} />
                <InfoRow icon={Clock} label="Due date" value={formatDate(invoice.dueDate)} />
                <InfoRow icon={IndianRupee} label="Currency" value={invoice.currency} />
                <InfoRow icon={Receipt} label="Terms" value={invoice.terms} />
              </div>
            </Card>

            <Card variant="elevated" className="rounded-xl">
              <SidebarCardTitle title="Invoice from" icon={Building2} />
              <div className="space-y-4">
                <InfoRow icon={Building2} label="Company" value={invoice.fromOrgName} emphasize />
                <InfoRow icon={Mail} label="Email" value={invoice.fromOrgEmail} />
                <InfoRow icon={Phone} label="Phone" value={invoice.fromOrgPhone} />
                <InfoRow icon={MapPin} label="Address" value={invoice.fromOrgAddress} />
                {invoice.fromOrgGstin ? (
                  <InfoRow icon={Receipt} label="GSTIN" value={invoice.fromOrgGstin} />
                ) : null}
              </div>
            </Card>

            <Card variant="elevated" className="rounded-xl">
              <SidebarCardTitle title="Bill to" icon={User} />
              <div className="space-y-4">
                <InfoRow icon={User} label="Contact" value={invoice.billToName} />
                <InfoRow icon={Building2} label="Company" value={invoice.billToCompany} emphasize />
                <InfoRow icon={Mail} label="Email" value={invoice.billToEmail} />
                <InfoRow icon={Phone} label="Phone" value={invoice.billToPhone} />
                <InfoRow icon={MapPin} label="Address" value={invoice.billToAddress} />
                {invoice.billToGstin ? (
                  <InfoRow icon={Receipt} label="GSTIN" value={invoice.billToGstin} />
                ) : null}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
