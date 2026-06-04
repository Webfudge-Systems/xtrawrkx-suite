import { clsx } from "clsx";
import { User } from "lucide-react";

const sizes = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-lg",
  xl: "w-14 h-14 text-xl",
};

export function Avatar({
  src,
  alt = "",
  name,
  initials,
  size = "md",
  status, // 'online', 'offline', 'away', 'busy'
  color = "bg-gray-500",
  className,
  hoverable = false,
  ...props
}) {
  const getInitials = (name) => {
    if (initials) return initials;
    if (!name) return "";
    const words = name.split(" ");
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (
      words[0].charAt(0).toUpperCase() +
      words[words.length - 1].charAt(0).toUpperCase()
    );
  };

  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    away: "bg-yellow-500",
    busy: "bg-red-500",
  };

  return (
    <div className="relative inline-block">
      <div
        className={clsx(
          "relative flex items-center justify-center rounded-full overflow-hidden transition-all duration-200",
          src ? "bg-gray-100" : color,
          sizes[size],
          hoverable && "hover:scale-105 cursor-pointer",
          className
        )}
        {...props}
      >
        {src ? (
          <AvatarImage
            src={src}
            alt={alt || name}
            className="w-full h-full object-cover"
          />
        ) : name || initials ? (
          <AvatarFallback className="font-semibold text-white">
            {getInitials(name)}
          </AvatarFallback>
        ) : (
          <AvatarFallback>
            <User className="w-1/2 h-1/2 text-gray-400" />
          </AvatarFallback>
        )}
      </div>
      {status && (
        <span
          className={clsx(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-white",
            statusColors[status],
            size === "xs" && "w-2 h-2",
            size === "sm" && "w-2.5 h-2.5",
            size === "md" && "w-3 h-3",
            size === "lg" && "w-3.5 h-3.5",
            size === "xl" && "w-4 h-4"
          )}
        />
      )}
    </div>
  );
}

// Avatar sub-components for compatibility
export function AvatarImage({ src, alt, className, ...props }) {
  return <img src={src} alt={alt} className={className} {...props} />;
}

export function AvatarFallback({ children, className, ...props }) {
  return (
    <span className={className} {...props}>
      {children}
    </span>
  );
}

export default Avatar;
