import React from "react";

export function AreaChart({
  data,
  dataKey,
  height = 200,
  color = "#3B82F6",
  className = "",
}) {
  if (!data || data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((item) => item[dataKey] || 0));
  const minValue = Math.min(...data.map((item) => item[dataKey] || 0));
  const range = maxValue - minValue || 1;

  const points = data
    .map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (((item[dataKey] || 0) - minValue) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0"
      >
        {/* Area fill */}
        <polygon
          points={areaPoints}
          fill={color}
          fillOpacity="0.1"
          stroke="none"
        />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />

        {/* Data points */}
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - (((item[dataKey] || 0) - minValue) / range) * 100;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="0.8"
              fill={color}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {/* Tooltip area */}
      <div className="absolute inset-0 flex">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex-1 relative group cursor-pointer"
            title={`${item.name || index}: ${item[dataKey]?.toLocaleString() || 0}`}
          >
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
              {item.name || index}: {item[dataKey]?.toLocaleString() || 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
