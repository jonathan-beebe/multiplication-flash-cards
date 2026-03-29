interface ErrorTextProps {
  id?: string
  children: React.ReactNode
}

export default function ErrorText({ id, children }: ErrorTextProps) {
  return (
    <p id={id} role="alert" className="text-center text-sm font-medium text-red-600 dark:text-red-400">
      {children}
    </p>
  )
}
