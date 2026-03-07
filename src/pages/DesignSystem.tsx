import { useEffect } from "react";
import NavBar from "@/components/NavBar";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-text border-b border-slate-200 dark:border-slate-700 pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {title}
      </h3>
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        {children}
      </div>
    </div>
  );
}

export default function DesignSystem() {
  useEffect(() => {
    document.title = "Design System — Math Flash Cards";
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-background px-4 pt-20 pb-12">
      <NavBar />
      <div className="mx-auto w-full max-w-2xl flex flex-col gap-12">
        <div>
          <h1 className="text-3xl font-bold text-text mb-1">Design System</h1>
          <p className="text-slate-500 dark:text-slate-400">Component playground for visual testing.</p>
        </div>

        {/* ── Atoms ──────────────────────────────────────────────── */}
        <Section title="Atoms">
          <Subsection title="Placeholder">
            <p className="text-slate-500 dark:text-slate-400 text-sm">No atoms documented yet.</p>
          </Subsection>
        </Section>

        {/* ── Components ─────────────────────────────────────────── */}
        <Section title="Components">
          <Subsection title="Placeholder">
            <p className="text-slate-500 dark:text-slate-400 text-sm">No components documented yet.</p>
          </Subsection>
        </Section>
      </div>
    </main>
  );
}
