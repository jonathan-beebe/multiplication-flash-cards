import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  startSession,
  recordResult,
  getCurrentSession,
  summarize,
  strugglingQuestions,
  allResults,
  getNextQuestion,
  loadGameState,
  saveGameState,
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
  const [state, setState] = useState<GameState>(loadGameState);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveGameState(state);
  }, [state]);

  const start = useCallback(() => {
    setState((s) => {
      // If the current session is empty (no results), reuse it instead of
      // creating another one. This prevents duplicates from React Strict Mode
      // double-mounting while still allowing new sessions when there's real data.
      if (s.currentSessionId !== null) {
        const current = s.sessions.find((sess) => sess.id === s.currentSessionId);
        if (current && current.results.length === 0) return s;
      }
      return startSession(s, generateId(), now());
    });
  }, [generateId, now]);

  const record = useCallback(
    (question: Question, wrongAnswers: readonly number[]) => {
      setState((s) => recordResult(s, question, wrongAnswers));
    },
    [],
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
