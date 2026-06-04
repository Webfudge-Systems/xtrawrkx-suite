import React, { useState } from "react";
import SidebarItem from "./SidebarItem";
import { Plus } from "lucide-react";

const NewSidebar = ({
  className = "",
  onItemClick,
  initialActiveItem = "home",
  workspaceInfo = { name: "Fourtwo Studio", icon: "4", color: "bg-green-500" },
  projects = [],
}) => {
  const [activeItem, setActiveItem] = useState(initialActiveItem);

  const menuItems = [
    { key: "home", label: "Home", icon: "home" },
    { key: "tasks", label: "My Tasks", icon: "tasks" },
    { key: "inbox", label: "Inbox", icon: "inbox" },
    { key: "message", label: "Message", icon: "message" },
    { key: "analytics", label: "Analytics", icon: "analytics" },
  ];

  const handleItemClick = (itemKey) => {
    setActiveItem(itemKey);
    if (onItemClick) {
      onItemClick(itemKey);
    }
  };

  return (
    <div
      className={`w-64 h-screen bg-white border-r border-gray-200 flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">📋</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">taskhub</h1>
        </div>

        {/* Workspace Info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div
            className={`w-6 h-6 ${workspaceInfo.color} rounded flex items-center justify-center`}
          >
            <span className="text-white font-bold text-xs">
              {workspaceInfo.icon}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-700">
            {workspaceInfo.name}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.key}
              label={item.label}
              icon={item.icon}
              active={activeItem === item.key}
              onClick={() => handleItemClick(item.key)}
            />
          ))}
        </nav>

        {/* Projects Section */}
        {projects.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4 px-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Projects
              </h3>
              <button className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors group">
                <Plus className="w-3 h-3 text-gray-500 group-hover:text-gray-700 transition-colors" />
              </button>
            </div>

            <div className="space-y-1">
              {projects.slice(0, 7).map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleItemClick(`project-${project.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-200 group"
                >
                  <div
                    className={`w-4 h-4 ${project.color} rounded flex items-center justify-center flex-shrink-0`}
                  >
                    <span className="text-white font-bold text-xs">
                      {project.icon}
                    </span>
                  </div>
                  <span className="font-medium truncate">{project.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Get Started Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 cursor-pointer group">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Get Started</p>
            <p className="text-xs text-gray-500">5/6 Completed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSidebar;
