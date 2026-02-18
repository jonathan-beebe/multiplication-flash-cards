import { Link } from "react-router-dom";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

function NavBar() {
  return (
    <div className="fixed left-0 top-0 flex h-12 w-full items-center bg-background/50 backdrop-blur-sm">
      <Link
        to="/"
        className="ml-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Home
      </Link>
    </div>
  );
}

export default NavBar;
