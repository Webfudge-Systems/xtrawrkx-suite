'use client'

import { clsx } from 'clsx'

/**
 * Section layout – semantic <section> with consistent spacing and variants.
 * @param {string} [id] - Section id (for anchor links)
 * @param {string} [ariaLabel] - aria-label for accessibility
 * @param {'default'|'hero'|'fullscreen'} [variant='default'] - Layout variant
 * @param {string} [className] - Additional classes
 * @param {React.ReactNode} children
 */
export function Section({ id, ariaLabel, variant = 'default', className, children, ...props }) {
  const variants = {
    default: 'relative w-full overflow-hidden bg-brand-light py-16 md:py-24 scroll-mt-20',
    hero: 'relative min-h-[100vh] overflow-hidden bg-brand-light scroll-mt-20',
    fullscreen: 'relative w-full min-h-screen overflow-hidden scroll-mt-20',
  }

  return (
    <section
      id={id}
      className={clsx(variants[variant] || variants.default, className)}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </section>
  )
}

export default Section
