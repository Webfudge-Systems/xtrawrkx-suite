'use client';

import { useCallback, useEffect, useState } from 'react';
import { ClientChatPanel } from '@webfudge/ui';
import { fetchClientChatMessages, sendClientChatMessage } from '../lib/api/clientChatService';

export default function ClientAccountChatPanel({ accountId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const rows = await fetchClientChatMessages(accountId);
      setMessages(rows);
    } catch (e) {
      console.error('Client chat load failed', e);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const handleSend = async (text) => {
    setSending(true);
    try {
      await sendClientChatMessage(accountId, text);
      await load();
    } finally {
      setSending(false);
    }
  };

  return (
    <ClientChatPanel
      messages={messages}
      loading={loading}
      sending={sending}
      onSend={handleSend}
      currentUserLabel="Client"
    />
  );
}
