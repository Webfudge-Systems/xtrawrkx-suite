'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Building2,
  Briefcase,
  User,
  Users,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { LoadingSpinner, WorkspaceSearchModal } from '@webfudge/ui';
import globalSearchService from '../lib/api/globalSearchService';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getIcon(type) {
  switch (type) {
    case 'lead':    return Building2;
    case 'deal':    return Briefcase;
    case 'contact': return User;
    case 'client':  return Users;
    default:        return FileText;
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SearchEmpty({ icon: Icon, title, description }) {
  return (
    <div className="px-6 py-12 text-center">
      <Icon className="mx-auto mb-4 h-10 w-10 text-gray-300" strokeWidth={1.25} aria-hidden />
      <p className="text-base font-semibold text-slate-900">{title}</p>
      {description ? <p className="mt-1.5 text-sm text-gray-500">{description}</p> : null}
    </div>
  );
}

function SearchSection({ title, icon: Icon, children, hasBorder = false }) {
  return (
    <section className={`py-2 ${hasBorder ? 'border-t border-gray-200/80' : ''}`.trim()}>
      <div className="flex items-center gap-2 px-5 py-2">
        {Icon && <Icon className="h-4 w-4 text-orange-500" aria-hidden />}
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{title}</p>
      </div>
      <div className="space-y-0.5 px-2">{children}</div>
    </section>
  );
}

function SearchResultButton({ icon: Icon, title, subtitle, description, isSelected, onClick, dataIndex }) {
  return (
    <button
      type="button"
      data-index={dataIndex}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
        isSelected ? 'bg-orange-50 ring-1 ring-orange-200/80' : 'hover:bg-white/80'
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm ring-1 ring-gray-200/80">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
        {subtitle ? <p className="truncate text-xs text-gray-500">{subtitle}</p> : null}
        {description ? <p className="truncate text-xs text-gray-400">{description}</p> : null}
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const EMPTY_RESULTS = {
  leads:    { data: [], total: 0 },
  deals:    { data: [], total: 0 },
  contacts: { data: [], total: 0 },
  clients:  { data: [], total: 0 },
};

export default function GlobalSearchModal({ isOpen, onClose, initialQuery = '' }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);

  // Sync initial query when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isOpen, initialQuery]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults(EMPTY_RESULTS);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || !isOpen) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await globalSearchService.search(query, { maxResults: 5 });
        setResults(data ?? EMPTY_RESULTS);
      } catch {
        setResults(EMPTY_RESULTS);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Flatten results for keyboard nav
  const allResults = [
    ...results.leads.data,
    ...results.deals.data,
    ...results.contacts.data,
    ...results.clients.data,
  ];

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, -1));
      } else if (e.key === 'Enter' && selectedIndex >= 0 && allResults[selectedIndex]) {
        e.preventDefault();
        router.push(allResults[selectedIndex].href);
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, selectedIndex, allResults, router, onClose]);

  const handleResultClick = (result) => {
    router.push(result.href);
    onClose();
  };

  const trimmed = query.trim();
  const hasResults = allResults.length > 0;
  const totalResults =
    results.leads.total + results.deals.total + results.contacts.total + results.clients.total;

  // Build section offset map for global keyboard index
  const leadsOffset = 0;
  const dealsOffset = results.leads.data.length;
  const contactsOffset = dealsOffset + results.deals.data.length;
  const clientsOffset = contactsOffset + results.contacts.data.length;

  let body = null;
  if (loading) {
    body = (
      <div className="flex items-center justify-center gap-3 px-6 py-12">
        <LoadingSpinner size="sm" />
        <span className="text-sm text-gray-500">Searching…</span>
      </div>
    );
  } else if (!trimmed) {
    body = (
      <SearchEmpty
        icon={Search}
        title="Search across your CRM"
        description="Find leads, deals, contacts, and clients."
      />
    );
  } else if (!hasResults) {
    body = (
      <SearchEmpty
        icon={Search}
        title="No results found"
        description={`Nothing matched "${trimmed}". Try different keywords.`}
      />
    );
  } else {
    body = (
      <>
        {results.leads.data.length > 0 && (
          <SearchSection title={`Leads (${results.leads.total})`} icon={Building2}>
            {results.leads.data.map((r, idx) => (
              <SearchResultButton
                key={r.id}
                icon={getIcon(r.type)}
                title={r.title}
                subtitle={r.subtitle}
                description={r.description}
                isSelected={selectedIndex === leadsOffset + idx}
                dataIndex={leadsOffset + idx}
                onClick={() => handleResultClick(r)}
              />
            ))}
          </SearchSection>
        )}

        {results.deals.data.length > 0 && (
          <SearchSection
            title={`Deals (${results.deals.total})`}
            icon={Briefcase}
            hasBorder={results.leads.data.length > 0}
          >
            {results.deals.data.map((r, idx) => (
              <SearchResultButton
                key={r.id}
                icon={getIcon(r.type)}
                title={r.title}
                subtitle={r.subtitle}
                description={r.metadata?.value ? `Value: ${r.metadata.value}` : undefined}
                isSelected={selectedIndex === dealsOffset + idx}
                dataIndex={dealsOffset + idx}
                onClick={() => handleResultClick(r)}
              />
            ))}
          </SearchSection>
        )}

        {results.contacts.data.length > 0 && (
          <SearchSection
            title={`Contacts (${results.contacts.total})`}
            icon={User}
            hasBorder={results.leads.data.length + results.deals.data.length > 0}
          >
            {results.contacts.data.map((r, idx) => (
              <SearchResultButton
                key={r.id}
                icon={getIcon(r.type)}
                title={r.title}
                subtitle={r.subtitle}
                description={r.description}
                isSelected={selectedIndex === contactsOffset + idx}
                dataIndex={contactsOffset + idx}
                onClick={() => handleResultClick(r)}
              />
            ))}
          </SearchSection>
        )}

        {results.clients.data.length > 0 && (
          <SearchSection
            title={`Clients (${results.clients.total})`}
            icon={Users}
            hasBorder={contactsOffset > 0}
          >
            {results.clients.data.map((r, idx) => (
              <SearchResultButton
                key={r.id}
                icon={getIcon(r.type)}
                title={r.title}
                subtitle={r.subtitle}
                description={r.description}
                isSelected={selectedIndex === clientsOffset + idx}
                dataIndex={clientsOffset + idx}
                onClick={() => handleResultClick(r)}
              />
            ))}
          </SearchSection>
        )}
      </>
    );
  }

  return (
    <WorkspaceSearchModal
      isOpen={isOpen}
      onClose={onClose}
      query={query}
      onQueryChange={(v) => { setQuery(v); setSelectedIndex(-1); }}
      placeholder="Search leads, deals, contacts, clients…"
      inputRef={inputRef}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500">
          {hasResults && (
            <span className="font-medium text-gray-700">{totalResults} result{totalResults !== 1 ? 's' : ''}</span>
          )}
          <div className="flex items-center gap-4 ml-auto">
            <span>
              <kbd className="rounded-md border border-gray-300 bg-white px-1.5 py-0.5 font-sans text-[11px]">↑↓</kbd>{' '}
              navigate
            </span>
            <span>
              <kbd className="rounded-md border border-gray-300 bg-white px-1.5 py-0.5 font-sans text-[11px]">↵</kbd>{' '}
              open
            </span>
            <span>
              <kbd className="rounded-md border border-gray-300 bg-white px-1.5 py-0.5 font-sans text-[11px]">Esc</kbd>{' '}
              close
            </span>
          </div>
        </div>
      }
    >
      {body}
    </WorkspaceSearchModal>
  );
}
