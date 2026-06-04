import { clsx } from "clsx";

const variants = {
  primary: "badge badge-primary",
  success: "badge badge-success",
  warning: "badge badge-warning",
  error: "badge badge-error",
  gray: "badge badge-gray",
};

const sizes = {
  sm: "text-xs px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
  lg: "text-sm px-3 py-1.5",
};

export function Badge({
  children,
  variant = "gray",
  size = "md",
  dot = false,
  className,
  ...props
}) {
  return (
    <span
      className={clsx(
        variants[variant],
        sizes[size],
        dot && "gap-1.5",
        className
      )}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export default Badge;
