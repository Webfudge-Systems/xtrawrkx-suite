"use client";

import { useState } from "react";
import { clsx } from "clsx";

export function Tabs({
  tabs = [],
  defaultTab,
  onChange,
  variant = "line", // 'line', 'pills'
  className,
  ...props
}) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key);

  const handleTabChange = (key) => {
    setActiveTab(key);
    if (onChange) {
      onChange(key);
    }
  };

  const activeTabData = tabs.find((tab) => tab.key === activeTab);

  return (
    <div className={clsx("w-full", className)} {...props}>
      <div
        className={clsx(
          "border-b border-gray-200",
          variant === "pills" && "border-0"
        )}
      >
        <nav className={clsx("flex", variant === "pills" && "gap-2")}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              disabled={tab.disabled}
              className={clsx(
                "whitespace-nowrap py-2 px-4 font-medium text-sm transition-colors",
                variant === "line" && [
                  activeTab === tab.key
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300",
                  "border-b-2 border-transparent",
                ],
                variant === "pills" && [
                  activeTab === tab.key
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100",
                  "rounded-lg",
                ],
                tab.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-2">
                {tab.icon && <tab.icon className="w-4 h-4" />}
                {tab.label}
                {tab.badge && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </div>
            </button>
          ))}
        </nav>
      </div>
      {activeTabData?.content && (
        <div className="mt-4">{activeTabData.content}</div>
      )}
    </div>
  );
}

export default Tabs;
