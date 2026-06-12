'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@webfudge/auth';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import {
  Button,
  Input,
  LoginBrandCorner,
  LoginProductCredit,
  LoginMobileBrandHeader,
} from '@webfudge/ui';
import { PM_SITE } from '../../lib/site';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  const { login, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) router.push('/');
  }, [isAuthenticated, loading, router]);

  const validate = () => {
    const next = {};
    if (!email) next.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    else if (password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result?.success) {
        router.replace('/');
      } else {
        setLoginError(result?.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setLoginError(err?.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !isSubmitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-lg border border-gray-100">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
          <span className="font-medium text-brand-dark">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-primary to-orange-600 relative flex-col justify-center px-16 py-20">
        <LoginBrandCorner
          brandIconPath={PM_SITE.brandIconPath}
          brandName={PM_SITE.brandName}
        />
        <div className="max-w-lg">
          <LoginProductCredit productName={PM_SITE.name} creatorLine={PM_SITE.brandName} />
          <h1 className="text-5xl font-bold text-white mb-6">Welcome back</h1>
          <p className="text-xl text-white/90 mb-4">{PM_SITE.loginTagline}</p>
          <p className="text-white/80 leading-relaxed">{PM_SITE.loginDetail}</p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            {PM_SITE.loginFeatures.map((item) => (
              <div key={item.label} className="bg-white/10 rounded-xl p-4 text-center">
                <p className="text-white font-semibold text-sm">{item.value}</p>
                <p className="text-white/70 text-xs mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-16">
        <div className="w-full max-w-md mx-auto">
          <LoginMobileBrandHeader
            logoPath={PM_SITE.logoPath}
            productName={PM_SITE.name}
            creatorLine={PM_SITE.brandName}
          />
          <h2 className="text-3xl font-semibold text-brand-dark mb-2">Sign in</h2>
          <p className="text-gray-600 mb-8">Enter your credentials to access the PM dashboard.</p>
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
              <label htmlFor="email" className="block text-sm font-medium text-brand-dark mb-1.5">Email</label>
              <Input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" error={errors.email} className="w-full" />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-dark mb-1.5">Password</label>
              <div className="relative">
                <Input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" error={errors.password} className="w-full pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-dark">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full" variant="primary">
              {isSubmitting ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Signing in...</span> : 'Sign in'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
