import React from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";

export default function Button({
  text,
  type = "primary",
  size = "md",
  className = "",
  link,
  onClick,
  disabled = false,
  icon,
  hideArrow = false,
  htmlType = "button",
  ...props
}) {
  const baseClass =
    type === "primary"
      ? "btn-primary"
      : type === "secondary"
      ? "btn-secondary"
      : "";

  const sizeClass = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "";
  const disabledClass = disabled ? "opacity-50 cursor-not-allowed" : "";

  const buttonContent = (
    <>
      {icon && (
        <Icon
          icon={icon}
          width={size === "sm" ? 16 : size === "lg" ? 20 : 18}
          height={size === "sm" ? 16 : size === "lg" ? 20 : 18}
          className="mr-2 shrink-0"
        />
      )}
      <span className="min-w-0 flex-1 text-left">{text}</span>
      {!hideArrow && (
        <span className="btn-icon shrink-0" aria-hidden>
          <Icon icon="solar:arrow-right-up-linear" width="18" height="18" />
        </span>
      )}
    </>
  );

  if (link && !disabled) {
    return (
      <Link
        href={link}
        className={`${baseClass} ${sizeClass} ${className} ${disabledClass}`}
        onClick={onClick}
        {...props}
      >
        {buttonContent}
      </Link>
    );
  }

  return (
    <button
      type={htmlType}
      className={`${baseClass} ${sizeClass} ${className} ${disabledClass}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {buttonContent}
    </button>
  );
}
