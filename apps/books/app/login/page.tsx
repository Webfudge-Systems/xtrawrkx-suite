'use client'

import type { ChangeEvent } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@webfudge/auth'
import { AlertCircle, BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button, Input } from '@webfudge/ui'

type FormErrors = {
  email?: string
  password?: string
}

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
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-lg border border-gray-100">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
          <span className="font-medium text-brand-dark">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-primary to-orange-600 flex-col justify-center px-16 py-20">
        <div className="max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-semibold text-lg">Webfudge Books</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">Welcome back</h1>
          <p className="text-xl text-white/90 mb-4">
            Finance and accounting for service agencies and modern teams.
          </p>
          <p className="text-white/80 leading-relaxed">
            Sign in to manage receivables, payables, projects, time tracking, and documents.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-16">
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-brand-foreground">Webfudge Books</span>
          </div>

          <h2 className="text-3xl font-semibold text-brand-dark mb-2">Sign in</h2>
          <p className="text-gray-600 mb-8">Enter your credentials to access Books.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {loginError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Login failed</p>
                  <p className="text-sm text-red-700 mt-1">{loginError}</p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-dark mb-1.5">
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
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-dark mb-1.5">
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
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-dark"
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

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
