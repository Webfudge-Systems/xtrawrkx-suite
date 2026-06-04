'use client';

const URL_RE = /(https?:\/\/[^\s<>"']+)/gi;

function trimTrailingPunctuation(url) {
  let trimmed = url;
  while (/[.,;:!?)}\]'"]$/.test(trimmed)) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed;
}

function splitTextWithUrls(text) {
  const str = String(text ?? '');
  if (!str) return [];

  const parts = [];
  let lastIndex = 0;
  let match;

  URL_RE.lastIndex = 0;
  while ((match = URL_RE.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: str.slice(lastIndex, match.index) });
    }

    const raw = match[0];
    const href = trimTrailingPunctuation(raw);
    const trailing = raw.slice(href.length);

    if (href) {
      parts.push({ type: 'link', value: href });
    }
    if (trailing) {
      parts.push({ type: 'text', value: trailing });
    }

    lastIndex = match.index + raw.length;
  }

  if (lastIndex < str.length) {
    parts.push({ type: 'text', value: str.slice(lastIndex) });
  }

  return parts.length ? parts : [{ type: 'text', value: str }];
}

/**
 * Renders plain text with http(s) URLs as links that open in a new tab.
 */
export function LinkifiedText({
  text,
  className,
  linkClassName = 'text-blue-600 underline decoration-blue-600/40 underline-offset-2 hover:text-blue-700 break-all',
}) {
  const parts = splitTextWithUrls(text);
  if (!parts.length) return null;

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.type === 'link' ? (
          <a
            key={`link-${i}`}
            href={part.value}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
          >
            {part.value}
          </a>
        ) : (
          <span key={`text-${i}`}>{part.value}</span>
        ),
      )}
    </span>
  );
}
