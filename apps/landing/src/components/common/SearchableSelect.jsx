"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import clsx from "clsx";

function normalizeOption(option) {
  if (typeof option === "string") {
    return { value: option, label: option };
  }
  return { value: option.value, label: option.label };
}

export default function SearchableSelect({
  label,
  name,
  value = "",
  onChange,
  options = [],
  placeholder = "Select an option",
  disabledPlaceholder = "Select an option first",
  required = false,
  disabled = false,
  className = "",
}) {
  const listboxId = useId();
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);

  const normalizedOptions = useMemo(
    () => options.map(normalizeOption),
    [options]
  );

  const selectedOption = useMemo(
    () => normalizedOptions.find((option) => option.value === value) || null,
    [normalizedOptions, value]
  );

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return normalizedOptions;
    return normalizedOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(normalized) ||
        option.value.toLowerCase().includes(normalized)
    );
  }, [normalizedOptions, query]);

  const displayPlaceholder = disabled ? disabledPlaceholder : placeholder;

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setHighlightIndex(0);
      requestAnimationFrame(() => searchRef.current?.focus());
    } else {
      setQuery("");
    }
  }, [open]);

  const selectOption = (option) => {
    onChange?.({ target: { name, value: option.value } });
    setOpen(false);
    setQuery("");
  };

  const clearSelection = (event) => {
    event.stopPropagation();
    onChange?.({ target: { name, value: "" } });
    setOpen(false);
    setQuery("");
  };

  const handleKeyDown = (event) => {
    if (disabled) return;

    if (!open) {
      if (["Enter", " ", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((current) =>
        Math.min(current + 1, Math.max(filteredOptions.length - 1, 0))
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" && filteredOptions[highlightIndex]) {
      event.preventDefault();
      selectOption(filteredOptions[highlightIndex]);
    }
  };

  return (
    <label className={clsx("block", className)}>
      {label ? (
        <span className="mb-2 block text-sm font-medium text-slate-700">
          {label}
          {required ? " *" : ""}
        </span>
      ) : null}

      <div ref={containerRef} className="relative">
        <div
          className={clsx(
            "input flex w-full items-center justify-between gap-2 text-left",
            disabled && "cursor-not-allowed opacity-60",
            !value && "text-brand-gray"
          )}
        >
          <button
            type="button"
            id={`${listboxId}-trigger`}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={`${listboxId}-listbox`}
            disabled={disabled}
            onClick={() => !disabled && setOpen((current) => !current)}
            onKeyDown={handleKeyDown}
            className="flex min-w-0 flex-1 items-center truncate text-left disabled:cursor-not-allowed"
          >
            <span className="truncate">
              {selectedOption?.label || displayPlaceholder}
            </span>
          </button>
          <span className="flex shrink-0 items-center gap-1">
            {value && !disabled ? (
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Clear selection"
              >
                <Icon icon="solar:close-circle-linear" width={18} />
              </button>
            ) : null}
            <button
              type="button"
              disabled={disabled}
              onClick={() => !disabled && setOpen((current) => !current)}
              className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed"
              aria-label={open ? "Close options" : "Open options"}
            >
              <Icon
                icon="solar:alt-arrow-down-linear"
                width={18}
                className={clsx("transition-transform duration-200", open && "rotate-180")}
              />
            </button>
          </span>
        </div>

        <div
          className={clsx(
            "absolute left-0 right-0 z-30 mt-2 origin-top overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.12)] transition-all duration-200",
            open
              ? "pointer-events-auto scale-100 opacity-100"
              : "pointer-events-none scale-95 opacity-0"
          )}
        >
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Icon
                icon="solar:magnifer-linear"
                width={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setHighlightIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-brand-primary/40 focus:ring-2 focus:ring-brand-primary/10"
              />
            </div>
          </div>

          <ul
            id={`${listboxId}-listbox`}
            role="listbox"
            aria-labelledby={`${listboxId}-trigger`}
            className="max-h-52 overflow-y-auto py-1"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-sm text-slate-500">No matches found</li>
            ) : (
              filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={value === option.value}
                >
                  <button
                    type="button"
                    onMouseEnter={() => setHighlightIndex(index)}
                    onClick={() => selectOption(option)}
                    className={clsx(
                      "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors",
                      highlightIndex === index
                        ? "bg-brand-primary/8 text-slate-900"
                        : "text-slate-700 hover:bg-slate-50",
                      value === option.value && "font-medium text-brand-primary"
                    )}
                  >
                    <span>{option.label}</span>
                    {value === option.value ? (
                      <Icon icon="solar:check-circle-bold" width={18} className="text-brand-primary" />
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </label>
  );
}
