'use client'

import { useState } from 'react'
import { Button, Input, LoadingSpinner } from '@webfudge/ui'
import { authService } from '@webfudge/auth'
import AuthErrorAlert from './AuthErrorAlert'
import PasswordField from './PasswordField'

export default function LoginFormSection() {
  const [formData, setFormData] = useState({ identifier: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.login(formData.identifier, formData.password)
      window.location.href = '/'
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full lg:w-1/2 flex flex-col justify-end py-0 px-0">
      <div className="w-full h-full flex flex-col justify-end">
        <div
          className="bg-white shadow-2xl rounded-t-3xl border border-gray-100 overflow-hidden flex flex-col mt-16 lg:mr-16 max-w-xl mx-auto w-full"
          style={{ height: 'calc(100vh - 6rem)' }}
        >
          <div className="text-center py-8 px-6">
            <h2 className="text-4xl font-semibold text-gray-900">Welcome Back!</h2>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          <div className="flex-1 py-8 px-6 flex flex-col justify-between overflow-y-auto">
            <div className="flex-1 flex flex-col justify-start">
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && <AuthErrorAlert title="Login Failed" message={error} />}

                <Input
                  id="identifier"
                  name="identifier"
                  type="email"
                  label="Email"
                  autoComplete="email"
                  required
                  value={formData.identifier}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="py-3 text-base"
                />

                <PasswordField
                  id="password"
                  name="password"
                  label="Password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="py-3 text-base"
                />

                <Button
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  size="lg"
                  className="w-full inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </form>
            </div>

            <div className="text-center py-4 mt-6">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <a href="/signup" className="text-brand-primary hover:underline font-medium">
                  Sign up
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
