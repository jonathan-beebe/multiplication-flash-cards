import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react'

interface UseDrillTimerOptions {
  onComplete: (correctCount: number, wrongCount: number) => void
}

interface UseDrillTimerResult {
  timeRemaining: number
  timerAnnouncement: string
  recordCorrect: () => void
  recordWrong: () => void
}

function useDrillTimer(durationMinutes: number, { onComplete }: UseDrillTimerOptions): UseDrillTimerResult {
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60)
  const correctCountRef = useRef(0)
  const wrongCountRef = useRef(0)
  const onCompleteRef = useRef(onComplete)
  useLayoutEffect(() => {
    onCompleteRef.current = onComplete
  })

  useEffect(() => {
    if (timeRemaining <= 0) return
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [timeRemaining])

  const timerAnnouncement = useMemo(() => {
    if (timeRemaining === 60) return '1 minute remaining'
    if (timeRemaining === 30) return '30 seconds remaining'
    if (timeRemaining === 10) return '10 seconds remaining'
    return ''
  }, [timeRemaining])

  useEffect(() => {
    if (timeRemaining === 0) {
      onCompleteRef.current(correctCountRef.current, wrongCountRef.current)
    }
  }, [timeRemaining])

  const recordCorrect = useCallback(() => {
    correctCountRef.current += 1
  }, [])
  const recordWrong = useCallback(() => {
    wrongCountRef.current += 1
  }, [])

  return { timeRemaining, timerAnnouncement, recordCorrect, recordWrong }
}

export { useDrillTimer }
