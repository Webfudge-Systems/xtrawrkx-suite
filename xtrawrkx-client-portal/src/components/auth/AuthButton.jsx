import { motion } from "framer-motion";

export default function AuthButton({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  const variants = {
    primary: "bg-orange-500 hover:bg-orange-600 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900",
    outline: "border border-gray-300 hover:bg-gray-50 text-gray-700",
    ghost: "hover:bg-gray-100 text-gray-700",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm sm:text-base",
    md: "px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base",
    lg: "px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg",
  };

  return (
    <motion.div
      className="pt-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.button
        type={type}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center w-full rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
        whileHover={!disabled && !loading ? { y: -1 } : {}}
        whileTap={!disabled && !loading ? { y: 0 } : {}}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70"></div>
            Loading...
          </div>
        ) : (
          children
        )}
      </motion.button>
    </motion.div>
  );
}
