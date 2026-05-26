"use client";

import { Icon } from "@iconify/react";
import clsx from "clsx";

/** Left icon circle — mirrors `.btn-primary .btn-icon` for Back */
function BackIconCircle() {
  return (
    <span className="btn-icon !ml-0 shrink-0 bg-slate-100 text-brand-dark">
      <Icon icon="solar:arrow-left-linear" width={18} height={18} />
    </span>
  );
}

/** Right icon circle — same as site Register / `.btn-primary` */
function ContinueIconCircle({ className = "" }) {
  return (
    <span className={clsx("btn-icon shrink-0", className)}>
      <Icon icon="solar:arrow-right-up-linear" width={18} height={18} />
    </span>
  );
}

export function FormBackButton({ onClick, disabled = false, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "btn-secondary shrink-0 !justify-start !gap-2 !py-1 !pl-1 !pr-5",
        "hover:-translate-y-0.5 active:scale-[0.99]",
        className
      )}
    >
      <BackIconCircle />
      <span className="whitespace-nowrap pr-1">Back</span>
    </button>
  );
}

export function FormContinueButton({
  text = "Continue",
  onClick,
  htmlType = "button",
  loading = false,
  disabled = false,
  className = "",
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={htmlType}
      onClick={onClick}
      disabled={isDisabled}
      className={clsx(
        "btn-primary relative min-w-0 !block !py-1 !pr-1 !pl-1",
        "hover:-translate-y-0.5 active:scale-[0.99]",
        "disabled:hover:translate-y-0",
        className
      )}
    >
      <span className="flex w-full items-center justify-center px-11 py-2 text-center">
        {loading ? (
          <Icon
            icon="solar:loading-bold"
            width={18}
            height={18}
            className="animate-spin"
          />
        ) : (
          <span className="truncate">{text}</span>
        )}
      </span>
      {!loading ? (
        <ContinueIconCircle className="absolute right-1 top-1/2 !ml-0 -translate-y-1/2" />
      ) : null}
    </button>
  );
}

/** Text option link — not a button; sits beside footer copy */
export function FormSkipLink({ onClick, disabled = false, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "shrink-0 text-sm font-normal text-slate-600 transition-colors duration-200",
        "hover:text-slate-900",
        "focus-visible:outline-none focus-visible:text-slate-900",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      Skip for Now
    </button>
  );
}

/** Back | Continue — Register-style pills */
export function SignupStepNav({
  showBack = false,
  onBack,
  continueText = "Continue",
  onContinue,
  htmlType = "button",
  loading = false,
  disabled = false,
}) {
  const onlyContinue = !showBack;

  return (
    <div
      className={clsx(
        "flex w-full items-center gap-2 sm:gap-3",
        onlyContinue && "justify-stretch"
      )}
    >
      {showBack ? (
        <FormBackButton onClick={onBack} disabled={disabled} />
      ) : null}

      {showBack ? <span className="min-w-0 flex-1" aria-hidden="true" /> : null}

      <FormContinueButton
        text={continueText}
        htmlType={htmlType}
        onClick={onContinue}
        loading={loading}
        disabled={disabled}
        className={clsx(onlyContinue ? "w-full flex-1" : "min-w-0 flex-[1.4] sm:flex-[1.55]")}
      />
    </div>
  );
}
