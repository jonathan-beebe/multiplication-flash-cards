import { useEffect } from "react";
import NavBar from "@/components/NavBar";

function About() {
  useEffect(() => {
    document.title = "About — Math Flash Cards";
  }, []);

  return (
    <main className="flex min-h-screen justify-center overflow-auto bg-background px-4 pb-8 pt-16">
      <NavBar />
      <div className="flex w-full max-w-md flex-col gap-6 text-left">
        <h1 className="text-4xl font-bold text-text">About</h1>
        <p className="text-lg text-slate-700 dark:text-slate-300">
          A math flash card app to help 1st–5th graders practice
          addition, subtraction, multiplication, and division.
        </p>
        <p className="text-lg text-slate-700 dark:text-slate-300">
          It began as a simple tool to help my fourth-grade son practice his
          multiplication facts (times tables). After gaining popularity with his
          school and classmates, it has grown into a comprehensive resource for
          elementary students to strengthen their math skills at every level.
        </p>
        <p className="text-lg text-slate-700 dark:text-slate-300">
          If you have any comments, bug reports, or feature requests, please
          email me at{" "}
          <a
            href="mailto:jonathan-beebe@outlook.com"
            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            jonathan-beebe@outlook.com
          </a>
          .
        </p>
        <p className="text-lg text-slate-700 dark:text-slate-300">
          This app is open source. You can see how it was built on{" "}
          <a
            href="https://github.com/jonathan-beebe/multiplication-flash-cards"
            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            GitHub
          </a>
          .
        </p>

        <h2 className="mt-4 text-2xl font-bold text-text">Install as an App</h2>
        <p className="text-lg text-slate-700 dark:text-slate-300">
          You can install this as an app on your device for easy access — no app
          store needed.
        </p>

        <h3 className="text-xl font-semibold text-text">iPhone or iPad</h3>
        <ol className="list-inside list-decimal text-lg text-slate-700 dark:text-slate-300">
          <li>Open this page in Safari</li>
          <li>Tap the Share button (square with an arrow pointing up)</li>
          <li>Scroll down and tap Add to Home Screen</li>
          <li>Tap Add</li>
        </ol>

        <h3 className="text-xl font-semibold text-text">Android</h3>
        <ol className="list-inside list-decimal text-lg text-slate-700 dark:text-slate-300">
          <li>Open this page in Chrome</li>
          <li>Tap the three-dot menu in the top right</li>
          <li>Tap Add to Home Screen or Install App</li>
          <li>Tap Add</li>
        </ol>

        <h3 className="text-xl font-semibold text-text">
          Desktop (Chrome, Edge)
        </h3>
        <ol className="list-inside list-decimal text-lg text-slate-700 dark:text-slate-300">
          <li>
            Look for the install icon in the address bar (a computer with a down
            arrow), or click the three-dot menu and choose Install Math Flash
            Cards
          </li>
          <li>Click Install</li>
        </ol>

        <p className="text-lg text-slate-700 dark:text-slate-300">
          Once installed, the app will appear on your home screen or in your
          apps list, and works offline.
        </p>

        <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400 mt-4">
          version {__COMMIT_HASH__}
        </p>
      </div>
    </main>
  );
}

export default About;
