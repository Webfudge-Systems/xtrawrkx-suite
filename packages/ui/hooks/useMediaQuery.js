'use client'

import { useEffect, useState } from 'react'

/**
 * @param {string} query CSS media query (e.g. `(max-width: 767px)`)
 * @param {boolean} [defaultValue=false] Value before `matchMedia` runs (SSR / first paint)
 */
export function useMediaQuery(query, defaultValue = false) {
  const [matches, setMatches] = useState(defaultValue)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)

    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}
