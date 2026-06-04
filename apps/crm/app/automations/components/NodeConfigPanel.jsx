'use client';

import { memo, useCallback } from 'react';
import {
  Users, Briefcase, Calendar, UserPlus, Receipt,
  Mail, CheckSquare, TrendingUp, UserCheck, MessageSquare,
  GitBranch, Clock, Plug, Zap, Circle, Settings2, X,
} from 'lucide-react';
import { Input, Select, Textarea } from '@webfudge/ui';
import { NODE_TYPE_MAP, NODE_TYPE_COLORS } from '../utils/nodeTypes';

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

// ─── Field renderers ──────────────────────────────────────────────────────────

function TextField({ field, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <Input
        value={value ?? ''}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={field.placeholder || ''}
        className="text-sm"
      />
    </div>
  );
}

function NumberField({ field, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <Input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={field.placeholder || ''}
        className="text-sm"
      />
    </div>
  );
}

function SelectField({ field, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <Select
        value={value ?? ''}
        onChange={(e) => onChange(field.key, e.target.value)}
        className="text-sm"
      >
        {field.placeholder && (
          <option value="" disabled>{field.placeholder}</option>
        )}
        {(field.options || []).map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </Select>
    </div>
  );
}

function TextareaField({ field, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <Textarea
        value={value ?? ''}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={field.placeholder || ''}
        rows={3}
        className="text-sm"
      />
    </div>
  );
}

function UserField({ field, value, onChange }) {
  // Placeholder for a user picker; shows a text input for now
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <Input
        value={value ?? ''}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={field.placeholder || 'Enter user email or name'}
        className="text-sm"
      />
      <p className="text-[10px] text-gray-400 mt-1">User picker coming soon</p>
    </div>
  );
}

function ConfigField({ field, value, onChange }) {
  switch (field.type) {
    case 'select': return <SelectField field={field} value={value} onChange={onChange} />;
    case 'textarea': return <TextareaField field={field} value={value} onChange={onChange} />;
    case 'number': return <NumberField field={field} value={value} onChange={onChange} />;
    case 'user': return <UserField field={field} value={value} onChange={onChange} />;
    default: return <TextField field={field} value={value} onChange={onChange} />;
  }
}

// ─── NodeConfigPanel ──────────────────────────────────────────────────────────

function NodeConfigPanel({ selectedNode, onUpdateConfig, onClose }) {
  const typeDef = selectedNode ? NODE_TYPE_MAP[selectedNode.typeId] : null;
  const colors = selectedNode ? NODE_TYPE_COLORS[selectedNode.type] || NODE_TYPE_COLORS.action : null;

  const handleChange = useCallback(
    (key, value) => {
      if (!selectedNode) return;
      onUpdateConfig(selectedNode.id, { [key]: value });
    },
    [selectedNode, onUpdateConfig]
  );

  // Empty state
  if (!selectedNode) {
    return (
      <div className="flex flex-col h-full bg-white border-l border-gray-200">
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Configuration</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-3">
            <Settings2 className="w-5 h-5 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-400">No node selected</p>
          <p className="text-xs text-gray-300 mt-1">Click a node on the canvas to configure it</p>
        </div>
      </div>
    );
  }

  const configSchema = typeDef?.configSchema || [];
  const isStart = selectedNode.isStart;

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Configuration</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors text-gray-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Node identity */}
      <div className={`mx-4 mt-4 p-3 rounded-xl border ${colors.border} ${colors.bg}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.badge}`}>
            <NodeIcon name={selectedNode.iconName} className={`w-4 h-4 ${colors.icon}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{selectedNode.label}</p>
            <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${colors.badge}`}>
              {selectedNode.type}
            </span>
          </div>
        </div>
        {selectedNode.description && (
          <p className="text-xs text-gray-500 mt-2">{selectedNode.description}</p>
        )}
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isStart ? (
          <div className="text-center py-6">
            <p className="text-xs text-gray-400">
              Select a trigger node type from the library to configure this node.
            </p>
          </div>
        ) : configSchema.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-gray-400">
              This node has no configurable fields.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {configSchema.map((field) => (
              <ConfigField
                key={field.key}
                field={field}
                value={selectedNode.config?.[field.key]}
                onChange={handleChange}
              />
            ))}
          </div>
        )}

        {/* Variable reference hint */}
        {configSchema.length > 0 && !isStart && (
          <div className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-[10px] font-semibold text-blue-600 mb-1">Variable syntax</p>
            <p className="text-[10px] text-blue-500 leading-relaxed">
              Use <code className="bg-blue-100 px-1 rounded">{'{{lead.name}}'}</code> or{' '}
              <code className="bg-blue-100 px-1 rounded">{'{{deal.stage}}'}</code> to insert dynamic values from your CRM records.
            </p>
          </div>
        )}

        {/* Future: Execution logs placeholder */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded-xl opacity-60">
          <p className="text-[10px] font-semibold text-gray-500 mb-0.5">Execution history</p>
          <p className="text-[10px] text-gray-400">Coming soon — per-node run logs</p>
        </div>
      </div>
    </div>
  );
}

export default memo(NodeConfigPanel);
