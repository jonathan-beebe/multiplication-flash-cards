// Barrel re-exports — keeps existing component imports working.

export type { Question } from "./multiplicationGenerator";
export { multiplicationGenerator } from "./multiplicationGenerator";

export type {
  QuestionResult,
  Session,
  GameState,
  QuestionStats,
  PeriodSummary,
  QuestionGenerator,
} from "./gameEngine";

export {
  createGameState,
  startSession,
  recordResult,
  getCurrentSession,
  summarize,
  sessionSummary,
  toDateStr,
  daySummary,
  questionStats,
  strugglingQuestions,
  allResults,
  serializeGameState,
  deserializeGameState,
  loadGameState,
  saveGameState,
} from "./gameEngine";
