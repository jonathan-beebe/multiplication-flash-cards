import { useEffect } from "react";
import NavBar from "@/components/NavBar";

function PartialQuotientsPlaceholder() {
  useEffect(() => {
    document.title = "Partial Quotients — Math Flash Cards";
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 pt-20 pb-12">
      <NavBar backTo="/division" />
      <div className="flex flex-col items-center gap-4 mt-12 text-center">
        <h1 className="text-2xl font-bold text-text">Partial Quotients</h1>
        <p className="text-slate-500 dark:text-slate-400">Coming soon</p>
      </div>
    </main>
  );
}

export default PartialQuotientsPlaceholder;
