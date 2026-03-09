import { useEffect } from "react";
import NavBar from "@/components/NavBar";
import HomeButton from "@/components/atoms/HomeButton";

function MultiplicationMenu() {
  useEffect(() => {
    document.title = "Multiplication — Math Flash Cards";
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-4 pt-16 pb-12 bg-background">
      <NavBar />
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <h1 className="mb-8 text-4xl font-bold text-text">Multiplication</h1>
        <div className="flex w-full max-w-xs flex-col items-center gap-6">
          <h2 id="multiplication-practice-heading" className="text-2xl font-semibold text-slate-700 dark:text-slate-300">Practice</h2>
          <div role="group" aria-labelledby="multiplication-practice-heading" className="flex w-full flex-col gap-4">
            <HomeButton to="/multiplication/practice/multiple-choice" color="amber">
              Multiple Choice
            </HomeButton>
            <HomeButton to="/multiplication/practice/hard-mode" color="amber">
              Hard Mode
            </HomeButton>
          </div>
          <h2 id="multiplication-drills-heading" className="text-2xl font-semibold text-slate-700 dark:text-slate-300">Drills</h2>
          <div role="group" aria-labelledby="multiplication-drills-heading" className="flex w-full flex-col gap-4">
            <HomeButton to="/multiplication/1-minute-drill" color="amber" aria-label="1 minute drill">
              1 min
            </HomeButton>
            <HomeButton to="/multiplication/3-minute-drill" color="amber" aria-label="3 minute drill">
              3 min
            </HomeButton>
            <HomeButton to="/multiplication/5-minute-drill" color="amber" aria-label="5 minute drill">
              5 min
            </HomeButton>
          </div>
        </div>
      </div>
    </main>
  );
}

export default MultiplicationMenu;
