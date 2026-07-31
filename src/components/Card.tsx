import { cardBaseClasses } from '@/components/cardClasses'

interface CardProps {
  display: React.ReactNode
  srText: string
  className?: string
  contentClassName?: string
  style?: React.CSSProperties
  onTransitionEnd?: React.TransitionEventHandler<HTMLDivElement>
  'aria-hidden'?: boolean | 'true' | 'false'
}

function Card({
  display,
  srText,
  className,
  contentClassName,
  style,
  onTransitionEnd,
  'aria-hidden': ariaHidden,
}: CardProps) {
  return (
    <div
      className={`${cardBaseClasses}${className ? ` ${className}` : ''}`}
      style={style}
      onTransitionEnd={onTransitionEnd}
      aria-hidden={ariaHidden}>
      <div className={contentClassName ?? 'text-center'}>
        <span className="text-5xl tabular-nums font-bold text-text" aria-hidden="true">
          {display}
        </span>
        <span className="sr-only">{srText}</span>
      </div>
    </div>
  )
}

export default Card
