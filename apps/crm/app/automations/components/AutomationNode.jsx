'use client';

import { useState, useRef, useCallback, memo } from 'react';
import {
  Users, Briefcase, Calendar, UserPlus, Receipt,
  Mail, CheckSquare, TrendingUp, UserCheck, MessageSquare,
  GitBranch, Clock, Plug, Zap, Circle,
} from 'lucide-react';
import { MoreHorizontal, Copy, Trash2, Settings } from 'lucide-react';
import { NodeHandle } from '@webfudge/ui';
import { NODE_TYPE_COLORS } from '../utils/nodeTypes';

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP = {
  Users, Briefcase, Calendar, UserPlus, Receipt,
  Mail, CheckSquare, TrendingUp, UserCheck, MessageSquare,
  GitBranch, Clock, Plug, Zap, Circle,
};

function NodeIcon({ name, className }) {
  const Icon = ICON_MAP[name] || Circle;
  return <Icon className={className} />;
}

// ─── AutomationNode ───────────────────────────────────────────────────────────

function AutomationNode({
  node,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onDragStart,
  onDragEnd,
  onHandleMouseDown,
  connectingFromHandle,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const nodeRef = useRef(null);
  const colors = NODE_TYPE_COLORS[node.type] || NODE_TYPE_COLORS.action;

  const handleMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      onSelect(node.id);
      onDragStart(e, node.id);
    },
    [node.id, onSelect, onDragStart]
  );

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setMenuOpen((v) => !v);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onDelete(node.id);
  };

  const handleDuplicate = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onDuplicate(node.id);
  };

  const isStart = node.isStart;
  const isCondition = node.type === 'condition';

  return (
    <div
      ref={nodeRef}
      className="absolute select-none"
      style={{ left: node.position.x, top: node.position.y, zIndex: isSelected ? 20 : 10 }}
      onMouseDown={handleMouseDown}
    >
      {/* Input handle (top) — all nodes except start */}
      {!isStart && (
        <NodeHandle
          type="input"
          position="top"
          onMouseDown={(e) => {
            e.stopPropagation();
            onHandleMouseDown?.(e, node.id, 'input');
          }}
          data-handle-id={`${node.id}__input`}
        />
      )}

      {/* Node card */}
      <div
        className={[
          'w-52 rounded-xl border-2 transition-all duration-150 cursor-grab active:cursor-grabbing shadow-md',
          colors.bg,
          isSelected ? `border-orange-500 shadow-lg ring-2 ${colors.ring} ring-offset-2` : colors.border,
          connectingFromHandle ? 'hover:border-orange-400' : '',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Category dot */}
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
            {/* Type badge */}
            <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${colors.badge}`}>
              {node.type}
            </span>
          </div>

          {!isStart && (
            <div className="relative">
              <button
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-black/10 transition-colors text-gray-500"
                onClick={handleMenuClick}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-7 z-50 w-36 bg-white rounded-xl border border-gray-200 shadow-xl py-1 text-sm"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <button
                    className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                    onClick={handleDuplicate}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Duplicate
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onSelect(node.id); }}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Configure
                  </button>
                  <div className="my-1 border-t border-gray-100" />
                  <button
                    className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-red-50 text-red-600"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.badge}`}>
              <NodeIcon name={node.iconName} className={`w-4 h-4 ${colors.icon}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
                {node.label}
              </p>
              {node.description && (
                <p className="text-[11px] text-gray-500 leading-tight truncate mt-0.5">
                  {node.description}
                </p>
              )}
            </div>
          </div>

          {/* Config preview */}
          {node.config && Object.keys(node.config).length > 0 && !isStart && (
            <div className="mt-2 pt-2 border-t border-black/5">
              {Object.entries(node.config)
                .filter(([, v]) => v !== '' && v != null)
                .slice(0, 2)
                .map(([k, v]) => (
                  <p key={k} className="text-[10px] text-gray-500 truncate">
                    <span className="font-medium text-gray-600">{k}:</span> {String(v)}
                  </p>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Output handle(s) — bottom */}
      {!isCondition && (
        <NodeHandle
          type="output"
          position="bottom"
          onMouseDown={(e) => {
            e.stopPropagation();
            onHandleMouseDown?.(e, node.id, 'output');
          }}
          data-handle-id={`${node.id}__output`}
        />
      )}

      {/* Condition: TRUE (left) + FALSE (right) */}
      {isCondition && (
        <>
          <NodeHandle
            type="output-true"
            position="bottom-left"
            label="True"
            onMouseDown={(e) => {
              e.stopPropagation();
              onHandleMouseDown?.(e, node.id, 'output-true');
            }}
            data-handle-id={`${node.id}__output-true`}
          />
          <NodeHandle
            type="output-false"
            position="bottom-right"
            label="False"
            onMouseDown={(e) => {
              e.stopPropagation();
              onHandleMouseDown?.(e, node.id, 'output-false');
            }}
            data-handle-id={`${node.id}__output-false`}
          />
        </>
      )}
    </div>
  );
}

export default memo(AutomationNode);
