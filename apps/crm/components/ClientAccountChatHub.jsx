'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquare, Hash, ListTodo, FolderKanban, Briefcase, Building2, Layers } from 'lucide-react';
import { EntityActivityPanel } from '@webfudge/ui';
import {
  buildClientChatChannels,
  fetchClientChatForChannel,
  fetchChannelActivityTimeline,
  sendClientChatForChannel,
} from '../lib/api/clientAccountAggregateService';

const SECTION_ICONS = {
  All: Layers,
  Account: Building2,
  Tasks: ListTodo,
  Projects: FolderKanban,
  Deals: Briefcase,
};

function ChannelNavButton({ channel, active, onClick, count }) {
  const Icon = SECTION_ICONS[channel.section] || Hash;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
        active
          ? 'bg-orange-50 font-semibold text-orange-800 ring-1 ring-orange-200/80'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-orange-500" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{channel.label}</span>
      {typeof count === 'number' && count > 0 ? (
        <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-gray-600">
          {count}
        </span>
      ) : null}
    </button>
  );
}

export default function ClientAccountChatHub({
  clientAccountId,
  accountName,
  tasks = [],
  projects = [],
  deals = [],
  canSend = false,
  fetchMentionUsers,
  onTimelineRefresh,
  entityHrefForRow,
  defaultChannelKey = 'account',
  defaultSubTab = 'chat',
  className = '',
  minHeightPx = 560,
  maxHeightPx = 800,
}) {
  const channels = useMemo(
    () =>
      buildClientChatChannels({
        clientAccountId,
        accountName,
        tasks,
        projects,
        deals,
      }),
    [clientAccountId, accountName, tasks, projects, deals],
  );

  const [activeChannelKey, setActiveChannelKey] = useState(defaultChannelKey);
  const [channelTimeline, setChannelTimeline] = useState([]);
  const [channelTimelineLoading, setChannelTimelineLoading] = useState(false);

  const activeChannel = useMemo(
    () => channels.find((c) => c.key === activeChannelKey) || channels[0],
    [channels, activeChannelKey],
  );

  const chatContext = useMemo(
    () => ({ tasks, projects, deals }),
    [tasks, projects, deals],
  );

  useEffect(() => {
    if (!channels.some((c) => c.key === activeChannelKey)) {
      setActiveChannelKey(channels[0]?.key || 'account');
    }
  }, [channels, activeChannelKey]);

  useEffect(() => {
    if (!activeChannel) return;
    let cancelled = false;
    (async () => {
      setChannelTimelineLoading(true);
      try {
        const res = await fetchChannelActivityTimeline(activeChannel, 60);
        if (!cancelled) setChannelTimeline(res.data || []);
      } catch {
        if (!cancelled) setChannelTimeline([]);
      } finally {
        if (!cancelled) setChannelTimelineLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeChannel]);

  const fetchCommentsFn = useCallback(
    () => fetchClientChatForChannel(activeChannel, chatContext, 100),
    [activeChannel, chatContext],
  );

  const addCommentFn = useCallback(
    async ({ comment }) => {
      if (!canSend) return null;
      const res = await sendClientChatForChannel(activeChannel, comment);
      onTimelineRefresh?.();
      const tl = await fetchChannelActivityTimeline(activeChannel, 60);
      setChannelTimeline(tl.data || []);
      return res;
    },
    [activeChannel, canSend, onTimelineRefresh],
  );

  const groupedChannels = useMemo(() => {
    const order = ['All', 'Account', 'Tasks', 'Projects', 'Deals'];
    const map = new Map();
    for (const ch of channels) {
      if (!map.has(ch.section)) map.set(ch.section, []);
      map.get(ch.section).push(ch);
    }
    return order
      .filter((section) => map.has(section))
      .map((section) => ({ section, items: map.get(section) }));
  }, [channels]);

  const composerDisabled = activeChannel?.key === 'all';

  return (
    <div className={`grid grid-cols-1 gap-4 lg:grid-cols-12 ${className}`.trim()}>
      <aside className="lg:col-span-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center gap-2 px-1">
            <MessageSquare className="h-4 w-4 text-orange-500" />
            <h3 className="text-sm font-semibold text-gray-900">Chat locations</h3>
          </div>
          <p className="mb-3 px-1 text-xs text-gray-500">
            Pick where this conversation lives — account, tasks, projects, or deals.
          </p>
          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {groupedChannels.map(({ section, items }) => (
              <div key={section}>
                <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  {section}
                </p>
                <div className="space-y-0.5">
                  {items.map((channel) => (
                    <ChannelNavButton
                      key={channel.key}
                      channel={channel}
                      active={channel.key === activeChannelKey}
                      onClick={() => setActiveChannelKey(channel.key)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="min-w-0 lg:col-span-9">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-800 ring-1 ring-orange-200/70">
            <Hash className="h-3 w-3" />
            {activeChannel?.section}: {activeChannel?.label}
          </span>
          {composerDisabled ? (
            <span className="text-xs text-amber-700">
              Select a specific task, project, or account to reply.
            </span>
          ) : null}
        </div>
        <EntityActivityPanel
          key={`chat-hub-${activeChannel?.key}`}
          entityType={activeChannel?.entityType || 'client_account'}
          entityId={activeChannel?.entityId || clientAccountId}
          entityName={activeChannel?.label || accountName}
          crmTimeline={channelTimeline}
          crmTimelineLoading={channelTimelineLoading}
          crmTimelineError={null}
          activityCount={channelTimeline.length}
          entityHrefForRow={entityHrefForRow}
          fetchCommentsFn={fetchCommentsFn}
          addCommentFn={composerDisabled || !canSend ? null : addCommentFn}
          fetchMentionUsers={fetchMentionUsers}
          chatFooterBadgeText={
            activeChannel?.entityType === 'task'
              ? 'Messages are saved on this task for your team and the client portal.'
              : activeChannel?.entityType === 'client_account'
                ? 'Messages are visible to the client in their portal.'
                : 'Messages are saved on this record for your team.'
          }
          defaultSubTab={defaultSubTab}
          className="w-full"
          minHeightPx={minHeightPx}
          maxHeightPx={maxHeightPx}
        />
      </div>
    </div>
  );
}
