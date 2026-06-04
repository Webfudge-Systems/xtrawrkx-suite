import React from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ModernButton({
  text,
  type = "secondary",
  size = "md",
  className = "",
  link,
  onClick,
  disabled = false,
  icon: Icon,
  hideArrow = false,
  children,
  variant = "default",
  ...props
}) {
  const getBaseClass = () => {
    switch (type) {
      case "primary":
        return "bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl border-0 transition-all duration-300 hover:scale-[1.02] group";
      case "secondary":
        return "bg-white border border-gray-200 text-gray-900 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] group";
      case "tertiary":
        return "bg-transparent border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-300 hover:scale-[1.01]";
      case "ghost":
        return "bg-transparent hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-all duration-300 hover:scale-[1.01]";
      case "gradient":
        return "bg-gradient-to-r from-pink-500 via-pink-600 to-red-500 hover:from-pink-600 hover:via-red-500 hover:to-red-600 text-white shadow-lg hover:shadow-xl border-0 transition-all duration-500 hover:scale-[1.02] group relative overflow-hidden";
      case "success":
        return "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl border-0 transition-all duration-300 hover:scale-[1.02] group";
      case "warning":
        return "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl border-0 transition-all duration-300 hover:scale-[1.02] group";
      case "danger":
        return "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl border-0 transition-all duration-300 hover:scale-[1.02] group";
      default:
        return "bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl border-0 transition-all duration-300 hover:scale-[1.02] group";
    }
  };

  const getSizeClass = () => {
    const baseClasses = {
      xs: "pl-3 pr-1 py-1 text-sm",
      sm: "pl-4 pr-1 py-1 text-base",
      lg: "pl-8 pr-1 py-1 text-xl",
      xl: "pl-6 pr-1 py-1 text-2xl",
      default: "pl-6 pr-1 py-1 text-base",
    };

    const sizeKey = size in baseClasses ? size : "default";
    let classes = baseClasses[sizeKey];

    // Adjust padding when arrow is hidden to center content properly
    if (hideArrow) {
      classes = classes.replace(/px-\d+/, (match) => {
        const currentPadding = parseInt(match.replace("px-", ""));
        const newPadding = currentPadding + 2;
        return `px-${newPadding}`;
      });
    }

    return classes;
  };

  const getShapeClass = () => {
    switch (variant) {
      case "rounded":
        return "rounded-lg";
      case "square":
        return "rounded-none";
      case "pill":
      default:
        return "rounded-full";
    }
  };

  const baseClass = getBaseClass();
  const sizeClass = getSizeClass();
  const shapeClass = getShapeClass();
  const disabledClass = disabled
    ? "opacity-50 cursor-not-allowed"
    : "cursor-pointer";
  const groupClass = type === "gradient" ? "group" : "";

  const getIconSize = () => {
    switch (size) {
      case "xs":
        return "h-4 w-4";
      case "sm":
        return "h-5 w-5";
      case "lg":
        return "h-6 w-6";
      case "xl":
        return "h-7 w-7";
      default:
        return "h-5 w-5";
    }
  };

  const getArrowIcon = () => {
    return type === "gradient" ? ArrowUpRight : ArrowRight;
  };

  const ArrowIcon = getArrowIcon();

  const buttonContent = (
    <>
      {/* Gradient shimmer effect for gradient buttons */}
      {type === "gradient" && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      )}

      {/* Centered text content */}
      <div className="flex-1 flex items-center justify-center min-w-0">
        {Icon && (
          <Icon
            className={cn("mr-2 relative z-10 flex-shrink-0", getIconSize())}
          />
        )}
        <span className="font-medium relative z-10 text-center">
          {text || children}
        </span>
      </div>

      {/* Arrow positioned on the right */}
      {!hideArrow && (
        <div
          className={cn("flex items-center justify-center relative z-10 ml-3", {
            "w-8 h-8 bg-white rounded-full my-[1px] shadow-lg group-hover:shadow-xl transition-all duration-300 border border-gray-100 group-hover:border-gray-200":
              type === "gradient",
            "w-8 h-8 bg-white rounded-full my-[1px] shadow-lg group-hover:shadow-xl transition-all duration-300 border border-gray-100 group-hover:border-gray-200":
              type === "primary",
            "w-8 h-8 bg-gray-900 rounded-full my-[1px] shadow-sm group-hover:shadow-md transition-all duration-300":
              type === "secondary",
          })}
        >
          <ArrowIcon
            className={cn("font-bold", {
              "h-6 w-6 text-pink-600 group-hover:text-pink-700":
                type === "gradient",
              "h-5 w-5 text-pink-600 group-hover:text-pink-700":
                type === "primary",
              "h-4 w-4 text-white": type === "secondary",
              "h-5 w-5 text-gray-500 group-hover:text-gray-700":
                type !== "gradient" &&
                type !== "primary" &&
                type !== "secondary",
              "group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:rotate-12 transition-all duration-300 ease-out":
                type === "gradient",
              "group-hover:translate-x-0.5 transition-transform duration-300 ease-out":
                type !== "gradient",
            })}
          />
        </div>
      )}
    </>
  );

  const combinedClassName = cn(
    "inline-flex items-center justify-between font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed relative",
    baseClass,
    sizeClass,
    shapeClass,
    groupClass,
    disabledClass,
    className
  );

  if (link && !disabled) {
    return (
      <Link
        href={link}
        className={combinedClassName}
        onClick={onClick}
        {...props}
      >
        {buttonContent}
      </Link>
    );
  }

  return (
    <button
      className={combinedClassName}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {buttonContent}
    </button>
  );
}

// Export additional button variants for convenience
export const PrimaryButton = (props) => (
  <ModernButton type="primary" {...props} />
);
export const SecondaryButton = (props) => (
  <ModernButton type="secondary" {...props} />
);
export const GradientButton = (props) => (
  <ModernButton type="gradient" {...props} />
);
export const SuccessButton = (props) => (
  <ModernButton type="success" {...props} />
);
export const WarningButton = (props) => (
  <ModernButton type="warning" {...props} />
);
export const DangerButton = (props) => (
  <ModernButton type="danger" {...props} />
);

// Named export for compatibility
export { ModernButton };
