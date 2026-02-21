import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "@/AppRoutes";

/**
 * Helper: parse the displayed multiplication question and return { a, b, correct }.
 * Cards render "a × b" — we grab the first match visible in the document.
 */
function readQuestion(): { a: number; b: number; correct: number } {
  const cards = screen.getAllByText(/\d+\s*×\s*\d+/);
  const match = cards[0].textContent!.match(/(\d+)\s*×\s*(\d+)/);
  const a = Number(match![1]);
  const b = Number(match![2]);
  return { a, b, correct: a * b };
}

/**
 * Helper: click the correct (or a wrong) answer button.
 * Returns the value that was clicked.
 */
function clickAnswer(correct: number, pickWrong = false): number {
  const buttons = screen.getAllByRole("button").filter((b) => /^\d+$/.test(b.textContent!));
  if (pickWrong) {
    const wrongBtn = buttons.find((b) => Number(b.textContent) !== correct)!;
    fireEvent.click(wrongBtn);
    return Number(wrongBtn.textContent);
  }
  const correctBtn = buttons.find((b) => Number(b.textContent) === correct)!;
  fireEvent.click(correctBtn);
  return correct;
}

/**
 * Helper: advance past the card transition animation after a correct answer.
 * 1. Advance 300ms for the setTimeout that triggers the slide-out.
 * 2. Fire transitionEnd on the front card (the one with card-slide-out).
 */
