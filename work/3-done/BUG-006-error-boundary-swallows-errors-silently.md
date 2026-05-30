---
id: BUG-006
type: bug
status: resolved
created: 2026-03-29
resolved: 2026-05-30
---

# BUG-006: ErrorBoundary catches errors but never logs them

## Problem

`src/components/ErrorBoundary.tsx:43-60` implements `getDerivedStateFromError()`
to render the fallback UI but does not implement `componentDidCatch()`. Caught
errors are swallowed — no console output, no error tracking hook. When a render
error occurs, the user sees "Something went horribly wrong" but the developer
has no way to diagnose what happened.

## Outcome

Render errors caught by `ErrorBoundary` are logged (at minimum to the console in
development) with the error and component stack trace, so a developer can
diagnose what failed.

## Why it matters

During development, errors inside the boundary are invisible — no
`console.error`, no diagnostic signal. In production there's no hook for an
error reporting service. Silent failures are hard to find and harder to fix.

## Recommendation

Add `componentDidCatch`:

```typescript
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  console.error('[ErrorBoundary]', error, errorInfo.componentStack);
}
```

## Related work

- [[BUG-007-error-boundary-go-home-wrong-base-path]] — separate issue in the
  same component.
