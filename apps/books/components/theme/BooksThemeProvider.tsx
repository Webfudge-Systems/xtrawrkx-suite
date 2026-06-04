'use client'

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type BooksTheme = 'light' | 'dark'

type BooksThemeContextValue = {
  theme: BooksTheme
  isDark: boolean
  toggleTheme: () => void
}

const BooksThemeContext = createContext<BooksThemeContextValue | null>(null)

export function BooksThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<BooksTheme>('dark')

  useLayoutEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: BooksTheme = prev === 'dark' ? 'light' : 'dark'
      if (next === 'dark') {
        document.documentElement.classList.add('dark')
        localStorage.setItem('books-theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('books-theme', 'light')
      }
      return next
    })
  }, [])

  const value = useMemo<BooksThemeContextValue>(
    () => ({
      theme,
      isDark: theme === 'dark',
      toggleTheme,
    }),
    [theme, toggleTheme]
  )

  return <BooksThemeContext.Provider value={value}>{children}</BooksThemeContext.Provider>
}

export function useBooksTheme(): BooksThemeContextValue {
  const ctx = useContext(BooksThemeContext)
  if (!ctx) {
    throw new Error('useBooksTheme must be used within BooksThemeProvider')
  }
  return ctx
}
