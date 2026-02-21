import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuizButton from "@/components/multiplication/QuizButton";

const defaults = { value: 42, onClick: () => {}, disabled: false, state: "default" as const };

describe("QuizButton", () => {
  it("renders the value as button text", () => {
    render(<QuizButton {...defaults} />);
    expect(screen.getByRole("button", { name: "Answer: 42" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<QuizButton {...defaults} onClick={onClick} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", async () => {
    const onClick = vi.fn();
    render(<QuizButton {...defaults} onClick={onClick} disabled />);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  describe("state styling", () => {
    it("applies green background for correct state", () => {
      render(<QuizButton {...defaults} state="correct" />);
      expect(screen.getByRole("button")).toHaveClass("bg-correct");
    });

    it("applies red background and not-allowed cursor for wrong state", () => {
      render(<QuizButton {...defaults} state="wrong" />);
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("bg-wrong");
      expect(btn).toHaveClass("cursor-not-allowed");
    });

    it("applies opacity-0 for fade-out state", () => {
      render(<QuizButton {...defaults} state="fade-out" />);
      expect(screen.getByRole("button")).toHaveClass("opacity-0");
    });

    it("applies default slate background for default state", () => {
      render(<QuizButton {...defaults} state="default" />);
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("bg-slate-200");
      expect(btn).not.toHaveClass("bg-correct", "bg-wrong", "opacity-0");
    });
  });
});
