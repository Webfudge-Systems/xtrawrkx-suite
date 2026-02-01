"use client";

import {
  Link,
  Copy,
  Edit,
  Plus,
  RotateCcw,
  Copy as CopyId,
  Mail,
  Move,
  Archive,
  Trash2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const TaskContextMenu = ({ isOpen, onClose, position, task, onDelete }) => {
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuItems = [
    {
      id: "copy-link",
      label: "Copy link",
      icon: Link,
      action: () => {
        // Copy task link to clipboard
        navigator.clipboard.writeText(
          `${window.location.origin}/projects/${task?.projectId}/tasks/${task?.id}`
        );
        onClose();
      },
    },
    {
      id: "copy-id",
      label: "Copy ID",
      icon: CopyId,
      action: () => {
        // Copy task ID to clipboard
        navigator.clipboard.writeText(task?.id?.toString() || "");
        onClose();
      },
    },
    {
      id: "rename",
      label: "Rename",
      icon: Edit,
      action: () => {
        onClose();
      },
    },
    {
      id: "add-to",
      label: "Add to",
      icon: Plus,
      hasSubmenu: true,
      action: () => {
        onClose();
      },
    },
    {
      id: "convert-to",
      label: "Convert to",
      icon: RotateCcw,
      hasSubmenu: true,
      action: () => {
        onClose();
      },
    },
    {
      id: "duplicate",
      label: "Duplicate",
      icon: Copy,
      action: () => {
        onClose();
      },
    },
    {
      id: "send-email",
      label: "Send email to task",
      icon: Mail,
      action: () => {
        onClose();
      },
    },
    {
      id: "move",
      label: "Move",
      icon: Move,
      action: () => {
        onClose();
      },
    },
    {
      id: "archive",
      label: "Archive",
      icon: Archive,
      action: () => {
        onClose();
      },
    },
    {
      id: "delete",
      label: "Delete",
      icon: Trash2,
      action: () => {
        if (onDelete && task) {
          onDelete(task);
        }
        onClose();
      },
      isDangerous: true,
    },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
      style={{
        top: position.y,
        left: position.x,
        transform: "translateY(-50%)",
      }}
    >
      {menuItems.map((item, index) => (
        <div key={item.id}>
          <button
            onClick={item.action}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors duration-200 ${
              item.isDangerous
                ? "text-red-600 hover:text-red-700"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <item.icon
                className={`w-3 h-3 ${item.isDangerous ? "text-red-500" : "text-gray-500"}`}
              />
              <span className="font-medium">{item.label}</span>
            </div>
            {item.hasSubmenu && (
              <svg
                className="w-3 h-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </button>

          {/* Add separator before delete */}
          {item.id === "archive" && (
            <div className="my-0.5 border-t border-gray-200" />
          )}
        </div>
      ))}
    </div>
  );
};

export default TaskContextMenu;
