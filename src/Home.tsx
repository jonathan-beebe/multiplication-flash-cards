import { Link } from "react-router-dom";
import HomeButton from "./HomeButton";

function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-4 bg-background">
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
            <HomeButton to="/1-minute-drill" color="amber">
              1 min
            </HomeButton>
            <HomeButton to="/3-minute-drill" color="amber">
              3 min
            </HomeButton>
            <HomeButton to="/5-minute-drill" color="amber">
              5 min
            </HomeButton>
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
