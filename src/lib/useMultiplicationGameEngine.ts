import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  startSession,
  recordResult,
  getCurrentSession,
  summarize,
  strugglingQuestions,
  allResults,
  loadGameState,
  saveGameState,
  multiplicationGenerator,
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
  const [state, setState] = useState<GameState<Question>>(() =>
    loadGameState(multiplicationGenerator),
  );
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveGameState(state, multiplicationGenerator);
  }, [state]);

  const start = useCallback(() => {
    setState((s) => {
      // If the current session is empty (no results), reuse it instead of
      // creating another one. This prevents duplicates from React Strict Mode
      // double-mount while still allowing new sessions when there's real data.
      if (s.currentSessionId !== null) {
        const current = s.sessions.find((sess) => sess.id === s.currentSessionId);
        if (current && current.results.length === 0) return s;
      }
      return startSession(s, generateId(), now());
    });
  }, [generateId, now]);

  const record = useCallback(
    (question: Question, correct: boolean) => {
      setState((s) => recordResult(s, question, correct));
    },
    [],
  );

  const nextQuestion = useCallback(
    (previousResults?: readonly import("./gameEngine").QuestionResult<Question>[]) => {
      const results = previousResults ?? allResults(state);
      return multiplicationGenerator.getNextQuestion(results, random());
    },
    [state, random],
  );

  const currentSession: Session<Question> | null = useMemo(
    () => getCurrentSession(state),
    [state],
  );

  const currentSummary: PeriodSummary = useMemo(
    () => (currentSession ? summarize(currentSession.results) : summarize([])),
    [currentSession],
  );

  const struggling: QuestionStats<Question>[] = useMemo(
    () => strugglingQuestions(allResults(state), multiplicationGenerator, 2, 10),
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
