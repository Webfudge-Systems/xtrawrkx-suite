"use client";



import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {

  MessageSquare,

  Hash,

  ListTodo,

  FolderKanban,

  Briefcase,

  Building2,

  Layers,

} from "lucide-react";

import { PortalChatPanel } from "./PortalChatPanel";

import {

  buildPortalChatChannels,

  fetchPortalChatForChannel,

  sendPortalChatForChannel,

} from "@/lib/api/portalChatAggregateService";



const SECTION_ICONS = {

  All: Layers,

  Account: Building2,

  Tasks: ListTodo,

  Projects: FolderKanban,

  Deals: Briefcase,

};



function ChannelNavButton({ channel, active, onClick }) {

  const Icon = SECTION_ICONS[channel.section] || Hash;

  return (

    <button

      type="button"

      onClick={onClick}

      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-150 ${

        active

          ? "bg-gradient-to-r from-orange-50 to-pink-50/60 font-semibold text-orange-900 shadow-sm"

          : "text-gray-700 hover:bg-gray-50/90"

      }`}

    >

      <span

        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${

          active

            ? "bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-sm"

            : "bg-gray-100 text-orange-500"

        }`}

      >

        <Icon className="h-3.5 w-3.5" aria-hidden />

      </span>

      <span className="min-w-0 flex-1 truncate">{channel.label}</span>

    </button>

  );

}



export default function PortalChatHub({

  clientAccountId,

  accountName,

  tasks = [],

  projects = [],

  deals = [],

  defaultChannelKey = "account",

  className = "",

}) {

  const panelWrapRef = useRef(null);

  const [panelHeight, setPanelHeight] = useState(560);



  useEffect(() => {

    const el = panelWrapRef.current;

    if (!el) return undefined;



    const measure = () => {

      const h = Math.floor(el.getBoundingClientRect().height);

      if (h > 0) setPanelHeight(Math.max(320, h));

    };



    measure();

    const ro = new ResizeObserver(measure);

    ro.observe(el);

    window.addEventListener("resize", measure);

    return () => {

      ro.disconnect();

      window.removeEventListener("resize", measure);

    };

  }, []);



  const channels = useMemo(

    () =>

      buildPortalChatChannels({

        clientAccountId,

        accountName,

        tasks,

        projects,

        deals,

      }),

    [clientAccountId, accountName, tasks, projects, deals]

  );



  const [activeChannelKey, setActiveChannelKey] = useState(defaultChannelKey);



  const activeChannel = useMemo(

    () => channels.find((c) => c.key === activeChannelKey) || channels[0],

    [channels, activeChannelKey]

  );



  const chatContext = useMemo(

    () => ({ tasks, projects, deals }),

    [tasks, projects, deals]

  );



  useEffect(() => {

    if (!channels.some((c) => c.key === activeChannelKey)) {

      setActiveChannelKey(channels[0]?.key || "account");

    }

  }, [channels, activeChannelKey]);



  const fetchCommentsFn = useCallback(

    () => fetchPortalChatForChannel(activeChannel, chatContext, 100),

    [activeChannel, chatContext]

  );



  const sendCommentFn = useCallback(

    async (text) => {

      await sendPortalChatForChannel(activeChannel, text);

    },

    [activeChannel]

  );



  const groupedChannels = useMemo(() => {

    const order = ["All", "Account", "Tasks", "Projects", "Deals"];

    const map = new Map();

    for (const ch of channels) {

      if (!map.has(ch.section)) map.set(ch.section, []);

      map.get(ch.section).push(ch);

    }

    return order

      .filter((section) => map.has(section))

      .map((section) => ({ section, items: map.get(section) }));

  }, [channels]);



  const readOnly = activeChannel?.key === "all";



  const chatFooterBadgeText =

    activeChannel?.entityType === "task"

      ? "Messages are saved on this task for your team."

      : activeChannel?.entityType === "project"

        ? "Messages are saved on this project for your team."

        : "Messages are visible to the Xtrawrkx team.";



  return (

    <div

      className={`grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch ${className}`.trim()}

    >

      <aside className="flex min-h-0 flex-col lg:col-span-3">

        <div className="flex min-h-[280px] flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-gradient-to-b from-gray-50/80 to-white shadow-md ring-1 ring-black/[0.03] lg:min-h-0">

          <div className="shrink-0 border-b border-gray-100 bg-white/80 px-4 py-4 backdrop-blur-sm">

            <div className="flex items-center gap-2.5">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 shadow-sm">

                <MessageSquare className="h-4 w-4 text-white" />

              </div>

              <div>

                <h3 className="text-sm font-semibold text-gray-900">

                  Chat locations

                </h3>

                <p className="text-xs text-gray-500">

                  Account, tasks, projects & deals

                </p>

              </div>

            </div>

          </div>



          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">

            {groupedChannels.map(({ section, items }) => (

              <div key={section}>

                <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">

                  {section}

                </p>

                <div className="space-y-1">

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



      <div

        ref={panelWrapRef}

        className="flex min-h-[480px] flex-col lg:col-span-9 lg:min-h-0"

      >

        <PortalChatPanel

          key={`portal-chat-${activeChannel?.key}`}

          channelSection={activeChannel?.section || "Account"}

          channelLabel={activeChannel?.label || accountName}

          accountName={accountName}

          readOnly={readOnly}

          footerText={readOnly ? undefined : chatFooterBadgeText}

          fetchMessages={fetchCommentsFn}

          onSend={readOnly ? undefined : sendCommentFn}

          className="h-full"

          style={{ minHeight: panelHeight, maxHeight: panelHeight }}

        />

      </div>

    </div>

  );

}


