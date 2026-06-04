import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AlertCircle } from "lucide-react";

export function Input({
  label,
  error,
  icon: Icon,
  type = "text",
  required = false,
  className,
  containerClassName,
  ...props
}) {
  return (
    <div className={twMerge("w-full", containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          type={type}
          className={twMerge(
            "block w-full rounded-lg border border-gray-300 shadow-sm",
            "px-3 py-2.5 text-gray-900 placeholder-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent",
            "transition-colors duration-200",
            Icon && "pl-10",
            error && "border-red-300 text-red-900",
            className
          )}
          {...props}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default Input;
