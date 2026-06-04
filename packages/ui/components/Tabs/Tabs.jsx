'use client'

import { clsx } from "clsx";
import { useState } from "react";

export function Tabs({
  tabs,
  defaultTab,
  onChange,
  className,
  tabsClassName,
  contentClassName,
  variant = "default",
  showBadges = false,
  ...props
}) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onChange) onChange(tabId);
  };

  const variants = {
    default: {
      tabs: "border-b border-gray-200",
      tab: "border-b-2 border-transparent hover:border-gray-300 hover:text-gray-700",
      activeTab: "border-orange-500 text-orange-600",
    },
    pills: {
      tabs: "",
      tab: "rounded-lg hover:bg-gray-100",
      activeTab: "bg-orange-100 text-orange-700",
    },
    modern: {
      tabs: "gap-2",
      tab: "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 border border-white/40 shadow-md hover:shadow-lg",
      activeTab: "bg-orange-500 text-white shadow-lg border-transparent",
    },
    glass: {
      tabs: "gap-2 bg-white/70 backdrop-blur-xl border border-white/40 rounded-lg shadow-xl p-3",
      tab: "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 border border-white/40 shadow-md",
      activeTab: "bg-orange-500 text-white shadow-lg border-transparent",
    },
  };

  const currentVariant = variants[variant] || variants.default;

  // Modern/Glass variants render differently
  if (variant === "modern" || variant === "glass") {
    return (
      <div className={clsx("w-full", className)} {...props}>
        {/* Tab Headers with Badge Support */}
        <div className={clsx("flex items-center overflow-x-auto", currentVariant.tabs, tabsClassName)}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={clsx(
                "flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 whitespace-nowrap",
                currentVariant.tab,
                activeTab === tab.id ? currentVariant.activeTab : ""
              )}
            >
              <span>{tab.label}</span>
              {showBadges && tab.badge !== undefined && (
                <span
                  className={clsx(
                    "ml-2 px-2 py-0.5 text-xs font-bold rounded-full transition-all duration-300",
                    activeTab === tab.id
                      ? "bg-white/30 text-white"
                      : "bg-gray-100 text-gray-700"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {!showBadges && (
          <div className={clsx("mt-6", contentClassName)}>
            {tabs.find((tab) => tab.id === activeTab)?.content}
          </div>
        )}
      </div>
    );
  }

  // Default and Pills variants (original behavior)
  return (
    <div className={clsx("w-full", className)} {...props}>
      {/* Tab Headers */}
      <div
        className={clsx("flex space-x-8", currentVariant.tabs, tabsClassName)}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={clsx(
              "py-2 px-1 text-sm font-medium transition-colors duration-200",
              currentVariant.tab,
              activeTab === tab.id ? currentVariant.activeTab : "text-gray-500"
            )}
          >
            {tab.label}
            {showBadges && tab.badge !== undefined && (
              <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={clsx("mt-6", contentClassName)}>
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}

export default Tabs;
