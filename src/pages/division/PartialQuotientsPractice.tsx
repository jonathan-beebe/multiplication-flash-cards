import { useEffect, useState } from "react";
import clsx from "clsx";
import NavBar from "@/components/NavBar";
import PartialQuotientsProblem from "@/components/division/partialQuotients/PartialQuotientsProblem";
import { LEVELS } from "@/lib/division/areaMode/divisionProblem";
import type { Level } from "@/lib/division/areaMode/divisionProblem";
import PageHeading from "@/components/atoms/PageHeading";

const LEVEL_IDS: Level[] = [1, 2, 3, 4];

export default function PartialQuotientsPractice() {
  const [level, setLevel] = useState<Level>(1);

  useEffect(() => {
    document.title = "Partial Quotients — Math Flash Cards";
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 pt-20 pb-12">
      <NavBar backTo="/division" />

      <div className="w-full max-w-xl flex flex-col items-center gap-8">
        <div className="text-center">
          <PageHeading>Division Practice</PageHeading>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Partial quotients method
          </p>
        </div>

        {/* Level picker */}
        <nav
          className="flex gap-1 rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-slate-100 dark:bg-slate-800/50"
          aria-label="Difficulty level"
        >
          {LEVEL_IDS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              aria-pressed={level === l ? "true" : "false"}
              title={LEVELS[l].description}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                level === l
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              {LEVELS[l].label}
            </button>
          ))}
        </nav>

        {/* Problem — keyed on level so state resets on level change */}
        <PartialQuotientsProblem key={level} level={level} />
      </div>
    </main>
  );
}
