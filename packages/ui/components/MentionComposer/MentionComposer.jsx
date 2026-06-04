'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  filterMentionUsers,
  formatMentionToken,
  getMentionContext,
  mentionUserLabel,
} from '../../utils/chatMentions';

/**
 * Textarea composer with @mention autocomplete.
 */
export function MentionComposer({
  value,
  onChange,
  onKeyDown,
  mentionUsers = [],
  placeholder = 'Write a message…',
  disabled = false,
  textareaRef: externalTextareaRef,
  className = '',
  textareaClassName = '',
  minHeightPx = 22,
  maxHeightPx = 120,
}) {
  const internalRef = useRef(null);
  const textareaRef = externalTextareaRef || internalRef;
  const listRef = useRef(null);

  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionStart, setMentionStart] = useState(-1);
  const [mentionQuery, setMentionQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);

  const options = useMemo(
    () => filterMentionUsers(mentionUsers, mentionQuery),
    [mentionUsers, mentionQuery],
  );

  const syncMentionState = useCallback(
    (text, caret) => {
      const ctx = getMentionContext(text, caret);
      if (!ctx || mentionUsers.length === 0) {
        setMentionOpen(false);
        setMentionStart(-1);
        setMentionQuery('');
        return;
      }
      setMentionOpen(true);
      setMentionStart(ctx.start);
      setMentionQuery(ctx.query);
      setHighlightIndex(0);
    },
    [mentionUsers.length],
  );

  useEffect(() => {
    if (!mentionOpen) return;
    const el = listRef.current?.querySelector('[data-mention-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [mentionOpen, highlightIndex]);

  const closeMention = useCallback(() => {
    setMentionOpen(false);
    setMentionStart(-1);
    setMentionQuery('');
  }, []);

  const insertMention = useCallback(
    (user) => {
      const el = textareaRef.current;
      if (!el || mentionStart < 0) return;
      const caret = el.selectionStart ?? value.length;
      const token = formatMentionToken(user);
      const next = `${value.slice(0, mentionStart)}${token} ${value.slice(caret)}`;
      onChange(next);
      closeMention();
      requestAnimationFrame(() => {
        const pos = mentionStart + token.length + 1;
        el.focus();
        el.setSelectionRange(pos, pos);
      });
    },
    [closeMention, mentionStart, onChange, textareaRef, value],
  );

  const handleChange = (e) => {
    const next = e.target.value;
    onChange(next);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeightPx)}px`;
    syncMentionState(next, e.target.selectionStart ?? next.length);
  };

  const handleSelect = (e) => {
    syncMentionState(e.target.value, e.target.selectionStart ?? e.target.value.length);
  };

  const handleKeyDown = (e) => {
    if (mentionOpen && options.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex((i) => (i + 1) % options.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex((i) => (i - 1 + options.length) % options.length);
        return;
      }
      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        insertMention(options[highlightIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMention();
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        insertMention(options[highlightIndex]);
        return;
      }
    }
    onKeyDown?.(e);
  };

  const showDropdown = mentionOpen && mentionUsers.length > 0;

  return (
    <div className={`relative flex-1 min-w-0 ${className}`}>
      {showDropdown ? (
        <div
          ref={listRef}
          className="absolute bottom-full left-0 right-0 z-20 mb-2 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-500">No matching people</p>
          ) : (
            options.map((user, index) => {
              const label = mentionUserLabel(user);
              const active = index === highlightIndex;
              return (
                <button
                  key={user.id ?? label}
                  type="button"
                  role="option"
                  aria-selected={active}
                  data-mention-active={active ? 'true' : 'false'}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                    active ? 'bg-orange-50 text-orange-900' : 'text-gray-800 hover:bg-gray-50'
                  }`}
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    insertMention(user);
                  }}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-[10px] font-bold text-white">
                    {label.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
                  {user.email ? (
                    <span className="hidden truncate text-xs text-gray-400 sm:block max-w-[140px]">
                      {user.email}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      ) : null}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onSelect={handleSelect}
        onClick={handleSelect}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          setTimeout(closeMention, 120);
        }}
        rows={1}
        disabled={disabled}
        placeholder={placeholder}
        className={textareaClassName}
        style={{ minHeight: `${minHeightPx}px`, maxHeight: `${maxHeightPx}px`, overflowY: 'auto' }}
      />
    </div>
  );
}
