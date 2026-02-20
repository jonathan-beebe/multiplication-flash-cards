import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AreaModelRect from "@/components/division/AreaModelRect";

const baseProps = {
  divisor: 3,
  dividend: 72,
  sections: [],
  remaining: 72,
};

describe("AreaModelRect", () => {
  it("renders without crashing with no sections", () => {
    render(<AreaModelRect {...baseProps} />);
  });

  it("is hidden from assistive technology", () => {
    const { container } = render(<AreaModelRect {...baseProps} />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("displays the divisor", () => {
    render(<AreaModelRect {...baseProps} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("displays the total dividend", () => {
    render(<AreaModelRect {...baseProps} />);
    expect(screen.getByText(/Total: 72/)).toBeInTheDocument();
  });

  it('renders a "?" for the unfilled remainder when sections are empty', () => {
    render(<AreaModelRect {...baseProps} remaining={72} />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it('renders a "?" for the unfilled remainder when sections are partially filled', () => {
    const sections = [{ partialQuotient: 20, area: 60 }];
    render(<AreaModelRect {...baseProps} sections={sections} remaining={12} />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it('does not render "?" when remaining is 0', () => {
    const sections = [{ partialQuotient: 24, area: 72 }];
    render(<AreaModelRect {...baseProps} sections={sections} remaining={0} />);
    expect(screen.queryByText("?")).not.toBeInTheDocument();
  });

  it("renders the area value for each section", () => {
    const sections = [
      { partialQuotient: 20, area: 60 },
      { partialQuotient: 4, area: 12 },
    ];
    render(<AreaModelRect {...baseProps} sections={sections} remaining={0} />);
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders the partial quotient label above each section", () => {
    const sections = [
      { partialQuotient: 20, area: 60 },
      { partialQuotient: 4, area: 12 },
    ];
    render(<AreaModelRect {...baseProps} sections={sections} remaining={0} />);
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("renders correctly with a single section that fills the full dividend", () => {
    const sections = [{ partialQuotient: 24, area: 72 }];
    render(<AreaModelRect {...baseProps} sections={sections} remaining={0} />);
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.queryByText("?")).not.toBeInTheDocument();
  });
});
