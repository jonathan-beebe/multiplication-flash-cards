import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import clsx from "clsx";
import NavBar from "@/components/NavBar";
import HomeButton from "@/components/HomeButton";
import { OPERATION_LEVELS, OPERATION_LEVEL_IDS, parseOperationLevel } from "@/lib/engine/operationLevels";

function SubtractionMenu() {
  const { level: levelParam } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const level = parseOperationLevel(levelParam);

  useEffect(() => {
    if (levelParam !== undefined && levelParam !== level) {
      navigate("/subtraction/ones", { replace: true });
    }
  }, [levelParam, level, navigate]);

  useEffect(() => {
    document.title = "Subtraction — Flash Cards";
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-4 pb-12 bg-background">
      <NavBar />
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <h1 className="mb-6 text-4xl font-bold text-text">Subtraction</h1>

        {/* Level picker */}
        <div
          className="flex gap-1 rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-slate-100 dark:bg-slate-800/50 mb-8"
          role="group"
          aria-label="Select difficulty level"
        >
          {OPERATION_LEVEL_IDS.map((l) => (
            <Link
              key={l}
              to={`/subtraction/${l}`}
              aria-current={level === l ? "page" : undefined}
              title={OPERATION_LEVELS[l].description}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                level === l
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              {OPERATION_LEVELS[l].label}
            </Link>
          ))}
        </div>

        <div className="flex w-full max-w-xs flex-col items-center gap-6">
          <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300">Practice</h2>
          <div className="flex w-full flex-col gap-4">
            <HomeButton to={`/subtraction/${level}/practice/multiple-choice`} color="rose">
              Multiple Choice
            </HomeButton>
            <HomeButton to={`/subtraction/${level}/practice/hard-mode`} color="rose">
              Hard Mode
            </HomeButton>
          </div>
          <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300">Drills</h2>
          <div className="flex w-full flex-col gap-4">
            <HomeButton to={`/subtraction/${level}/1-minute-drill`} color="rose" aria-label="1 minute drill">
              1 min
            </HomeButton>
            <HomeButton to={`/subtraction/${level}/3-minute-drill`} color="rose" aria-label="3 minute drill">
              3 min
            </HomeButton>
            <HomeButton to={`/subtraction/${level}/5-minute-drill`} color="rose" aria-label="5 minute drill">
              5 min
            </HomeButton>
          </div>
        </div>
      </div>
    </main>
  );
}

export default SubtractionMenu;
