"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { legalRelatedPages } from "@/data/legalContent";

function SectionContent({ section }) {
  return (
    <div className="space-y-4">
      {section.paragraphs?.map((text, i) => (
        <p key={i} className="text-gray-600 leading-relaxed">
          {text}
        </p>
      ))}
      {section.list?.length > 0 && (
        <ul className="space-y-3">
          {section.list.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-500">
                {i + 1}
              </span>
              <span className="text-gray-700 text-sm leading-relaxed pt-0.5">
                {item}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Settings-style layout for About, Privacy Policy, and Terms of Service.
 */
export default function LegalDocumentPage({
  title,
  description,
  lastUpdated,
  sections = [],
  currentPageId,
}) {
  const [activeSectionId, setActiveSectionId] = useState(
    sections[0]?.id ?? ""
  );

  const activeSection =
    sections.find((s) => s.id === activeSectionId) ?? sections[0];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600">{description}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left navigation — matches Settings "Categories" panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Sections</h3>
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection?.id === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSectionId(section.id)}
                    className={cn(
                      "w-full flex items-center space-x-3 p-3 text-left rounded-xl border transition-colors group",
                      isActive
                        ? "bg-xtrawrkx-50 border-xtrawrkx-200"
                        : "border-transparent hover:bg-gray-50 hover:border-gray-200"
                    )}
                  >
                    <span
                      className={cn(
                        "w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center border bg-gray-50",
                        isActive
                          ? "border-xtrawrkx-200 bg-white"
                          : "border-gray-200 group-hover:border-gray-300"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          isActive
                            ? "text-xtrawrkx-600"
                            : "text-gray-400 group-hover:text-gray-600"
                        )}
                      />
                    </span>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "font-medium truncate",
                          isActive ? "text-xtrawrkx-900" : "text-gray-900"
                        )}
                      >
                        {section.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {section.navDescription}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Legal & Info</h3>
            <nav className="space-y-2">
              {legalRelatedPages.map((page) => {
                const Icon = page.icon;
                const isCurrent = currentPageId === page.id;
                return (
                  <Link
                    key={page.id}
                    href={page.href}
                    className={cn(
                      "w-full flex items-center space-x-3 p-3 rounded-xl border transition-colors group",
                      isCurrent
                        ? "bg-gray-100 border-gray-200"
                        : "border-transparent hover:bg-gray-50 hover:border-gray-200"
                    )}
                  >
                    <span
                      className={cn(
                        "w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center border bg-gray-50",
                        isCurrent
                          ? "border-gray-200 bg-white"
                          : "border-gray-200 group-hover:border-gray-300"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          isCurrent
                            ? "text-gray-700"
                            : "text-gray-400 group-hover:text-gray-600"
                        )}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {page.label}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main content — matches Settings right panel */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeSection?.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {activeSection?.title}
              </h2>
              {lastUpdated && (
                <Badge
                  variant="gray"
                  className="w-fit inline-flex items-center gap-1.5 !bg-gray-100 !text-gray-600 font-normal border-0"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Last updated {lastUpdated}
                </Badge>
              )}
            </div>

            {activeSection && <SectionContent section={activeSection} />}
          </motion.div>

          {/* Quick jump: all sections as compact cards (notifications-style) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {sections
              .filter((s) => s.id !== activeSection?.id)
              .map((section) => {
                const Icon = section.icon;
                const preview =
                  section.paragraphs?.[0] ??
                  (section.list?.[0] ? section.list[0] : "");
                const isContact = section.id === "contact";
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSectionId(section.id)}
                    className={cn(
                      "bg-white rounded-xl border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50",
                      isContact && "md:col-span-2"
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                        <Icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {section.title}
                        </h4>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {preview}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
