'use client';

import { useCallback, useMemo, useState } from 'react';
import { ChevronDown, Users } from 'lucide-react';
import { Avatar, Table } from '@webfudge/ui';

const UNASSIGNED_KEY = '__unassigned__';

export function userDisplayName(user) {
  if (!user || typeof user !== 'object') return 'Unknown user';
  return (
    user.username ||
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.email ||
    `User ${user.id ?? user.documentId ?? ''}`.trim()
  );
}

function userKey(user) {
  if (!user || typeof user !== 'object') return null;
  const id = user.id ?? user.documentId;
  return id != null ? String(id) : null;
}

function assigneeKeyForLead(lead) {
  const assigned = lead?.assignedTo;
  if (assigned == null) return UNASSIGNED_KEY;
  if (typeof assigned === 'object') {
    const id = assigned.id ?? assigned.documentId;
    return id != null ? String(id) : UNASSIGNED_KEY;
  }
  return String(assigned);
}

/**
 * Build member sections: all org users (even with 0 leads) + optional Unassigned bucket.
 * @param {object[]} leads
 * @param {object[]} orgUsers
 */
export function buildLeadsByMemberSections(leads, orgUsers) {
  const sections = new Map();

  (orgUsers || []).forEach((user) => {
    const key = userKey(user);
    if (!key) return;
    sections.set(key, {
      key,
      label: userDisplayName(user),
      user,
      leads: [],
    });
  });

  const unassigned = [];

  (leads || []).forEach((lead) => {
    const key = assigneeKeyForLead(lead);
    if (key === UNASSIGNED_KEY) {
      unassigned.push(lead);
      return;
    }
    if (!sections.has(key)) {
      const assigned = lead.assignedTo;
      sections.set(key, {
        key,
        label: typeof assigned === 'object' ? userDisplayName(assigned) : `User ${key}`,
        user: typeof assigned === 'object' ? assigned : null,
        leads: [],
      });
    }
    sections.get(key).leads.push(lead);
  });

  const sorted = Array.from(sections.values()).sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  );

  if (unassigned.length > 0) {
    sorted.push({
      key: UNASSIGNED_KEY,
      label: 'Unassigned',
      user: null,
      leads: unassigned,
    });
  }

  return sorted;
}

function MemberSectionHeader({ section, expanded, onToggle }) {
  const initials =
    section.user?.firstName?.[0] ||
    section.user?.username?.[0] ||
    section.user?.email?.[0] ||
    (section.key === UNASSIGNED_KEY ? '?' : 'U');

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white px-4 py-3 text-left transition hover:border-orange-200 hover:from-orange-50/40 hover:to-white"
    >
      <Avatar
        fallback={initials}
        alt={section.label}
        size="sm"
        className="flex-shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{section.label}</p>
        <p className="text-xs text-gray-500">
          {section.leads.length} lead{section.leads.length === 1 ? '' : 's'}
        </p>
      </div>
      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700">
        {section.leads.length}
      </span>
      <ChevronDown
        className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-200 ${
          expanded ? 'rotate-180' : ''
        }`}
        aria-hidden
      />
    </button>
  );
}

/**
 * Leads grouped by team member — collapsible table per user (managers/admins).
 */
export function LeadsByMembersView({
  leads,
  orgUsers,
  columns,
  onRowClick,
  emptyMessage,
  tableResizeProps = {},
}) {
  const sections = useMemo(() => buildLeadsByMemberSections(leads, orgUsers), [leads, orgUsers]);
  const [collapsedKeys, setCollapsedKeys] = useState(() => new Set());

  const toggleSection = useCallback((key) => {
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  if (!sections.length) {
    return (
      <div className="p-12 text-center">
        <Users className="mx-auto mb-3 h-12 w-12 text-gray-400 opacity-50" />
        <h3 className="mb-2 text-lg font-semibold text-gray-700">No team members found</h3>
        <p className="text-sm text-gray-500">{emptyMessage || 'No users are available to group leads by.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-5">
      {sections.map((section) => {
        const expanded = !collapsedKeys.has(section.key);
        return (
          <section key={section.key} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-3">
              <MemberSectionHeader
                section={section}
                expanded={expanded}
                onToggle={() => toggleSection(section.key)}
              />
            </div>
            {expanded ? (
              section.leads.length > 0 ? (
                <Table
                  columns={columns}
                  data={section.leads}
                  keyField="id"
                  variant="modernEmbedded"
                  onRowClick={onRowClick}
                  getRowClassName={() => 'group'}
                  {...tableResizeProps}
                />
              ) : (
                <div className="border-t border-gray-100 px-4 py-8 text-center text-sm text-gray-500">
                  No leads assigned to this member
                </div>
              )
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
