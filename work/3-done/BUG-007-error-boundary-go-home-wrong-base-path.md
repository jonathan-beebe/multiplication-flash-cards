---
id: BUG-007
type: bug
status: resolved
created: 2026-03-29
resolved: 2026-05-30
---

# BUG-007: ErrorBoundary "Go home" button navigates to wrong URL

## Problem

`src/components/ErrorBoundary.tsx:26` uses `window.location.assign("/")` for the
error fallback's "Go home" button, but the app is deployed under the base path
`/multiplication-flash-cards` (configured via `BrowserRouter basename`).
Clicking "Go home" after a crash navigates to the site root, which 404s in
production (GitHub Pages).

`ErrorBoundary` is a class component outside the React Router context, so it
can't use `useNavigate()` or `<Link>`.

## Outcome

After a render error, the "Go home" button takes the user to the app's actual
home page in production (e.g. `/multiplication-flash-cards/`) rather than the
site root.

## Why it matters

The only recovery action after a crash leads to a 404. The user is stranded and
must manually edit the URL or use browser back — a poor experience for a child
using the app.

## Recommendation

Use `import.meta.env.BASE_URL`, which is already imported at the top of the file
for error images:

```typescript
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
// …
onClick={() => window.location.assign(BASE + "/")}
```

## Related work

- [[BUG-006-error-boundary-swallows-errors-silently]] — separate issue in the
  same component.
