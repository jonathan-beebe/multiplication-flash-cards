---
id: BUG-005
type: bug
status: resolved
created: 2026-03-29
---

# BUG-005: parseInt silently truncates decimal and partial-numeric input

## Problem

All text-input answer fields use `parseInt(inputValue, 10)` to parse user input.
`parseInt` silently truncates non-integer content:

- `"3.5"` → `3` (decimal silently dropped)
- `"5a"` → `5` (trailing chars silently dropped)
- `"1e10"` → `1` (scientific notation silently dropped)

Affected files:

- `src/components/division/areaMode/AreaModelProblem.tsx:55`
- `src/components/division/partialQuotients/PartialQuotientsProblem.tsx:54`
- `src/components/division/standardAlgorithm/StandardAlgorithmProblem.tsx:98`
- `src/components/quiz/HardModeQuizBoard.tsx:44`

Downstream validation (`Number.isInteger()`, `validatePartialQuotient`, …) then
sees a clean integer and accepts it. The user's actual input is silently
reinterpreted.

## Outcome

A non-digit-only entry (e.g. `"3.5"`, `"5a"`, `"1e10"`) is rejected with a clear
inline error rather than being silently coerced to a partial integer.

## Why it matters

On desktop `NumberInput` uses `type="text"` with `inputMode="numeric"` and
`pattern="[0-9]*"`; the `pattern` attribute only validates on form submission,
so non-digit characters can be typed. A child accidentally typing `"3.5"` or
pasting text gets their answer silently accepted as `3`, which may be wrong.

## Discovery notes

On mobile, `inputMode="numeric"` shows a number pad so this is primarily a
desktop concern — but desktop usage exists and the silent reinterpretation is
the worst kind of error to debug from a child's perspective.

## Recommendation

Validate the raw string before parsing:

```typescript
if (!/^\d+$/.test(inputValue.trim())) {
  triggerShake()
  setInputError('Enter a whole number')
  inputRef.current?.focus()
  return
}
const value = parseInt(inputValue, 10)
```

## Working

**2026-03-29:** Confirmed in all 4 files. Added
`/^\d+$/.test(inputValue.trim())` guard before `parseInt` in each:

- `HardModeQuizBoard.tsx` — "Enter a number" for empty, "Enter a whole number"
  for non-digit.
- `AreaModelProblem.tsx` — "Enter a whole number".
- `PartialQuotientsProblem.tsx` — "Enter a whole number".
- `StandardAlgorithmProblem.tsx` — "Enter a digit" for empty, "Enter a whole
  number" for non-digit.

Two new tests in `HardModeQuizBoard.test.tsx` covering decimal (`"3.5"`) and
trailing non-digit (`"5a"`) input. All 246 tests pass.

Resolved by PR #6 (commit `f3d19fe`).
