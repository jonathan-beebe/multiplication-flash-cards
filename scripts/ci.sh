#!/bin/sh
# CI: runs all checks in parallel, suppressing output unless a step fails.

steps="format:check typecheck lint test"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT INT TERM

slug() {
  printf '%s' "$1" | tr ':/' '__'
}

for step in $steps; do
  s=$(slug "$step")
  npm run "$step" >"$tmp/$s.log" 2>&1 &
  eval "pid_$s=$!"
done

fail=0
for step in $steps; do
  s=$(slug "$step")
  eval "pid=\$pid_$s"
  wait "$pid"
  rc=$?
  eval "rc_$s=$rc"
  [ "$rc" -ne 0 ] && fail=1
done

for step in $steps; do
  s=$(slug "$step")
  eval "rc=\$rc_$s"
  if [ "$rc" -eq 0 ]; then
    echo "✓ $step"
  else
    echo "✗ $step"
  fi
done

if [ "$fail" -ne 0 ]; then
  for step in $steps; do
    s=$(slug "$step")
    eval "rc=\$rc_$s"
    if [ "$rc" -ne 0 ]; then
      echo
      echo "--- $step output ---"
      cat "$tmp/$s.log"
    fi
  done
  exit 1
fi

echo "✓ All checks passed."
