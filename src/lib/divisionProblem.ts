export type Level = 1 | 2 | 3 | 4;

export interface Problem {
  dividend: number;
  divisor: number;
  quotient: number;
}

export interface Section {
  partialQuotient: number;
  area: number;
}

export interface HelpfulFact {
  multiplier: number;
  product: number;
}

interface LevelConfig {
  label: string;
  description: string;
  divisorMin: number;
  divisorMax: number;
  quotientMin: number;
  quotientMax: number;
}

export const LEVELS: Record<Level, LevelConfig> = {
  1: {
    label: "Level 1",
    description: "2-digit answer, small divisor",
    divisorMin: 2,
    divisorMax: 5,
    quotientMin: 11,
    quotientMax: 99,
  },
  2: {
    label: "Level 2",
    description: "3-digit answer",
    divisorMin: 2,
    divisorMax: 9,
    quotientMin: 101,
    quotientMax: 999,
  },
  3: {
    label: "Level 3",
    description: "4-digit answer",
    divisorMin: 2,
    divisorMax: 9,
    quotientMin: 1001,
    quotientMax: 9999,
  },
  4: {
    label: "Level 4",
    description: "Divide by 10, 11, or 12",
    divisorMin: 10,
    divisorMax: 12,
    quotientMin: 11,
    quotientMax: 99,
  },
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hasAtLeastTwoNonZeroDigits(n: number): boolean {
  return String(n).split("").filter((d) => d !== "0").length >= 2;
}

export function generateProblem(level: Level): Problem {
  const config = LEVELS[level];
  const divisor = randomInt(config.divisorMin, config.divisorMax);

  let quotient = randomInt(config.quotientMin, config.quotientMax);
  for (let i = 0; i < 20; i++) {
    if (hasAtLeastTwoNonZeroDigits(quotient)) break;
    quotient = randomInt(config.quotientMin, config.quotientMax);
  }

  return { dividend: divisor * quotient, divisor, quotient };
}

/**
 * Returns a list of helpful multiplication facts for the given divisor,
 * filtered to only include products that don't exceed the dividend.
 */
export function getHelpfulFacts(
  divisor: number,
  dividend: number
): HelpfulFact[] {
  const multipliers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 50, 100, 200, 500, 1000];
  return multipliers
    .filter((m) => divisor * m <= dividend)
    .map((m) => ({ multiplier: m, product: divisor * m }));
}

export function validatePartialQuotient(
  value: number,
  divisor: number,
  remaining: number
): { valid: true } | { valid: false; error: string } {
  if (!Number.isInteger(value) || value <= 0) {
    return { valid: false, error: "Enter a whole number greater than 0" };
  }
  if (value * divisor > remaining) {
    return {
      valid: false,
      error: `Too big — only ${remaining.toLocaleString()} remaining`,
    };
  }
  return { valid: true };
}
