import { useState, useCallback, useMemo } from "react";
import {
  createGameState,
  startSession,
  recordResult,
  getCurrentSession,
  summarize,
  strugglingQuestions,
  allResults,
  getNextQuestion,
  type GameState,
  type Question,
  type PeriodSummary,
  type QuestionStats,
  type Session,
} from "./multiplicationGameEngine";

export interface GameEngineDeps {
  now: () => number;
  generateId: () => string;
  random: () => number;
}

const defaultDeps: GameEngineDeps = {
  now: () => Date.now(),
  generateId: () => crypto.randomUUID(),
  random: () => Math.random(),
};

export function useMultiplicationGameEngine(deps?: Partial<GameEngineDeps>) {
  const { now, generateId, random } = { ...defaultDeps, ...deps };
  const [state, setState] = useState<GameState>(createGameState);

  const start = useCallback(() => {
    setState((s) => startSession(s, generateId(), now()));
  }, [generateId, now]);

  const record = useCallback(
    (question: Question, wrongAnswers: readonly number[]) => {
      setState((s) => recordResult(s, question, wrongAnswers, now()));
    },
    [now],
  );

  const nextQuestion = useCallback(
    (previousResults?: readonly import("./multiplicationGameEngine").QuestionResult[]) => {
      const results = previousResults ?? allResults(state);
      return getNextQuestion(results, random());
    },
    [state, random],
  );

  const currentSession: Session | null = useMemo(
    () => getCurrentSession(state),
    [state],
  );

  const currentSummary: PeriodSummary = useMemo(
    () => (currentSession ? summarize(currentSession.results) : summarize([])),
    [currentSession],
  );

  const struggling: QuestionStats[] = useMemo(
    () => strugglingQuestions(allResults(state), 2, 10),
    [state],
  );

  return useMemo(
    () => ({
      start,
      recordResult: record,
      getNextQuestion: nextQuestion,
      currentSession,
      currentSummary,
      struggling,
      state,
    }),
    [start, record, nextQuestion, currentSession, currentSummary, struggling, state],
  );
}
