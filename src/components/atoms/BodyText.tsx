export default function BodyText({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-base text-text${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </p>
  )
}
