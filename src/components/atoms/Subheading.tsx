export default function Subheading({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-lg font-semibold text-text${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </p>
  )
}
