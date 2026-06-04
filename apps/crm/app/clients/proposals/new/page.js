'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@webfudge/auth';
import {
  Button,
  Input,
  Select,
  Textarea,
  Modal,
  FormSectionCard,
} from '@webfudge/ui';
import CRMPageHeader from '../../../../components/CRMPageHeader';
import proposalService from '../../../../lib/api/proposalService';
import uploadService from '../../../../lib/api/uploadService';
import leadCompanyService from '../../../../lib/api/leadCompanyService';
import clientAccountService from '../../../../lib/api/clientAccountService';
import contactService from '../../../../lib/api/contactService';
import { isConvertedLeadCompany } from '../../../../lib/dealFormOptions';
import { mapEntityToProposalClientFields } from '../../../../lib/proposalClientAutofill';
import {
  FileText,
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
  Clock,
  Target,
  ListChecks,
  Shield,
  Package,
  Layers,
  DollarSign,
  Flag,
  Info,
  Hammer,
  BookOpen,
  Upload,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROPOSALS_STORAGE_KEY = 'crm.proposals.items';

const formatCurrency = (value, currency = 'INR') => {
  const num = parseFloat(value) || 0;
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
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

const safeId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `p_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const loadStoredProposals = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PROPOSALS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistStoredProposals = (list) => {
  try {
    window.localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
};

const normalizeProposalRow = (row) => {
  if (!row || typeof row !== 'object') return null;
  const id = row.id || safeId();
  const nowIso = new Date().toISOString();
  return {
    id,
    title: row.title || row.projectName || 'Untitled Proposal',
    proposalNumber: row.proposalNumber || '',
    documentType: row.documentType || 'SOW',
    clientName: row.clientName || row.clientCompanyName || '',
    clientEmail: row.clientEmail || '',
    amount: Number(row.amount ?? row.totalValue ?? 0) || 0,
    currency: row.currency || 'INR',
    status: row.status || 'draft',
    date: row.date || '',
    validUntil: row.validUntil || '',
    createdAt: row.createdAt || nowIso,
    updatedAt: row.updatedAt || nowIso,
  };
};

// ─── Proposal Preview Document ─────────────────────────────────────────────────

function ProposalPreviewDocument({ data }) {
  const {
    proposalData,
    modules,
    milestones,
    assumptions,
    outOfScope,
    handoverDeliverables,
    securityItems,
    totalValue,
  } = data;

  const docTypeLabels = { SOW: 'Statement of Work (SOW)', PROPOSAL: 'Project Proposal', QUOTE: 'Project Quote' };
  const docTitle = docTypeLabels[proposalData.documentType] || 'Statement of Work (SOW)';
  const currency = proposalData.currency || 'INR';
  const totalWords = numberToWords(totalValue);

  return (
    <div
      style={{
        width: '794px',
        minWidth: '794px',
        fontFamily: "'Segoe UI', Arial, sans-serif",
        fontSize: '11px',
        lineHeight: '1.6',
        color: '#1a1a2e',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Cover Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding: '40px', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '4px' }}>
              {proposalData.preparedByCompany || 'Webfudge Systems'}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '20px' }}>
              {proposalData.preparedByEmail} &nbsp;|&nbsp; {proposalData.preparedByPhone}
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#f97316', marginBottom: '6px' }}>
              {docTitle}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9, fontWeight: '600' }}>
              Project: {proposalData.projectName || 'Untitled Project'}
            </div>
          </div>
          <div style={{ textAlign: 'right', opacity: 0.85 }}>
            <div style={{ fontSize: '11px', marginBottom: '4px' }}>Doc No: <strong>{proposalData.proposalNumber}</strong></div>
            <div style={{ fontSize: '11px', marginBottom: '4px' }}>Date: <strong>{proposalData.date}</strong></div>
            {proposalData.validUntil && (
              <div style={{ fontSize: '11px' }}>Valid Until: <strong>{proposalData.validUntil}</strong></div>
            )}
          </div>
        </div>
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', gap: '60px' }}>
          <div>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6, marginBottom: '6px' }}>Prepared For</div>
            <div style={{ fontWeight: '700', fontSize: '13px' }}>{proposalData.clientCompanyName || 'Client Name'}</div>
            {proposalData.clientContactName && <div style={{ fontSize: '11px', opacity: 0.8 }}>{proposalData.clientContactName}</div>}
            {proposalData.clientEmail && <div style={{ fontSize: '11px', opacity: 0.7 }}>{proposalData.clientEmail}</div>}
          </div>
          <div>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6, marginBottom: '6px' }}>Prepared By</div>
            <div style={{ fontWeight: '700', fontSize: '13px' }}>{proposalData.preparedByCompany || 'Webfudge Systems'}</div>
            {proposalData.preparedByName && <div style={{ fontSize: '11px', opacity: 0.8 }}>{proposalData.preparedByName}</div>}
            <div style={{ fontSize: '11px', opacity: 0.7 }}>{proposalData.preparedByEmail}</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6, marginBottom: '6px' }}>Total Value</div>
            <div style={{ fontWeight: '800', fontSize: '22px', color: '#f97316' }}>
              {formatCurrency(totalValue, currency)}
            </div>
            {totalWords && <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '2px' }}>({totalWords})</div>}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '32px 40px' }}>

        {/* 1. Project Overview */}
        {proposalData.projectOverview && (
          <div style={{ marginBottom: '28px' }}>
            <SectionHeading number="1" title="Project Overview" />
            <p style={{ margin: 0, whiteSpace: 'pre-line', color: '#374151' }}>{proposalData.projectOverview}</p>
          </div>
        )}

        {/* 2. Scope of Work */}
        {modules.some(m => m.name) && (
          <div style={{ marginBottom: '28px' }}>
            <SectionHeading number={proposalData.projectOverview ? '2' : '1'} title="Scope of Work (Modules & Deliverables)" />
            <p style={{ color: '#6b7280', marginTop: 0, marginBottom: '16px', fontSize: '11px' }}>
              The scope includes the following modules. Each module lists its price, deliverables, and acceptance criteria.
            </p>
            {modules.filter(m => m.name).map((mod, i) => (
              <div key={mod.id} style={{ marginBottom: '16px', borderLeft: '3px solid #f97316', paddingLeft: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div style={{ fontWeight: '700', fontSize: '12px', color: '#1a1a2e' }}>
                    Module {i + 1} — {mod.name}
                  </div>
                  {mod.price && (
                    <div style={{ fontWeight: '700', color: '#f97316', fontSize: '12px' }}>
                      Price: {formatCurrency(mod.price, currency)}
                    </div>
                  )}
                </div>
                {mod.deliverables && (
                  <div style={{ marginBottom: '6px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', marginBottom: '4px' }}>Deliverables & Features</div>
                    <div style={{ whiteSpace: 'pre-line', color: '#374151', fontSize: '11px' }}>{mod.deliverables}</div>
                  </div>
                )}
                {mod.acceptanceCriteria && (
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', marginBottom: '4px' }}>Acceptance Criteria</div>
                    <div style={{ whiteSpace: 'pre-line', color: '#374151', fontSize: '11px' }}>{mod.acceptanceCriteria}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 3. Timeline & Milestones */}
        {(proposalData.estimatedTimeline || milestones.some(m => m.name)) && (
          <div style={{ marginBottom: '28px' }}>
            <SectionHeading number="3" title="Project Timeline & Milestones" />
            {proposalData.estimatedTimeline && (
              <p style={{ color: '#374151', marginTop: 0, marginBottom: '12px' }}>
                <strong>Estimated Timeline:</strong> {proposalData.estimatedTimeline}
              </p>
            )}
            {milestones.some(m => m.name) && (
              <>
                <div style={{ fontWeight: '600', fontSize: '11px', marginBottom: '8px', color: '#374151' }}>Milestones & Payment Schedule</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Milestone</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Description</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Payment %</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {milestones.filter(m => m.name).map((ms, i) => (
                      <tr key={ms.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '8px 12px', fontWeight: '600', color: '#1a1a2e' }}>{ms.name}</td>
                        <td style={{ padding: '8px 12px', color: '#6b7280' }}>{ms.description || '—'}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#f97316', fontWeight: '600' }}>{ms.paymentPercent ? `${ms.paymentPercent}%` : '—'}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#374151', fontWeight: '600' }}>
                          {ms.paymentPercent ? formatCurrency((totalValue * parseFloat(ms.paymentPercent)) / 100, currency) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* 4. Change Control */}
        {proposalData.outOfScopeRate && (
          <div style={{ marginBottom: '28px' }}>
            <SectionHeading number="4" title="Change Control & Additional Work" />
            <p style={{ color: '#374151', margin: 0 }}>
              Any requests that impact scope, integrations, workflows, or data models will be handled via a formal Change Request.
            </p>
            <p style={{ color: '#374151', marginBottom: 0, marginTop: '6px' }}>
              <strong>Out-of-scope rate:</strong> {formatCurrency(proposalData.outOfScopeRate, currency)} {proposalData.outOfScopeRateUnit || 'per hour'} (billed in 0.25-hour increments)
            </p>
          </div>
        )}

        {/* 5. Assumptions */}
        {assumptions.some(a => a.trim()) && (
          <div style={{ marginBottom: '28px' }}>
            <SectionHeading number="5" title="Assumptions" />
            <ol style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
              {assumptions.filter(a => a.trim()).map((a, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{a}</li>
              ))}
            </ol>
          </div>
        )}

        {/* 6. Security & Compliance */}
        {securityItems.some(s => s.trim()) && (
          <div style={{ marginBottom: '28px' }}>
            <SectionHeading number="6" title="Security & Compliance" />
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', listStyle: 'disc' }}>
              {securityItems.filter(s => s.trim()).map((s, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 7. Warranty & Support */}
        {proposalData.warrantyDays && (
          <div style={{ marginBottom: '28px' }}>
            <SectionHeading number="7" title="Warranty, Maintenance & Support" />
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', listStyle: 'disc' }}>
              <li style={{ marginBottom: '4px' }}>{proposalData.warrantyDays}-day post-deployment bug-fix warranty</li>
              <li>Optional support and enhancement retainers available</li>
            </ul>
          </div>
        )}

        {/* 8. Deliverables at Handover */}
        {handoverDeliverables.some(d => d.trim()) && (
          <div style={{ marginBottom: '28px' }}>
            <SectionHeading number="8" title="Deliverables at Handover" />
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', listStyle: 'disc' }}>
              {handoverDeliverables.filter(d => d.trim()).map((d, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{d}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 9. Out of Scope */}
        {outOfScope.some(o => o.trim()) && (
          <div style={{ marginBottom: '28px' }}>
            <SectionHeading number="9" title="Out of Scope" />
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', listStyle: 'disc' }}>
              {outOfScope.filter(o => o.trim()).map((o, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{o}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 10. Pricing Summary */}
        {modules.some(m => m.name) && (
          <div style={{ marginBottom: '28px' }}>
            <SectionHeading number="10" title="Pricing Summary (Module-wise)" />
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: '600' }}>Module</th>
                  <th style={{ textAlign: 'right', padding: '10px 14px', fontWeight: '600' }}>Price ({currency})</th>
                </tr>
              </thead>
              <tbody>
                {modules.filter(m => m.name).map((mod, i) => (
                  <tr key={mod.id} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                    <td style={{ padding: '8px 14px', color: '#374151' }}>{mod.name}</td>
                    <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '600', color: '#1a1a2e' }}>
                      {mod.price ? formatCurrency(mod.price, currency) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>
                  <td style={{ padding: '10px 14px', fontWeight: '700', fontSize: '12px' }}>Total</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800', fontSize: '13px', color: '#f97316' }}>
                    {formatCurrency(totalValue, currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
            {totalWords && (
              <p style={{ color: '#6b7280', fontSize: '10px', marginTop: '6px', fontStyle: 'italic' }}>
                ({totalWords})
              </p>
            )}
          </div>
        )}

        {/* 11. Acceptance & Next Steps */}
        <div style={{ marginBottom: '28px' }}>
          <SectionHeading number="11" title="Acceptance & Next Steps" />
          {proposalData.acceptanceNotes ? (
            <p style={{ color: '#374151', whiteSpace: 'pre-line', marginTop: 0 }}>{proposalData.acceptanceNotes}</p>
          ) : (
            <>
              <p style={{ color: '#374151', marginTop: 0 }}>To proceed:</p>
              <ol style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
                <li style={{ marginBottom: '4px' }}>Approve this {proposalData.documentType || 'SOW'} via email or signature</li>
                <li style={{ marginBottom: '4px' }}>Release the first milestone payment</li>
                <li>Share any required integration details and access credentials</li>
              </ol>
              <p style={{ color: '#374151', marginBottom: 0, marginTop: '8px' }}>
                Upon confirmation, {proposalData.preparedByCompany || 'Webfudge Systems'} will initiate the project kickoff and execution plan.
              </p>
            </>
          )}
        </div>

        {/* Footer — Contact */}
        <div style={{ borderTop: '2px solid #f97316', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '12px', color: '#1a1a2e', marginBottom: '4px' }}>Contact</div>
            <div style={{ color: '#374151' }}>
              <div style={{ fontWeight: '600' }}>{proposalData.preparedByName || proposalData.preparedByCompany}</div>
              <div>{proposalData.preparedByCompany}</div>
              <div>Email: {proposalData.preparedByEmail}</div>
              <div>Phone: {proposalData.preparedByPhone}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', color: '#9ca3af', fontSize: '10px' }}>
            <div>{proposalData.proposalNumber}</div>
            <div>Generated on {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ number, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
      <div style={{
        width: '24px', height: '24px', borderRadius: '50%',
        backgroundColor: '#f97316', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '10px', fontWeight: '700', flexShrink: 0,
      }}>{number}</div>
      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a2e' }}>{title}</div>
    </div>
  );
}

// ─── Dynamic list helpers ──────────────────────────────────────────────────────

function DynamicList({ items, onChange, placeholder = 'Enter item...' }) {
  const handleChange = (i, val) => {
    const updated = [...items];
    updated[i] = val;
    onChange(updated);
  };
  const add = () => onChange([...items, '']);
  const remove = (i) => {
    if (items.length > 1) onChange(items.filter((_, idx) => idx !== i));
  };
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => handleChange(i, e.target.value)}
            placeholder={placeholder}
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={items.length === 1}
            className="p-2 text-red-400 hover:text-red-600 disabled:opacity-30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <Button type="button" onClick={add} size="sm" variant="outline" className="mt-1">
        <Plus className="w-3 h-3 mr-1" /> Add Item
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewProposalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadCompanyFromUrlApplied = useRef(false);
  const previewRef = useRef(null);
  const { currentOrg, user } = useAuth();

  const [creationMode, setCreationMode] = useState('builder');
  const [pdfFile, setPdfFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const [leadCompanyId, setLeadCompanyId] = useState('');
  const [clientAccountId, setClientAccountId] = useState('');
  const [leadCompanies, setLeadCompanies] = useState([]);
  const [clientAccounts, setClientAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  // ── Proposal header ──────────────────────────────────────────────────────────
  const [proposalData, setProposalData] = useState({
    documentType: 'SOW',
    proposalNumber: `WFS-${Date.now().toString().slice(-6)}`,
    proposalTitle: '',
    date: new Date().toISOString().split('T')[0],
    validUntil: '',
    currency: 'INR',
    // Client
    clientCompanyName: '',
    clientContactName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    // Prepared by (will be overwritten by useEffect once org loads)
    preparedByCompany: '',
    preparedByName: '',
    preparedByEmail: '',
    preparedByPhone: '',
    // Project
    projectName: '',
    projectOverview: '',
    // Timeline
    estimatedTimeline: '',
    // Change control
    outOfScopeRate: '2500',
    outOfScopeRateUnit: 'per hour',
    // Warranty
    warrantyDays: '30',
    // Acceptance
    acceptanceNotes: '',
    // Billing
    paymentTerms: '',
    taxInfo: '',
  });

  // Populate "Prepared By" from active org once auth is ready
  useEffect(() => {
    if (currentOrg || user) {
      setProposalData((prev) => ({
        ...prev,
        preparedByCompany: prev.preparedByCompany || currentOrg?.name || '',
        preparedByEmail: prev.preparedByEmail || currentOrg?.email || user?.email || '',
        preparedByPhone: prev.preparedByPhone || currentOrg?.phone || '',
        preparedByName: prev.preparedByName || (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''),
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

  useEffect(() => {
    if (loadingRefs || leadCompanyFromUrlApplied.current) return;
    const raw = searchParams.get('leadCompany')?.trim();
    if (!raw) return;
    leadCompanyFromUrlApplied.current = true;
    handleLeadCompanySelect(raw);
  }, [loadingRefs, searchParams]);

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

  // ── Dynamic sections ─────────────────────────────────────────────────────────
  const [modules, setModules] = useState([
    { id: 1, name: '', price: '', deliverables: '', acceptanceCriteria: '' },
  ]);

  const [milestones, setMilestones] = useState([
    { id: 1, name: '', paymentPercent: '', description: '' },
  ]);

  const [assumptions, setAssumptions] = useState(['']);
  const [outOfScope, setOutOfScope] = useState(['']);
  const [handoverDeliverables, setHandoverDeliverables] = useState(['Production-deployed platform', 'Admin and user accounts', 'User and admin documentation', 'Deployment runbook']);
  const [securityItems, setSecurityItems] = useState([
    'HTTPS/TLS for all production endpoints',
    'Role-based access control',
    'Full audit trail for all actions',
  ]);

  // ── Computed ──────────────────────────────────────────────────────────────────
  const totalValue = modules.reduce((sum, m) => sum + (parseFloat(m.price) || 0), 0);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleChange = (field, value) => {
    setProposalData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  // Modules
  const updateModule = (id, field, value) => {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };
  const addModule = () => {
    const id = Math.max(...modules.map((m) => m.id), 0) + 1;
    setModules((prev) => [...prev, { id, name: '', price: '', deliverables: '', acceptanceCriteria: '' }]);
  };
  const removeModule = (id) => {
    if (modules.length > 1) setModules((prev) => prev.filter((m) => m.id !== id));
  };

  // Milestones
  const updateMilestone = (id, field, value) => {
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };
  const addMilestone = () => {
    const id = Math.max(...milestones.map((m) => m.id), 0) + 1;
    setMilestones((prev) => [...prev, { id, name: '', paymentPercent: '', description: '' }]);
  };
  const removeMilestone = (id) => {
    if (milestones.length > 1) setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const switchCreationMode = (mode) => {
    setCreationMode(mode);
    setErrors({});
    if (mode === 'builder') setPdfFile(null);
  };

  const handlePdfFileChange = (e) => {
    const file = e.target.files?.[0];
    setPdfFile(file || null);
    if (errors.pdfFile) setErrors((prev) => ({ ...prev, pdfFile: null }));
  };

  // ── Validation ────────────────────────────────────────────────────────────────
  const validateUpload = () => {
    const errs = {};
    if (!leadCompanyId && !clientAccountId) {
      errs.clientCompanyName = 'Select a lead company or client account';
    } else if (!proposalData.clientCompanyName.trim()) {
      errs.clientCompanyName = 'Client company name is required';
    }
    if (!proposalData.proposalTitle.trim()) {
      errs.proposalTitle = 'Proposal title is required';
    }
    if (!proposalData.clientEmail.trim()) {
      errs.clientEmail = 'Client email is required';
    } else if (!/\S+@\S+\.\S+/.test(proposalData.clientEmail)) {
      errs.clientEmail = 'Please enter a valid email';
    }
    if (!pdfFile) errs.pdfFile = 'Please upload a PDF proposal';
    else if (pdfFile.type !== 'application/pdf' && !pdfFile.name.toLowerCase().endsWith('.pdf')) {
      errs.pdfFile = 'Only PDF files are supported';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validate = () => {
    const errs = {};
    if (!leadCompanyId && !clientAccountId) {
      errs.clientCompanyName = 'Select a lead company or client account';
    } else if (!proposalData.clientCompanyName.trim()) {
      errs.clientCompanyName = 'Client company name is required';
    }
    if (!proposalData.projectName.trim()) errs.projectName = 'Project name is required';
    if (!proposalData.clientEmail.trim()) {
      errs.clientEmail = 'Client email is required';
    } else if (!/\S+@\S+\.\S+/.test(proposalData.clientEmail)) {
      errs.clientEmail = 'Please enter a valid email';
    }
    if (modules.every((m) => !m.name.trim())) errs.modules = 'At least one module is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Preview ───────────────────────────────────────────────────────────────────
  const handlePreview = () => {
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setShowPreview(true);
  };

  // ── PDF Download ──────────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    setIsDownloading(true);
    try {
      const element = previewRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

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

      const filename = `${proposalData.proposalNumber || 'proposal'}-${(proposalData.clientCompanyName || 'client').replace(/\s+/g, '-')}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (creationMode === 'upload') {
      if (!validateUpload()) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setIsSubmitting(true);
      try {
        const uploaded = await uploadService.uploadFile(pdfFile);
        const payload = {
          ...proposalData,
          creationMode: 'UPLOAD',
          title: proposalData.proposalTitle || 'Untitled Proposal',
          projectName: proposalData.proposalTitle || 'Uploaded proposal',
          status: 'DRAFT',
          totalValue: 0,
          modules: [],
          milestones: [],
          assumptions: [],
          securityItems: [],
          outOfScope: [],
          handoverDeliverables: [],
          leadCompany: leadCompanyId || null,
          clientAccount: clientAccountId || null,
          proposalFile: uploaded.id,
        };
        const result = await proposalService.create(payload);
        const createdId = result?.id ?? result?.data?.id;
        setShowSuccess(true);
        setTimeout(() => router.push(createdId ? `/clients/proposals/${createdId}` : '/clients/proposals'), 2000);
      } catch (err) {
        console.error('Error saving uploaded proposal:', err);
        setErrors((prev) => ({ ...prev, submit: err?.message || 'Failed to save proposal. Please try again.' }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...proposalData,
        creationMode: 'BUILDER',
        title: proposalData.proposalTitle || proposalData.projectName || 'Untitled Proposal',
        status: 'DRAFT',
        totalValue: Number(totalValue) || 0,
        modules,
        milestones,
        assumptions,
        securityItems,
        outOfScope,
        handoverDeliverables,
        leadCompany: leadCompanyId || null,
        clientAccount: clientAccountId || null,
      };
      const result = await proposalService.create(payload);
      const createdId = result?.id ?? result?.data?.id;
      setShowSuccess(true);
      setTimeout(() => router.push(createdId ? `/clients/proposals/${createdId}` : '/clients/proposals'), 2000);
    } catch (err) {
      console.error('Error saving proposal:', err);
      setErrors((prev) => ({ ...prev, submit: err?.message || 'Failed to save proposal. Please try again.' }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Options ───────────────────────────────────────────────────────────────────
  const documentTypeOptions = [
    { value: 'SOW', label: 'Statement of Work (SOW)' },
    { value: 'PROPOSAL', label: 'Project Proposal' },
    { value: 'QUOTE', label: 'Project Quote' },
  ];

  const currencyOptions = [
    { value: 'INR', label: '₹ Indian Rupee (INR)' },
    { value: 'USD', label: '$ US Dollar (USD)' },
    { value: 'EUR', label: '€ Euro (EUR)' },
    { value: 'GBP', label: '£ British Pound (GBP)' },
  ];

  const rateUnitOptions = [
    { value: 'per hour', label: 'Per Hour' },
    { value: 'per day', label: 'Per Day' },
    { value: 'per task', label: 'Per Task' },
  ];

  // ── Milestone % total warning ─────────────────────────────────────────────────
  const milestoneTotal = milestones.reduce((s, m) => s + (parseFloat(m.paymentPercent) || 0), 0);

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Proposal Saved!</h2>
          <p className="text-gray-600 mb-4">Your proposal has been created successfully</p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Redirecting to proposals...</p>
        </div>
      </div>
    );
  }

  const previewData = { proposalData, modules, milestones, assumptions, outOfScope, handoverDeliverables, securityItems, totalValue };

  return (
    <div className="min-h-screen bg-white">
      {/* ── Preview Modal ── */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Proposal Preview"
        size="2xl"
        className="max-h-[96vh] flex flex-col"
        contentClassName="flex flex-col flex-1 overflow-hidden !p-0"
      >
        {/* sticky action bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white">
          <p className="text-sm text-gray-500">This is how your proposal will look when downloaded as PDF.</p>
          <Button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white flex items-center gap-2"
          >
            {isDownloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
        {/* scrollable preview area */}
        <div className="flex-1 overflow-y-auto overflow-x-auto bg-gray-100 p-6">
          <div className="shadow-2xl mx-auto" style={{ width: '794px', minWidth: '794px' }}>
            <div ref={previewRef}>
              <ProposalPreviewDocument data={previewData} />
            </div>
          </div>
        </div>
      </Modal>

      <div className="p-4 space-y-6">
        <CRMPageHeader
          title="New Proposal"
          subtitle={
            creationMode === 'upload'
              ? 'Upload an existing PDF proposal and link it to a client'
              : 'Build a professional proposal or statement of work'
          }
          breadcrumb={[
            { label: 'Dashboard', href: '/' },
            { label: 'Clients', href: '/clients' },
            { label: 'Proposals', href: '/clients/proposals' },
            { label: 'New Proposal', href: '/clients/proposals/new' },
          ]}
          showProfile={true}
          showSearch={false}
          showActions={false}
        />

        {/* Builder vs upload toggle */}
        <div className="rounded-2xl border border-gray-200/80 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-700 mb-3">How would you like to add this proposal?</p>
          <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => switchCreationMode('builder')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                creationMode === 'builder'
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Hammer className="w-4 h-4" />
              Build proposal
            </button>
            <button
              type="button"
              onClick={() => switchCreationMode('upload')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                creationMode === 'upload'
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload PDF
            </button>
          </div>
        </div>

        {/* Validation error banner */}
        {Object.keys(errors).length > 0 && (
          <div className="rounded-xl bg-red-50 border-2 border-red-300 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-red-900 font-semibold text-base mb-1">Please fix the following errors:</h4>
                <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
                  {errors.submit && <li>{errors.submit}</li>}
                  {errors.proposalTitle && <li>{errors.proposalTitle}</li>}
                  {errors.clientCompanyName && <li>{errors.clientCompanyName}</li>}
                  {errors.projectName && <li>{errors.projectName}</li>}
                  {errors.clientEmail && <li>{errors.clientEmail}</li>}
                  {errors.modules && <li>{errors.modules}</li>}
                  {errors.pdfFile && <li>{errors.pdfFile}</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Section 1: Proposal Info ── */}
          <FormSectionCard
            icon={FileText}
            title="Proposal Information"
            description="Document type, reference number and dates"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Select
                  label="Document Type"
                  value={proposalData.documentType}
                  onChange={(v) => handleChange('documentType', v)}
                  options={documentTypeOptions}
                  icon={FileText}
                />
              </div>
              <div className="lg:col-span-2">
                <Input
                  label={creationMode === 'upload' ? 'Proposal Title *' : 'Proposal Title'}
                  value={proposalData.proposalTitle}
                  onChange={(e) => handleChange('proposalTitle', e.target.value)}
                  error={errors.proposalTitle}
                  placeholder="e.g. OMIMS — OEM & Inventory Management System"
                  icon={FileText}
                />
              </div>
              <div>
                <Input
                  label="Proposal / Doc Number"
                  value={proposalData.proposalNumber}
                  onChange={(e) => handleChange('proposalNumber', e.target.value)}
                  placeholder="WFS-001"
                />
              </div>
              <div>
                <Input
                  label="Date"
                  type="date"
                  value={proposalData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  icon={Calendar}
                />
              </div>
              <div>
                <Input
                  label="Valid Until"
                  type="date"
                  value={proposalData.validUntil}
                  onChange={(e) => handleChange('validUntil', e.target.value)}
                  icon={Clock}
                />
              </div>
              <div>
                <Select
                  label="Currency"
                  value={proposalData.currency}
                  onChange={(v) => handleChange('currency', v)}
                  options={currencyOptions}
                  icon={IndianRupee}
                />
              </div>
            </div>
          </FormSectionCard>

          {/* ── Section 2: Client Details ── */}
          <FormSectionCard
            icon={Building2}
            title="Client Details (Prepared For)"
            description="Company and contact details of the client"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Select
                  label="Lead Company"
                  value={leadCompanyId}
                  onChange={handleLeadCompanySelect}
                  options={leadCompanyOptions}
                  placeholder="— Select lead company —"
                  icon={Building2}
                  disabled={loadingRefs || Boolean(clientAccountId)}
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Converted leads are hidden — use Client Account for existing clients.
                </p>
              </div>
              <div>
                <Select
                  label="Client Account"
                  value={clientAccountId}
                  onChange={handleClientAccountSelect}
                  options={clientAccountOptions}
                  placeholder="— Select client account —"
                  icon={Building2}
                  disabled={loadingRefs || Boolean(leadCompanyId)}
                />
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                <Input
                  label="Client Company Name *"
                  value={proposalData.clientCompanyName}
                  onChange={(e) => handleChange('clientCompanyName', e.target.value)}
                  error={errors.clientCompanyName}
                  placeholder="Filled from selection; you can edit if needed"
                  icon={Building2}
                />
              </div>
              <div>
                <Input
                  label="Contact Person"
                  value={proposalData.clientContactName}
                  onChange={(e) => handleChange('clientContactName', e.target.value)}
                  placeholder="John Doe"
                  icon={User}
                />
              </div>
              <div>
                <Input
                  label="Client Email *"
                  type="email"
                  value={proposalData.clientEmail}
                  onChange={(e) => handleChange('clientEmail', e.target.value)}
                  error={errors.clientEmail}
                  placeholder="contact@client.com"
                  icon={Mail}
                />
              </div>
              <div>
                <Input
                  label="Client Phone"
                  type="tel"
                  value={proposalData.clientPhone}
                  onChange={(e) => handleChange('clientPhone', e.target.value)}
                  placeholder="+91 98765 43210"
                  icon={Phone}
                />
              </div>
              <div>
                <Input
                  label="Client Address"
                  value={proposalData.clientAddress}
                  onChange={(e) => handleChange('clientAddress', e.target.value)}
                  placeholder="City, State, Country"
                  icon={MapPin}
                />
              </div>
            </div>
          </FormSectionCard>

          {creationMode === 'upload' && (
            <FormSectionCard
              icon={Upload}
              title="Upload Proposal PDF"
              description="Attach your existing proposal document (PDF only, max 25 MB)"
              cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
            >
              <div className="max-w-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proposal file *
                </label>
                <div
                  className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                    errors.pdfFile
                      ? 'border-red-300 bg-red-50/50'
                      : pdfFile
                        ? 'border-orange-300 bg-orange-50/30'
                        : 'border-gray-200 bg-gray-50/50 hover:border-orange-200 hover:bg-orange-50/20'
                  }`}
                >
                  <Upload className="w-10 h-10 text-orange-400 mx-auto mb-3" />
                  {pdfFile ? (
                    <p className="text-sm font-semibold text-gray-900">{pdfFile.name}</p>
                  ) : (
                    <p className="text-sm text-gray-600 mb-1">Drag and drop or click to choose a PDF</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">PDF only</p>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handlePdfFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                {errors.pdfFile && (
                  <p className="mt-2 text-sm text-red-600">{errors.pdfFile}</p>
                )}
              </div>
            </FormSectionCard>
          )}

          {creationMode === 'builder' && (
          <>
          {/* ── Section 3: Prepared By ── */}
          <FormSectionCard
            icon={User}
            title="Prepared By (Your Organization)"
            description={currentOrg ? `Pre-filled from: ${currentOrg.name}` : 'Your company details that appear on the proposal'}
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
              <div>
                <Input
                  label="Company / Organization Name"
                  value={proposalData.preparedByCompany}
                  onChange={(e) => handleChange('preparedByCompany', e.target.value)}
                  icon={Building2}
                />
              </div>
              <div>
                <Input
                  label="Your Name"
                  value={proposalData.preparedByName}
                  onChange={(e) => handleChange('preparedByName', e.target.value)}
                  placeholder="e.g. Abhiraj Maid"
                  icon={User}
                />
              </div>
              <div>
                <Input
                  label="Email"
                  type="email"
                  value={proposalData.preparedByEmail}
                  onChange={(e) => handleChange('preparedByEmail', e.target.value)}
                  icon={Mail}
                />
              </div>
              <div>
                <Input
                  label="Phone"
                  value={proposalData.preparedByPhone}
                  onChange={(e) => handleChange('preparedByPhone', e.target.value)}
                  icon={Phone}
                />
              </div>
            </div>
          </FormSectionCard>

          {/* ── Section 4: Project Info ── */}
          <FormSectionCard
            icon={Target}
            title="Project Information"
            description="Project name and high-level overview"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Input
                  label="Project Name *"
                  value={proposalData.projectName}
                  onChange={(e) => handleChange('projectName', e.target.value)}
                  error={errors.projectName}
                  placeholder="e.g. OMIMS — OEM & Inventory Management System"
                />
              </div>
              <div>
                <Textarea
                  label="Project Overview"
                  value={proposalData.projectOverview}
                  onChange={(e) => handleChange('projectOverview', e.target.value)}
                  placeholder="Describe the project background, business need, and what you propose to build..."
                  rows={5}
                />
              </div>
            </div>
          </FormSectionCard>

          {/* ── Section 5: Scope of Work / Modules ── */}
          <FormSectionCard
            icon={Layers}
            title="Scope of Work — Modules & Deliverables"
            description="Add each deliverable module with its price, features, and acceptance criteria"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >
            {errors.modules && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errors.modules}
              </div>
            )}

            {/* Total value bar */}
            {totalValue > 0 && (
              <div className="mb-5 flex items-center justify-between rounded-xl bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 px-5 py-3">
                <span className="text-sm font-medium text-gray-700">Total Module Value</span>
                <span className="text-xl font-bold text-orange-600">{formatCurrency(totalValue, proposalData.currency)}</span>
              </div>
            )}

            <div className="space-y-5">
              {modules.map((mod, index) => (
                <div key={mod.id} className="relative rounded-xl bg-white border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-orange-600">{index + 1}</span>
                      </div>
                      <span className="font-semibold text-gray-900 text-sm">Module {index + 1}</span>
                      {mod.name && <span className="text-gray-500 text-sm">— {mod.name}</span>}
                    </div>
                    {modules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeModule(mod.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="lg:col-span-2">
                      <Input
                        label="Module Name"
                        value={mod.name}
                        onChange={(e) => updateModule(mod.id, 'name', e.target.value)}
                        placeholder="e.g. OEM & Partner Management"
                      />
                    </div>
                    <div>
                      <Input
                        label="Price"
                        type="number"
                        value={mod.price}
                        onChange={(e) => updateModule(mod.id, 'price', e.target.value)}
                        placeholder="40000"
                        min={0}
                        icon={IndianRupee}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Textarea
                      label="Deliverables & Features"
                      value={mod.deliverables}
                      onChange={(e) => updateModule(mod.id, 'deliverables', e.target.value)}
                      placeholder={"- Feature 1\n- Feature 2\n- Feature 3"}
                      rows={4}
                    />
                    <Textarea
                      label="Acceptance Criteria"
                      value={mod.acceptanceCriteria}
                      onChange={(e) => updateModule(mod.id, 'acceptanceCriteria', e.target.value)}
                      placeholder={"- Criterion 1\n- Criterion 2"}
                      rows={4}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Button
                type="button"
                onClick={addModule}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Module
              </Button>
            </div>
          </FormSectionCard>

          {/* ── Section 6: Timeline & Milestones ── */}
          <FormSectionCard
            icon={Flag}
            title="Timeline & Milestones"
            description="Project timeline and payment milestone schedule"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >
            <div className="mb-5">
              <Input
                label="Estimated Timeline"
                value={proposalData.estimatedTimeline}
                onChange={(e) => handleChange('estimatedTimeline', e.target.value)}
                placeholder="e.g. 8–10 weeks from project kickoff"
                icon={Clock}
              />
            </div>

            {milestoneTotal !== 0 && milestoneTotal !== 100 && (
              <div className="mb-4 flex items-center gap-2 text-sm rounded-lg px-4 py-2 border bg-amber-50 border-amber-200 text-amber-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Milestone payments total {milestoneTotal}% (should sum to 100%)
              </div>
            )}

            <div className="space-y-4">
              {milestones.map((ms, index) => (
                <div key={ms.id} className="rounded-xl bg-white border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-900 text-sm">Milestone {index + 1}</span>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(ms.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label="Milestone Name"
                        value={ms.name}
                        onChange={(e) => updateMilestone(ms.id, 'name', e.target.value)}
                        placeholder="e.g. Kickoff & Design Sign-off"
                      />
                    </div>
                    <div>
                      <Input
                        label="Payment %"
                        type="number"
                        value={ms.paymentPercent}
                        onChange={(e) => updateMilestone(ms.id, 'paymentPercent', e.target.value)}
                        placeholder="50"
                        min={0}
                        max={100}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Input
                        label="Description"
                        value={ms.description}
                        onChange={(e) => updateMilestone(ms.id, 'description', e.target.value)}
                        placeholder="What gets delivered at this milestone?"
                      />
                    </div>
                  </div>
                  {ms.paymentPercent && totalValue > 0 && (
                    <div className="mt-2 text-right text-sm text-orange-600 font-semibold">
                      = {formatCurrency((totalValue * parseFloat(ms.paymentPercent)) / 100, proposalData.currency)}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button
                type="button"
                onClick={addMilestone}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Milestone
              </Button>
            </div>
          </FormSectionCard>

          {/* ── Section 7: Change Control & Billing ── */}
          <FormSectionCard
            icon={DollarSign}
            title="Billing & Change Control"
            description="Out-of-scope rates, payment terms, and tax details"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Input
                  label="Out-of-Scope Rate"
                  type="number"
                  value={proposalData.outOfScopeRate}
                  onChange={(e) => handleChange('outOfScopeRate', e.target.value)}
                  placeholder="2500"
                  icon={IndianRupee}
                />
              </div>
              <div>
                <Select
                  label="Rate Unit"
                  value={proposalData.outOfScopeRateUnit}
                  onChange={(v) => handleChange('outOfScopeRateUnit', v)}
                  options={rateUnitOptions}
                />
              </div>
              <div>
                <Input
                  label="Warranty Period (days)"
                  type="number"
                  value={proposalData.warrantyDays}
                  onChange={(e) => handleChange('warrantyDays', e.target.value)}
                  placeholder="30"
                  min={0}
                />
              </div>
              <div className="lg:col-span-3">
                <Input
                  label="Payment Terms"
                  value={proposalData.paymentTerms}
                  onChange={(e) => handleChange('paymentTerms', e.target.value)}
                  placeholder="e.g. Net 15 days, advance + milestone-based"
                />
              </div>
              <div className="lg:col-span-3">
                <Input
                  label="Tax / GST Info"
                  value={proposalData.taxInfo}
                  onChange={(e) => handleChange('taxInfo', e.target.value)}
                  placeholder="e.g. 18% GST applicable on all invoices"
                />
              </div>
            </div>
          </FormSectionCard>

          {/* ── Section 8: Assumptions ── */}
          <FormSectionCard
            icon={Info}
            title="Assumptions"
            description="List the assumptions made while scoping this proposal"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >
            <DynamicList
              items={assumptions}
              onChange={setAssumptions}
              placeholder="e.g. Client will provide API access within the first week"
            />
          </FormSectionCard>

          {/* ── Section 9: Security & Compliance ── */}
          <FormSectionCard
            icon={Shield}
            title="Security & Compliance"
            description="Security standards and compliance items included in the engagement"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >
            <DynamicList
              items={securityItems}
              onChange={setSecurityItems}
              placeholder="e.g. HTTPS/TLS for all endpoints"
            />
          </FormSectionCard>

          {/* ── Section 10: Deliverables at Handover ── */}
          <FormSectionCard
            icon={Package}
            title="Deliverables at Handover"
            description="What gets handed over to the client at project completion"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >
            <DynamicList
              items={handoverDeliverables}
              onChange={setHandoverDeliverables}
              placeholder="e.g. Production-deployed platform"
            />
          </FormSectionCard>

          {/* ── Section 11: Out of Scope ── */}
          <FormSectionCard
            icon={ListChecks}
            title="Out of Scope"
            description="Explicitly list what is NOT included in this engagement"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >
            <DynamicList
              items={outOfScope}
              onChange={setOutOfScope}
              placeholder="e.g. Third-party integrations not listed above"
            />
          </FormSectionCard>

          {/* ── Section 12: Acceptance Notes ── */}
          <FormSectionCard
            icon={BookOpen}
            title="Acceptance & Next Steps"
            description="Custom acceptance notes (leave blank to use default)"
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
          >
            <Textarea
              label="Acceptance Notes (optional)"
              value={proposalData.acceptanceNotes}
              onChange={(e) => handleChange('acceptanceNotes', e.target.value)}
              placeholder={"To proceed:\n1. Approve this SOW via email or signature\n2. Release the first milestone payment\n3. Share integration details"}
              rows={4}
            />
          </FormSectionCard>
          </>
          )}

          {/* ── Action Buttons ── */}
          <div className="flex items-center justify-between pt-6">
            <Button
              type="button"
              onClick={() => router.back()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              {creationMode === 'builder' && (
                <Button
                  type="button"
                  onClick={handlePreview}
                  variant="outline"
                  className="flex items-center gap-2 border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  <Eye className="w-4 h-4" />
                  Preview Proposal
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white flex items-center gap-2 min-w-[160px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    {creationMode === 'upload' ? (
                      <Upload className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    {creationMode === 'upload' ? 'Save uploaded proposal' : 'Save Proposal'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
