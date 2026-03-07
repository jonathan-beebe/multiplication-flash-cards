type FocusColor = "teal" | "indigo";

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  focusColor?: FocusColor;
  ref?: React.Ref<HTMLInputElement>;
}

const focusClasses: Record<FocusColor, string> = {
  teal: "focus:border-teal-500 dark:focus:border-teal-400",
  indigo: "focus:border-indigo-500 dark:focus:border-indigo-400",
};

export default function NumberInput({
  focusColor = "teal",
  className,
  ref,
  ...props
}: NumberInputProps) {
  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      className={`w-32 text-center text-2xl font-bold rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-text px-3 py-2 focus:outline-none tabular-nums ${focusClasses[focusColor]}${className ? ` ${className}` : ""}`}
      {...props}
    />
  );
}
