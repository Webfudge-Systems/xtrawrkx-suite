import React from "react";

export function Textarea({
  label,
  error,
  helperText,
  className = "",
  required = false,
  disabled = false,
  rows = 3,
  resize = "vertical",
  ...props
}) {
  const resizeClasses = {
    none: "resize-none",
    vertical: "resize-y",
    horizontal: "resize-x",
    both: "resize",
  };

  const baseClasses = `
    w-full px-3 py-2 
    border border-gray-300 rounded-lg 
    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    transition-colors duration-200
    ${resizeClasses[resize]}
    ${error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}
    ${className}
  `;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <textarea
        className={baseClasses}
        rows={rows}
        disabled={disabled}
        {...props}
      />

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

export default Textarea;
