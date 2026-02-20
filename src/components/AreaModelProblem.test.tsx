import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import AreaModelProblem from "@/components/AreaModelProblem";

// Deterministic problem: 72 ÷ 3 = 24
// Two-section path: enter 20 (area=60, remaining=12) → enter 4 (area=12, remaining=0) → summing
// Summing path: enter 24 → done
// Single-section path: enter 24 directly → done (skips summing)
vi.mock("@/lib/divisionProblem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/divisionProblem")>();
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderComponent() {
  render(<AreaModelProblem level={1} />);
  // Advance past the initial focus delay so the input is focused.
  act(() => vi.advanceTimersByTime(50));
}

function enterPartialQuotient(value: string) {
  const input = screen.getByRole("textbox", { name: /partial quotient/i });
  fireEvent.change(input, { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: /place/i }));
  // Advance focus delay in case phase changed.
  act(() => vi.advanceTimersByTime(50));
}

/** Fills 20 + 4 = 24 across two sections, landing in the summing phase. */
function advanceToSumming() {
  enterPartialQuotient("20"); // 20 × 3 = 60, remaining = 12
  enterPartialQuotient("4");  // 4 × 3 = 12, remaining = 0 → summing phase
}

function enterSum(value: string) {
  const input = screen.getByRole("textbox", { name: /sum of partial quotients/i });
  fireEvent.change(input, { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: /check/i }));
  // Advance focus delay in case phase changed.
  act(() => vi.advanceTimersByTime(50));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AreaModelProblem — initial render", () => {
  it("displays the problem heading", () => {
    renderComponent();
    expect(screen.getByText(/72 ÷ 3 = \?/)).toBeInTheDocument();
  });

  it("shows the building-phase input", () => {
    renderComponent();
    expect(screen.getByRole("textbox", { name: /partial quotient/i })).toBeInTheDocument();
  });

  it("focuses the building-phase input on mount", () => {
    renderComponent();
    expect(screen.getByRole("textbox", { name: /partial quotient/i })).toHaveFocus();
  });

  it("does not show the summing-phase input", () => {
    renderComponent();
    expect(screen.queryByRole("textbox", { name: /sum of partial quotients/i })).not.toBeInTheDocument();
  });

  it("does not show the done phase", () => {
    renderComponent();
    expect(screen.queryByRole("button", { name: /next problem/i })).not.toBeInTheDocument();
  });

  it("shows the helpful facts panel toggle", () => {
    renderComponent();
    expect(screen.getByText(/helpful facts for 3/i)).toBeInTheDocument();
  });
});

