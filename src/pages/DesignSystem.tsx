import { useEffect } from "react";
import NavBar from "@/components/NavBar";

export default function DesignSystem() {
  useEffect(() => {
    document.title = "Design System — Math Flash Cards";
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-background px-4 pt-20 pb-12">
      <NavBar />
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-text mb-2">Design System</h1>
        <p className="text-slate-500 dark:text-slate-400">Component playground for visual testing.</p>
      </div>
    </main>
  );
}
