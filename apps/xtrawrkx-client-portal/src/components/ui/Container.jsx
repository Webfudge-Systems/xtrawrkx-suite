import { clsx } from "clsx";

export function Container({
  children,
  size = "default", // 'sm', 'default', 'lg', 'xl', 'full'
  className,
  ...props
}) {
  const sizes = {
    sm: "max-w-3xl",
    default: "max-w-7xl",
    lg: "max-w-8xl",
    xl: "max-w-9xl",
    full: "max-w-full",
  };

  return (
    <div
      className={clsx("mx-auto px-4 sm:px-6 lg:px-8", sizes[size], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default Container;
