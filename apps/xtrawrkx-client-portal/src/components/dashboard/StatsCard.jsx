"use client";

export default function StatsCard({ 
  title,
  value,
  icon: Icon,
  color = "blue",
  change,
  changeType = "increase",
  className = "" 
}) {
  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      icon: "text-blue-600",
      border: "border-blue-200",
    },
    green: {
      bg: "bg-green-50",
      icon: "text-green-600",
      border: "border-green-200",
    },
    orange: {
      bg: "bg-orange-50",
      icon: "text-orange-600",
      border: "border-orange-200",
    },
    purple: {
      bg: "bg-purple-50",
      icon: "text-purple-600",
      border: "border-purple-200",
    },
    red: {
      bg: "bg-red-50",
      icon: "text-red-600",
      border: "border-red-200",
    },
    gray: {
      bg: "bg-gray-50",
      icon: "text-gray-600",
      border: "border-gray-200",
    },
  };

  const changeColorClasses = {
    increase: "text-green-600",
    decrease: "text-red-600",
    neutral: "text-gray-600",
  };

  const selectedColor = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`bg-white rounded-xl border ${selectedColor.border} p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-neutral-900">{value}</p>
          {change && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-sm font-medium ${changeColorClasses[changeType]}`}>
                {changeType === "increase" ? "+" : changeType === "decrease" ? "-" : ""}{change}
              </span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 ${selectedColor.bg} rounded-lg flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${selectedColor.icon}`} />
          </div>
        )}
      </div>
    </div>
  );
}
