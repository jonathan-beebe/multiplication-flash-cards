/** Parse a digits-only input value. Returns null if empty. */
export function parseInputValue(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  return parseInt(trimmed, 10)
}
