# Project

A math training PWA for grade school children, covering addition, subtraction,
multiplication, and division.

# Stack

- TypeScript, React, Tailwind CSS
- Published as a PWA

# Details

- **Accessibility.** This app needs to adhere to strict WCAG guidelines. Always
  favor highly-accessible solutions.
- **Tabular Numbers.** All numbers are represented using tabular numbers so they
  align well.

# Principles

- **Simplicity first.** Avoid over-engineering. The right amount of complexity
  is the minimum needed for the current task.
- **Iterative workflow.** Build incrementally; prefer small, focused changes.
- **Functional core / imperative shell.** Business logic and state
  transformations live in pure functions that are easily unit-testable.
  Components and hooks are thin shells that wire state to the UI.
- **Test what matters.** Write tests to protect primary user value — end-to-end
  flows and core logic. Don't test implementation details.

# Worflow details

- **Collaboration.** We work together in three steps: planning our work, then
  implementing, then reviewing and committing.
- **git commit messages.** We follow the git conventions for
  [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary).
- **Plan before executing.** Always present a plan and get approval before
  implementing non-trivial changes.
