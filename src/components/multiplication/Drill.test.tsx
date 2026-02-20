import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "@/AppRoutes";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Drill → Success routing", () => {
  it("navigates to success screen when timer expires", () => {
    render(
      <MemoryRouter initialEntries={["/1-minute-drill"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    // Drill UI should be showing a question
    expect(screen.getAllByText(/\d+\s*×\s*\d+/).length).toBeGreaterThan(0);

    // Fast-forward 60 seconds
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByRole("heading", { name: /drill complete/i })).toBeInTheDocument();
  });

  it("shows correct and wrong counts from route state", () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/1-minute-drill/success",
            state: { correctCount: 15, wrongCount: 3 },
          },
        ]}
      >
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument(); // 15 + 3 attempted
  });

  it("restart navigates back to drill route", () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/1-minute-drill/success",
            state: { correctCount: 10, wrongCount: 2 },
          },
        ]}
      >
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /drill complete/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /restart/i }));

    // Should be back on the drill screen with a multiplication question
    expect(screen.getAllByText(/\d+\s*×\s*\d+/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/drill complete/i)).not.toBeInTheDocument();
  });

  it("home link navigates to /", () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/1-minute-drill/success",
            state: { correctCount: 5, wrongCount: 1 },
          },
        ]}
      >
        <AppRoutes />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("link", { name: /home/i }));

    expect(screen.getByRole("heading", { name: /multiplication flash/i })).toBeInTheDocument();
  });

  it("demo route renders with prop-based counts", () => {
    render(
      <MemoryRouter initialEntries={["/demo/drill-complete"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument(); // 42 + 8 attempted
  });
});
