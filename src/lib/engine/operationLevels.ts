export type OperationLevel = 'ones' | 'tens' | 'hundreds' | 'thousands'

export const OPERATION_LEVELS: Record<OperationLevel, { label: string; description: string }> = {
  ones: { label: 'Easy', description: 'Single digits' },
  tens: { label: 'Med', description: 'Up to two digits' },
  hundreds: { label: 'Hard', description: 'Up to three digits' },
  thousands: { label: 'Master', description: 'Up to four digits' },
}

export const ADDITION_LEVEL_RANGES: Record<OperationLevel, { aMin: number; aMax: number; bMin: number; bMax: number }> =
  {
    ones: { aMin: 2, aMax: 9, bMin: 2, bMax: 9 },
    tens: { aMin: 2, aMax: 99, bMin: 2, bMax: 9 },
    hundreds: { aMin: 2, aMax: 999, bMin: 2, bMax: 99 },
    thousands: { aMin: 2, aMax: 9999, bMin: 2, bMax: 9999 },
  }

export const SUBTRACTION_LEVEL_RANGES: Record<
  OperationLevel,
  { aMin: number; aMax: number; bMin: number; bMax: number }
> = {
  ones: { aMin: 2, aMax: 9, bMin: 2, bMax: 9 },
  tens: { aMin: 2, aMax: 99, bMin: 2, bMax: 9 },
  hundreds: { aMin: 2, aMax: 999, bMin: 2, bMax: 99 },
  thousands: { aMin: 2, aMax: 9999, bMin: 2, bMax: 9999 },
}

export const MULTIPLICATION_LEVEL_RANGES: Record<
  OperationLevel,
  { aMin: number; aMax: number; bMin: number; bMax: number }
> = {
  // Factors start at 3 (×1 and ×2 are not worth drilling); the second factor
  // stays small so each level matches its digit-count tooltip.
  ones: { aMin: 3, aMax: 9, bMin: 3, bMax: 9 },
  tens: { aMin: 3, aMax: 99, bMin: 3, bMax: 9 },
  hundreds: { aMin: 3, aMax: 999, bMin: 3, bMax: 9 },
  thousands: { aMin: 3, aMax: 9999, bMin: 3, bMax: 12 },
}

export const OPERATION_LEVEL_IDS: OperationLevel[] = ['ones', 'tens', 'hundreds', 'thousands']

export const DEFAULT_LEVEL: OperationLevel = 'ones'

export function parseOperationLevel(param: string | undefined): OperationLevel {
  if (param === 'ones' || param === 'tens' || param === 'hundreds' || param === 'thousands') {
    return param
  }
  return DEFAULT_LEVEL
}
