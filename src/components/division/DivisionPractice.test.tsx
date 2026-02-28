import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import DivisionPractice from "@/components/division/DivisionPractice";

vi.mock("@/lib/division/divisionProblem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/division/divisionProblem")>();
  return {
    ...actual,
    generateProblem: vi.fn().mockReturnValue({ dividend: 72, divisor: 3, quotient: 24 }),
  };
});

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function renderPage(initialLevel = 1) {
  render(
    <MemoryRouter initialEntries={[`/division-practice/level-${initialLevel}`]}>
      <Routes>
        <Route path="/division-practice/:level" element={<DivisionPractice />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("DivisionPractice", () => {
  it("renders the page heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /division practice/i })).toBeInTheDocument();
  });

  it("renders the 'Area model method' subtitle", () => {
    renderPage();
    expect(screen.getByText(/area model method/i)).toBeInTheDocument();
  });

  it("renders all four level links", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /level 1/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /level 2/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /level 3/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /level 4/i })).toBeInTheDocument();
  });

  it("selects Level 1 by default", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /level 1/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("link", { name: /level 2/i })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("link", { name: /level 3/i })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("link", { name: /level 4/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("selects the clicked level and deselects the previous one", () => {
    renderPage();
    fireEvent.click(screen.getByRole("link", { name: /level 3/i }));
    expect(screen.getByRole("link", { name: /level 3/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("link", { name: /level 1/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("only one level is selected at a time", () => {
    renderPage();
    fireEvent.click(screen.getByRole("link", { name: /level 2/i }));
    const pressed = screen
      .getAllByRole("link", { name: /level \d/i })
      .filter((el) => el.getAttribute("aria-pressed") === "true");
    expect(pressed).toHaveLength(1);
    expect(pressed[0]).toHaveTextContent(/level 2/i);
  });

  it("shows the building-phase input on load", () => {
    renderPage();
    act(() => vi.advanceTimersByTime(50));
    expect(screen.getByRole("textbox", { name: /partial quotient/i })).toBeInTheDocument();
  });

  it("resets to the building phase when the level changes", () => {
    renderPage();
    act(() => vi.advanceTimersByTime(50));
    // Confirm building phase is active
    expect(screen.getByRole("textbox", { name: /partial quotient/i })).toBeInTheDocument();
    // Switch level
    fireEvent.click(screen.getByRole("link", { name: /level 4/i }));
    act(() => vi.advanceTimersByTime(50));
    // New AreaModelProblem instance should start in building phase
    expect(screen.getByRole("textbox", { name: /partial quotient/i })).toBeInTheDocument();
  });

  it("sets the document title to include 'Division'", () => {
    renderPage();
    expect(document.title).toMatch(/division/i);
  });

  it("renders the correct level when navigated to directly", () => {
    renderPage(3);
    expect(screen.getByRole("link", { name: /level 3/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("link", { name: /level 1/i })).toHaveAttribute("aria-pressed", "false");
  });
});
