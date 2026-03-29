import { useUpdateAvailable } from '@/lib/pwa/useUpdateAvailable'

interface UpdateBannerContentProps {
  onUpdate?: () => void
}

export function UpdateBannerContent({ onUpdate }: UpdateBannerContentProps) {
  return (
    <div
      role="alert"
      className="flex items-center gap-4 rounded-full bg-amber-100 px-4 py-2 text-sm whitespace-nowrap text-amber-900 shadow-md dark:bg-amber-900 dark:text-amber-100">
      <span>A new version is available.</span>
      <button
        onClick={onUpdate}
        aria-label="Update app to new version"
        className="rounded bg-amber-700 px-3 py-1 font-semibold text-white hover:bg-amber-800 focus-visible:outline-offset-2">
        Update
      </button>
    </div>
  )
}

export function UpdateBanner() {
  const { updateAvailable, applyUpdate } = useUpdateAvailable()

  if (!updateAvailable) return null

  return (
    <div className="fixed left-1/2 top-12 z-50 -translate-x-1/2">
      <UpdateBannerContent onUpdate={applyUpdate} />
    </div>
  )
}
