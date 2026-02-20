import { useState, useEffect } from "react";
import clsx from "clsx";
import NavBar from "@/components/NavBar";
import AreaModelProblem from "@/components/division/AreaModelProblem";
import { LEVELS } from "@/lib/divisionProblem";
import type { Level } from "@/lib/divisionProblem";

const LEVEL_IDS: Level[] = [1, 2, 3, 4];

export default function DivisionPractice() {
  const [level, setLevel] = useState<Level>(1);

  useEffect(() => {
    document.title = "Division Practice — Multiplication Flash Cards";
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 pt-20 pb-12">
      <NavBar />

      <div className="w-full max-w-xl flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text">Division Practice</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Area model method
          </p>
        </div>

        {/* Level picker */}
        <div
          className="flex gap-1 rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-slate-100 dark:bg-slate-800/50"
          role="group"
          aria-label="Select difficulty level"
        >
          {LEVEL_IDS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              aria-pressed={level === l}
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
        </div>

        {/* Problem area — keyed on level so state resets when level changes */}
        <AreaModelProblem key={level} level={level} />
      </div>
    </main>
  );
}
