interface SuccessTextProps {
  id?: string
  'aria-label'?: string
  children: React.ReactNode
}

export default function SuccessText({ id, 'aria-label': ariaLabel, children }: SuccessTextProps) {
  return (
    <p id={id} aria-label={ariaLabel} className="text-2xl font-bold tabular-nums text-teal-600 dark:text-teal-400">
      {children}
    </p>
  )
}
