"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, User, LogOut, Home, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { useSession } from "@/lib/session";
import { ChatNotifications } from "../chat/ChatNotifications";

// Top navigation items matching reference
const navigationTabs = [
  { label: "Dashboard", href: "/dashboard", key: "dashboard" },
  { label: "Projects", href: "/projects", key: "projects" },
  { label: "Tasks", href: "/tasks", key: "tasks" },
  { label: "Messages", href: "/messages", key: "messages" },
  { label: "Events", href: "/events", key: "events" },
  { label: "Communities", href: "/communities", key: "communities" },
  { label: "Services", href: "/services", key: "services" },
];

export function TopNavbar({ onMenuClick }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <>
      {/* Floating Header matching CRM style */}
      <header className="sticky top-0 z-40 w-full px-4 pt-4">
        <div className="bg-white/95 backdrop-blur-xl border border-white/30 shadow-xl rounded-2xl mx-auto w-full">
          <div className="flex h-16 items-center justify-between px-6">
            {/* Left side - Logo + Mobile Menu */}
            <div className="flex items-center">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="lg:hidden hover:bg-white/20"
              >
                <Menu className="h-5 w-5 text-gray-900" />
              </Button>

              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center shadow-md">
                  <Home className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {session?.account?.companyName || "Client Portal"}
                </h1>
              </div>

              {/* Navigation Tabs */}
              <nav className="hidden md:flex items-center space-x-2 ml-8">
                {navigationTabs.map((tab) => {
                  const isActive =
                    pathname === tab.href ||
                    pathname.startsWith(tab.href + "/");
                  return (
                    <Link key={tab.key} href={tab.href}>
                      <span
                        className={cn(
                          "px-4 py-2 text-sm font-medium transition-all duration-200 rounded-xl",
                          isActive
                            ? "bg-xtrawrkx-500 text-white shadow-sm"
                            : "text-gray-700 hover:text-gray-900 hover:bg-white/50"
                        )}
                      >
                        {tab.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right side - Search + Notifications + User */}
            <div className="flex items-center space-x-3">
              {/* Search Bar */}
              <div className="hidden lg:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  className="w-64 pl-10 pr-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/30 focus:border-xtrawrkx-500 focus:bg-white/25 transition-all duration-300 text-sm placeholder:text-gray-400 shadow-lg"
                />
              </div>

              {/* Chat Notifications */}
              <ChatNotifications
                onNotificationClick={(notification) => {
                  // Handle notification click - could navigate to specific conversation
                }}
              />

              {/* User Profile */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-2 bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 hover:border-white/40 rounded-xl transition-all duration-300 shadow-lg"
                >
                  <User className="h-5 w-5 text-gray-900" />
                </motion.button>

                {/* User dropdown */}
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl border border-white/30 rounded-xl shadow-2xl py-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={session?.avatarUrl} />
                          <AvatarFallback className="bg-xtrawrkx-500 text-white font-semibold">
                            {session?.name?.charAt(0) ||
                              session?.email?.charAt(0) ||
                              "A"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {session?.name || "Alex Carter"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {session?.email || "alex@abcinc.com"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="py-2">
                      <Link
                        href="/settings/profile"
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button className="flex items-center space-x-3 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Click outside handlers */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowUserMenu(false);
          }}
        />
      )}
    </>
  );
}

      </header>

      {/* Click outside handlers */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowUserMenu(false);
          }}
        />
      )}
    </>
  );
}

      </header>

      {/* Click outside handlers */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowUserMenu(false);
          }}
        />
      )}
    </>
  );
}
