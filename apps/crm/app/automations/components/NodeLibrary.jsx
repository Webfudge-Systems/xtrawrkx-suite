'use client';

import { useState, memo } from 'react';
import {
  Users, Briefcase, Calendar, UserPlus, Receipt,
  Mail, CheckSquare, TrendingUp, UserCheck, MessageSquare,
  GitBranch, Clock, Plug, Zap, Circle, Search, ChevronDown, ChevronRight,
} from 'lucide-react';
import { NODE_CATEGORIES, NODE_TYPE_COLORS } from '../utils/nodeTypes';

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

// ─── Library item (draggable) ─────────────────────────────────────────────────

const LibraryItem = memo(function LibraryItem({ node }) {
  const colors = NODE_TYPE_COLORS[node.type] || NODE_TYPE_COLORS.action;

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/automation-node-type', node.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={[
        'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-grab active:cursor-grabbing',
        'transition-all duration-150 hover:shadow-sm group',
        colors.bg,
        colors.border,
      ].join(' ')}
    >
      <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${colors.badge}`}>
        <NodeIcon name={node.iconName} className={`w-3.5 h-3.5 ${colors.icon}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-800 leading-tight truncate">
          {node.label}
        </p>
        <p className="text-[10px] text-gray-500 leading-tight truncate mt-0.5">
          {node.description}
        </p>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </div>
    </div>
  );
});

// ─── Category section ─────────────────────────────────────────────────────────

const CategorySection = memo(function CategorySection({ category, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        className="flex items-center justify-between w-full px-1 py-1.5 text-left group"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            {category.label}
          </span>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
            {category.nodes.length}
          </span>
        </div>
        {open
          ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        }
      </button>

      {open && (
        <div className="space-y-1.5 mt-1 pb-2">
          {category.nodes.map((node) => (
            <LibraryItem key={node.id} node={node} />
          ))}
        </div>
      )}
    </div>
  );
});

// ─── NodeLibrary panel ────────────────────────────────────────────────────────

function NodeLibrary() {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? NODE_CATEGORIES.map((cat) => ({
        ...cat,
        nodes: cat.nodes.filter(
          (n) =>
            n.label.toLowerCase().includes(search.toLowerCase()) ||
            n.description.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter((cat) => cat.nodes.length > 0)
    : NODE_CATEGORIES;

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Node Library</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes…"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Hint */}
      <div className="px-4 py-2 bg-orange-50 border-b border-orange-100">
        <p className="text-[10px] text-orange-600 font-medium">
          Drag nodes onto the canvas to build your workflow
        </p>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-gray-400">No nodes match your search</p>
          </div>
        ) : (
          filtered.map((cat, idx) => (
            <CategorySection key={cat.id} category={cat} defaultOpen={idx === 0} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 text-center">
          {NODE_CATEGORIES.reduce((sum, c) => sum + c.nodes.length, 0)} node types available
        </p>
      </div>
    </div>
  );
}

export default memo(NodeLibrary);
