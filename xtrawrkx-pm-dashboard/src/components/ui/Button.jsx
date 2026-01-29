import { clsx } from "clsx";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  disabled,
  ...props
}) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900",
    outline:
      "border-2 border-gray-400 bg-white text-gray-800 hover:bg-gray-100 hover:border-gray-500",
    ghost: "hover:bg-gray-100 text-gray-700",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
