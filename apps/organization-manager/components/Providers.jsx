'use client'

import { AuthProvider } from '@webfudge/auth'

export default function Providers({ children }) {
  return <AuthProvider>{children}</AuthProvider>
}
