import { clsx } from "clsx";

export function CircularProgress({
  value = 0,
  max = 100,
  size = 120,
  strokeWidth = 8,
  title,
  subtitle,
  showValue = true,
  className,
  ...props
}) {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / max) * circumference;

  const percentage = Math.round((value / max) * 100);

  // Determine color based on percentage
  const getColor = (percent) => {
    if (percent >= 80) return "#ffaa44"; // brand-primary
    if (percent >= 60) return "#ffcc66"; // brand-secondary
    if (percent >= 40) return "#ff8844"; // brand-tertiary
    return "#ef4444"; // red
  };

  const color = getColor(percentage);

  return (
    <div className={clsx("flex flex-col items-center", className)} {...props}>
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Centered content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showValue && (
            <span className="text-3xl font-bold text-brand-foreground">
              {percentage}%
            </span>
          )}
          {title && (
            <span className="text-xs font-medium text-brand-text-light text-center mt-1">
              {title}
            </span>
          )}
        </div>
      </div>

      {subtitle && (
        <p className="text-sm text-brand-text-muted mt-2 text-center">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default CircularProgress;

