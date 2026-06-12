export const metadata = {
  title: 'Offline',
}

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#FFFAF7] px-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900">You are offline</h1>
      <p className="mt-2 max-w-md text-sm text-gray-600">
        Fudge Grow needs an internet connection for live data. Reconnect and reload this page to
        continue.
      </p>
    </main>
  )
}
