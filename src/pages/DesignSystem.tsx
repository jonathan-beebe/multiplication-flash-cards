import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import HomeButton from "@/components/HomeButton";
import QuizButton from "@/components/multiplication/QuizButton";
import ErrorText from "@/components/atoms/ErrorText";
import PrimaryButton from "@/components/atoms/PrimaryButton";
import NumberInput from "@/components/atoms/NumberInput";
import SuccessText from "@/components/atoms/SuccessText";
import ProblemHeading from "@/components/atoms/ProblemHeading";
import PageHeading from "@/components/atoms/PageHeading";

// ─── Scaffold ─────────────────────────────────────────────────────────────────

function Category({ title, children }: { title: string; children: React.ReactNode }) {
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

function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2">{children}</div>;
}

function Title({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-slate-400">{children}</p>;
}

function Row({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-wrap gap-2 ${className ?? ""}`.trim()}>{children}</div>;
}

function Items({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-4">{children}</div>;
}

function Item({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col items-center gap-1">{children}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-xs text-slate-400 text-center">{children}</span>;
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function TypographyAtoms() {
  return (
    <div className="flex flex-col gap-4">
      <Group>
        <Title>ProblemHeading</Title>
        <ProblemHeading>657 ÷ 3 = ?</ProblemHeading>
      </Group>
      <Group>
        <Title>PageHeading</Title>
        <PageHeading>Division Practice</PageHeading>
      </Group>
      <Group>
        <Title>Subheading — text-lg font-semibold</Title>
        <p className="text-lg font-semibold text-text">Area model method</p>
      </Group>
      <Group>
        <Title>Body — text-base</Title>
        <p className="text-base text-text">How many times does 3 go into 27?</p>
      </Group>
      <Group>
        <Title>Secondary — text-sm text-slate-500</Title>
        <p className="text-sm text-slate-500 dark:text-slate-400">2-digit answer, small divisor</p>
      </Group>
      <Group>
        <Title>Mono numeric — font-mono tabular-nums text-xl</Title>
        <p className="font-mono tabular-nums text-xl text-text">3 ) 657</p>
      </Group>
      <Group>
        <Title>Success — SuccessText</Title>
        <SuccessText>219 ✓</SuccessText>
      </Group>
      <Group>
        <Title>Error</Title>
        <ErrorText>Too big — only 57 remaining</ErrorText>
      </Group>
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
      <Group>
        <Title>Custom tokens</Title>
        <Items>
          {tokens.map(({ label, className }) => (
            <Item key={label}>
              <div className={`w-12 h-12 rounded-lg ${className}`} />
              <Label>{label}</Label>
            </Item>
          ))}
        </Items>
      </Group>
      <Group>
        <Title>Accent colors</Title>
        <Items>
          {accents.map(({ label, className }) => (
            <Item key={label}>
              <div className={`w-12 h-12 rounded-lg ${className}`} />
              <Label>{label}</Label>
            </Item>
          ))}
        </Items>
      </Group>
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
      <Group>
        <Title>HomeButton — all color variants</Title>
        <div className="flex flex-col gap-2 max-w-xs">
          {(["teal", "indigo", "amber", "green", "rose", "pink", "red"] as const).map((color) => (
            <HomeButton key={color} to="#" color={color}>{color}</HomeButton>
          ))}
        </div>
      </Group>

      {/* Primary action buttons */}
      <Group>
        <Title>Primary action button</Title>
        <Row>
          <PrimaryButton>Place</PrimaryButton>
          <PrimaryButton>Check</PrimaryButton>
          <PrimaryButton size="lg">Next problem →</PrimaryButton>
        </Row>
      </Group>

      {/* QuizButton */}
      <Group>
        <Title>QuizButton — all states</Title>
        <Items>
          {(["default", "correct", "wrong", "fade-out"] as const).map((state) => (
            <Item key={state}>
              <QuizButton value={42} onClick={() => {}} disabled={state !== "default"} state={state} />
              <Label>{state}</Label>
            </Item>
          ))}
        </Items>
      </Group>

      {/* Shake */}
      <Group>
        <Title>Shake feedback (error animation)</Title>
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
      </Group>
    </div>
  );
}

function InputAtoms() {
  const [value, setValue] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <Group>
        <Title>NumberInput — teal focus (division)</Title>
        <NumberInput
          placeholder="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          focusColor="teal"
        />
      </Group>
      <Group>
        <Title>NumberInput — indigo focus (multiplication)</Title>
        <NumberInput
          placeholder="0"
          defaultValue=""
          focusColor="indigo"
          readOnly
        />
      </Group>
      <Group>
        <Title>NumberInput — error state (border-red-400 override)</Title>
        <NumberInput
          defaultValue="abc"
          readOnly
          className="border-red-400"
        />
        <ErrorText>Enter a whole number</ErrorText>
      </Group>
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
        <Category title="Atoms">
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
        </Category>

        {/* ── Components ─────────────────────────────────────────── */}
        <Category title="Components">
          <Subsection title="Placeholder">
            <p className="text-slate-500 dark:text-slate-400 text-sm">No components documented yet.</p>
          </Subsection>
        </Category>
      </div>
    </main>
  );
}
