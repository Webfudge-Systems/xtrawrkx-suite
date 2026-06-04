'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ChevronDown, Search } from 'lucide-react'

const SEARCHABLE_OPTION_THRESHOLD = 8
const DEFAULT_LIST_MAX_HEIGHT = 'max-h-52'
const MENU_GAP_PX = 4
const VIEWPORT_PADDING_PX = 8
const SEARCH_HEADER_HEIGHT_PX = 56
const MIN_LIST_HEIGHT_PX = 96
const PREFERRED_LIST_MAX_PX = 208 // matches max-h-52

/** Visible scrollbar for searchable dropdown lists (Windows overlay scrollbars, portaled menus). */
const SCROLLABLE_OPTIONS_LIST_CLASS =
  'min-h-0 overflow-y-scroll overscroll-contain [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:rgb(156_163_175)_rgb(243_244_246)] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 hover:[&::-webkit-scrollbar-thumb]:bg-gray-500'

function normalizeValue(value) {
  if (value == null) return ''
  return String(value)
}

function SearchableSelect({
  label,
  error,
  options = [],
  placeholder = 'Select an option',
  allowEmpty = true,
  required = false,
  className,
  containerClassName,
  icon: Icon,
  onChange,
  value,
  disabled,
  searchPlaceholder = 'Search…',
  listMaxHeight = DEFAULT_LIST_MAX_HEIGHT,
  listClassName,
  menuPortal = true,
  chevronClassName,
  /** When true, shows "Add …" when search text does not match an existing option. */
  allowCustom = false,
  id: idProp,
  ...props
}) {
  const autoId = useId()
  const controlId = idProp || autoId
  const listboxId = `${controlId}-listbox`
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const searchRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [menuCoords, setMenuCoords] = useState({
    top: undefined,
    bottom: undefined,
    left: 0,
    width: 0,
    placement: 'below',
    maxHeight: undefined,
    listMaxHeight: undefined,
  })

  const normalizedValue = normalizeValue(value)

  const allOptions = useMemo(() => {
    const rows = options.map((option) => ({
      value: normalizeValue(option.value),
      label: option.label ?? option.value,
      disabled: Boolean(option.disabled),
    }))
    if (!allowEmpty) return rows
    const hasEmpty = rows.some((row) => row.value === '')
    if (hasEmpty) return rows
    return [{ value: '', label: placeholder, disabled: false }, ...rows]
  }, [allowEmpty, options, placeholder])

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allOptions
    return allOptions.filter((row) => row.label.toLowerCase().includes(q))
  }, [allOptions, query])

  const customAddLabel = useMemo(() => {
    const q = query.trim()
    if (!allowCustom || !q) return null
    const lower = q.toLowerCase()
    const exists = allOptions.some(
      (row) =>
        row.label.toLowerCase() === lower ||
        row.value.toLowerCase() === lower
    )
    return exists ? null : q
  }, [allowCustom, allOptions, query])

  const selectedOption = useMemo(
    () => allOptions.find((row) => row.value === normalizedValue),
    [allOptions, normalizedValue]
  )

  const displayLabel = selectedOption?.label || placeholder

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return undefined

    const updatePosition = () => {
      const trigger = triggerRef.current
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PADDING_PX
      const spaceAbove = rect.top - VIEWPORT_PADDING_PX
      const menuHeight = menuRef.current?.offsetHeight ?? 0
      const preferredHeight = Math.min(
        PREFERRED_LIST_MAX_PX + SEARCH_HEADER_HEIGHT_PX,
        menuHeight || PREFERRED_LIST_MAX_PX + SEARCH_HEADER_HEIGHT_PX
      )

      const openAbove =
        spaceBelow < preferredHeight + MENU_GAP_PX && spaceAbove > spaceBelow

      const availableSpace = (openAbove ? spaceAbove : spaceBelow) - MENU_GAP_PX
      const panelMaxHeight = Math.max(
        SEARCH_HEADER_HEIGHT_PX + MIN_LIST_HEIGHT_PX,
        availableSpace
      )
      const listMaxHeight = Math.max(
        MIN_LIST_HEIGHT_PX,
        Math.min(PREFERRED_LIST_MAX_PX, panelMaxHeight - SEARCH_HEADER_HEIGHT_PX)
      )

      setMenuCoords({
        placement: openAbove ? 'above' : 'below',
        top: menuPortal && !openAbove ? rect.bottom + MENU_GAP_PX : undefined,
        bottom: menuPortal && openAbove ? window.innerHeight - rect.top + MENU_GAP_PX : undefined,
        left: rect.left,
        width: rect.width,
        maxHeight: panelMaxHeight,
        listMaxHeight,
      })
    }

    let resizeObserver

    const connectObserver = () => {
      const menuEl = menuRef.current
      if (!menuEl || typeof ResizeObserver === 'undefined') return
      resizeObserver = new ResizeObserver(updatePosition)
      resizeObserver.observe(menuEl)
    }

    updatePosition()
    const raf = requestAnimationFrame(() => {
      updatePosition()
      connectObserver()
    })

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      resizeObserver?.disconnect()
    }
  }, [open, menuPortal, filteredOptions.length, query])

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      const target = event.target
      if (rootRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
      setQuery('')
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => searchRef.current?.focus(), 0)
      return () => window.clearTimeout(t)
    }
    return undefined
  }, [open])

  const pick = (nextValue) => {
    if (onChange) onChange(nextValue)
    setOpen(false)
    setQuery('')
  }

  const triggerClasses = twMerge(
    'flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white text-left text-gray-900 shadow-sm',
    'py-2.5 pr-10',
    Icon ? 'pl-10' : 'px-3',
    'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
    'transition-colors duration-200',
    'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
    error && 'border-red-300',
    open && !className && 'border-orange-500 ring-2 ring-orange-500 ring-offset-0',
    !selectedOption && allowEmpty && 'text-gray-500',
    className
  )

  const menuPanel = (
    <div
      ref={menuRef}
      className={clsx(
        'flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg',
        menuPortal
          ? 'fixed z-[200]'
          : clsx(
              'absolute left-0 right-0 z-50',
              menuCoords.placement === 'above' ? 'bottom-full mb-1' : 'top-full mt-1'
            ),
        listClassName
      )}
      style={
        menuPortal
          ? {
              top: menuCoords.top,
              bottom: menuCoords.bottom,
              left: menuCoords.left,
              width: menuCoords.width,
              maxHeight: menuCoords.maxHeight,
            }
          : { maxHeight: menuCoords.maxHeight }
      }
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="shrink-0 border-b border-gray-100 p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-md border border-gray-200 py-2 pl-8 pr-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
            onKeyDown={(event) => event.stopPropagation()}
          />
        </div>
      </div>
      <ul
        id={listboxId}
        role="listbox"
        aria-label={label || 'Options'}
        className={clsx('flex-1 py-1', SCROLLABLE_OPTIONS_LIST_CLASS, listMaxHeight)}
        style={
          menuCoords.listMaxHeight != null
            ? { maxHeight: menuCoords.listMaxHeight }
            : undefined
        }
      >
        {filteredOptions.length === 0 && !customAddLabel ? (
          <li className="px-3 py-2 text-sm text-gray-500">No matches</li>
        ) : (
          filteredOptions.map((row) => {
            const selected = row.value === normalizedValue
            return (
              <li key={row.value === '' ? '__empty__' : row.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={row.disabled}
                  className={clsx(
                    'flex w-full px-3 py-2 text-left text-sm',
                    selected
                      ? 'bg-orange-50 font-medium text-orange-900'
                      : 'text-gray-800 hover:bg-gray-50',
                    row.disabled && 'cursor-not-allowed opacity-50'
                  )}
                  onClick={() => {
                    if (row.disabled) return
                    pick(row.value)
                  }}
                >
                  <span className="min-w-0 truncate">{row.label}</span>
                </button>
              </li>
            )
          })
        )}
        {customAddLabel ? (
          <li role="presentation" className="border-t border-gray-100">
            <button
              type="button"
              role="option"
              aria-selected={normalizedValue === customAddLabel}
              className="flex w-full px-3 py-2 text-left text-sm font-medium text-orange-700 hover:bg-orange-50"
              onClick={() => pick(customAddLabel)}
            >
              <span className="min-w-0 truncate">Add &ldquo;{customAddLabel}&rdquo;</span>
            </button>
          </li>
        ) : null}
      </ul>
    </div>
  )

  return (
    <div className={clsx('w-full', containerClassName)} ref={rootRef} {...props}>
      {label ? (
        <label htmlFor={controlId} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
          {required ? <span className="ml-1 text-red-500">*</span> : null}
        </label>
      ) : null}
      <div className="relative">
        {Icon ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        ) : null}
        <button
          ref={triggerRef}
          id={controlId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          className={triggerClasses}
          onClick={() => {
            if (disabled) return
            setOpen((prev) => !prev)
            if (open) setQuery('')
          }}
        >
          <span className="min-w-0 flex-1 truncate">{displayLabel}</span>
        </button>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDown
            className={clsx(
              'h-5 w-5 transition-transform',
              chevronClassName || 'text-gray-400',
              open && 'rotate-180'
            )}
          />
        </div>
        {open && !menuPortal ? menuPanel : null}
      </div>
      {open && menuPortal && typeof document !== 'undefined'
        ? createPortal(menuPanel, document.body)
        : null}
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}

export function Select({
  label,
  error,
  options = [],
  placeholder = 'Select an option',
  /** When false, omits the empty placeholder option (for locked single-value fields). */
  allowEmpty = true,
  required = false,
  className,
  containerClassName,
  icon: Icon,
  onChange,
  /** Enable search + scrollable list. Defaults to true when there are more than 7 options. */
  searchable,
  searchPlaceholder = 'Search…',
  listMaxHeight = DEFAULT_LIST_MAX_HEIGHT,
  listClassName,
  menuPortal = true,
  chevronClassName,
  allowCustom = false,
  value,
  disabled,
  ...props
}) {
  const useSearchable =
    searchable ?? options.length >= SEARCHABLE_OPTION_THRESHOLD

  if (useSearchable) {
    return (
      <SearchableSelect
        label={label}
        error={error}
        options={options}
        placeholder={placeholder}
        allowEmpty={allowEmpty}
        required={required}
        className={className}
        containerClassName={containerClassName}
        icon={Icon}
        onChange={onChange}
        value={value}
        disabled={disabled}
        searchPlaceholder={searchPlaceholder}
        listMaxHeight={listMaxHeight}
        listClassName={listClassName}
        menuPortal={menuPortal}
        chevronClassName={chevronClassName}
        allowCustom={allowCustom}
        {...props}
      />
    )
  }

  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value)
    }
  }

  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <select
          className={twMerge(
            'block w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 shadow-none',
            Icon && 'pl-10',
            'focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20',
            'transition-colors duration-200',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            error && 'border-red-300',
            className
          )}
          onChange={handleChange}
          value={value}
          disabled={disabled}
          {...props}
        >
          {allowEmpty ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

export default Select
