import { Link } from "react-router-dom";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

function NavBar() {
  return (
    <div className="fixed left-0 top-0 flex h-12 w-full items-center bg-background/50 backdrop-blur-sm">
      <Link
        to="/"
        className="ml-4 flex items-center gap-1 text-sm text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
      >
        <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        Home
      </Link>
    </div>
  );
}

export default NavBar;
