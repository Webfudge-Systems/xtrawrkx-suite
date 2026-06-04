'use client'

export default function AuthBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-orange-50 via-brand-primary/30 to-brand-primary">
      <div className="absolute inset-0 bg-gradient-to-tr from-orange-100/40 via-orange-50/30 to-orange-200/40"></div>
      <div className="absolute inset-0 bg-gradient-to-bl from-orange-100/30 via-orange-50/20 to-orange-200/35"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute top-3/4 right-1/4 w-48 h-48 bg-orange-100/30 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: '2s' }}
      ></div>
      <div
        className="absolute bottom-1/4 left-1/3 w-32 h-32 bg-orange-50/25 rounded-full blur-xl animate-pulse"
        style={{ animationDelay: '4s' }}
      ></div>
    </div>
  )
}
