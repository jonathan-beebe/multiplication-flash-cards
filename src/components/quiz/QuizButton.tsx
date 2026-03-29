interface QuizButtonProps {
  value: number
  onClick: () => void
  disabled: boolean
  state: 'default' | 'correct' | 'wrong' | 'fade-out'
}

export default function QuizButton({ value, onClick, disabled, state }: QuizButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={state === 'wrong' ? `${value}, incorrect` : `Answer: ${value}`}
      className={`min-w-[72px] rounded-xl px-6 py-4 text-xl tabular-nums font-semibold shadow-lg transition-all duration-150 active:scale-90 active:shadow-sm disabled:active:scale-100 disabled:active:shadow-lg ${
        state === 'fade-out' ? 'opacity-0' : ''
      } ${
        state === 'correct'
          ? 'bg-correct text-white'
          : state === 'wrong'
            ? 'cursor-not-allowed bg-wrong text-white line-through'
            : 'border border-slate-500 dark:border-slate-400 bg-slate-200 text-slate-900 hover:bg-slate-300 active:bg-slate-400 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 dark:active:bg-slate-500'
      }`}>
      {value}
    </button>
  )
}
