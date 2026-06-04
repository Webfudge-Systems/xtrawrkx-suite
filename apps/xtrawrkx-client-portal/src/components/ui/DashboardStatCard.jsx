import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { clsx } from "clsx";

export function DashboardStatCard({
  title,
  value,
  trend,
  isPositive = true,
  className,
  ...props
}) {
  return (
    <div
      className={clsx(
        "bg-white rounded-lg p-4 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        {trend && (
          <div
            className={clsx(
              "flex items-center space-x-1 text-xs px-2 py-1 rounded-full",
              isPositive
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-600"
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span className="font-medium">{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardStatCard;
