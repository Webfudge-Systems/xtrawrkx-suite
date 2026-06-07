"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { fetchSimilarCompanies } from "@/src/services/companySuggestService";

const SOURCE_LABELS = {
  client_account: "Registered client",
};

function matchLabel(level) {
  if (level === "exact") return "Exact match";
  if (level === "high") return "Very similar";
  return "Similar";
}

function matchPercent(score) {
  return `${Math.round((score || 0) * 100)}%`;
}

export default function CompanyNameField({
  value,
  onChange,
  onStatusChange,
  disabled = false,
  required = true,
  placeholder = "Enter company name",
}) {
  const listId = useId();
  const requestRef = useRef(0);
  const onStatusChangeRef = useRef(onStatusChange);
  const [checking, setChecking] = useState(false);
  const [matches, setMatches] = useState([]);
  const [hasStrongMatch, setHasStrongMatch] = useState(false);
  const [hasExactMatch, setHasExactMatch] = useState(false);
  const [confirmedDifferent, setConfirmedDifferent] = useState(false);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    setConfirmedDifferent(false);
  }, [value]);

  useEffect(() => {
    const canProceed =
      !hasExactMatch && (!hasStrongMatch || confirmedDifferent);

    onStatusChangeRef.current?.({
      checking,
      matches,
      hasStrongMatch,
      hasExactMatch,
      confirmedDifferent,
      canProceed,
    });
  }, [checking, matches, hasStrongMatch, hasExactMatch, confirmedDifferent]);

  useEffect(() => {
    const query = typeof value === "string" ? value.trim() : "";
    if (query.length < 2) {
      setMatches([]);
      setHasStrongMatch(false);
      setHasExactMatch(false);
      setChecking(false);
      return undefined;
    }

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setChecking(true);

    const timer = window.setTimeout(async () => {
      try {
        const result = await fetchSimilarCompanies(query);
        if (requestRef.current !== requestId) return;

        setMatches(result.matches);
        setHasStrongMatch(result.hasStrongMatch);
        setHasExactMatch(
          Boolean(result.hasExactMatch) ||
            result.matches.some((match) => match.matchLevel === "exact")
        );
      } catch {
        if (requestRef.current !== requestId) return;
        setMatches([]);
        setHasStrongMatch(false);
        setHasExactMatch(false);
      } finally {
        if (requestRef.current === requestId) {
          setChecking(false);
        }
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [value]);

  const showMatches = matches.length > 0 && !checking;
  const isBlocked = hasExactMatch;

  return (
    <div className="block sm:col-span-2">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        Company name{required ? " *" : ""}
      </span>
      <div className="relative">
        <input
          name="companyName"
          value={value}
          onChange={onChange}
          className="input pr-11"
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="organization"
          aria-describedby={showMatches ? listId : undefined}
        />
        {checking ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-primary">
            <Icon icon="solar:loading-bold" width={18} className="animate-spin" />
          </span>
        ) : null}
      </div>

      {showMatches ? (
        <div
          id={listId}
          className={`mt-3 rounded-2xl border px-4 py-3 ${
            isBlocked
              ? "border-red-200 bg-red-50"
              : hasStrongMatch
                ? "border-amber-200 bg-amber-50"
                : "border-sky-200 bg-sky-50/70"
          }`}
        >
          <div className="flex items-start gap-2">
            <Icon
              icon={
                isBlocked
                  ? "solar:shield-warning-bold"
                  : hasStrongMatch
                    ? "solar:danger-triangle-bold"
                    : "solar:info-circle-bold"
              }
              width={18}
              className={
                isBlocked
                  ? "mt-0.5 text-red-600"
                  : hasStrongMatch
                    ? "mt-0.5 text-amber-600"
                    : "mt-0.5 text-sky-600"
              }
            />
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-medium ${
                  isBlocked
                    ? "text-red-900"
                    : hasStrongMatch
                      ? "text-amber-900"
                      : "text-sky-900"
                }`}
              >
                {isBlocked
                  ? "This company is already registered"
                  : hasStrongMatch
                    ? "A similar company may already be registered"
                    : "Similar companies found"}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                {isBlocked
                  ? "You cannot create another account for this company. Sign in with your existing account or contact support if you need access."
                  : hasStrongMatch
                    ? "If your organization is already on xtrawrkx, sign in instead of creating another account."
                    : "Review these names to avoid duplicate company accounts."}
              </p>
              {isBlocked || hasStrongMatch ? (
                <Link
                  href="/auth?mode=login"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-primary transition hover:text-brand-secondary"
                >
                  Sign in to existing account
                  <Icon icon="solar:arrow-right-linear" width={14} />
                </Link>
              ) : null}

              <ul className="mt-3 space-y-2">
                {matches.map((match) => (
                  <li
                    key={`${match.source}-${match.companyName}`}
                    className="rounded-xl border border-white/70 bg-white/80 px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900">{match.companyName}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {matchLabel(match.matchLevel)} · {matchPercent(match.score)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {SOURCE_LABELS[match.source] || "Existing record"}
                      {match.industry ? ` · ${match.industry}` : ""}
                    </p>
                  </li>
                ))}
              </ul>

              {hasStrongMatch && !isBlocked ? (
                <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs leading-5 text-amber-950">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-amber-300 text-brand-primary focus:ring-brand-primary/30"
                    checked={confirmedDifferent}
                    onChange={(event) => setConfirmedDifferent(event.target.checked)}
                  />
                  <span>
                    I confirm this is a different organization and not the same company listed
                    above.
                  </span>
                </label>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
