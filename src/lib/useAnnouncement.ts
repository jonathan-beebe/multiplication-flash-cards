import { useState, useRef, useEffect, useCallback } from 'react'

/**
 * Manages an ARIA live region announcement string.
 *
 * Clears the message before setting the new one so screen readers always
 * re-announce, even when the text hasn't changed.
 */
export function useAnnouncement() {
  const [announcement, setAnnouncement] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const announce = useCallback((text: string) => {
    setAnnouncement('')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setAnnouncement(text), 50)
  }, [])

  return { announcement, announce }
}
