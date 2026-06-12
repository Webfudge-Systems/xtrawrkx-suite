'use client';

import { FileText, Image as ImageIcon, Download } from 'lucide-react';

function attachmentUrl(att, apiBase) {
  const raw = att?.url ?? att?.file?.url;
  if (!raw) return null;
  if (raw.startsWith('http')) return raw;
  const base = String(apiBase || '').replace(/\/$/, '');
  return base ? `${base}${raw.startsWith('/') ? raw : `/${raw}`}` : raw;
}

function isImage(att) {
  const mime = att?.mime ?? att?.file?.mime;
  return typeof mime === 'string' && mime.startsWith('image/');
}

/**
 * Renders file attachments on a chat message.
 */
export function ChatMessageAttachments({ attachments = [], apiBase = '' }) {
  const list = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
  if (!list.length) return null;

  return (
    <div className="mt-2 flex flex-col gap-2">
      {list.map((att) => {
        const url = attachmentUrl(att, apiBase);
        const name = att?.name ?? att?.fileName ?? 'file';
        const key = att?.id ?? url ?? name;

        if (url && isImage(att)) {
          return (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block max-w-[240px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:border-orange-200 transition-colors"
            >
              <img src={url} alt={name} className="max-h-40 w-full object-cover" />
              <span className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-gray-600 truncate">
                <ImageIcon className="w-3 h-3 shrink-0" />
                {name}
              </span>
            </a>
          );
        }

        return (
          <a
            key={key}
            href={url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={!url ? (e) => e.preventDefault() : undefined}
            className="inline-flex max-w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-700 hover:border-orange-200 hover:bg-orange-50/50 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 shrink-0 text-gray-500" />
            <span className="truncate font-medium">{name}</span>
            {url ? <Download className="w-3 h-3 shrink-0 text-gray-400" /> : null}
          </a>
        );
      })}
    </div>
  );
}
