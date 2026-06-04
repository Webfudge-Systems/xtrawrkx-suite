import { clsx } from 'clsx';

const statusConfig = {
  draft: {
    label: 'Draft',
    classes: 'bg-gray-100 text-gray-600 border border-gray-200',
    dot: 'bg-gray-400',
  },
  active: {
    label: 'Active',
    classes: 'bg-green-50 text-green-700 border border-green-200',
    dot: 'bg-green-500',
  },
  paused: {
    label: 'Paused',
    classes: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot: 'bg-amber-500',
  },
  error: {
    label: 'Error',
    classes: 'bg-red-50 text-red-700 border border-red-200',
    dot: 'bg-red-500',
  },
};

export function WorkflowStatusBadge({ status = 'draft', className, size = 'md' }) {
  const config = statusConfig[status] || statusConfig.draft;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.classes,
        sizeClasses[size] || sizeClasses.md,
        className
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot)} />
      {config.label}
    </span>
  );
}

export default WorkflowStatusBadge;
