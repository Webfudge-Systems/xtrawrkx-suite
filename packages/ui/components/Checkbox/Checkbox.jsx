import { clsx } from "clsx";

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  className,
  ...props
}) {
  return (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange && onChange(e.target.checked)}
        disabled={disabled}
        className={clsx(
          "h-4 w-4 rounded border-gray-300 text-orange-500",
          "focus:ring-orange-500 focus:ring-2 focus:ring-offset-0",
          "transition-colors duration-200",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      />
      {label && (
        <span
          className={clsx(
            "ml-2 text-sm text-gray-700",
            disabled && "opacity-50"
          )}
        >
          {label}
        </span>
      )}
    </label>
  );
}

export default Checkbox;
