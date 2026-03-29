interface DrillTimerBarProps {
  durationSeconds: number
}

function DrillTimerBar({ durationSeconds }: DrillTimerBarProps) {
  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-10 h-1 origin-right bg-slate-500 dark:bg-slate-500"
      style={{
        animation: `drill-timer ${durationSeconds}s linear forwards`,
      }}
    />
  )
}

export default DrillTimerBar
