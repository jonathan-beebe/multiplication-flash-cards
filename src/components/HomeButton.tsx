import { Link } from "react-router-dom";

interface HomeButtonProps {
  to: string;
  color: "indigo" | "amber" | "teal" | "green" | "red" | "rose" | "pink";
  children: React.ReactNode;
  'aria-label'?: string;
}

const colorClasses = {
  indigo:
    "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-500 dark:active:bg-indigo-600",
  amber:
    "bg-amber-700 hover:bg-amber-800 active:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-600 dark:active:bg-amber-600",
  teal:
    "bg-teal-600 hover:bg-teal-500 active:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 dark:active:bg-teal-700",
  green:
    "bg-green-600 hover:bg-green-500 active:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 dark:active:bg-green-700",
  red:
    "bg-red-600 hover:bg-red-500 active:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 dark:active:bg-red-700",
  rose:
    "bg-rose-600 hover:bg-rose-500 active:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 dark:active:bg-rose-700",
  pink:
    "bg-pink-600 hover:bg-pink-500 active:bg-pink-700 dark:bg-pink-600 dark:hover:bg-pink-500 dark:active:bg-pink-700",
};

export default function HomeButton({ to, color, children, 'aria-label': ariaLabel }: HomeButtonProps) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      className={`w-full rounded-xl px-6 py-4 text-xl font-bold text-white shadow-lg transition-all duration-150 active:scale-95 active:shadow-sm flex items-center justify-center ${colorClasses[color]}`}
    >
      {children}
    </Link>
  );
}
