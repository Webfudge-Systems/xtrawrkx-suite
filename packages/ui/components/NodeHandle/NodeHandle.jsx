import { clsx } from 'clsx';

const positionClasses = {
  top: '-top-2 left-1/2 -translate-x-1/2',
  bottom: '-bottom-2 left-1/2 -translate-x-1/2',
  left: 'top-1/2 -left-2 -translate-y-1/2',
  right: 'top-1/2 -right-2 -translate-y-1/2',
  'bottom-left': '-bottom-2 left-1/4 -translate-x-1/2',
  'bottom-right': '-bottom-2 left-3/4 -translate-x-1/2',
};

const typeClasses = {
  input: 'bg-white border-2 border-gray-300 hover:border-orange-400',
  output: 'bg-orange-400 border-2 border-orange-500 hover:bg-orange-500',
  'output-true': 'bg-green-400 border-2 border-green-500 hover:bg-green-500',
  'output-false': 'bg-red-400 border-2 border-red-500 hover:bg-red-500',
};

export function NodeHandle({
  type = 'output',
  position = 'bottom',
  label,
  active = false,
  onMouseDown,
  className,
  style,
  'data-handle-id': handleId,
}) {
  return (
    <div
      className={clsx(
        'absolute z-10 w-3.5 h-3.5 rounded-full cursor-crosshair transition-all duration-150',
        positionClasses[position],
        typeClasses[type] || typeClasses.output,
        active && 'ring-2 ring-orange-300 ring-offset-1 scale-125',
        className
      )}
      style={style}
      onMouseDown={onMouseDown}
      data-handle-id={handleId}
      title={label}
    >
      {label && (
        <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-gray-500 whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  );
}

export default NodeHandle;
