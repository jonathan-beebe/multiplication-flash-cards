import clsx from "clsx";

interface CardProps {
  a: number;
  b: number;
  className?: string;
  style?: React.CSSProperties;
  onTransitionEnd?: React.TransitionEventHandler<HTMLDivElement>;
}

const baseClasses =
  clsx(
    "card flex items-center justify-center rounded-2xl",
    "bg-slate-50", 
    "shadow-[inset_1px_1px_0px_rgba(255,255,255,0.8),inset_-1px_-1px_0px_rgba(0,0,0,0.12),2px_2px_2px_rgba(0,0,0,0.1)]",
    "border border-t-white/80 border-l-white/80 border-b-slate-300/60 border-r-slate-300/60",
    "dark:bg-slate-800",
    "dark:shadow-[inset_1px_1px_0px_rgba(255,255,255,0.10),inset_-1px_-1px_0px_rgba(0,0,0,0.8),2px_2px_2px_rgba(0,0,0,0.2)]",
    "dark:border-t-slate-600/60 dark:border-l-slate-600/60 dark:border-b-slate-900/80 dark:border-r-slate-900/80 dark:border-none",
  );

function Card({ a, b, className, style, onTransitionEnd }: CardProps) {
  return (
    <div
      className={`${baseClasses}${className ? ` ${className}` : ""}`}
      style={style}
      onTransitionEnd={onTransitionEnd}
    >
      <div className="text-center">
        <span className="text-5xl tabular-nums font-bold text-slate-900 dark:text-slate-100">
          {a} × {b}
        </span>
      </div>
    </div>
  );
}

export default Card;
