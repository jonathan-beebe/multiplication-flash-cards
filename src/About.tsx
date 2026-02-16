import { Link } from "react-router-dom";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

function About() {
  return (
    <div className="flex min-h-screen justify-center bg-slate-50 px-4 pt-16 dark:bg-slate-900">
      <Link
        to="/"
        className="fixed left-4 top-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Home
      </Link>
      <div className="flex w-full max-w-md flex-col gap-6 text-left">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
          About
        </h1>
        <p className="text-lg text-slate-700 dark:text-slate-300">
          A simple flash card app to help kids practice their multiplication
          tables for the numbers 0–12.
        </p>
        <p className="text-lg text-slate-700 dark:text-slate-300">
          If you have any comments, bug reports, or feature requests, please
          email me at{" "}
          <a
            href="mailto:jonathan-beebe@outlook.com"
            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            jonathan-beebe@outlook.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export default About;
