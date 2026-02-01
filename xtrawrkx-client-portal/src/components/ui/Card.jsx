import { clsx } from "clsx";

export function Card({
  children,
  className,
  title,
  subtitle,
  actions,
  padding = true,
  hoverable = false,
  variant = "default",
  glass = false,
  gradient = false,
  gradientType = "glass",
  onClick,
  ...props
}) {
  const variants = {
    default: "bg-white border border-gray-100 shadow-sm",
    elevated: "bg-white border border-gray-100 shadow-md",
    outlined: "bg-white border border-gray-200",
    ghost: "bg-transparent border-0",
    glass: "bg-white/95 backdrop-blur-xl border border-white/30 shadow-lg",
    "glass-strong":
      "bg-white/98 backdrop-blur-2xl border border-white/40 shadow-xl",
  };

  const gradientVariants = {
    glass:
      "bg-gradient-to-br from-white/95 via-white/85 to-white/75 backdrop-blur-xl",
    warm: "bg-gradient-to-br from-white/90 via-orange-50/80 to-amber-50/70 backdrop-blur-xl",
    sunset:
      "bg-gradient-to-br from-white/90 via-orange-100/80 to-red-50/70 backdrop-blur-xl",
    coral:
      "bg-gradient-to-br from-white/90 via-rose-50/80 to-orange-50/70 backdrop-blur-xl",
    peach:
      "bg-gradient-to-br from-white/90 via-peach-50/80 to-orange-50/70 backdrop-blur-xl",
  };

  const getVariantClasses = () => {
    if (gradient && gradientType) {
      return `${gradientVariants[gradientType]} border border-white/20 shadow-xl`;
    }
    if (glass) {
      return variants.glass;
    }
    return variants[variant] || variants.default;
  };

  const getHoverClasses = () => {
    if (glass || gradient) {
      return "hover:shadow-2xl hover:border-white/40 hover:scale-[1.02] hover:bg-white/95";
    }
    return "hover:shadow-md hover:border-gray-200";
  };

  return (
    <div
      className={clsx(
        "rounded-2xl transition-all duration-300",
        getVariantClasses(),
        hoverable && `${getHoverClasses()} cursor-pointer`,
        padding && "p-6",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {(title || subtitle || actions) && (
        <CardHeader>
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </div>
  );
}

// Card sub-components for compatibility
export function CardHeader({ children, className, ...props }) {
  return (
    <div
      className={clsx("flex items-start justify-between mb-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3
      className={clsx("text-lg font-semibold text-gray-900", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export default Card;
