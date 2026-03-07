import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import HomeButton from "@/components/HomeButton";
import QuizButton from "@/components/multiplication/QuizButton";
import ErrorText from "@/components/atoms/ErrorText";
import PrimaryButton from "@/components/atoms/PrimaryButton";

// ─── Scaffold ─────────────────────────────────────────────────────────────────

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

// ─── Atoms ────────────────────────────────────────────────────────────────────

function TypographyAtoms() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs text-slate-400 mb-1">Problem heading — text-4xl font-bold tabular-nums</p>
        <p className="text-4xl font-bold tabular-nums text-text">657 ÷ 3 = ?</p>
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-1">Page heading — text-2xl font-bold</p>
        <p className="text-2xl font-bold text-text">Division Practice</p>
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-1">Subheading — text-lg font-semibold</p>
        <p className="text-lg font-semibold text-text">Area model method</p>
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-1">Body — text-base</p>
        <p className="text-base text-text">How many times does 3 go into 27?</p>
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-1">Secondary — text-sm text-slate-500</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">2-digit answer, small divisor</p>
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-1">Mono numeric — font-mono tabular-nums text-xl</p>
        <p className="font-mono tabular-nums text-xl text-text">3 ) 657</p>
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-1">Success — text-teal-600</p>
        <p className="text-2xl font-bold tabular-nums text-teal-600 dark:text-teal-400">219 ✓</p>
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-1">Error</p>
        <ErrorText>Too big — only 57 remaining</ErrorText>
      </div>
    </div>
  );
}

function ColorAtoms() {
  const tokens = [
    { label: "background", className: "bg-background border border-slate-300 dark:border-slate-600" },
    { label: "text", className: "bg-text" },
    { label: "correct", className: "bg-correct" },
    { label: "wrong", className: "bg-wrong" },
  ];
  const accents = [
    { label: "teal (division)", className: "bg-teal-600" },
    { label: "indigo (multiplication)", className: "bg-indigo-600" },
    { label: "amber (addition)", className: "bg-amber-700" },
    { label: "green (subtraction)", className: "bg-green-600" },
    { label: "rose", className: "bg-rose-600" },
    { label: "slate-500", className: "bg-slate-500" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs text-slate-400 mb-2">Custom tokens</p>
        <div className="flex flex-wrap gap-3">
          {tokens.map(({ label, className }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className={`w-12 h-12 rounded-lg ${className}`} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-2">Accent colors</p>
        <div className="flex flex-wrap gap-3">
          {accents.map(({ label, className }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className={`w-12 h-12 rounded-lg ${className}`} />
              <span className="text-xs text-slate-500 text-center" style={{ maxWidth: "4rem" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ButtonAtoms() {
  const [shaking, setShaking] = useState(false);

  function triggerShake() {
    setShaking(true);
    setTimeout(() => setShaking(false), 400);
  }

  return (
    <div className="flex flex-col gap-6">

      {/* HomeButton */}
      <div>
        <p className="text-xs text-slate-400 mb-2">HomeButton — all color variants</p>
        <div className="flex flex-col gap-2 max-w-xs">
          {(["teal", "indigo", "amber", "green", "rose", "pink", "red"] as const).map((color) => (
            <HomeButton key={color} to="#" color={color}>{color}</HomeButton>
          ))}
        </div>
      </div>

      {/* Primary action buttons */}
      <div>
        <p className="text-xs text-slate-400 mb-2">Primary action button</p>
        <div className="flex flex-wrap gap-2">
          <PrimaryButton>Place</PrimaryButton>
          <PrimaryButton>Check</PrimaryButton>
          <PrimaryButton size="lg">Next problem →</PrimaryButton>
        </div>
      </div>

      {/* QuizButton */}
      <div>
        <p className="text-xs text-slate-400 mb-2">QuizButton — all states</p>
        <div className="flex flex-wrap gap-2">
          <QuizButton value={42} onClick={() => {}} disabled={false} state="default" />
          <QuizButton value={42} onClick={() => {}} disabled={true} state="correct" />
          <QuizButton value={42} onClick={() => {}} disabled={true} state="wrong" />
          <QuizButton value={42} onClick={() => {}} disabled={true} state="fade-out" />
        </div>
        <div className="flex gap-4 mt-2 text-xs text-slate-400">
          <span>default</span>
          <span>correct</span>
          <span>wrong</span>
          <span>fade-out</span>
        </div>
      </div>

      {/* Shake */}
      <div>
        <p className="text-xs text-slate-400 mb-2">Shake feedback (error animation)</p>
        <div className="flex items-center gap-3">
          <div className={shaking ? "shake" : ""}>
            <input
              type="text"
              defaultValue="99"
              readOnly
              className="w-24 text-center text-2xl font-bold rounded-xl border-2 border-red-400 bg-white dark:bg-slate-800 text-text px-3 py-2 tabular-nums"
            />
          </div>
          <button
            onClick={triggerShake}
            className="rounded-xl bg-slate-200 dark:bg-slate-700 text-text font-semibold px-4 py-2 text-sm"
          >
            Trigger shake
          </button>
        </div>
      </div>
    </div>
  );
}

function InputAtoms() {
  const [value, setValue] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs text-slate-400 mb-2">Number input — default</p>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-32 text-center text-2xl font-bold rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-text px-3 py-2 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400 tabular-nums"
        />
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-2">Number input — error state</p>
        <div className="flex flex-col gap-1">
          <input
            type="text"
            defaultValue="abc"
            readOnly
            className="w-32 text-center text-2xl font-bold rounded-xl border-2 border-red-400 bg-white dark:bg-slate-800 text-text px-3 py-2 tabular-nums"
          />
          <p className="text-sm font-medium text-red-600 dark:text-red-400">Enter a whole number</p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
          <Subsection title="Typography">
            <TypographyAtoms />
          </Subsection>
          <Subsection title="Color Palette">
            <ColorAtoms />
          </Subsection>
          <Subsection title="Buttons">
            <ButtonAtoms />
          </Subsection>
          <Subsection title="Inputs">
            <InputAtoms />
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
