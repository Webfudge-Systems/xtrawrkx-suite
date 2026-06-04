import { clsx } from "clsx";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}) {
  return (
    <div className={clsx("text-center py-12 px-6", className)} {...props}>
      {Icon && (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center text-gray-400">
          <Icon className="h-10 w-10" strokeWidth={1.25} />
        </div>
      )}
      {title && (
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      )}
      {description && (
        <p className="mt-1.5 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export default EmptyState;
