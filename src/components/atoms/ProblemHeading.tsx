interface ProblemHeadingProps {
  "aria-label"?: string;
  children: React.ReactNode;
}

export default function ProblemHeading({ "aria-label": ariaLabel, children }: ProblemHeadingProps) {
  return (
    <p className="text-4xl font-bold tabular-nums text-text" aria-label={ariaLabel}>
      {children}
    </p>
  );
}
