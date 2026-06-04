'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Button, Card, LoadingSpinner, Modal,
} from '@webfudge/ui';
import CRMPageHeader from '../../../../components/CRMPageHeader';
import {
  InfoSection,
  InfoRow,
  DetailColumnHeading,
  SidebarCardTitle,
} from '@webfudge/ui';
import proposalService from '../../../../lib/api/proposalService';
import {
  FileText, Eye, Pencil, Trash2, Download, ArrowLeft,
  Building2, User, Mail, Phone, MapPin, Calendar, Clock,
  IndianRupee, Target, Flag,
  Layers, List, AlignLeft,
} from 'lucide-react';

// ─── Shared helpers (kept inline to avoid cross-page import complexity) ───────

const formatCurrency = (value, currency = 'INR') => {
  const num = parseFloat(value) || 0;
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(num);
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://api.xtrawrkx.com' : 'http://localhost:1337');

function getProposalFileUrl(proposalFile) {
  const raw = proposalFile?.url;
  if (!raw) return null;
  if (raw.startsWith('http')) return raw;
  return `${API_BASE_URL}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const numberToWords = (num) => {
  if (!num || isNaN(num)) return '';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
    if (n < 1000) return ones[Math.floor(n/100)]+' Hundred'+(n%100 ? ' '+convert(n%100) : '');
    if (n < 100000) return convert(Math.floor(n/1000))+' Thousand'+(n%1000 ? ' '+convert(n%1000) : '');
    if (n < 10000000) return convert(Math.floor(n/100000))+' Lakh'+(n%100000 ? ' '+convert(n%100000) : '');
    return convert(Math.floor(n/10000000))+' Crore'+(n%10000000 ? ' '+convert(n%10000000) : '');
  };
  const w = convert(Math.floor(num));
  return w ? w + ' only' : '';
};

const STATUS_CONFIG = {
  DRAFT:    { variant: 'default', label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  SENT:     { variant: 'info',    label: 'Sent',  color: 'bg-blue-100 text-blue-700' },
  ACCEPTED: { variant: 'success', label: 'Accepted', color: 'bg-green-100 text-green-700' },
  REJECTED: { variant: 'danger',  label: 'Rejected', color: 'bg-red-100 text-red-700' },
  EXPIRED:  { variant: 'warning', label: 'Expired',  color: 'bg-amber-100 text-amber-700' },
};

// ─── Inline ProposalPreviewDocument (same as new/page.js) ─────────────────────

function SectionHeading({ number, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#f97316', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', flexShrink: 0 }}>{number}</div>
      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a2e' }}>{title}</div>
    </div>
  );
}

function ProposalPreviewDocument({ data }) {
  const p = data;
  const currency = p.currency || 'INR';
  const modules = Array.isArray(p.modules) ? p.modules : [];
  const milestones = Array.isArray(p.milestones) ? p.milestones : [];
  const assumptions = Array.isArray(p.assumptions) ? p.assumptions : [];
  const securityItems = Array.isArray(p.securityItems) ? p.securityItems : [];
  const outOfScope = Array.isArray(p.outOfScope) ? p.outOfScope : [];
  const handoverDeliverables = Array.isArray(p.handoverDeliverables) ? p.handoverDeliverables : [];
  const totalValue = p.totalValue || modules.reduce((s, m) => s + (parseFloat(m.price)||0), 0);
  const totalWords = numberToWords(totalValue);
  const docTypeLabels = { SOW: 'Statement of Work (SOW)', PROPOSAL: 'Project Proposal', QUOTE: 'Project Quote' };

  return (
    <div style={{ width: '794px', minWidth: '794px', fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: '11px', lineHeight: '1.6', color: '#1a1a2e', backgroundColor: '#ffffff' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding: '40px', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>{p.preparedByCompany || 'Your Company'}</div>
            <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '20px' }}>{p.preparedByEmail} &nbsp;|&nbsp; {p.preparedByPhone}</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#f97316', marginBottom: '6px' }}>{docTypeLabels[p.documentType] || 'Project Proposal'}</div>
            <div style={{ fontSize: '14px', opacity: 0.9, fontWeight: '600' }}>Project: {p.projectName || 'Untitled'}</div>
          </div>
          <div style={{ textAlign: 'right', opacity: 0.85 }}>
            <div style={{ fontSize: '11px', marginBottom: '4px' }}>Doc No: <strong>{p.proposalNumber}</strong></div>
            <div style={{ fontSize: '11px', marginBottom: '4px' }}>Date: <strong>{p.date}</strong></div>
            {p.validUntil && <div style={{ fontSize: '11px' }}>Valid Until: <strong>{p.validUntil}</strong></div>}
          </div>
        </div>
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', gap: '60px' }}>
          <div>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6, marginBottom: '6px' }}>Prepared For</div>
            <div style={{ fontWeight: '700', fontSize: '13px' }}>{p.clientCompanyName || '—'}</div>
            {p.clientContactName && <div style={{ fontSize: '11px', opacity: 0.8 }}>{p.clientContactName}</div>}
            {p.clientEmail && <div style={{ fontSize: '11px', opacity: 0.7 }}>{p.clientEmail}</div>}
          </div>
          <div>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6, marginBottom: '6px' }}>Prepared By</div>
            <div style={{ fontWeight: '700', fontSize: '13px' }}>{p.preparedByCompany || '—'}</div>
            {p.preparedByName && <div style={{ fontSize: '11px', opacity: 0.8 }}>{p.preparedByName}</div>}
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6, marginBottom: '6px' }}>Total Value</div>
            <div style={{ fontWeight: '800', fontSize: '22px', color: '#f97316' }}>{formatCurrency(totalValue, currency)}</div>
            {totalWords && <div style={{ fontSize: '9px', opacity: 0.6 }}>({totalWords})</div>}
          </div>
        </div>
      </div>
      <div style={{ padding: '32px 40px' }}>
        {p.projectOverview && (
          <div style={{ marginBottom: '28px' }}>
            <SectionHeading number="1" title="Project Overview" />
            <p style={{ margin: 0, whiteSpace: 'pre-line', color: '#374151' }}>{p.projectOverview}</p>
          </div>
        )}
        {modules.some(m => m.name) && (
          <div style={{ marginBottom: '28px' }}>
            <SectionHeading number="2" title="Scope of Work" />
            {modules.filter(m => m.name).map((mod, i) => (
              <div key={i} style={{ marginBottom: '14px', borderLeft: '3px solid #f97316', paddingLeft: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ fontWeight: '700', fontSize: '12px' }}>Module {i+1} — {mod.name}</div>
                  {mod.price && <div style={{ fontWeight: '700', color: '#f97316' }}>Price: {formatCurrency(mod.price, currency)}</div>}
                </div>
                {mod.deliverables && <div style={{ whiteSpace: 'pre-line', color: '#374151', fontSize: '11px', marginBottom: '4px' }}>{mod.deliverables}</div>}
                {mod.acceptanceCriteria && <div style={{ whiteSpace: 'pre-line', color: '#6b7280', fontSize: '10.5px', fontStyle: 'italic' }}>{mod.acceptanceCriteria}</div>}
              </div>
            ))}
          </div>
        )}
        {milestones.some(m => m.name) && (
          <div style={{ marginBottom: '28px' }}>
            <SectionHeading number="3" title="Timeline & Milestones" />
            {p.estimatedTimeline && <p style={{ color: '#374151', marginTop: 0 }}><strong>Timeline:</strong> {p.estimatedTimeline}</p>}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  {['Milestone','Description','Payment %','Amount'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {milestones.filter(m => m.name).map((ms, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '600' }}>{ms.name}</td>
                    <td style={{ padding: '8px 12px', color: '#6b7280' }}>{ms.description || '—'}</td>
                    <td style={{ padding: '8px 12px', color: '#f97316', fontWeight: '600' }}>{ms.paymentPercent ? `${ms.paymentPercent}%` : '—'}</td>
                    <td style={{ padding: '8px 12px', fontWeight: '600' }}>{ms.paymentPercent ? formatCurrency((totalValue * parseFloat(ms.paymentPercent))/100, currency) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {assumptions.some(a => a?.trim()) && (
          <div style={{ marginBottom: '28px' }}>
            <SectionHeading number="4" title="Assumptions" />
            <ol style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>{assumptions.filter(a => a?.trim()).map((a,i) => <li key={i}>{a}</li>)}</ol>
          </div>
        )}
        {modules.some(m => m.name) && (
          <div style={{ marginBottom: '28px' }}>
            <SectionHeading number="5" title="Pricing Summary" />
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead><tr style={{ backgroundColor: '#1a1a2e', color: '#fff' }}><th style={{ padding: '10px 14px', textAlign: 'left' }}>Module</th><th style={{ padding: '10px 14px', textAlign: 'right' }}>Price</th></tr></thead>
              <tbody>{modules.filter(m => m.name).map((mod, i) => (<tr key={i} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: i%2===0?'#fff':'#f9fafb' }}><td style={{ padding: '8px 14px' }}>{mod.name}</td><td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '600' }}>{mod.price ? formatCurrency(mod.price,currency) : '—'}</td></tr>))}</tbody>
              <tfoot><tr style={{ backgroundColor: '#1a1a2e', color: '#fff' }}><td style={{ padding: '10px 14px', fontWeight: '700' }}>Total</td><td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800', color: '#f97316' }}>{formatCurrency(totalValue,currency)}</td></tr></tfoot>
            </table>
          </div>
        )}
        <div style={{ borderTop: '2px solid #f97316', paddingTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '12px', marginBottom: '4px' }}>Contact</div>
            <div>{p.preparedByName || p.preparedByCompany}</div>
            <div>{p.preparedByCompany}</div>
            <div>Email: {p.preparedByEmail}</div>
            <div>Phone: {p.preparedByPhone}</div>
          </div>
          <div style={{ textAlign: 'right', color: '#9ca3af', fontSize: '10px' }}>
            <div>{p.proposalNumber}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Page ──────────────────────────────────────────────────────────────

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const previewRef = useRef(null);
  const id = params?.id;

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showPreview, setShowPreview]   = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [deleteModal, setDeleteModal]   = useState(false);
  const [isDeleting, setIsDeleting]     = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await proposalService.getOne(id);
        if (!res?.data) { setNotFound(true); return; }
        setProposal(res.data);
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await proposalService.delete(id);
      router.push('/clients/proposals');
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
      setDeleteModal(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await proposalService.update(id, { status: newStatus });
      if (res?.data) setProposal(res.data);
    } catch (err) { console.error(err); }
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pdfW) / canvas.width;
      let left = imgH, pos = 0;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, pos, pdfW, imgH);
      left -= pdfH;
      while (left > 0) { pos -= pdfH; pdf.addPage(); pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, pos, pdfW, imgH); left -= pdfH; }
      pdf.save(`${proposal?.proposalNumber || 'proposal'}-${(proposal?.clientCompanyName || 'client').replace(/\s+/g,'-')}.pdf`);
    } catch (err) { console.error(err); }
    finally { setIsDownloading(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" message="Loading proposal..." /></div>;
  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Proposal not found</h2>
        <Button onClick={() => router.push('/clients/proposals')} variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Proposals</Button>
      </div>
    </div>
  );

  if (!proposal) return null;

  const modules = Array.isArray(proposal.modules) ? proposal.modules : [];
  const milestones = Array.isArray(proposal.milestones) ? proposal.milestones : [];
  const assumptions = Array.isArray(proposal.assumptions) ? proposal.assumptions : [];
  const outOfScope = Array.isArray(proposal.outOfScope) ? proposal.outOfScope : [];
  const handoverDeliverables = Array.isArray(proposal.handoverDeliverables) ? proposal.handoverDeliverables : [];
  const statusCfg = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.DRAFT;
  const isUploadedProposal =
    proposal.creationMode === 'UPLOAD' || Boolean(proposal.proposalFile?.url || proposal.proposalFile?.id);
  const uploadedPdfUrl = getProposalFileUrl(proposal.proposalFile);

  const statusActions = Object.entries(STATUS_CONFIG)
    .filter(([k]) => k !== proposal.status)
    .map(([k, v]) => ({ key: k, label: `Mark as ${v.label}` }));

  return (
    <div className="min-h-screen">
      {/* Preview Modal */}
      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Proposal Preview" size="2xl"
        className="max-h-[96vh] flex flex-col" contentClassName="flex flex-col flex-1 overflow-hidden !p-0">
        <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-b bg-white">
          <p className="text-sm text-gray-500">Preview of proposal document</p>
          <Button onClick={handleDownloadPDF} disabled={isDownloading}
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white flex items-center gap-2">
            {isDownloading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Generating...</> : <><Download className="w-4 h-4" /> Download PDF</>}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-auto bg-gray-100 p-6">
          <div className="shadow-2xl mx-auto" style={{ width: '794px', minWidth: '794px' }}>
            <div ref={previewRef}><ProposalPreviewDocument data={proposal} /></div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteModal}
        onClose={() => {
          if (isDeleting) return;
          setDeleteModal(false);
        }}
        title="Delete Proposal"
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
          <p className="text-sm text-gray-700">Are you sure you want to delete this proposal?</p>
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
              {isDeleting ? 'Deleting…' : 'Delete Proposal'}
            </Button>
          </div>
        </div>
      </Modal>

      <div className="space-y-6 p-4 md:p-6">
        <CRMPageHeader
          title={proposal.title || proposal.projectName || proposal.proposalNumber || 'Proposal'}
          subtitle={`${proposal.proposalNumber || ''} · ${proposal.documentType || 'PROPOSAL'}`}
          breadcrumb={[
            { label: 'Dashboard', href: '/' },
            { label: 'Clients', href: '/clients' },
            { label: 'Proposals', href: '/clients/proposals' },
            { label: proposal.proposalNumber || 'Detail', href: `/clients/proposals/${id}` },
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
                      type="button"
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
              {isUploadedProposal && uploadedPdfUrl ? (
                <Button
                  type="button"
                  onClick={() => window.open(uploadedPdfUrl, '_blank', 'noopener,noreferrer')}
                  variant="outline"
                  className="h-9 px-3 flex items-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
                >
                  <Download className="w-4 h-4" /> Open PDF
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  variant="outline"
                  className="h-9 px-3 flex items-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
                >
                  <Eye className="w-4 h-4" /> Preview
                </Button>
              )}
              <Button
                type="button"
                onClick={() => router.push(`/clients/proposals/${id}/edit`)}
                className="h-9 px-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" /> Edit
              </Button>
              <button
                type="button"
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
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 pr-2">
                  <h2 className="text-xl font-semibold text-gray-900">Project</h2>
                  <p className="mt-1.5 text-base text-gray-500">
                    Key dates, total value, document reference, and overview.
                  </p>
                </div>
                <span
                  className="inline-flex shrink-0 items-center rounded-xl border border-orange-300/90 bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100/90 px-4 py-2 text-sm font-bold uppercase tracking-widest text-orange-900 shadow-sm ring-2 ring-orange-200/70"
                  title="Document type"
                >
                  {proposal.documentType || 'PROPOSAL'}
                </span>
              </div>

              <InfoSection title="Summary" icon={Target} isFirst>
                <div className="mb-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <InfoRow label="Project name" icon={FileText} value={proposal.projectName} />
                  <InfoRow label="Date" icon={Calendar} value={formatDate(proposal.date)} />
                  <InfoRow label="Valid until" icon={Clock} value={formatDate(proposal.validUntil)} />
                  <InfoRow
                    label="Total value"
                    icon={IndianRupee}
                    value={formatCurrency(proposal.totalValue, proposal.currency)}
                    emphasize
                  />
                </div>
              </InfoSection>

              {proposal.proposalNumber ? (
                <InfoSection title="Document" icon={FileText}>
                  <InfoRow label="Proposal number" value={proposal.proposalNumber} />
                </InfoSection>
              ) : null}

              {proposal.projectOverview ? (
                <section className="border-t border-gray-100 pt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <AlignLeft className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Overview</h3>
                  </div>
                  <p className="mt-2.5 whitespace-pre-wrap text-base font-normal leading-relaxed text-gray-800">
                    {proposal.projectOverview}
                  </p>
                </section>
              ) : null}
            </Card>

            {modules.length > 0 && modules.some((m) => m.name) && (
              <Card variant="elevated" className="rounded-xl">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Scope of work</h2>
                  <p className="mt-1.5 text-base text-gray-500">Modules, deliverables, acceptance criteria, and pricing.</p>
                </div>
                <InfoSection title="Modules" icon={Layers} isFirst>
                  <div className="mb-4 space-y-4">
                    {modules.filter((m) => m.name).map((mod, i) => (
                      <div key={i} className="border-l-[3px] border-orange-400 py-0.5 pl-4">
                        <div className="mb-1 flex items-start justify-between gap-3">
                          <span className="text-base font-semibold text-gray-900">
                            Module {i + 1} — {mod.name}
                          </span>
                          {mod.price ? (
                            <span className="shrink-0 text-base font-bold text-orange-600">
                              {formatCurrency(mod.price, proposal.currency)}
                            </span>
                          ) : null}
                        </div>
                        {mod.deliverables ? (
                          <p className="mt-1 text-base leading-snug text-gray-600 whitespace-pre-line">{mod.deliverables}</p>
                        ) : null}
                        {mod.acceptanceCriteria ? (
                          <p className="mt-1 text-base italic leading-snug text-gray-500 whitespace-pre-line">
                            Acceptance: {mod.acceptanceCriteria}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </InfoSection>
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                  <span className="text-sm font-medium text-gray-600">Total</span>
                  <span className="text-xl font-bold text-orange-600 tabular-nums">
                    {formatCurrency(proposal.totalValue, proposal.currency)}
                  </span>
                </div>
              </Card>
            )}

            {milestones.some((m) => m.name) && (
              <Card variant="elevated" className="rounded-xl">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Milestones</h2>
                  <p className="mt-1.5 text-base text-gray-500">Payment schedule and timeline.</p>
                </div>
                {proposal.estimatedTimeline ? (
                  <p className="mb-4 text-base text-gray-600">
                    <span className="font-semibold text-gray-800">Timeline:</span> {proposal.estimatedTimeline}
                  </p>
                ) : null}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Milestone', 'Description', 'Payment %', 'Amount'].map((h) => (
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
                      {milestones.filter((m) => m.name).map((ms, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-900">{ms.name}</td>
                          <td className="px-4 py-3 text-gray-600">{ms.description || '—'}</td>
                          <td className="px-4 py-3 font-semibold text-orange-600">
                            {ms.paymentPercent ? `${ms.paymentPercent}%` : '—'}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900 tabular-nums">
                            {ms.paymentPercent
                              ? formatCurrency((proposal.totalValue * parseFloat(ms.paymentPercent)) / 100, proposal.currency)
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {(assumptions.some((a) => a?.trim()) ||
              outOfScope.some((o) => o?.trim()) ||
              handoverDeliverables.some((d) => d?.trim())) && (
              <Card variant="elevated" className="rounded-xl">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Assumptions, scope &amp; handover</h2>
                  <p className="mt-1.5 text-base text-gray-500">What we assume, what is excluded, and delivery commitments.</p>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {assumptions.some((a) => a?.trim()) && (
                    <div className="min-w-0">
                      <DetailColumnHeading title="Assumptions" icon={List} />
                      <ul className="mt-2.5 list-inside list-disc space-y-2 text-base leading-snug text-gray-700">
                        {assumptions.filter((a) => a?.trim()).map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {outOfScope.some((o) => o?.trim()) && (
                    <div className="min-w-0">
                      <DetailColumnHeading title="Out of scope" icon={Layers} />
                      <ul className="mt-2.5 list-inside list-disc space-y-2 text-base leading-snug text-gray-700">
                        {outOfScope.filter((o) => o?.trim()).map((o, i) => (
                          <li key={i}>{o}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {handoverDeliverables.some((d) => d?.trim()) && (
                    <div className="min-w-0">
                      <DetailColumnHeading title="Handover deliverables" icon={FileText} />
                      <ul className="mt-2.5 list-inside list-disc space-y-2 text-base leading-snug text-gray-700">
                        {handoverDeliverables.filter((d) => d?.trim()).map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card variant="elevated" className="rounded-xl">
              <SidebarCardTitle title="Client" icon={Building2} />
              <div className="space-y-4">
                <InfoRow label="Company" icon={Building2} value={proposal.clientCompanyName} emphasize />
                <InfoRow label="Contact" icon={User} value={proposal.clientContactName} />
                <InfoRow label="Email" icon={Mail} value={proposal.clientEmail} />
                <InfoRow label="Phone" icon={Phone} value={proposal.clientPhone} />
                <InfoRow label="Address" icon={MapPin} value={proposal.clientAddress} />
              </div>
            </Card>

            <Card variant="elevated" className="rounded-xl">
              <SidebarCardTitle title="Prepared by" icon={User} />
              <div className="space-y-4">
                <InfoRow label="Company" icon={Building2} value={proposal.preparedByCompany} />
                <InfoRow label="Name" icon={User} value={proposal.preparedByName} />
                <InfoRow label="Email" icon={Mail} value={proposal.preparedByEmail} />
                <InfoRow label="Phone" icon={Phone} value={proposal.preparedByPhone} />
              </div>
            </Card>

            {(proposal.paymentTerms || proposal.taxInfo || proposal.outOfScopeRate || proposal.warrantyDays) && (
              <Card variant="elevated" className="rounded-xl">
                <SidebarCardTitle title="Billing" icon={IndianRupee} />
                <div className="space-y-4">
                  {proposal.outOfScopeRate ? (
                    <InfoRow
                      label="Out-of-scope rate"
                      icon={IndianRupee}
                      value={`${formatCurrency(proposal.outOfScopeRate, proposal.currency)} / ${proposal.outOfScopeRateUnit || 'hr'}`}
                    />
                  ) : null}
                  {proposal.warrantyDays ? (
                    <InfoRow label="Warranty" icon={Clock} value={`${proposal.warrantyDays} days`} />
                  ) : null}
                  <InfoRow label="Payment terms" icon={List} value={proposal.paymentTerms} />
                  <InfoRow label="Tax info" icon={List} value={proposal.taxInfo} />
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
