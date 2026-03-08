import { Component } from "react";
import type { ReactNode } from "react";

export function ErrorFallback() {
  return (
    <main className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-5xl">😬</div>
      <h1 className="text-2xl font-bold">Oops! We made a math mistake.</h1>
      <p className="text-slate-600 dark:text-slate-400">
        Skill issue on our end, ngl. Let's get you back home.
      </p>
      <button
        onClick={() => window.location.assign("/")}
        className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white shadow hover:bg-teal-700"
      >
        Go home
      </button>
    </main>
  );
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen">
          <ErrorFallback />
        </div>
      );
    }
    return this.props.children;
  }
}