function advanceCardTransition() {
  act(() => {
    vi.advanceTimersByTime(300);
  });
  const slidingCard = document.querySelector(".card-slide-out");
  if (slidingCard) {
    fireEvent.transitionEnd(slidingCard, { propertyName: "transform" });
  }
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("App user journeys", () => {
  // ─── 1. Home screen ────────────────────────────────────────────────
  describe("Home screen", () => {
    it("renders heading and all navigation options", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <AppRoutes />
        </MemoryRouter>,
      );

      expect(screen.getByRole("heading", { name: /multiplication flash\s*cards/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /practice multiplication/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /multiple choice/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /hard mode/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /1 min/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /3 min/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /5 min/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /about/i })).toBeInTheDocument();
    });
  });

  // ─── 2. Practice flow ──────────────────────────────────────────────
  describe("Practice flow", () => {
    it("Home → Practice → answer questions → Home", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <AppRoutes />
        </MemoryRouter>,
      );

      // Navigate to practice (multiple choice)
      fireEvent.click(screen.getByRole("link", { name: /multiple choice/i }));

      // A multiplication question should be visible
      const q1 = readQuestion();
      expect(q1.a).toBeGreaterThanOrEqual(3);
      expect(q1.b).toBeGreaterThanOrEqual(3);

      // Click the correct answer
      clickAnswer(q1.correct);
      advanceCardTransition();

      // A new question should be visible (could be different)
      const q2 = readQuestion();
      expect(q2.a).toBeGreaterThanOrEqual(3);

      // Navigate home via NavBar
      fireEvent.click(screen.getByRole("link", { name: /home/i }));
      expect(screen.getByRole("heading", { name: /multiplication flash\s*cards/i })).toBeInTheDocument();
    });
  });

  // ─── 3. Drill full flow ────────────────────────────────────────────
  describe("Drill full flow", () => {
    it("Home → Drill → answer → timer expires → DrillComplete → Restart → Drill → Home", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <AppRoutes />
        </MemoryRouter>,
      );

      // Navigate to 1-minute drill
      fireEvent.click(screen.getByRole("link", { name: /1 min/i }));

      // Drill UI: question visible, timer bar visible
      const q1 = readQuestion();
      expect(document.querySelector("[style*='drill-timer']")).toBeInTheDocument();

      // Click one correct answer
      clickAnswer(q1.correct);
      advanceCardTransition();

      // Click one wrong answer on the next question
      const q2 = readQuestion();
      clickAnswer(q2.correct, true); // pick wrong

      // Advance timer to expiration (60s minus the ~300ms already advanced)
      act(() => {
        vi.advanceTimersByTime(60_000);
      });

      // DrillComplete screen
      expect(screen.getByRole("heading", { name: /drill complete/i })).toBeInTheDocument();
      // Verify the results section rendered (correct/wrong/attempted labels)
      expect(screen.getByText(/correct/)).toBeInTheDocument();
      expect(screen.getByText(/wrong/)).toBeInTheDocument();
      expect(screen.getByText(/attempted/)).toBeInTheDocument();

      // Restart → back to drill
      fireEvent.click(screen.getByRole("button", { name: /restart/i }));
      expect(screen.getAllByText(/\d+\s*×\s*\d+/).length).toBeGreaterThan(0);
      expect(screen.queryByText(/drill complete/i)).not.toBeInTheDocument();

      // Navigate home via NavBar
      fireEvent.click(screen.getByRole("link", { name: /home/i }));
      expect(screen.getByRole("heading", { name: /multiplication flash\s*cards/i })).toBeInTheDocument();
    });
  });

  // ─── 4. Drill early exit ───────────────────────────────────────────
  describe("Drill early exit", () => {
    it("Home → Drill → NavBar Home (no completion screen)", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <AppRoutes />
        </MemoryRouter>,
      );

      // Navigate to 1-minute drill
      fireEvent.click(screen.getByRole("link", { name: /1 min/i }));
      expect(screen.getAllByText(/\d+\s*×\s*\d+/).length).toBeGreaterThan(0);

      // Leave early via NavBar
      fireEvent.click(screen.getByRole("link", { name: /home/i }));

      // Should be on Home, not DrillComplete
      expect(screen.getByRole("heading", { name: /multiplication flash\s*cards/i })).toBeInTheDocument();
      expect(screen.queryByText(/drill complete/i)).not.toBeInTheDocument();
    });
  });

  // ─── 5. Division practice flow ─────────────────────────────────────
  describe("Division practice flow", () => {
    it("/division-practice redirects to /division-practice/level-1", () => {
      render(
        <MemoryRouter initialEntries={["/division-practice"]}>
          <AppRoutes />
        </MemoryRouter>,
      );

      expect(screen.getByRole("heading", { name: /division practice/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /level 1/i })).toHaveAttribute("aria-pressed", "true");
    });

    it("/division-practice/level-3 renders with Level 3 selected", () => {
      render(
        <MemoryRouter initialEntries={["/division-practice/level-3"]}>
          <AppRoutes />
        </MemoryRouter>,
      );

      expect(screen.getByRole("link", { name: /level 3/i })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("link", { name: /level 1/i })).toHaveAttribute("aria-pressed", "false");
    });

    it("clicking a level link updates the selected level", () => {
      render(
        <MemoryRouter initialEntries={["/division-practice/level-1"]}>
          <AppRoutes />
        </MemoryRouter>,
      );

      expect(screen.getByRole("link", { name: /level 1/i })).toHaveAttribute("aria-pressed", "true");

      fireEvent.click(screen.getByRole("link", { name: /level 2/i }));

      expect(screen.getByRole("link", { name: /level 2/i })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("link", { name: /level 1/i })).toHaveAttribute("aria-pressed", "false");
    });

    it("division practice → Home via NavBar", () => {
      render(
        <MemoryRouter initialEntries={["/division-practice/level-1"]}>
          <AppRoutes />
        </MemoryRouter>,
      );

      expect(screen.getByRole("heading", { name: /division practice/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("link", { name: /home/i }));
      expect(screen.getByRole("heading", { name: /multiplication flash\s*cards/i })).toBeInTheDocument();
    });
  });

  // ─── 6. About flow ────────────────────────────────────────────────
  describe("About flow", () => {
    it("Home → About → Home", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <AppRoutes />
        </MemoryRouter>,
      );

      // Navigate to About
      fireEvent.click(screen.getByRole("link", { name: /about/i }));

      // About page content
      expect(screen.getByRole("heading", { name: /about/i })).toBeInTheDocument();
      expect(screen.getByText(/flash card app/i)).toBeInTheDocument();

      // Navigate home via NavBar
      fireEvent.click(screen.getByRole("link", { name: /home/i }));
      expect(screen.getByRole("heading", { name: /multiplication flash\s*cards/i })).toBeInTheDocument();
    });
  });
});