describe("AreaModelProblem — building phase", () => {
  beforeEach(() => {
    renderComponent();
  });

  it("places a valid partial quotient and announces the area and remaining", () => {
    enterPartialQuotient("20");
    expect(screen.getByRole("status")).toHaveTextContent(/60 placed/i);
    expect(screen.getByRole("status")).toHaveTextContent(/12 remaining/i);
  });

  it("stays in building phase after a partial quotient that leaves a remainder", () => {
    enterPartialQuotient("20");
    expect(screen.getByRole("textbox", { name: /partial quotient/i })).toBeInTheDocument();
  });

  it("advances to summing phase after all sections cover the full dividend", () => {
    advanceToSumming();
    expect(screen.getByRole("textbox", { name: /sum of partial quotients/i })).toBeInTheDocument();
  });

  it("skips summing and goes directly to done when a single section covers the full dividend", () => {
    enterPartialQuotient("24"); // 24 × 3 = 72, single section fills all
    expect(screen.getByRole("button", { name: /next problem/i })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /sum of partial quotients/i })).not.toBeInTheDocument();
  });

  it("shows an error for empty input", () => {
    fireEvent.click(screen.getByRole("button", { name: /place/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /partial quotient/i })).toBeInTheDocument();
  });

  it("shows a 'Too big' error when the partial quotient would exceed remaining", () => {
    const input = screen.getByRole("textbox", { name: /partial quotient/i });
    fireEvent.change(input, { target: { value: "100" } }); // 100 × 3 = 300 > 72
    fireEvent.click(screen.getByRole("button", { name: /place/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/too big/i);
  });

  it("clears the error message when the input value changes", () => {
    const input = screen.getByRole("textbox", { name: /partial quotient/i });
    fireEvent.change(input, { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: /place/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "10" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("pressing Enter submits the same as clicking Place", () => {
    const input = screen.getByRole("textbox", { name: /partial quotient/i });
    fireEvent.change(input, { target: { value: "20" } });
    fireEvent.keyDown(input, { key: "Enter" });
    act(() => vi.advanceTimersByTime(50));
    // Partial quotient placed — 12 remaining announced
    expect(screen.getByRole("status")).toHaveTextContent(/12 remaining/i);
  });
});

describe("AreaModelProblem — summing phase", () => {
  beforeEach(() => {
    renderComponent();
    advanceToSumming();
  });

  it("displays the sum equation", () => {
    expect(screen.getByText(/20 \+ 4 = \?/)).toBeInTheDocument();
  });

  it("focuses the sum input on entering the summing phase", () => {
    expect(screen.getByRole("textbox", { name: /sum of partial quotients/i })).toHaveFocus();
  });

  it("transitions to the done phase on the correct sum", () => {
    enterSum("24");
    expect(screen.getByRole("button", { name: /next problem/i })).toBeInTheDocument();
  });

  it("shows the full correct answer in the done phase", () => {
    enterSum("24");
    expect(screen.getByText(/72 ÷ 3 = 24/)).toBeInTheDocument();
  });

  it("announces the correct answer to screen readers", () => {
    enterSum("24");
    expect(screen.getByRole("status")).toHaveTextContent(/correct/i);
    expect(screen.getByRole("status")).toHaveTextContent(/72/);
  });

  it("shows an error for an incorrect sum and stays in summing phase", () => {
    enterSum("20"); // wrong
    expect(screen.getByRole("alert")).toHaveTextContent(/check your addition/i);
    expect(screen.getByRole("textbox", { name: /sum of partial quotients/i })).toBeInTheDocument();
  });

  it("shows an error for empty input", () => {
    fireEvent.click(screen.getByRole("button", { name: /check/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("pressing Enter submits the same as clicking Check", () => {
    const input = screen.getByRole("textbox", { name: /sum of partial quotients/i });
    fireEvent.change(input, { target: { value: "24" } });
    fireEvent.keyDown(input, { key: "Enter" });
    act(() => vi.advanceTimersByTime(50));
    expect(screen.getByRole("button", { name: /next problem/i })).toBeInTheDocument();
  });
});

describe("AreaModelProblem — done phase", () => {
  beforeEach(() => {
    renderComponent();
    advanceToSumming();
    enterSum("24");
  });

  it("shows the success message with a checkmark", () => {
    expect(screen.getByText(/72 ÷ 3 = 24 ✓/)).toBeInTheDocument();
  });

  it("shows the Next problem button", () => {
    expect(screen.getByRole("button", { name: /next problem/i })).toBeInTheDocument();
  });

  it("hides all text inputs", () => {
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("hides the helpful facts panel", () => {
    expect(screen.queryByText(/helpful facts/i)).not.toBeInTheDocument();
  });

  it("focuses the Next problem button after the delay", () => {
    // enterSum already advanced 50ms, so the button should be focused.
    expect(screen.getByRole("button", { name: /next problem/i })).toHaveFocus();
  });

  it("clicking Next problem resets to the building phase", () => {
    fireEvent.click(screen.getByRole("button", { name: /next problem/i }));
    act(() => vi.advanceTimersByTime(50));
    expect(screen.getByRole("textbox", { name: /partial quotient/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /next problem/i })).not.toBeInTheDocument();
  });
});

// ─── Keyboard regression ──────────────────────────────────────────────────────
//
// Bug: pressing Enter to submit the correct sum in the summing phase would
// briefly show the done phase and then immediately advance to the next problem.
// Root cause: the old code used `autoFocus` on the Next button, so the Enter
// keyup fired on the newly-focused button and triggered handleNext.
// Fix: replaced autoFocus with a ref + setTimeout(50ms) so the button only
// receives focus after the key event sequence is complete.

describe("AreaModelProblem — keyboard regression: Enter in summing phase", () => {
  it("shows the done phase without advancing to the next problem", () => {
    renderComponent();
    advanceToSumming();

    const input = screen.getByRole("textbox", { name: /sum of partial quotients/i });
    fireEvent.change(input, { target: { value: "24" } });
    fireEvent.keyDown(input, { key: "Enter" });

    // Done phase should be visible.
    expect(screen.getByText(/72 ÷ 3 = 24 ✓/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next problem/i })).toBeInTheDocument();

    // Building phase must NOT have loaded (would mean the next problem was triggered).
    expect(screen.queryByRole("textbox", { name: /partial quotient/i })).not.toBeInTheDocument();
  });

  it("does not immediately focus the Next button after Enter (no autoFocus)", () => {
    renderComponent();
    advanceToSumming();

    const input = screen.getByRole("textbox", { name: /sum of partial quotients/i });
    fireEvent.change(input, { target: { value: "24" } });
    fireEvent.keyDown(input, { key: "Enter" });

    // With the old autoFocus approach the button would be focused here, which
    // caused keyup to trigger a click and advance to the next problem.
    const nextButton = screen.getByRole("button", { name: /next problem/i });
    expect(nextButton).not.toHaveFocus();
  });

  it("focuses the Next button after the 50ms delay", () => {
    renderComponent();
    advanceToSumming();

    const input = screen.getByRole("textbox", { name: /sum of partial quotients/i });
    fireEvent.change(input, { target: { value: "24" } });
    fireEvent.keyDown(input, { key: "Enter" });

    const nextButton = screen.getByRole("button", { name: /next problem/i });
    expect(nextButton).not.toHaveFocus(); // not yet

    act(() => vi.advanceTimersByTime(50));
    expect(nextButton).toHaveFocus(); // now focused, safe to press Enter again
  });
});
