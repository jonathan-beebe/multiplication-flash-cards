import type { Section } from "@/lib/division/areaMode/divisionProblem";

interface AreaModelRectProps {
  divisor: number;
  dividend: number;
  sections: Section[];
  remaining: number;
}

/**
 * Pure display component. Renders a rectangle divided into sections whose
 * widths are proportional to their area (partial quotient × divisor).
 *
 * Layout:
 *   - Partial quotient labels appear above each filled section, with a "?"
 *     above the unfilled remainder.
 *   - The divisor is labeled on the left side of the rectangle.
 *   - Filled sections are teal; the unfilled remainder is dimmed.
 */
export default function AreaModelRect({
  divisor,
  dividend,
  sections,
  remaining,
}: AreaModelRectProps) {
  // Width of the divisor label column — must match in both label row and rect row.
  const DIVISOR_COL = "3rem";

  return (
    <div className="w-full select-none" aria-hidden="true">
      {/* Partial quotient labels row */}
      <div className="flex" style={{ marginLeft: DIVISOR_COL }}>
        {sections.map((s, i) => (
          <div
            key={i}
            className="flex items-end justify-center pb-1 text-sm font-bold text-slate-700 dark:text-slate-200 overflow-hidden"
            style={{ flex: s.area, minWidth: "2rem" }}
          >
            {s.partialQuotient.toLocaleString()}
          </div>
        ))}
        {remaining > 0 && (
          <div
            className="flex items-end justify-center pb-1 text-sm font-bold text-slate-400 dark:text-slate-500 overflow-hidden"
            style={{ flex: remaining, minWidth: "2rem" }}
          >
            ?
          </div>
        )}
      </div>

      {/* Rectangle row */}
      <div className="flex items-stretch" style={{ minHeight: "5rem" }}>
        {/* Divisor label */}
        <div
          className="flex shrink-0 items-center justify-center text-lg font-bold text-slate-700 dark:text-slate-200 border-2 border-r-0 border-slate-400 dark:border-slate-500 rounded-l-lg bg-slate-100 dark:bg-slate-800"
          style={{ width: DIVISOR_COL }}
        >
          {divisor}
        </div>

        {/* Sections */}
        <div className="flex flex-1 border-2 border-slate-400 dark:border-slate-500 rounded-r-lg overflow-hidden">
          {sections.map((s, i) => {
            const isLast = i === sections.length - 1 && remaining === 0;
            return (
              <div
                key={i}
                className={`flex items-center justify-center text-sm font-semibold bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 overflow-hidden ${
                  isLast ? "" : "border-r-2 border-slate-300 dark:border-slate-600"
                }`}
                style={{ flex: s.area, minWidth: "2rem" }}
              >
                {s.area.toLocaleString()}
              </div>
            );
          })}

          {remaining > 0 && (
            <div
              className="flex items-center justify-center text-sm text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 border-l-2 border-dashed border-slate-300 dark:border-slate-600 overflow-hidden"
              style={{ flex: remaining, minWidth: "2rem" }}
            >
              {remaining.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Dividend label below */}
      <div className="flex justify-end mt-1" style={{ marginLeft: DIVISOR_COL }}>
        <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
          Total: {dividend.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
