'use client';

import { parseChatMessageParts } from '../../utils/chatMentions';

/**
 * Renders chat/comment text with @mentions and clickable URLs.
 */
export function ChatMessageText({
  text,
  className,
  linkClassName = 'text-blue-600 underline decoration-blue-600/40 underline-offset-2 hover:text-blue-700 break-all',
  mentionClassName = 'font-semibold text-orange-700 bg-orange-50/90 rounded px-0.5',
}) {
  const parts = parseChatMessageParts(text);
  if (!parts.length) return null;

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.type === 'mention') {
          return (
            <span key={`m-${i}`} className={mentionClassName} title={`User #${part.userId}`}>
              @{part.label}
            </span>
          );
        }
        if (part.type === 'link') {
          return (
            <a
              key={`l-${i}`}
              href={part.value}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClassName}
            >
              {part.value}
            </a>
          );
        }
        return <span key={`t-${i}`}>{part.value}</span>;
      })}
    </span>
  );
}
