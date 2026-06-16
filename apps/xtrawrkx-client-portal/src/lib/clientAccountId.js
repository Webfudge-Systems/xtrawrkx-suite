import strapiClient from "@/lib/strapiClient";

/**
 * Resolve the authenticated client account id for portal API calls.
 * Prefers explicit account fields, then localStorage, then /me refresh.
 */
export async function resolveClientAccountId(session) {
  let accountId =
    session?.account?.id ||
    session?.account?.documentId ||
    session?.user?.account?.id ||
    session?.user?.account?.documentId;

  if (!accountId && typeof window !== "undefined") {
    const raw = localStorage.getItem("client_account");
    if (raw) {
      try {
        const account = JSON.parse(raw);
        accountId = account.id || account.documentId;
      } catch {
        /* ignore */
      }
    }
  }

  if (!accountId) {
    accountId = strapiClient.getCurrentAccountId();
  }

  if (!accountId) {
    try {
      const currentUser = await strapiClient.getCurrentUser();
      accountId =
        currentUser?.account?.id ||
        currentUser?.account?.documentId ||
        currentUser?.id ||
        currentUser?.documentId;
    } catch {
      /* ignore */
    }
  }

  return accountId || null;
}

/** Map API project rows to `{ id, name }` for task create modals. */
export function mapProjectsForTaskSelect(rows = []) {
  return rows
    .map((project) => ({
      id: project.id ?? project.documentId,
      name: project.name || "Untitled Project",
    }))
    .filter((project) => project.id != null && project.id !== "");
}
