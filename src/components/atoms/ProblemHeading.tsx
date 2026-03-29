interface ProblemHeadingProps {
  'aria-label'?: string
  children: React.ReactNode
}

export default function ProblemHeading({ 'aria-label': ariaLabel, children }: ProblemHeadingProps) {
  return (
    <h1 className="text-4xl font-bold tabular-nums text-text" aria-label={ariaLabel}>
      {children}
    </h1>
  )
}
