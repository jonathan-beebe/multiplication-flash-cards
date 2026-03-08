import { useState, useEffect, useRef, useCallback } from "react";

interface UseDrillTimerOptions {
  onComplete: (correctCount: number, wrongCount: number) => void;
}

interface UseDrillTimerResult {
  timeRemaining: number;
  timerAnnouncement: string;
  recordCorrect: () => void;
  recordWrong: () => void;
}

function useDrillTimer(
  durationMinutes: number,
  { onComplete }: UseDrillTimerOptions
): UseDrillTimerResult {
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);
  const [timerAnnouncement, setTimerAnnouncement] = useState("");
  const correctCountRef = useRef(0);
  const wrongCountRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining]);

  useEffect(() => {
    if (timeRemaining === 0) {
      onCompleteRef.current(correctCountRef.current, wrongCountRef.current);
    } else if (timeRemaining === 60) {
      setTimerAnnouncement("1 minute remaining");
    } else if (timeRemaining === 30) {
      setTimerAnnouncement("30 seconds remaining");
    } else if (timeRemaining === 10) {
      setTimerAnnouncement("10 seconds remaining");
    }
  }, [timeRemaining]);

  const recordCorrect = useCallback(() => { correctCountRef.current += 1; }, []);
  const recordWrong = useCallback(() => { wrongCountRef.current += 1; }, []);

  return { timeRemaining, timerAnnouncement, recordCorrect, recordWrong };
}

export { useDrillTimer };
