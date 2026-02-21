import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import HardModeQuizBoard from "@/components/multiplication/HardModeQuizBoard";

/** Read the correct answer from the rendered card stack. */
function getCorrectAnswer(): number {
  const els = screen.getAllByText(/\d+\s*×\s*\d+/);
  const match = els[0].textContent!.match(/(\d+)\s*×\s*(\d+)/)!;
  return Number(match[1]) * Number(match[2]);
}

/** Type a value into the input by clearing then setting it. */
function typeAnswer(input: HTMLElement, value: number) {
  fireEvent.change(input, { target: { value: String(value) } });
}

/** Click the Check button. */
function clickCheck() {
  fireEvent.click(screen.getByRole("button", { name: /check/i }));
}

/** Press Enter on the input. */
function pressEnter(input: HTMLElement) {
  fireEvent.keyDown(input, { key: "Enter" });
}

/** Advance past the card transition after a correct answer. */
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

describe("HardModeQuizBoard", () => {
  it("renders a question, an input, and a Check button", () => {
    render(<HardModeQuizBoard />);

    const cards = screen.getAllByText(/\d+\s*×\s*\d+/);
    expect(cards.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByLabelText(/enter your answer/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /check/i })).toBeInTheDocument();
  });

  it("auto-focuses the input on mount", () => {
    render(<HardModeQuizBoard />);

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(screen.getByLabelText(/enter your answer/i)).toHaveFocus();
  });

  it("shows 'Try again' error for a wrong answer via Check button", () => {
    render(<HardModeQuizBoard />);

    const input = screen.getByLabelText(/enter your answer/i);
    const wrongAnswer = getCorrectAnswer() + 1;

    typeAnswer(input, wrongAnswer);
    clickCheck();

    expect(screen.getByRole("alert")).toHaveTextContent(/try again/i);
  });

  it("shows 'Try again' error for a wrong answer via Enter key", () => {
    render(<HardModeQuizBoard />);

    const input = screen.getByLabelText(/enter your answer/i);
    const wrongAnswer = getCorrectAnswer() + 1;

    typeAnswer(input, wrongAnswer);
    pressEnter(input);

    expect(screen.getByRole("alert")).toHaveTextContent(/try again/i);
  });

  it("shows 'Enter a number' error when submitting empty input", () => {
    render(<HardModeQuizBoard />);

    clickCheck();

    expect(screen.getByRole("alert")).toHaveTextContent(/enter a number/i);
  });

  it("clears error when user types after a wrong answer", () => {
    render(<HardModeQuizBoard />);

    const input = screen.getByLabelText(/enter your answer/i);
    const wrongAnswer = getCorrectAnswer() + 1;

    typeAnswer(input, wrongAnswer);
    clickCheck();
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "1" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows 'Correct!' text for a correct answer", () => {
    render(<HardModeQuizBoard />);

    const input = screen.getByLabelText(/enter your answer/i);
    const correctAnswer = getCorrectAnswer();

    typeAnswer(input, correctAnswer);
    clickCheck();

    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });

  it("transitions to a new question after correct answer", () => {
    render(<HardModeQuizBoard />);

    const input = screen.getByLabelText(/enter your answer/i);
    const correctAnswer = getCorrectAnswer();

    typeAnswer(input, correctAnswer);
    clickCheck();

    advanceCardTransition();

    // Input should be cleared and visible again
    const newInput = screen.getByLabelText(/enter your answer/i);
    expect(newInput).toHaveValue("");
    expect(screen.queryByText("Correct!")).not.toBeInTheDocument();
  });

  it("re-focuses input after card transition completes", () => {
    render(<HardModeQuizBoard />);

    const input = screen.getByLabelText(/enter your answer/i);
    const correctAnswer = getCorrectAnswer();

    typeAnswer(input, correctAnswer);
    clickCheck();

    advanceCardTransition();

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(screen.getByLabelText(/enter your answer/i)).toHaveFocus();
  });

  it("announces correct answer to screen readers", () => {
    render(<HardModeQuizBoard />);

    const input = screen.getByLabelText(/enter your answer/i);
    const correctAnswer = getCorrectAnswer();

    typeAnswer(input, correctAnswer);
    clickCheck();

    act(() => {
      vi.advanceTimersByTime(50);
    });

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/correct!/i);
  });

  it("announces wrong answer to screen readers", () => {
    render(<HardModeQuizBoard />);

    const input = screen.getByLabelText(/enter your answer/i);
    const wrongAnswer = getCorrectAnswer() + 1;

    typeAnswer(input, wrongAnswer);
    clickCheck();

    act(() => {
      vi.advanceTimersByTime(50);
    });

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/incorrect.*try again/i);
  });
});
