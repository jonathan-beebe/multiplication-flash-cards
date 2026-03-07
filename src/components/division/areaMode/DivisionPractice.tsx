import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import clsx from "clsx";
import NavBar from "@/components/NavBar";
import AreaModelProblem from "@/components/division/areaMode/AreaModelProblem";
import { LEVELS } from "@/lib/division/areaMode/divisionProblem";
import type { Level } from "@/lib/division/areaMode/divisionProblem";
import PageHeading from "@/components/atoms/PageHeading";
import SecondaryText from "@/components/atoms/SecondaryText";

const LEVEL_IDS: Level[] = [1, 2, 3, 4];

function parseLevel(param: string | undefined): Level {
  const match = param?.match(/^level-(\d+)$/);
  const n = match ? Number(match[1]) : NaN;
  if (n >= 1 && n <= 4) return n as Level;
  return 1;
}

export default function DivisionPractice() {
  const { level: levelParam } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const level = parseLevel(levelParam);

  useEffect(() => {
    if (levelParam !== undefined && levelParam !== `level-${level}`) {
      navigate("/division-practice/level-1", { replace: true });
    }
  }, [levelParam, level, navigate]);

  useEffect(() => {
    document.title = "Division Practice — Multiplication Flash Cards";
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 pt-20 pb-12">
      <NavBar backTo="/division" />

      <div className="w-full max-w-xl flex flex-col items-center gap-8">
        <div className="text-center">
          <PageHeading>Division Practice</PageHeading>
          <SecondaryText className="mt-1">
            Area model method
          </SecondaryText>
        </div>

        {/* Level picker */}
        <nav
          className="flex gap-1 rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-slate-100 dark:bg-slate-800/50"
          aria-label="Difficulty level"
        >
          {LEVEL_IDS.map((l) => (
            <Link
              key={l}
              to={`/division-practice/level-${l}`}
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
            </Link>
          ))}
        </nav>

        {/* Problem area — keyed on level so state resets when level changes */}
        <AreaModelProblem key={level} level={level} />
      </div>
    </main>
  );
}
