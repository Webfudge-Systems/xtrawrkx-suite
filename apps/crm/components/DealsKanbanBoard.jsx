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

/** Strapi deal.stage keys — use for tab filters and kanban columns. */
export const DEAL_PIPELINE_STAGES = [
  { key: 'discovery', label: 'Discovery' },
  { key: 'prospect', label: 'Prospect' },
  { key: 'proposal', label: 'Proposal' },
  { key: 'negotiation', label: 'Negotiation' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
];

const STAGE_STYLES = {
  discovery: {
    header: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    dropActive: 'border-blue-400 bg-blue-50/80 shadow-lg shadow-blue-100',
  },
  prospect: {
    header: 'bg-violet-50 border-violet-200',
    text: 'text-violet-700',
    badge: 'bg-violet-100 text-violet-700',
    dropActive: 'border-violet-400 bg-violet-50/80 shadow-lg shadow-violet-100',
  },
  proposal: {
    header: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    dropActive: 'border-amber-400 bg-amber-50/80 shadow-lg shadow-amber-100',
  },
  negotiation: {
    header: 'bg-orange-50 border-orange-200',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-700',
    dropActive: 'border-orange-400 bg-orange-50/80 shadow-lg shadow-orange-100',
  },
  won: {
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
};

const PRIORITY_PILL = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-500',
};

function formatINR(v) {
  if (v == null || Number.isNaN(Number(v))) return null;
  return '₹' + Number(v).toLocaleString('en-IN');
}

function dealCompany(d) {
  return (
    d?.leadCompany?.companyName ||
    d?.leadCompany?.name ||
    d?.clientAccount?.companyName ||
    d?.clientAccount?.name ||
    null
  );
}

function DealCardInner({ deal, getDealHref }) {
  const company = dealCompany(deal);
  const value = formatINR(deal.value);
  const href = getDealHref ? getDealHref(String(deal.id)) : null;

  const titleNode = href ? (
    <Link
      href={href}
      onPointerDown={(e) => e.stopPropagation()}
      className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-gray-900 hover:text-orange-600"
    >
      {deal.name || 'Unnamed deal'}
    </Link>
  ) : (
    <p className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-gray-900">{deal.name || 'Unnamed deal'}</p>
  );

  return (
    <>
      <div className="flex items-start justify-between gap-1">
        {titleNode}
        <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {company ? <p className="mt-0.5 truncate text-xs text-gray-500">{company}</p> : null}

      {value ? <p className="mt-2 text-sm font-bold text-gray-800">{value}</p> : null}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {deal.priority ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              PRIORITY_PILL[deal.priority] || 'bg-gray-100 text-gray-500'
            }`}
          >
            {deal.priority}
          </span>
        ) : null}
        {deal.expectedCloseDate ? (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
            {new Date(deal.expectedCloseDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
            })}
          </span>
        ) : null}
      </div>

      {deal.probability != null ? (
        <div className="mt-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-400">Win probability</p>
            <p className="text-[10px] font-semibold text-gray-500">{deal.probability}%</p>
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-400 transition-all"
              style={{ width: `${Math.min(100, deal.probability)}%` }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function DealCard({ deal, overlay = false, getDealHref, canMoveDeal }) {
  const canMove = canMoveDeal ? canMoveDeal(deal) : true;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(deal.id),
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
      <DealCardInner deal={deal} getDealHref={getDealHref} />
    </div>
  );
}

function StageColumn({ stageKey, label, deals, isOver, getDealHref, canMoveDeal }) {
  const { setNodeRef } = useDroppable({ id: stageKey });
  const style = STAGE_STYLES[stageKey] || STAGE_STYLES.discovery;
  const totalValue = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

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
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${style.badge}`}>{deals.length}</span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3">
        {deals.length === 0 ? (
          <div
            className={`flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition-colors ${
              isOver ? 'border-current bg-white/80' : 'border-gray-200 bg-white/40'
            }`}
          >
            <p className="text-[11px] text-gray-400">{isOver ? 'Release to move here' : 'No deals'}</p>
          </div>
        ) : (
          deals.map((d) => <DealCard key={d.id} deal={d} getDealHref={getDealHref} canMoveDeal={canMoveDeal} />)
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
 * CRM deal pipeline board — columns from `stageColumns`; drag calls `onMoveDeal`.
 * @param {Array<{key: string, label: string, deals: object[]}>} stageColumns
 * @param {object[]} dealsLookup — full list to resolve dragged deal + overlay (e.g. all deals from API)
 * @param {(dealId: string, newStage: string) => void | Promise<void>} onMoveDeal
 * @param {(dealId: string) => string | undefined} [getDealHref] — if set, deal title links (pointer events don’t start drag)
 * @param {(deal: object) => boolean} [canMoveDeal] — if set, disables drag for records the user cannot edit
 */
export function DealsKanbanBoard({ stageColumns, dealsLookup, onMoveDeal, getDealHref, canMoveDeal }) {
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const activeDeal = useMemo(() => {
    if (!activeId || !dealsLookup?.length) return null;
    return dealsLookup.find((d) => String(d.id) === activeId) ?? null;
  }, [activeId, dealsLookup]);

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
      const dealId = String(active.id);
      const newStage = String(over.id);
      const deal = dealsLookup.find((d) => String(d.id) === dealId);
      if (!deal) return;
      if (canMoveDeal && !canMoveDeal(deal)) return;
      const oldStage = (deal.stage || 'discovery').toLowerCase();
      if (oldStage === newStage) return;
      await onMoveDeal(dealId, newStage, deal);
    },
    [canMoveDeal, dealsLookup, onMoveDeal]
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
        {stageColumns.map(({ key, label, deals }) => (
          <StageColumn
            key={key}
            stageKey={key}
            label={label}
            deals={deals}
            isOver={overId === key}
            getDealHref={getDealHref}
            canMoveDeal={canMoveDeal}
          />
        ))}
        {stageColumns.length === 0 ? (
          <div className="flex min-h-[360px] min-w-full items-center justify-center rounded-2xl border border-dashed border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-500">No deals match your filters.</p>
          </div>
        ) : null}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
        {activeDeal ? (
          <div className="w-[272px] rotate-1 rounded-xl border border-orange-300 bg-white p-3.5 shadow-2xl ring-2 ring-orange-400/30">
            <DealCardInner deal={activeDeal} getDealHref={getDealHref} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
