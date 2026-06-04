import React from "react";

export function Label({
  children,
  htmlFor,
  required = false,
  className = "",
  ...props
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

export default Label;
