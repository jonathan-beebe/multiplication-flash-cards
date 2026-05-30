---
id: BUG-008
type: bug
status: resolved
created: 2026-03-29
resolved: 2026-05-30
---

# BUG-008: Level picker tooltip descriptions don't match actual question ranges

## Problem

The `OPERATION_LEVELS` descriptions in `src/lib/engine/operationLevels.ts:3-8`
(shown as `title` tooltips on level picker buttons) are wrong in two ways:

1. **Ranges don't match code.** Every description overstates the range. Example:
   "ones" says `0–99 + 0–9` but the actual range is `2–9 + 2–9`.
2. **Subtraction shows "+" sign.** The same descriptions are shared across
   addition and subtraction, so subtraction level pickers show `0–99 + 0–9` with
   a `+` operator.

| Level     | Tooltip (current) | Actual `ADDITION_LEVEL_RANGES` |
| --------- | ----------------- | ------------------------------ |
| ones      | `0–99 + 0–9`      | `2–9 + 2–9`                    |
| tens      | `0–999 + 0–99`    | `2–99 + 2–9`                   |
| hundreds  | `0–9999 + 0–999`  | `2–999 + 2–99`                 |
| thousands | `0–9999 + 0–9999` | `2–9,999 + 2–9,999`            |

`SUBTRACTION_LEVEL_RANGES` has identical values but should use `−` instead of
`+`.

Descriptions are defined once in `OPERATION_LEVELS` and shared by both
`AdditionMenu.tsx:38` and `SubtractionMenu.tsx:38` via
`title={OPERATION_LEVELS[l].description}`.

## Outcome

Level picker tooltips accurately describe the questions a child will see at that
level, in both the addition and subtraction menus.

## Why it matters

Parents or children hovering over level buttons see incorrect range information;
subtraction tooltips misleadingly show `+`. Trust in the difficulty labels
suffers.

## Recommendation

Either make descriptions operation-aware (separate description sets for addition
vs subtraction), or make them generic:

```typescript
export const OPERATION_LEVELS: Record<
  OperationLevel,
  { label: string; description: string }
> = {
  ones: { label: 'Easy', description: 'Single digits' },
  tens: { label: 'Med', description: 'Up to two digits' },
  hundreds: { label: 'Hard', description: 'Up to three digits' },
  thousands: { label: 'Master', description: 'Up to four digits' },
}
```

Or fix the ranges to match exactly:

```typescript
ones:      { label: 'Easy',   description: '2–9 and 2–9'          },
tens:      { label: 'Med',    description: '2–99 and 2–9'         },
hundreds:  { label: 'Hard',   description: '2–999 and 2–99'       },
thousands: { label: 'Master', description: '2–9,999 and 2–9,999'  },
```
