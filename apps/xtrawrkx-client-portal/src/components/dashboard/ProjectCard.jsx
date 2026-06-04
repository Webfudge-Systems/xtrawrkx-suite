"use client";

import { Calendar, MoreHorizontal } from "lucide-react";

export default function ProjectCard({ 
  projectName,
  status = "active",
  dueDate,
  progress = 0,
  onClick,
  className = "" 
}) {
  const statusConfig = {
    active: {
      label: "Active",
      bg: "bg-green-100",
      text: "text-green-700",
      border: "border-green-200",
    },
    completed: {
      label: "Completed",
      bg: "bg-blue-100",
      text: "text-blue-700",
      border: "border-blue-200",
    },
    pending: {
      label: "Pending",
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      border: "border-yellow-200",
    },
    onHold: {
      label: "On Hold",
      bg: "bg-gray-100",
      text: "text-gray-700",
      border: "border-gray-200",
    },
  };

  const selectedStatus = statusConfig[status] || statusConfig.active;

  const formatDate = (date) => {
    if (!date) return "";
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div 
      className={`bg-white rounded-xl border border-neutral-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-blue-600 transition-colors truncate">
            {projectName}
          </h3>
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedStatus.bg} ${selectedStatus.text} ${selectedStatus.border} border`}>
              {selectedStatus.label}
            </span>
          </div>
        </div>
        <button 
          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded-lg"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-500">Progress</span>
          <span className="text-sm font-bold text-neutral-900">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full transition-all duration-500 ${
              progress === 100 ? 'bg-green-500' : 
              progress >= 75 ? 'bg-blue-500' : 
              progress >= 50 ? 'bg-yellow-500' : 
              'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>

      {/* Due Date */}
      {dueDate && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Due {formatDate(dueDate)}</span>
        </div>
      )}
    </div>
  );
}
