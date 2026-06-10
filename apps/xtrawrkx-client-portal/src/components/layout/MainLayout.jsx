"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { WorkspaceTopBar } from "@webfudge/ui";
import { Sidebar } from "./Sidebar";
import { ChatProvider } from "../providers/ChatProvider";
import { PORTAL_SITE } from "@/lib/site";

export function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Handle redirect from root protected route to dashboard
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
      <div className="min-h-screen flex flex-col relative bg-white">
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

        <div className="flex flex-1 min-h-0 relative">
          {!sidebarHidden ? (
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              onToggle={hideSidebar}
            />
          ) : null}

          <div className="flex-1 flex flex-col relative z-10 transition-all duration-300 min-w-0">
            <main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
          </div>
        </div>
      </div>
    </ChatProvider>
  );
}
