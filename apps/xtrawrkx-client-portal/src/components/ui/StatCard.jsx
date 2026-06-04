import { clsx } from "clsx";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral", // 'increase', 'decrease', 'neutral'
  icon: Icon,
  iconBg = "bg-brand-primary/10",
  iconColor = "text-brand-primary",
  subtitle,
  gradient = false,
  gradientType = "primary",
  className,
  ...props
}) {
  const getTrendIcon = () => {
    if (changeType === "increase") return TrendingUp;
    if (changeType === "decrease") return TrendingDown;
    return Minus;
  };

  const TrendIcon = getTrendIcon();

  const trendColors = {
    increase:
      "text-emerald-600 bg-emerald-100/60 backdrop-blur-sm border border-emerald-200/60",
    decrease:
      "text-red-600 bg-red-100/60 backdrop-blur-sm border border-red-200/60",
    neutral:
      "text-brand-text-light bg-white/35 backdrop-blur-sm border border-white/45",
  };

  const gradientClasses = {
    primary: "bg-gradient-primary",
    secondary: "bg-gradient-secondary",
    warm: "bg-gradient-warm",
    peach: "bg-gradient-peach",
    coral: "bg-gradient-coral",
    gold: "bg-gradient-gold",
    sunset: "bg-gradient-sunset",
    amber: "bg-gradient-amber",
    default: "bg-gradient-card",
  };

  return (
    <div
      className={clsx(
        gradient
          ? `${gradientClasses[gradientType] || gradientClasses.default} rounded-2xl shadow-xl border border-white/30`
          : "bg-white/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30",
        "p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 hover:bg-white/40 hover:border-white/40 group",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-brand-text-light group-hover:text-brand-foreground transition-colors duration-300">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-brand-foreground group-hover:text-brand-primary transition-colors duration-300">
              {value}
            </h3>
            {subtitle && (
              <span className="text-sm text-brand-text-muted">{subtitle}</span>
            )}
          </div>
          {change !== undefined && (
            <div className="mt-3 flex items-center gap-1">
              <span
                className={clsx(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold",
                  trendColors[changeType]
                )}
              >
                <TrendIcon className="w-3.5 h-3.5" />
                {change}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-xl bg-white/25 backdrop-blur-md border border-white/35 shadow-lg group-hover:bg-white/35 group-hover:border-white/45 transition-all duration-300">
            <Icon className="w-6 h-6 text-brand-primary group-hover:scale-110 transition-transform duration-300" />
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;
