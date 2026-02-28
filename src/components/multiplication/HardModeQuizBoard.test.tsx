import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import HardModeQuizBoard from "@/components/multiplication/HardModeQuizBoard";
import type { CardAnimationProps } from "@/components/multiplication/QuizBoard";
import type { QuestionGenerator } from "@/lib/engine/gameEngine";

interface MockQuestion {
  left: number;
  right: number;
}

const mockGenerator: QuestionGenerator<MockQuestion> = {
  storageKey: "mock-game-state",
  questionKey: (q) => `${q.left}+${q.right}`,
  parseQuestionKey: (key) => {
    const [l, r] = key.split("+");
    return { left: Number(l), right: Number(r) };
  },
  getNextQuestion: () => ({ left: 2, right: 3 }),
  evaluate: (q, answer) => answer === q.left + q.right,
  generateChoices: (q) => {
    const correct = q.left + q.right;
    return [correct, correct + 1, correct + 2];
  },
  displayText: (q) => `${q.left} plus ${q.right}`,
};

function renderQuestion(q: MockQuestion, animProps: CardAnimationProps) {
  return (
    <div
      className={animProps.className}
      style={animProps.style}
      onTransitionEnd={animProps.onTransitionEnd}
      aria-hidden={animProps["aria-hidden"]}
    >
      <span aria-hidden="true">{q.left} + {q.right}</span>
      <span className="sr-only">{q.left} plus {q.right}</span>
    </div>
  );
}

let questionIndex = 0;
function mockGetNextQuestion(): MockQuestion {
  questionIndex++;
  return { left: 2 + questionIndex, right: 3 + questionIndex };
}

/** Read the correct answer from the rendered cards. */
function getCorrectAnswer(): number {
  const els = screen.getAllByText(/\d+\s*\+\s*\d+/);
  const match = els[0].textContent!.match(/(\d+)\s*\+\s*(\d+)/)!;
  return Number(match[1]) + Number(match[2]);
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
  questionIndex = 0;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("HardModeQuizBoard", () => {
  it("renders a question, an input, and a Check button", () => {
    render(
      <HardModeQuizBoard
        generator={mockGenerator}
        getNextQuestion={mockGetNextQuestion}
        renderQuestion={renderQuestion}
      />
    );

    const cards = screen.getAllByText(/\d+\s*\+\s*\d+/);
    expect(cards.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByLabelText(/enter your answer/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /check/i })).toBeInTheDocument();
  });

  it("auto-focuses the input on mount", () => {
    render(
      <HardModeQuizBoard
        generator={mockGenerator}
        getNextQuestion={mockGetNextQuestion}
        renderQuestion={renderQuestion}
      />
    );

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(screen.getByLabelText(/enter your answer/i)).toHaveFocus();
  });

  it("shows 'Try again' error for a wrong answer via Check button", () => {
    render(
      <HardModeQuizBoard
        generator={mockGenerator}
        getNextQuestion={mockGetNextQuestion}
        renderQuestion={renderQuestion}
      />
    );

    const input = screen.getByLabelText(/enter your answer/i);
    const wrongAnswer = getCorrectAnswer() + 1;

    typeAnswer(input, wrongAnswer);
    clickCheck();

    expect(screen.getByRole("alert")).toHaveTextContent(/try again/i);
  });

  it("shows 'Try again' error for a wrong answer via Enter key", () => {
    render(
      <HardModeQuizBoard
        generator={mockGenerator}
        getNextQuestion={mockGetNextQuestion}
        renderQuestion={renderQuestion}
      />
    );

    const input = screen.getByLabelText(/enter your answer/i);
    const wrongAnswer = getCorrectAnswer() + 1;

    typeAnswer(input, wrongAnswer);
    pressEnter(input);

    expect(screen.getByRole("alert")).toHaveTextContent(/try again/i);
  });

  it("shows 'Enter a number' error when submitting empty input", () => {
    render(
      <HardModeQuizBoard
        generator={mockGenerator}
        getNextQuestion={mockGetNextQuestion}
        renderQuestion={renderQuestion}
      />
    );

    clickCheck();

    expect(screen.getByRole("alert")).toHaveTextContent(/enter a number/i);
  });

  it("clears error when user types after a wrong answer", () => {
    render(
      <HardModeQuizBoard
        generator={mockGenerator}
        getNextQuestion={mockGetNextQuestion}
        renderQuestion={renderQuestion}
      />
    );

    const input = screen.getByLabelText(/enter your answer/i);
    const wrongAnswer = getCorrectAnswer() + 1;

    typeAnswer(input, wrongAnswer);
    clickCheck();
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "1" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows 'Correct!' text for a correct answer", () => {
    render(
      <HardModeQuizBoard
        generator={mockGenerator}
        getNextQuestion={mockGetNextQuestion}
        renderQuestion={renderQuestion}
      />
    );

    const input = screen.getByLabelText(/enter your answer/i);
    const correctAnswer = getCorrectAnswer();

    typeAnswer(input, correctAnswer);
    clickCheck();

    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });

  it("transitions to a new question after correct answer", () => {
    render(
      <HardModeQuizBoard
        generator={mockGenerator}
        getNextQuestion={mockGetNextQuestion}
        renderQuestion={renderQuestion}
      />
    );

    const input = screen.getByLabelText(/enter your answer/i);
    const correctAnswer = getCorrectAnswer();

    typeAnswer(input, correctAnswer);
    clickCheck();

    advanceCardTransition();

    const newInput = screen.getByLabelText(/enter your answer/i);
    expect(newInput).toHaveValue("");
    expect(screen.queryByText("Correct!")).not.toBeInTheDocument();
  });

  it("re-focuses input after card transition completes", () => {
    render(
      <HardModeQuizBoard
        generator={mockGenerator}
        getNextQuestion={mockGetNextQuestion}
        renderQuestion={renderQuestion}
      />
    );

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
    render(
      <HardModeQuizBoard
        generator={mockGenerator}
        getNextQuestion={mockGetNextQuestion}
        renderQuestion={renderQuestion}
      />
    );

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
    render(
      <HardModeQuizBoard
        generator={mockGenerator}
        getNextQuestion={mockGetNextQuestion}
        renderQuestion={renderQuestion}
      />
    );

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
