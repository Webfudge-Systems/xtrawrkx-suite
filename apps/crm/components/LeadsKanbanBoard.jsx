'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { GripVertical, TrendingUp } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { primaryContactForLeadCompany } from '../lib/leadCompanyContacts';

/** Strapi lead-company.status keys — use for tab filters and kanban columns. */
export const LEAD_PIPELINE_STAGES = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'lost', label: 'Lost' },
  { key: 'converted', label: 'Converted' },
  { key: 'client', label: 'Client' },
];

const STAGE_STYLES = {
  new: {
    header: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    dropActive: 'border-blue-400 bg-blue-50/80 shadow-lg shadow-blue-100',
  },
  contacted: {
    header: 'bg-violet-50 border-violet-200',
    text: 'text-violet-700',
    badge: 'bg-violet-100 text-violet-700',
    dropActive: 'border-violet-400 bg-violet-50/80 shadow-lg shadow-violet-100',
  },
  qualified: {
    header: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
    dropActive: 'border-emerald-400 bg-emerald-50/80 shadow-lg shadow-emerald-100',
  },
  lost: {
    header: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
    dropActive: 'border-red-400 bg-red-50/80 shadow-lg shadow-red-100',
  },
  converted: {
    header: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    dropActive: 'border-amber-400 bg-amber-50/80 shadow-lg shadow-amber-100',
  },
  client: {
    header: 'bg-orange-50 border-orange-200',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-700',
    dropActive: 'border-orange-400 bg-orange-50/80 shadow-lg shadow-orange-100',
  },
};

function formatINR(v) {
  if (v == null || Number.isNaN(Number(v))) return null;
  return '₹' + Number(v).toLocaleString('en-IN');
}

function assigneeName(company) {
  const u = company?.assignedTo;
  if (!u) return null;
  return (
    u.username ||
    [u.firstName, u.lastName].filter(Boolean).join(' ').trim() ||
    u.email ||
    null
  );
}

function LeadCardInner({ company, getLeadHref }) {
  const { name: contactName } = primaryContactForLeadCompany(company);
  const value = formatINR(company.dealValue);
  const href = getLeadHref ? getLeadHref(String(company.id)) : null;
  const owner = assigneeName(company);

  const titleNode = href ? (
    <Link
      href={href}
      onPointerDown={(e) => e.stopPropagation()}
      className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-gray-900 hover:text-orange-600"
    >
      {company.companyName || 'Unnamed company'}
    </Link>
  ) : (
    <p className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-gray-900">
      {company.companyName || 'Unnamed company'}
    </p>
  );

  return (
    <>
      <div className="flex items-start justify-between gap-1">
        {titleNode}
        <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {contactName ? <p className="mt-0.5 truncate text-xs text-gray-500">{contactName}</p> : null}

      {value ? <p className="mt-2 text-sm font-bold text-gray-800">{value}</p> : null}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {company.source ? (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600">
            {String(company.source).replace(/_/g, ' ')}
          </span>
        ) : null}
        {owner ? (
          <span className="truncate rounded-full bg-orange-50 px-2 py-0.5 text-[10px] text-orange-700">
            {owner}
          </span>
        ) : null}
      </div>
    </>
  );
}

function LeadCard({ company, overlay = false, getLeadHref, canMoveLead }) {
  const canMove = canMoveLead ? canMoveLead(company) : true;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(company.id),
    disabled: !canMove,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...(canMove ? listeners : {})}
      className={[
        'group relative rounded-xl border bg-white p-3.5 transition-all',
        canMove ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
        isDragging
          ? 'opacity-25 shadow-none'
          : 'border-gray-200 shadow-sm hover:border-orange-200 hover:shadow-md',
        overlay ? 'rotate-1 border-orange-300 shadow-2xl ring-2 ring-orange-400/30 !opacity-100' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <LeadCardInner company={company} getLeadHref={getLeadHref} />
    </div>
  );
}

function StatusColumn({ stageKey, label, companies, isOver, getLeadHref, canMoveLead }) {
  const { setNodeRef } = useDroppable({ id: stageKey });
  const style = STAGE_STYLES[stageKey] || STAGE_STYLES.new;
  const totalValue = companies.reduce((sum, c) => sum + (Number(c.dealValue) || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={[
        'flex min-h-[420px] min-w-[272px] max-w-[300px] flex-shrink-0 flex-col rounded-2xl border transition-all duration-150',
        isOver ? style.dropActive : 'border-gray-200 bg-gray-50/60',
      ].join(' ')}
    >
      <div className={`flex items-center justify-between rounded-t-2xl border-b px-4 py-3 ${style.header}`}>
        <div className="flex items-center gap-2">
          <h3 className={`text-[11px] font-extrabold uppercase tracking-widest ${style.text}`}>{label}</h3>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${style.badge}`}>{companies.length}</span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3">
        {companies.length === 0 ? (
          <div
            className={`flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition-colors ${
              isOver ? 'border-current bg-white/80' : 'border-gray-200 bg-white/40'
            }`}
          >
            <p className="text-[11px] text-gray-400">{isOver ? 'Release to move here' : 'No leads'}</p>
          </div>
        ) : (
          companies.map((c) => (
            <LeadCard key={c.id} company={c} getLeadHref={getLeadHref} canMoveLead={canMoveLead} />
          ))
        )}
      </div>

      {totalValue > 0 ? (
        <div className="flex items-center gap-1.5 border-t border-gray-200 px-4 py-2.5">
          <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
          <p className="text-xs font-semibold text-gray-500">{formatINR(totalValue)}</p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * CRM lead pipeline board — columns from `statusColumns`; drag calls `onMoveLead`.
 */
export function LeadsKanbanBoard({ statusColumns, leadsLookup, onMoveLead, getLeadHref, canMoveLead }) {
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const activeLead = useMemo(() => {
    if (!activeId || !leadsLookup?.length) return null;
    return leadsLookup.find((c) => String(c.id) === activeId) ?? null;
  }, [activeId, leadsLookup]);

  const handleDragStart = useCallback(({ active }) => {
    setActiveId(String(active.id));
  }, []);

  const handleDragOver = useCallback(({ over }) => {
    setOverId(over?.id ?? null);
  }, []);

  const handleDragEnd = useCallback(
    async ({ active, over }) => {
      setActiveId(null);
      setOverId(null);
      if (!over) return;
      const leadId = String(active.id);
      const newStatus = String(over.id);
      const lead = leadsLookup.find((c) => String(c.id) === leadId);
      if (!lead) return;
      if (canMoveLead && !canMoveLead(lead)) return;
      const oldStatus = (lead.status || 'new').toLowerCase();
      if (oldStatus === newStatus) return;
      await onMoveLead(leadId, newStatus, lead);
    },
    [canMoveLead, leadsLookup, onMoveLead]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto p-4 pb-5 md:p-5">
        {statusColumns.map(({ key, label, companies }) => (
          <StatusColumn
            key={key}
            stageKey={key}
            label={label}
            companies={companies}
            isOver={overId === key}
            getLeadHref={getLeadHref}
            canMoveLead={canMoveLead}
          />
        ))}
        {statusColumns.length === 0 ? (
          <div className="flex min-h-[360px] min-w-full items-center justify-center rounded-2xl border border-dashed border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-500">No leads match your filters.</p>
          </div>
        ) : null}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
        {activeLead ? (
          <div className="w-[272px] rotate-1 rounded-xl border border-orange-300 bg-white p-3.5 shadow-2xl ring-2 ring-orange-400/30">
            <LeadCardInner company={activeLead} getLeadHref={getLeadHref} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
