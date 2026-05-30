---
id: BUG-001
type: bug
status: resolved
created: 2026-03-29
---

# BUG-001: Biased factor order in multiplication question presentation

## Problem

`src/lib/multiplication/multiplicationGenerator.ts:100` reuses the same
`randomValue` for both question selection (weighted random pick) and factor
order (a×b vs b×a):

```typescript
let target = randomValue * totalWeight
for (let i = 0; i < pool.length; i++) {
  target -= weights[i]
  if (target <= 0) {
    const q = pool[i]
    // BUG: reuses randomValue — simplifies to randomValue < 0.5
    return randomValue * totalWeight < totalWeight / 2 ? q : { a: q.b, b: q.a }
  }
}
```

The expression `randomValue * totalWeight < totalWeight / 2` simplifies to
`randomValue < 0.5`. Since `randomValue` also drives the weighted question pick,
questions from the first half of the weight distribution (lower `randomValue`)
are **always** presented as `a × b`, and questions from the second half are
**always** presented as `b × a`. A child will never see both orderings of the
same question.

## Outcome

Across many trials, a given question (e.g. `3 × 7`) appears in both factor
orderings with roughly equal frequency, decoupled from which question was
selected.

## Why it matters

Children don't get to practice commutativity (seeing both factor orderings), and
certain questions always appear in one order — reinforcing rote memorization of
presentation rather than the underlying multiplication fact.

## Discovery notes

The same bias exists in the `totalWeight === 0` fallback path (also reusing
`randomValue`). The generator takes `randomValue` as a parameter for
deterministic testability, so calling `Math.random()` directly inside breaks
that contract.

## Recommendation

Use an independent-but-derived value so testability is preserved:

```typescript
return (randomValue * 7919) % 1 < 0.5 ? q : { a: q.b, b: q.a }
```

Or accept a second random parameter explicitly.

## Working

**2026-03-29 — Confirmed and fixed.**

1. Verified the bug at line 94 of `multiplicationGenerator.ts`.
2. The same pattern existed in the `totalWeight === 0` fallback (line 85).
3. Added a failing test checking that both factor orderings appear across
   different `randomValue` inputs — confirmed it failed pre-fix.
4. Applied the recommended `(randomValue * 7919) % 1 < 0.5` approach.
5. All 245 tests pass.

Resolved by PR #2 (commit `9d18cf4`).
