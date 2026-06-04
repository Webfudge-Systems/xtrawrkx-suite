'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { ChevronDown } from 'lucide-react'

/**
 * Accordion component – expand/collapse items. Single open by default.
 * @param {Array<{ id: string, label: React.ReactNode, content: React.ReactNode }>} items
 * @param {string} [defaultOpenId] - Initial open item id (default: first item)
 * @param {boolean} [allowMultiple=false] - Allow multiple items open
 * @param {string} [variant='default'] - 'default' | 'outlined'
 * @param {string} [className]
 * @param {string} [itemClassName]
 */
export function Accordion({
  items = [],
  defaultOpenId,
  allowMultiple = false,
  variant = 'default',
  className,
  itemClassName,
  ...props
}) {
  const [openIds, setOpenIds] = useState(() => {
    if (defaultOpenId) return allowMultiple ? [defaultOpenId] : [defaultOpenId]
    return items.length ? [items[0].id] : []
  })

  const isOpen = (id) => openIds.includes(id)

  const toggle = (id) => {
    setOpenIds((prev) => {
      if (allowMultiple) {
        return prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      }
      return prev.includes(id) ? [] : [id]
    })
  }

  const variants = {
    default: 'bg-white border border-gray-100 shadow-sm',
    outlined: 'bg-white border border-gray-200',
  }

  const itemVariants = {
    default: 'border-gray-100',
    outlined: 'border-gray-200',
  }

  const currentItemVariant = itemVariants[variant] || itemVariants.default

  return (
    <div className={clsx('flex flex-col gap-4', className)} {...props}>
      {items.map((item) => {
        const open = isOpen(item.id)
        return (
          <div
            key={item.id}
            className={clsx(
              'rounded-2xl overflow-hidden transition-shadow',
              variants[variant] || variants.default,
              itemClassName
            )}
          >
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className={clsx(
                'flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors',
                'text-gray-900 font-normal hover:bg-gray-50/80',
                '[&_svg]:flex-shrink-0 [&_svg]:transition-transform [&_svg]:duration-200',
                open && '[&_svg]:rotate-180'
              )}
              aria-expanded={open}
              aria-controls={`accordion-content-${item.id}`}
              id={`accordion-trigger-${item.id}`}
            >
              <span className="text-base md:text-lg font-medium leading-snug text-gray-900">{item.label}</span>
              <ChevronDown className="w-5 h-5 text-gray-600" aria-hidden />
            </button>
            <div
              id={`accordion-content-${item.id}`}
              role="region"
              aria-labelledby={`accordion-trigger-${item.id}`}
              className={clsx(
                'grid transition-[grid-template-rows] duration-200',
                open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              )}
            >
              <div className="overflow-hidden">
                <div
                  className={clsx(
                    'px-5 pb-4 pt-0 text-gray-700 text-base md:text-lg leading-relaxed border-t',
                    currentItemVariant
                  )}
                >
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Accordion
