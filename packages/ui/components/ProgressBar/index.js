'use client';

/**
 * ProgressBar — generic percentage progress bar.
 *
 * Props:
 *   value     – number 0–100 (default 0)
 *   label     – boolean  show the % label below the bar (default true)
 *   size      – 'sm' | 'md'  controls bar height (default 'md')
 *   className – additional wrapper classes
 */
export function ProgressBar({ value = 0, label = true, size = 'md', className = '' }) {
  const progress = Math.max(0, Math.min(100, Number(value) || 0));
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className={`min-w-[120px] ${className}`}>
      <div className={`overflow-hidden rounded-full bg-gray-200 ${height}`} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="h-full rounded-full bg-orange-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      {label ? <div className="mt-2 text-xs font-medium text-gray-600">{progress}%</div> : null}
    </div>
  );
}

export default ProgressBar;
