'use client'

import type { ChangeEvent } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@webfudge/auth'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import {
  Button,
  Input,
  LoginBrandCorner,
  LoginProductCredit,
  LoginMobileBrandHeader,
} from '@webfudge/ui'
import { BOOKS_SITE } from '@/lib/site'

type FormErrors = {
  email?: string
  password?: string
}

const loginInputClassName =
  'border-[color:var(--books-input-border)] bg-[var(--books-input-bg)] text-[var(--books-input-text)] placeholder:text-[var(--books-input-placeholder)] focus:ring-orange-500/30'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginError, setLoginError] = useState('')

  const { login, isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && isAuthenticated) router.push('/')
  }, [isAuthenticated, loading, router])

  const validate = () => {
    const next: FormErrors = {}
    if (!email) next.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Enter a valid email'
    if (!password) next.password = 'Password is required'
    else if (password.length < 6) next.password = 'Password must be at least 6 characters'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoginError('')
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const result = await login(email, password)
      if (result?.success) {
        router.replace('/')
      } else {
        setLoginError(result?.error || 'Login failed. Please try again.')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setLoginError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading && !isSubmitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--books-bg-page)]">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--books-border)] bg-[var(--books-bg-card)] px-6 py-4 shadow-[var(--books-shell-shadow)]">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
          <span className="font-medium text-[var(--books-text-primary)]">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-[var(--books-bg-page)]">
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center bg-gradient-to-br from-brand-primary via-orange-500 to-orange-700 px-16 py-20 dark:from-[#431407] dark:via-[#c2410c] dark:to-[#9a3412]">
        <LoginBrandCorner
          brandIconPath={BOOKS_SITE.brandIconPath}
          brandName={BOOKS_SITE.brandName}
        />
        <div className="max-w-lg">
          <LoginProductCredit productName={BOOKS_SITE.name} creatorLine={BOOKS_SITE.brandName} />
          <h1 className="text-5xl font-bold text-white mb-6">Welcome back</h1>
          <p className="text-xl text-white/90 mb-4">{BOOKS_SITE.loginTagline}</p>
          <p className="text-white/80 leading-relaxed">{BOOKS_SITE.loginDetail}</p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            {BOOKS_SITE.loginFeatures.map((item) => (
              <div key={item.label} className="bg-white/10 rounded-xl p-4 text-center">
                <p className="text-white font-semibold text-sm">{item.value}</p>
                <p className="text-white/70 text-xs mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center bg-[var(--books-bg-page)] p-8 lg:w-1/2 lg:p-16">
        <div className="mx-auto w-full max-w-md">
          <LoginMobileBrandHeader
            logoPath={BOOKS_SITE.logoPath}
            productName={BOOKS_SITE.name}
            creatorLine={BOOKS_SITE.brandName}
          />

          <h2 className="mb-2 text-3xl font-semibold text-[var(--books-text-primary)]">Sign in</h2>
          <p className="mb-8 text-[var(--books-text-secondary)]">
            Enter your credentials to access Books.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {loginError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/40">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Login failed</p>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">{loginError}</p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[var(--books-text-primary)]">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="you@company.com"
                error={errors.email}
                className={loginInputClassName}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[var(--books-text-primary)]">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  error={errors.password}
                  className={`${loginInputClassName} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--books-text-tertiary)] hover:text-[var(--books-text-primary)]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full" variant="primary">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--books-text-tertiary)]">
            Don&apos;t have an account? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
