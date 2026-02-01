"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import "../styles/globals.css";
import CRMSidebar from "../components/CRMSidebar";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { SubSidebarProvider } from "../contexts/SubSidebarContext";
import ExtensionDownloadModal from "../components/ExtensionDownloadModal";
import { useExtensionPrompt } from "../hooks/useExtensionPrompt";
import { Loader2 } from "lucide-react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function LayoutContent({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Extension download prompt
  const { showModal, handleCloseModal } = useExtensionPrompt();

  // Don't show sidebar on login page
  const isLoginPage = pathname === "/login";
  const isUnauthorizedPage = pathname === "/unauthorized";

  // Handle authentication redirect - MUST be at the top before any conditional returns
  useEffect(() => {
    if (!loading && !isAuthenticated && !isLoginPage && !isUnauthorizedPage) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, isLoginPage, isUnauthorizedPage, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // For login and unauthorized pages, render without sidebar
  if (isLoginPage || isUnauthorizedPage) {
    return children;
  }

  // For authenticated users, show the full layout with sidebar and top nav
  if (isAuthenticated) {
    return (
      <div className="flex h-screen overflow-hidden">
        {/* CRM Sidebar */}
        <CRMSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </div>

        {/* Extension Download Modal */}
        <ExtensionDownloadModal isOpen={showModal} onClose={handleCloseModal} />
      </div>
    );
  }

  // For unauthenticated users on protected routes, show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Xtrawrkx CRM Portal</title>
        <meta
          name="description"
          content="Comprehensive Customer Relationship Management system for sales, leads, deals, and client management. Streamline your business operations with Xtrawrkx CRM."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Robots Meta Tags */}
        <meta
          name="robots"
          content="noindex, nofollow, nocache, noarchive, nosnippet, noimageindex"
        />
        <meta
          name="googlebot"
          content="noindex, nofollow, nocache, noarchive, nosnippet, noimageindex"
        />
        <meta
          name="bingbot"
          content="noindex, nofollow, nocache, noarchive, nosnippet, noimageindex"
        />
        <meta
          name="slurp"
          content="noindex, nofollow, nocache, noarchive, nosnippet, noimageindex"
        />
        <meta
          name="duckduckbot"
          content="noindex, nofollow, nocache, noarchive, nosnippet, noimageindex"
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://crm.xtrawrkx.com" />
        <meta
          property="og:title"
          content="Xtrawrkx CRM Portal - Complete Business Management Solution"
        />
        <meta
          property="og:description"
          content="Powerful CRM system for managing sales pipelines, leads, deals, and client relationships. Boost your business efficiency with our comprehensive management tools."
        />
        <meta
          property="og:image"
          content="https://crm.xtrawrkx.com/images/og-image.png"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Xtrawrkx CRM Portal" />
        <meta property="og:site_name" content="Xtrawrkx CRM Portal" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://crm.xtrawrkx.com" />
        <meta
          property="twitter:title"
          content="Xtrawrkx CRM Portal - Complete Business Management Solution"
        />
        <meta
          property="twitter:description"
          content="Powerful CRM system for managing sales pipelines, leads, deals, and client relationships."
        />
        <meta
          property="twitter:image"
          content="https://crm.xtrawrkx.com/images/og-image.png"
        />

        {/* Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href="https://crm.xtrawrkx.com" />

        {/* Additional Meta */}
        <meta name="application-name" content="Xtrawrkx CRM" />
        <meta name="apple-mobile-web-app-title" content="Xtrawrkx CRM" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-TileColor" content="#ffffff" />
      </head>
      <body className="bg-white ">
        <AuthProvider>
          <SubSidebarProvider>
            <LayoutContent>{children}</LayoutContent>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </SubSidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
