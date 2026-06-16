"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { WorkspaceTopBar } from "@webfudge/ui";
import { Sidebar } from "./Sidebar";
import { ChatProvider } from "../providers/ChatProvider";
import { PORTAL_SITE } from "@/lib/site";

/**
 * Client portal shell — mirrors CRM/PM layout (top bar + sidebar) but uses
 * portal custom auth instead of @webfudge/auth AppShell.
 */
export function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/") {
      router.replace("/dashboard");
    }
  }, [pathname, router]);

  const openSidebar = () => {
    setSidebarHidden(false);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(true);
    }
  };

  const hideSidebar = () => {
    setSidebarHidden(true);
    setSidebarOpen(false);
  };

  return (
    <ChatProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-white">
        {sidebarHidden ? (
          <WorkspaceTopBar
            onOpenSidebar={openSidebar}
            branding={{
              logoPath: PORTAL_SITE.logoPath,
              brandName: PORTAL_SITE.name,
              homeHref: "/dashboard",
            }}
          />
        ) : null}

        <div className="flex min-h-0 flex-1 overflow-hidden">
          {!sidebarHidden ? (
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              onToggle={hideSidebar}
            />
          ) : null}

          <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-white">
            {children}
          </main>
        </div>
      </div>
    </ChatProvider>
  );
}
