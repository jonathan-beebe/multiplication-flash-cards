import { Link } from "react-router-dom";

interface HomeButtonProps {
  to: string;
  color: "indigo" | "amber";
  children: React.ReactNode;
  'aria-label'?: string;
}

const colorClasses = {
  indigo:
    "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:active:bg-indigo-600",
  amber:
    "bg-amber-600 hover:bg-amber-500 active:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 dark:active:bg-amber-600",
};

export default function HomeButton({ to, color, children, 'aria-label': ariaLabel }: HomeButtonProps) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      className={`w-full rounded-xl px-6 py-4 text-xl font-semibold text-white shadow-lg transition-all duration-150 active:scale-95 active:shadow-sm ${colorClasses[color]}`}
    >
      {children}
    </Link>
  );
}
