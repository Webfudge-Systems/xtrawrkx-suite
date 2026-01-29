import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";

export function Select({
  label,
  error,
  options = [],
  placeholder = "Select an option",
  required = false,
  className,
  containerClassName,
  onChange,
  ...props
}) {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };
  return (
    <div className={clsx("w-full", containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          className={clsx(
            "block w-full rounded-lg border shadow-sm appearance-none",
            "px-3 py-2.5 pr-10 text-gray-900",
            "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent",
            "transition-colors duration-200",
            error ? "border-red-300" : "border-gray-300",
            className
          )}
          onChange={handleChange}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default Select;
