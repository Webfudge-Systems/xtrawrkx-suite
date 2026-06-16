"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import PortalChatHub from "@/components/chat/PortalChatHub";
import { PageHeader } from "@/components/ui/PageHeader";
import { PortalPageShell } from "@/components/layout/PortalPageShell";
import { strapiClient } from "@/lib/strapiClient";
import { listTasksForClient } from "@/lib/api/clientTaskService";
import { listProjectsForClient } from "@/lib/api/clientProjectService";

function readAccountFromStorage() {
  if (typeof window === "undefined") return { id: null, name: "Account" };
  try {
    const raw = localStorage.getItem("client_account");
    if (!raw) return { id: null, name: "Account" };
    const a = JSON.parse(raw);
    const id = a.id ?? a.documentId ?? null;
    const name =
      a.companyName?.trim() ||
      a.attributes?.companyName?.trim() ||
      a.name?.trim() ||
      "Account";
    return { id, name };
  } catch {
    return { id: null, name: "Account" };
  }
}

export default function MessagesPage() {
  const [accountId, setAccountId] = useState(null);
  const [accountName, setAccountName] = useState("Account");
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHubData = useCallback(async () => {
    const stored = readAccountFromStorage();
    const id = strapiClient.getCurrentAccountId() ?? stored.id;
    if (id == null || id === "") {
      setAccountId(null);
      setTasks([]);
      setProjects([]);
      setLoading(false);
      return;
    }

    setAccountId(id);
    setAccountName(stored.name);
    setLoading(true);
    setError("");

    try {
      const [taskRows, projectRows] = await Promise.all([
        listTasksForClient(id),
        listProjectsForClient(id),
      ]);
      setTasks(
        taskRows.map((t) => ({
          id: t.id ?? t.documentId,
          name: t.name || t.title || "Untitled task",
        }))
      );
      setProjects(
        projectRows.map((p) => ({
          id: p.id ?? p.documentId,
          name: p.name || "Untitled project",
        }))
      );
    } catch (e) {
      console.error("Messages hub load failed", e);
      setError(e.message || "Failed to load conversations");
      setTasks([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHubData();
  }, [loadHubData]);

  return (
    <PortalPageShell className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0">
        <PageHeader
          title="Messages"
          subtitle="All conversations with Xtrawrkx — account, tasks, projects, and deals. Pick a location on the left to read or reply."
        />
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col md:mt-6">
        {loading ? (
          <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : !accountId ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
            Sign in with a client account to view messages.
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-800">
            {error}
          </div>
        ) : (
          <PortalChatHub
            clientAccountId={accountId}
            accountName={accountName}
            tasks={tasks}
            projects={projects}
            deals={[]}
            className="min-h-0 flex-1"
          />
        )}
      </div>
    </PortalPageShell>
  );
}
