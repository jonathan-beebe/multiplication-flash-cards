import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuizBoard from "@/components/multiplication/QuizBoard";
import type { CardAnimationProps } from "@/components/multiplication/QuizBoard";
import type { QuestionGenerator } from "@/lib/gameEngine";

interface MockQuestion {
  left: number;
  right: number;
}

const mockGenerator: QuestionGenerator<MockQuestion> = {
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

describe("QuizBoard", () => {
  function getCorrectAnswer(): number {
    const els = screen.getAllByText(/\d+\s*\+\s*\d+/);
    const match = els[0].textContent!.match(/(\d+)\s*\+\s*(\d+)/)!;
    return Number(match[1]) + Number(match[2]);
  }

  beforeEach(() => {
    questionIndex = 0;
  });

  it("renders a question and 3 choice buttons", () => {
    render(
      <QuizBoard
        generator={mockGenerator}
        getNextQuestion={mockGetNextQuestion}
        renderQuestion={renderQuestion}
      />
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
  });

  it("renders the question expression via renderQuestion", () => {
    render(
      <QuizBoard
        generator={mockGenerator}
        getNextQuestion={mockGetNextQuestion}
        renderQuestion={renderQuestion}
      />
    );
    const cards = screen.getAllByText(/\d+\s*\+\s*\d+/);
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  it("calls onCorrect when the right answer is clicked", async () => {
    const onCorrect = vi.fn();
    render(
      <QuizBoard
        generator={mockGenerator}
        getNextQuestion={mockGetNextQuestion}
        renderQuestion={renderQuestion}
        onCorrect={onCorrect}
      />
    );

    const correctAnswer = getCorrectAnswer();
    const correctButton = screen.getByRole("button", { name: `Answer: ${correctAnswer}` });
    await userEvent.click(correctButton);

    expect(onCorrect).toHaveBeenCalledOnce();
  });

  it("calls onWrong when a wrong answer is clicked", async () => {
    const onWrong = vi.fn();
    render(
      <QuizBoard
        generator={mockGenerator}
        getNextQuestion={mockGetNextQuestion}
        renderQuestion={renderQuestion}
        onWrong={onWrong}
      />
    );

    const correctAnswer = getCorrectAnswer();
    const wrongButton = screen.getAllByRole("button")
      .find((btn) => btn.textContent !== String(correctAnswer))!;
    await userEvent.click(wrongButton);

    expect(onWrong).toHaveBeenCalledOnce();
  });

  it("disables a wrong answer button after clicking it", async () => {
    render(
      <QuizBoard
        generator={mockGenerator}
        getNextQuestion={mockGetNextQuestion}
        renderQuestion={renderQuestion}
      />
    );

    const correctAnswer = getCorrectAnswer();
    const wrongButton = screen.getAllByRole("button")
      .find((btn) => btn.textContent !== String(correctAnswer))!;
    await userEvent.click(wrongButton);

    expect(wrongButton).toBeDisabled();
  });

  it("does not call onWrong twice for the same wrong answer", async () => {
    const onWrong = vi.fn();
    render(
      <QuizBoard
        generator={mockGenerator}
        getNextQuestion={mockGetNextQuestion}
        renderQuestion={renderQuestion}
        onWrong={onWrong}
      />
    );

    const correctAnswer = getCorrectAnswer();
    const wrongButton = screen.getAllByRole("button")
      .find((btn) => btn.textContent !== String(correctAnswer))!;

    await userEvent.click(wrongButton);
    await userEvent.click(wrongButton);

    expect(onWrong).toHaveBeenCalledOnce();
  });
});
