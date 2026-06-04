import { clsx } from "clsx";

export function Checkbox({
  label,
  description,
  className,
  containerClassName,
  ...props
}) {
  return (
    <div className={clsx("flex items-start", containerClassName)}>
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          className={clsx(
            "h-4 w-4 rounded border-gray-300 text-blue-600",
            "focus:ring-2 focus:ring-blue-500 focus:ring-offset-0",
            "transition-colors duration-200",
            className
          )}
          {...props}
        />
      </div>
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <label className="text-sm font-medium text-gray-700 cursor-pointer">
              {label}
            </label>
          )}
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Checkbox;
