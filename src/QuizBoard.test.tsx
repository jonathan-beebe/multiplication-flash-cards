import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuizBoard, { generateQuestion, generateChoices } from "./QuizBoard";

describe("generateQuestion", () => {
  it("returns a and b within default range 3-12", () => {
    for (let i = 0; i < 50; i++) {
      const q = generateQuestion();
      expect(q.a).toBeGreaterThanOrEqual(3);
      expect(q.a).toBeLessThanOrEqual(12);
      expect(q.b).toBeGreaterThanOrEqual(3);
      expect(q.b).toBeLessThanOrEqual(12);
    }
  });

  it("respects custom min/max", () => {
    for (let i = 0; i < 50; i++) {
      const q = generateQuestion(5, 7);
      expect(q.a).toBeGreaterThanOrEqual(5);
      expect(q.a).toBeLessThanOrEqual(7);
      expect(q.b).toBeGreaterThanOrEqual(5);
      expect(q.b).toBeLessThanOrEqual(7);
    }
  });
});

describe("generateChoices", () => {
  it("returns exactly 3 choices", () => {
    expect(generateChoices(4, 5)).toHaveLength(3);
  });

  it("always includes the correct answer", () => {
    for (let i = 0; i < 50; i++) {
      const a = 6, b = 7;
      const choices = generateChoices(a, b);
      expect(choices).toContain(a * b);
    }
  });

  it("returns unique values", () => {
    for (let i = 0; i < 50; i++) {
      const choices = generateChoices(8, 9);
      expect(new Set(choices).size).toBe(3);
    }
  });
});

describe("QuizBoard", () => {
  /** Read the correct answer from the rendered card stack. */
  function getCorrectAnswer(): number {
    // Both front and back cards show "a × b"; grab the first match
    const els = screen.getAllByText(/\d+\s*×\s*\d+/);
    const match = els[0].textContent!.match(/(\d+)\s*×\s*(\d+)/)!;
    return Number(match[1]) * Number(match[2]);
  }

  it("renders a question and 3 choice buttons", () => {
    render(<QuizBoard />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
  });

  it("renders the multiplication expression on the cards", () => {
    render(<QuizBoard />);
    // Card stack has a front and back card, both showing "a × b"
    const cards = screen.getAllByText(/\d+\s*×\s*\d+/);
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  it("calls onCorrect when the right answer is clicked", async () => {
    const onCorrect = vi.fn();
    render(<QuizBoard onCorrect={onCorrect} />);

    const correctAnswer = getCorrectAnswer();
    const correctButton = screen.getByRole("button", { name: String(correctAnswer) });
    await userEvent.click(correctButton);

    expect(onCorrect).toHaveBeenCalledOnce();
  });

  it("calls onWrong when a wrong answer is clicked", async () => {
    const onWrong = vi.fn();
    render(<QuizBoard onWrong={onWrong} />);

    const correctAnswer = getCorrectAnswer();
    const wrongButton = screen.getAllByRole("button")
      .find((btn) => btn.textContent !== String(correctAnswer))!;
    await userEvent.click(wrongButton);

    expect(onWrong).toHaveBeenCalledOnce();
  });

  it("disables a wrong answer button after clicking it", async () => {
    render(<QuizBoard />);

    const correctAnswer = getCorrectAnswer();
    const wrongButton = screen.getAllByRole("button")
      .find((btn) => btn.textContent !== String(correctAnswer))!;
    await userEvent.click(wrongButton);

    expect(wrongButton).toBeDisabled();
  });

  it("does not call onWrong twice for the same wrong answer", async () => {
    const onWrong = vi.fn();
    render(<QuizBoard onWrong={onWrong} />);

    const correctAnswer = getCorrectAnswer();
    const wrongButton = screen.getAllByRole("button")
      .find((btn) => btn.textContent !== String(correctAnswer))!;

    await userEvent.click(wrongButton);
    await userEvent.click(wrongButton); // second click on same button (disabled, won't fire)

    expect(onWrong).toHaveBeenCalledOnce();
  });
});
