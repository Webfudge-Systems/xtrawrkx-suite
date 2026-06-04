const MENTION_TOKEN_RE = /@\[([^\]]+)\]\(user:(\d+)\)/g;
const URL_RE = /(https?:\/\/[^\s<>"']+)/gi;

export function mentionUserLabel(user) {
  if (!user) return '';
  return (
    user.name?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.username?.trim() ||
    user.email?.split('@')[0]?.trim() ||
    (user.id != null ? `User ${user.id}` : 'User')
  );
}

export function formatMentionToken(user) {
  const label = mentionUserLabel(user);
  const id = user?.id;
  if (id == null) return `@${label}`;
  return `@[${label}](user:${id})`;
}

export function trimTrailingPunctuation(url) {
  let trimmed = url;
  while (/[.,;:!?)}\]'"]$/.test(trimmed)) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed;
}

/**
 * Active @mention query at caret, or null.
 */
export function getMentionContext(text, caretIndex) {
  const caret = Math.max(0, Math.min(caretIndex ?? 0, String(text ?? '').length));
  const before = String(text ?? '').slice(0, caret);
  const at = before.lastIndexOf('@');
  if (at === -1) return null;

  const segment = before.slice(at + 1);
  if (segment.includes('\n') || segment.includes('[') || segment.includes('(')) return null;

  return { start: at, query: segment };
}

export function filterMentionUsers(users, query) {
  const list = Array.isArray(users) ? users : [];
  const q = String(query ?? '')
    .trim()
    .toLowerCase();
  if (!q) return list.slice(0, 12);

  return list
    .filter((user) => {
      const label = mentionUserLabel(user).toLowerCase();
      const email = String(user?.email ?? '').toLowerCase();
      const username = String(user?.username ?? '').toLowerCase();
      return label.includes(q) || email.includes(q) || username.includes(q);
    })
    .slice(0, 12);
}

/**
 * Split message into renderable parts: text, mention, link.
 */
export function parseChatMessageParts(text) {
  const str = String(text ?? '');
  if (!str) return [];

  const parts = [];
  let cursor = 0;

  const pushTextSegment = (segment) => {
    if (!segment) return;
    let lastIndex = 0;
    let match;
    URL_RE.lastIndex = 0;
    while ((match = URL_RE.exec(segment)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', value: segment.slice(lastIndex, match.index) });
      }
      const raw = match[0];
      const href = trimTrailingPunctuation(raw);
      const trailing = raw.slice(href.length);
      if (href) parts.push({ type: 'link', value: href });
      if (trailing) parts.push({ type: 'text', value: trailing });
      lastIndex = match.index + raw.length;
    }
    if (lastIndex < segment.length) {
      parts.push({ type: 'text', value: segment.slice(lastIndex) });
    }
  };

  MENTION_TOKEN_RE.lastIndex = 0;
  let mentionMatch;
  while ((mentionMatch = MENTION_TOKEN_RE.exec(str)) !== null) {
    if (mentionMatch.index > cursor) {
      pushTextSegment(str.slice(cursor, mentionMatch.index));
    }
    parts.push({
      type: 'mention',
      label: mentionMatch[1],
      userId: mentionMatch[2],
    });
    cursor = mentionMatch.index + mentionMatch[0].length;
  }

  if (cursor < str.length) {
    pushTextSegment(str.slice(cursor));
  }

  return parts.length ? parts : [{ type: 'text', value: str }];
}

export function mergeMentionUsers(...lists) {
  const out = [];
  const seen = new Set();
  for (const list of lists) {
    for (const user of list || []) {
      const id = user?.id;
      if (id == null) continue;
      const key = String(id);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(user);
    }
  }
  return out.sort((a, b) =>
    mentionUserLabel(a).localeCompare(mentionUserLabel(b), undefined, { sensitivity: 'base' }),
  );
}
