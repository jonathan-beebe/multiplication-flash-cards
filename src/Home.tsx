import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-900">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <h1 className="mb-8 text-4xl font-bold text-slate-900 dark:text-slate-100">
          Multiplication Flash{"\u00A0"}Cards
        </h1>
        <div className="flex w-full max-w-xs flex-col items-center gap-6">
          <Link
            to="/practice"
            className="w-full rounded-xl bg-indigo-600 px-8 py-4 text-xl font-semibold text-white shadow-lg transition-colors hover:bg-indigo-500 active:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:active:bg-indigo-600"
          >
            Start Learning
          </Link>
          <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300">
            Drills
          </h2>
          <div className="flex w-full flex-col gap-4">
            <Link
              to="/1-minute-drill"
              className="w-full rounded-xl bg-amber-600 px-6 py-4 text-xl font-semibold text-white shadow-lg transition-colors hover:bg-amber-500 active:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 dark:active:bg-amber-600"
            >
              1 min
            </Link>
            <Link
              to="/3-minute-drill"
              className="w-full rounded-xl bg-amber-600 px-6 py-4 text-xl font-semibold text-white shadow-lg transition-colors hover:bg-amber-500 active:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 dark:active:bg-amber-600"
            >
              3 min
            </Link>
            <Link
              to="/5-minute-drill"
              className="w-full rounded-xl bg-amber-600 px-6 py-4 text-xl font-semibold text-white shadow-lg transition-colors hover:bg-amber-500 active:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 dark:active:bg-amber-600"
            >
              5 min
            </Link>
          </div>
          <Link
            to="/about"
            className="mt-4 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            About
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
