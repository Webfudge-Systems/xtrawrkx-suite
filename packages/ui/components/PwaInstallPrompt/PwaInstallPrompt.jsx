'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

const DISMISS_KEY_PREFIX = 'pwa-install-dismissed:'

/**
 * Shows a bottom banner when the browser fires `beforeinstallprompt` (installable PWA).
 */
export default function PwaInstallPrompt({ appName, storageKey }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !storageKey) return

    if (localStorage.getItem(`${DISMISS_KEY_PREFIX}${storageKey}`)) return

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    if (isStandalone) return

    const onBeforeInstall = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [storageKey])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setVisible(false)
  }

  const handleDismiss = () => {
    localStorage.setItem(`${DISMISS_KEY_PREFIX}${storageKey}`, '1')
    setDeferredPrompt(null)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[200] md:left-auto md:right-4 md:max-w-sm"
      role="region"
      aria-label={`Install ${appName}`}
    >
      <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg ring-1 ring-black/5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5630F]/10 text-[#F5630F]">
          <Download className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">Install {appName}</p>
          <p className="mt-0.5 text-xs leading-5 text-gray-600">
            Add to your home screen or desktop for quick access and an app-like experience.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleInstall}
              className="rounded-lg bg-[#F5630F] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#ea580c]"
            >
              Install
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
