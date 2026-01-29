import React from "react";

export function Progress({
  value = 0,
  max = 100,
  className = "",
  size = "md",
  variant = "default",
  showLabel = false,
  label = "",
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const variantClasses = {
    default: "bg-xtrawrkx-600",
    success: "bg-green-600",
    warning: "bg-yellow-600",
    error: "bg-red-600",
  };

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm text-gray-500">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div
        className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}
      >
        <div
          className={`${sizeClasses[size]} ${variantClasses[variant]} transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
