'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '../Button';
import { Card } from '../Card';
import { EmptyState } from '../EmptyState';
import { ChatMessageText } from '../ChatMessageText';

function formatTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Client-facing chat panel — separate from internal EntityActivityPanel.
 */
export function ClientChatPanel({
  messages = [],
  loading = false,
  sending = false,
  onSend,
  currentUserLabel = 'You',
  emptyTitle = 'No messages yet',
  emptyDescription = 'Start a conversation with your Xtrawrkx team.',
  className = '',
}) {
  const [draft, setDraft] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !onSend) return;
    await onSend(text);
    setDraft('');
  };

  return (
    <Card variant="elevated" className={`flex flex-col rounded-xl ${className}`}>
      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="text-base font-semibold text-gray-900">Client chat</h3>
        <p className="text-sm text-gray-500">
          Messages here are visible to the client — separate from internal team notes.
        </p>
      </div>

      <div className="min-h-[280px] max-h-[420px] flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isClient = msg.fromClient === true || msg.sender === 'client';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      isClient
                        ? 'bg-brand-primary text-white'
                        : 'border border-gray-200 bg-gray-50 text-gray-900'
                    }`}
                  >
                    <p className="mb-1 text-xs font-medium opacity-80">
                      {isClient ? currentUserLabel : msg.senderName || 'Xtrawrkx Team'}
                    </p>
                    <ChatMessageText text={msg.message || msg.text || ''} />
                    <p className="mt-1 text-[11px] opacity-70">
                      {formatTime(msg.createdAt || msg.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Write a message to the client…"
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            type="button"
            onClick={handleSend}
            disabled={sending || !draft.trim()}
            className="shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default ClientChatPanel;
