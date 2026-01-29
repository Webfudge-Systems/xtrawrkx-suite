"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { ChevronDown, Search, X } from "lucide-react";

export function SearchableSelect({
  label,
  error,
  options = [],
  placeholder = "Select an option",
  required = false,
  className,
  containerClassName,
  onChange,
  value,
  disabled = false,
  icon: Icon,
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search query
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected option label
  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : "";

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickInsideContainer = containerRef.current?.contains(event.target);
      const isClickInsideDropdown = dropdownRef.current?.contains(event.target);
      
      if (!isClickInsideContainer && !isClickInsideDropdown) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Focus search input when dropdown opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue) => {
    if (onChange) {
      onChange(optionValue);
    }
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchQuery("");
      }
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange("");
    }
    setSearchQuery("");
  };

  return (
    <div className={clsx("w-full", containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative" ref={containerRef}>
        {/* Selected value display */}
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={clsx(
            "block w-full rounded-lg border shadow-sm appearance-none",
            "px-3 py-2.5 pr-10 text-gray-900 text-left",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "transition-colors duration-200",
            "flex items-center justify-between",
            error ? "border-red-300" : "border-gray-300",
            disabled && "bg-gray-100 cursor-not-allowed",
            !disabled && "cursor-pointer hover:border-gray-400",
            className
          )}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {Icon && (
              <Icon className="h-5 w-5 text-gray-400 flex-shrink-0" />
            )}
            <span className={clsx("truncate", !displayValue && "text-gray-400")}>
              {displayValue || placeholder}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded"
                onMouseDown={(e) => e.preventDefault()}
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
            <ChevronDown
              className={clsx(
                "h-5 w-5 text-gray-400 transition-transform",
                isOpen && "transform rotate-180"
              )}
            />
          </div>
        </button>

        {/* Dropdown - rendered via portal */}
        {typeof window !== "undefined" &&
          isOpen &&
          createPortal(
            <div
              ref={dropdownRef}
              className="fixed z-[9999] bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-hidden"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search input */}
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setIsOpen(false);
                        setSearchQuery("");
                      }
                    }}
                  />
                </div>
              </div>

              {/* Options list */}
              <div className="max-h-48 overflow-y-auto">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500 text-center">
                    No options found
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={clsx(
                        "w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors",
                        "flex items-center gap-2",
                        value === option.value && "bg-blue-50 text-blue-700"
                      )}
                    >
                      {value === option.value && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      <span className={value === option.value ? "font-medium" : ""}>
                        {option.label}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>,
            document.body
          )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default SearchableSelect;
