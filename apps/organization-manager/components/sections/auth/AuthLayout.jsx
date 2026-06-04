'use client'

import AuthBackground from './AuthBackground'
import AuthBrandingSide from './AuthBrandingSide'

export default function AuthLayout({ title, subtitle, description, children }) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <AuthBackground />
      <div className="relative z-10 min-h-screen w-[85%] mx-auto flex">
        <AuthBrandingSide title={title} subtitle={subtitle} description={description} />
        {children}
      </div>
    </div>
  )
}
