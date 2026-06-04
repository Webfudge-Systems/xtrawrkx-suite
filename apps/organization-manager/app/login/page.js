'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@webfudge/auth';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button, Input } from '@webfudge/ui';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  const { platformLogin, isAuthenticated, isPlatformAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated && isPlatformAdmin()) {
      router.replace('/organizations');
    }
  }, [isAuthenticated, isPlatformAdmin, loading, router]);

  const validate = () => {
    const next = {};
    if (!email) next.email = 'Email is required';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const result = await platformLogin(email, password);
      if (result?.success) router.replace('/organizations');
      else setLoginError(result?.error || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !isSubmitting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-primary to-orange-600 flex-col justify-center px-16 py-20">
        <div className="max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <Image
              src="/favicon/web-app-manifest-512x512.png"
              alt="Xtrawrkx"
              width={40}
              height={40}
              className="rounded-xl"
            />
            <div>
              <p className="text-white font-bold text-lg leading-tight">Fudge Orbit</p>
              <p className="text-white/70 text-xs">by Webfudge Systems</p>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">Platform Admin</h1>
          <p className="text-xl text-white/90 mb-4">
            Create and manage organizations, teams, and platform access across the Xtrawrkx suite.
          </p>
          <p className="text-white/80 leading-relaxed">
            Only seeded platform administrators can access this portal.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { label: 'Organizations', value: 'Create' },
              { label: 'Users', value: 'Manage' },
              { label: 'Access', value: 'Control' },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 rounded-xl p-4 text-center">
                <p className="text-white font-semibold text-sm">{item.value}</p>
                <p className="text-white/70 text-xs mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="border-b border-orange-100 bg-gradient-to-r from-brand-primary to-orange-600 px-6 py-5 lg:hidden w-full absolute top-0">
        <div className="flex items-center gap-3 text-white">
          <Image src="/favicon/web-app-manifest-512x512.png" alt="Xtrawrkx" width={36} height={36} className="rounded-lg" />
          <div>
            <p className="font-bold">Fudge Orbit</p>
            <p className="text-xs text-white/80">Platform Administration</p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-16 pt-24 lg:pt-16">
        <div className="mx-auto w-full max-w-md">
          <h2 className="mb-2 text-2xl font-semibold text-brand-dark sm:text-3xl">Super admin sign in</h2>
          <p className="mb-8 text-sm text-gray-600">
            Only seeded platform administrators can access this portal.
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            {loginError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="superadmin@xtrawrkx.com" error={errors.email} className="w-full" />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" error={errors.password} className="w-full pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full" variant="primary">
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Signing in...</span>
              ) : (
                'Sign in to admin portal'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
