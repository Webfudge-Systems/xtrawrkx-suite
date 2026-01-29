"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { FloatingChatWidget } from "../chat/FloatingChatWidget";
import { ChatProvider } from "../providers/ChatProvider";

export function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Handle redirect from root protected route to dashboard
  useEffect(() => {
    if (pathname === "/") {
      router.replace("/dashboard");
    }
  }, [pathname, router]);

  return (
    <ChatProvider>
      <div className="min-h-screen flex relative bg-white">

        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onCollapseChange={setSidebarCollapsed}
        />

        {/* Main content area */}
        <div
          className={`flex-1 flex flex-col relative z-10 transition-all duration-300 min-w-0 ${
            sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
          }`}
        >
          {/* Page content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
        </div>

        {/* Floating Chat Widget */}
        <FloatingChatWidget />
      </div>
    </ChatProvider>
  );
}
