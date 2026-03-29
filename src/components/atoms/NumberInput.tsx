type FocusColor = 'teal' | 'indigo'

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  focusColor?: FocusColor
  error?: boolean
  ref?: React.Ref<HTMLInputElement>
}

const focusClasses: Record<FocusColor, string> = {
  teal: 'focus:border-teal-500 dark:focus:border-teal-400',
  indigo: 'focus:border-indigo-500 dark:focus:border-indigo-400',
}

export default function NumberInput({
  focusColor = 'teal',
  error = false,
  className,
  ref,
  ...props
}: NumberInputProps) {
  const borderClass = error
    ? 'border-red-400 focus:border-red-400'
    : `border-slate-300 dark:border-slate-600 ${focusClasses[focusColor]}`
  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      className={`w-32 text-center text-2xl font-bold rounded-xl border-2 ${borderClass} bg-white dark:bg-slate-800 text-text px-3 py-2 focus-visible:outline-none tabular-nums${className ? ` ${className}` : ''}`}
      {...props}
    />
  )
}
