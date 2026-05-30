---
id: A11Y-001
type: a11y
status: resolved
created: 2026-03-29
---

# A11Y-001: SecondaryText fails minimum contrast ratio for small text

## Problem

The `SecondaryText` component (`src/components/atoms/SecondaryText.tsx:3`) uses
`text-slate-500` (`#64748b`) on the `bg-background` page background, which
resolves to `slate-100` (`#f1f5f9`) in light mode. The computed contrast ratio
is approximately **4.3:1**, below the WCAG AA minimum of **4.5:1** for small
text (`text-sm` / 14px, normal weight). Dark mode (`text-slate-400` on
`slate-900`) achieves ~7.0:1 and passes.

## Outcome

`SecondaryText` and other `text-slate-500`-on-light-background instances meet
WCAG 1.4.3 AA (≥ 4.5:1) for small text in light mode.

## Why it matters

WCAG 1.4.3 Contrast (Minimum) — Level AA. At ~4.3:1 the text is difficult to
read for users with low vision, especially on lower-quality displays.

## Discovery notes

Other uses of `text-slate-500` on light backgrounds throughout the app likely
have the same issue. Known instances: the division problem components
(`AreaModelRect`, `PartialQuotientsDisplay`, `LongDivisionDisplay`) and the
"Helpful facts" toggle button — all render `text-slate-500` at `text-sm`.

## Recommendation

Change `text-slate-500` to `text-slate-600` (`#475569`) in light mode.
`slate-600` on `slate-100` yields ~7.0:1, comfortably passing AA and AAA.

```diff
- <p className={`text-sm text-slate-500 dark:text-slate-400${className ? ` ${className}` : ''}`} {...props}>
+ <p className={`text-sm text-slate-600 dark:text-slate-400${className ? ` ${className}` : ''}`} {...props}>
```

Audit all other `text-slate-500` on light backgrounds for the same issue.

## Working

Resolved by PR #7 (commit `12beacf`).
