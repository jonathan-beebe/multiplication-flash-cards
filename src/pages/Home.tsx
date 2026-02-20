import { useEffect } from "react";
import { Link } from "react-router-dom";
import HomeButton from "@/components/HomeButton";

function Home() {
  useEffect(() => {
    document.title = "Multiplication Flash Cards";
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-4 bg-background">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <h1 className="mb-8 text-4xl font-bold text-text">
          Multiplication Flash{"\u00A0"}Cards
        </h1>
        <div className="flex w-full max-w-xs flex-col items-center gap-6">
          <HomeButton to="/practice" color="indigo">
            Start Learning
          </HomeButton>
          <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300">
            Drills
          </h2>
          <div className="flex w-full flex-col gap-4">
            <HomeButton to="/1-minute-drill" color="amber" aria-label="1 minute drill">
              1 min
            </HomeButton>
            <HomeButton to="/3-minute-drill" color="amber" aria-label="3 minute drill">
              3 min
            </HomeButton>
            <HomeButton to="/5-minute-drill" color="amber" aria-label="5 minute drill">
              5 min
            </HomeButton>
          </div>
          <div className="w-full border-t border-slate-200 dark:border-slate-700 pt-6 flex flex-col items-center gap-4">
            <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300">
              Division
            </h2>
            <HomeButton to="/division-practice" color="teal">
              Explore Division
            </HomeButton>
          </div>
          <Link
            to="/about"
            className="mt-4 text-sm text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
          >
            About
          </Link>
        </div>
      </div>
    </main>
  );
}

export default Home;
