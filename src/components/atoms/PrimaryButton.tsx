interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'md' | 'lg'
  ref?: React.Ref<HTMLButtonElement>
}

export default function PrimaryButton({ size = 'md', className, ref, children, ...props }: PrimaryButtonProps) {
  const sizeClasses = size === 'lg' ? 'px-8 py-3 text-lg' : 'px-5 py-2'

  return (
    <button
      ref={ref}
      className={`rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold shadow-md transition-all ${sizeClasses}${className ? ` ${className}` : ''}`}
      {...props}>
      {children}
    </button>
  )
}
