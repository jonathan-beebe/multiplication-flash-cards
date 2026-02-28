export type OperationLevel = 'ones' | 'tens' | 'hundreds' | 'thousands';

export const OPERATION_LEVELS: Record<OperationLevel, { label: string; description: string }> = {
  ones:      { label: 'Easy',   description: '0–99 + 0–9'       },
  tens:      { label: 'Med',    description: '0–999 + 0–99'     },
  hundreds:  { label: 'Hard',   description: '0–9999 + 0–999'   },
  thousands: { label: 'Master', description: '0–9999 + 0–9999'  },
};

export const ADDITION_LEVEL_RANGES: Record<OperationLevel, { aMin: number; aMax: number; bMin: number; bMax: number }> = {
  ones:      { aMin: 0, aMax: 9,    bMin: 0, bMax: 9    },
  tens:      { aMin: 0, aMax: 99,   bMin: 0, bMax: 9    },
  hundreds:  { aMin: 0, aMax: 999,  bMin: 0, bMax: 99   },
  thousands: { aMin: 0, aMax: 9999, bMin: 0, bMax: 9999 },
};

export const SUBTRACTION_LEVEL_RANGES: Record<OperationLevel, { aMin: number; aMax: number; bMax: number }> = {
  ones:      { aMin: 1, aMax: 9,    bMax: 9    },
  tens:      { aMin: 1, aMax: 99,   bMax: 9    },
  hundreds:  { aMin: 1, aMax: 999,  bMax: 99   },
  thousands: { aMin: 1, aMax: 9999, bMax: 9999 },
};

export const OPERATION_LEVEL_IDS: OperationLevel[] = ['ones', 'tens', 'hundreds', 'thousands'];

export const DEFAULT_LEVEL: OperationLevel = 'ones';

export function parseOperationLevel(param: string | undefined): OperationLevel {
  if (param === 'ones' || param === 'tens' || param === 'hundreds' || param === 'thousands') {
    return param;
  }
  return DEFAULT_LEVEL;
}
