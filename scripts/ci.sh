#!/bin/sh
# CI: runs all checks, suppressing output unless a step fails.
set -e

steps="lint typecheck test:ci build"

for step in $steps; do
  if ! output=$(npm run "$step" 2>&1); then
    echo "✗ $step failed:"
    echo "$output"
    exit 1
  fi
done

echo "✓ All checks passed."
