export default function SecondaryText({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm text-slate-500 dark:text-slate-400${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </p>
  )
}
