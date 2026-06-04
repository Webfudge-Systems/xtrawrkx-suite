import { clsx } from "clsx";

export function Container({ children, size = "default", className, ...props }) {
  const sizes = {
    sm: "max-w-3xl",
    default: "max-w-7xl",
    lg: "max-w-none",
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
