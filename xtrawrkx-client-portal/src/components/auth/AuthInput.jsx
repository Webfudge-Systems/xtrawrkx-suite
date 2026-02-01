import { motion } from "framer-motion";
import { Mail, Lock, User, Phone } from "lucide-react";

const iconMap = {
  email: Mail,
  password: Lock,
  text: User,
  tel: Phone,
};

export default function AuthInput({
  type = "text",
  label,
  placeholder,
  required = false,
  error,
  className = "",
  ...props
}) {
  const Icon = iconMap[type] || User;

  return (
    <motion.div
      className={`w-full ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {label && (
        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 break-words">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative w-full">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none z-10">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          required={required}
          className={`block w-full rounded-lg border shadow-sm px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200 ${
            Icon ? "pl-10 sm:pl-12" : ""
          } ${
            error
              ? "border-red-300 text-red-900 focus:ring-red-500"
              : "border-gray-300 focus:ring-orange-500"
          } ${className}`}
          {...props}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </div>
      {error && (
        <motion.p
          className="mt-1 text-sm text-red-600"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}
