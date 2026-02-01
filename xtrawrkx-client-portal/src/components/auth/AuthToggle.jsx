import Link from "next/link";
import { motion } from "framer-motion";

export default function AuthToggle({
  text,
  linkText,
  href,
  onClick,
  className = "",
}) {
  return (
    <motion.div
      className={`text-center text-sm ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <span className="text-gray-600">
        {text}{" "}
        {href ? (
          <Link
            href={href}
            className="text-[#FF4A74] hover:text-orange-600 font-medium transition-colors"
          >
            {linkText}
          </Link>
        ) : (
          <button
            onClick={onClick}
            className="text-[#FF4A74] hover:text-orange-600 font-medium transition-colors"
          >
            {linkText}
          </button>
        )}
      </span>
    </motion.div>
  );
}
