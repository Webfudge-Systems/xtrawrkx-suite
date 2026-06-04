"use client";

import { motion } from "framer-motion";

/**
 * Reusable loading spinner component
 */
export default function LoadingSpinner({
  size = "md",
  message = null,
  fullScreen = false,
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        className={`${sizeClasses[size]} border-4 border-gray-200 border-t-orange-500 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      {message && (
        <p className="text-sm text-gray-600 animate-pulse">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * Page-level loading component
 */
export function PageLoader({ message = "Loading..." }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="xl" message={message} />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for content
 */
export function SkeletonLoader({ lines = 3, height = "h-4" }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`${height} bg-gray-200 rounded ${
            index === lines - 1 ? "w-2/3" : "w-full"
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Card skeleton loader
 */
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 bg-gray-200 rounded" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="h-3 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  );
}

/**
 * Table skeleton loader
 */
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="animate-pulse space-y-3">
      {/* Header */}
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: "1rem" }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <div key={`header-${index}`} className="h-4 bg-gray-300 rounded" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: "1rem",
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-3 bg-gray-200 rounded"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * KPI card placeholder — matches KPICard layout on dashboard pages.
 */
export function KPICardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2.5">
          <div className="h-3 w-24 rounded bg-gray-200" />
          <div className="h-8 w-20 rounded bg-gray-200" />
          <div className="h-3 w-16 rounded bg-gray-100" />
        </div>
        <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}

/**
 * Row of KPI card skeletons.
 */
export function KPICardsRowSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <KPICardSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * Glass-style widget card placeholder for dashboard panels.
 */
export function WidgetCardSkeleton({ className = "", minHeight = "min-h-[280px]" }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-gray-200/80 bg-white/80 p-6 shadow-sm ${className}`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="h-5 w-32 rounded bg-gray-200" />
          <div className="h-3 w-48 rounded bg-gray-100" />
        </div>
        <div className="h-8 w-20 rounded-lg bg-gray-100" />
      </div>
      <div className={`rounded-xl bg-gray-50/90 ${minHeight}`} />
    </div>
  );
}

/**
 * Compact loading status shown above dashboard skeleton content.
 */
export function DashboardContentLoader({ message = "Loading dashboard..." }) {
  return (
    <div
      className="flex items-center gap-2 pb-1 text-sm text-gray-500"
      role="status"
      aria-live="polite"
    >
      <motion.div
        className="h-4 w-4 shrink-0 rounded-full border-2 border-gray-200 border-t-orange-500"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <span className="animate-pulse">{message}</span>
    </div>
  );
}
