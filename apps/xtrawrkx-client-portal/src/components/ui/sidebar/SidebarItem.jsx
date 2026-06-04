import React from "react";
import {
  Home,
  CheckSquare,
  Inbox,
  MessageSquare,
  BarChart,
} from "lucide-react";

const SidebarItem = ({
  label,
  icon,
  active = false,
  onClick,
  className = "",
}) => {
  const iconMap = {
    home: Home,
    tasks: CheckSquare,
    inbox: Inbox,
    message: MessageSquare,
    analytics: BarChart,
  };

  const IconComponent = iconMap[icon] || Home;

  const baseClasses =
    "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer group";
  const activeClasses = active
    ? "bg-gray-100 text-gray-900 font-bold shadow-sm rounded-r-lg"
    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700";

  const iconClasses = active
    ? "text-teal-700 h-5 w-5"
    : "text-gray-500 group-hover:text-gray-700 h-5 w-5";

  return (
    <div
      className={`${baseClasses} ${activeClasses} ${className}`}
      onClick={onClick}
    >
      <IconComponent className={iconClasses} />
      <span>{label}</span>
    </div>
  );
};

export default SidebarItem;
