"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CheckSquare,
  FolderOpen,
  Search,
  Users,
  UsersRound,
} from "lucide-react";
import {
  LoadingSpinner,
  TableCellProjectStatus,
  TableCellTaskStatus,
  WorkspaceSearchModal,
} from "@webfudge/ui";
import { useSession } from "@/lib/auth";
import { searchPortal } from "@/lib/api/portalGlobalSearchService";

const EMPTY_RESULTS = {
  tasks: [],
  projects: [],
  communities: [],
  members: [],
};

function SearchEmpty({ icon: Icon, title, description }) {
  return (
    <div className="px-6 py-12 text-center">
      <Icon className="mx-auto mb-4 h-10 w-10 text-gray-300" strokeWidth={1.25} aria-hidden />
      <p className="text-base font-semibold text-slate-900">{title}</p>
      {description ? <p className="mt-1.5 text-sm text-gray-500">{description}</p> : null}
    </div>
  );
}

function SearchSection({ title, children, className = "" }) {
  return (
    <section className={`py-2 ${className}`.trim()}>
      <p className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {title}
      </p>
      <div className="space-y-0.5 px-2">{children}</div>
    </section>
  );
}

function SearchResultButton({ icon: Icon, title, subtitle, statusBadge, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/80"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm ring-1 ring-gray-200/80">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
        {subtitle ? <p className="truncate text-xs text-gray-500">{subtitle}</p> : null}
      </div>
      {statusBadge}
      <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
    </button>
  );
}

export default function GlobalSearchModal({ isOpen, onClose, initialQuery = "" }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen, initialQuery]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults(EMPTY_RESULTS);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || !isOpen) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchPortal(query, { maxResults: 5, session });
        setResults(data ?? EMPTY_RESULTS);
      } catch {
        setResults(EMPTY_RESULTS);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isOpen, session]);

  const handleResultClick = (href) => {
    router.push(href);
    onClose();
  };

  const trimmed = query.trim();
  const allResults = [
    ...results.tasks,
    ...results.projects,
    ...results.communities,
    ...results.members,
  ];
  const hasResults = allResults.length > 0;
  const totalResults =
    results.tasks.length +
    results.projects.length +
    results.communities.length +
    results.members.length;

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
        title="Search your portal"
        description="Find tasks, projects, communities, and company members."
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
        {results.tasks.length > 0 ? (
          <SearchSection title="Tasks">
            {results.tasks.map((task) => (
              <SearchResultButton
                key={`task-${task.id}`}
                icon={CheckSquare}
                title={task.name}
                subtitle={task.projectName || null}
                statusBadge={<TableCellTaskStatus status={task.strapiStatus} compact />}
                onClick={() => handleResultClick(task.href)}
              />
            ))}
          </SearchSection>
        ) : null}
        {results.projects.length > 0 ? (
          <SearchSection
            title="Projects"
            className={results.tasks.length > 0 ? "border-t border-gray-200/80" : ""}
          >
            {results.projects.map((project) => (
              <SearchResultButton
                key={`project-${project.id}`}
                icon={FolderOpen}
                title={project.name}
                subtitle={project.description || null}
                statusBadge={<TableCellProjectStatus status={project.strapiStatus} compact />}
                onClick={() => handleResultClick(project.href)}
              />
            ))}
          </SearchSection>
        ) : null}
        {results.communities.length > 0 ? (
          <SearchSection
            title="Communities"
            className={
              results.tasks.length > 0 || results.projects.length > 0
                ? "border-t border-gray-200/80"
                : ""
            }
          >
            {results.communities.map((community) => (
              <SearchResultButton
                key={`community-${community.id}`}
                icon={UsersRound}
                title={community.name}
                subtitle={community.description || null}
                onClick={() => handleResultClick(community.href)}
              />
            ))}
          </SearchSection>
        ) : null}
        {results.members.length > 0 ? (
          <SearchSection
            title="Company Members"
            className={
              results.tasks.length > 0 ||
              results.projects.length > 0 ||
              results.communities.length > 0
                ? "border-t border-gray-200/80"
                : ""
            }
          >
            {results.members.map((member) => (
              <SearchResultButton
                key={`member-${member.id}`}
                icon={Users}
                title={member.name}
                subtitle={member.email || member.role || null}
                onClick={() => handleResultClick(member.href)}
              />
            ))}
          </SearchSection>
        ) : null}
      </>
    );
  }

  return (
    <WorkspaceSearchModal
      isOpen={isOpen}
      onClose={onClose}
      query={query}
      onQueryChange={setQuery}
      placeholder="Search tasks, projects, communities…"
      inputRef={inputRef}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500">
          {hasResults ? (
            <span className="font-medium text-gray-700">
              {totalResults} result{totalResults !== 1 ? "s" : ""}
            </span>
          ) : null}
          <div className="ml-auto flex items-center gap-4">
            <span>
              <kbd className="rounded-md border border-gray-300 bg-white px-1.5 py-0.5 font-sans text-[11px]">
                ↵
              </kbd>{" "}
              open
            </span>
            <span>
              <kbd className="rounded-md border border-gray-300 bg-white px-1.5 py-0.5 font-sans text-[11px]">
                Esc
              </kbd>{" "}
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
