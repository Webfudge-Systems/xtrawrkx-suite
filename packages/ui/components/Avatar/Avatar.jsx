import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function Avatar({
  src,
  alt,
  size = "md",
  fallback,
  className,
  /** `circle` (default) or `rounded` for a soft rounded-square tile (sidebar-style logo) */
  shape = "circle",
  ...props
}) {
  const sizes = {
    xs: "w-6 h-6 text-xs",
    sm: "w-7 h-7 text-xs",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
    xl: "w-12 h-12 text-base",
  };

  const roundClass = shape === "rounded" ? "rounded-2xl" : "rounded-full";

  const initials = fallback || (alt ? alt.charAt(0).toUpperCase() : "?");

  return (
    <div
      className={twMerge(
        clsx(
          "inline-flex items-center justify-center bg-gray-500 font-medium text-white flex-shrink-0",
          roundClass,
          sizes[size],
          className
        )
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className={clsx("w-full h-full object-cover", roundClass)}
        />
      ) : (
        <span className="select-none">{initials}</span>
      )}
    </div>
  );
}

export default Avatar;
