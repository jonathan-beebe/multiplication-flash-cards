import { useUpdateAvailable } from '@/lib/pwa/useUpdateAvailable'

export function UpdateBanner() {
  const { updateAvailable, applyUpdate } = useUpdateAvailable()

  if (!updateAvailable) return null

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-4 bg-amber-100 px-4 py-2 text-sm text-amber-900 dark:bg-amber-900 dark:text-amber-100"
    >
      <span>A new version is available.</span>
      <button
        onClick={applyUpdate}
        className="rounded bg-amber-500 px-3 py-1 font-semibold text-white hover:bg-amber-600 focus-visible:outline-offset-2"
      >
        Update
      </button>
    </div>
  )
}
