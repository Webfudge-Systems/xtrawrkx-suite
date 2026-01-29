import { motion } from "framer-motion";
import { LogIn, UserPlus, KeyRound } from "lucide-react";

const iconMap = {
  "Welcome Back": LogIn,
  "Create Account": UserPlus,
  "Reset Your Password": KeyRound,
  "Check Your Email": KeyRound,
};

export default function AuthCard({
  title,
  subtitle,
  children,
  className = "",
}) {
  const Icon = iconMap[title] || LogIn;

  return (
    <div className={`w-full max-w-full overflow-hidden ${className}`}>
      {/* Header with Icon */}
      <motion.div
        className="mb-6 sm:mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-orange-500 flex items-center justify-center shadow-md flex-shrink-0">
            <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{title}</h3>
          {subtitle && <p className="text-sm sm:text-base text-gray-600 mt-2 break-words">{subtitle}</p>}
        </div>
      </motion.div>

      {/* Form Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
