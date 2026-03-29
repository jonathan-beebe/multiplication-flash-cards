export default function MonoText({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`font-mono tabular-nums text-xl text-text${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </p>
  )
}
