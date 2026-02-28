import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useGameActive } from "./useGameActive";
import {
  startSession,
  recordResult,
  getCurrentSession,
  summarize,
  strugglingQuestions,
  allResults,
  loadGameState,
  saveGameState,
  type GameState,
  type PeriodSummary,
  type QuestionStats,
  type Session,
  type QuestionGenerator,
  type QuestionResult,
} from "./gameEngine";

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

export function useOperationGameEngine<Q>(
  generator: QuestionGenerator<Q>,
  deps?: Partial<GameEngineDeps>,
) {
  const { now, generateId, random } = { ...defaultDeps, ...deps };
  const [state, setState] = useState<GameState<Q>>(() =>
    loadGameState(generator),
  );
  const isInitialMount = useRef(true);

  useGameActive(state.currentSessionId !== null);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveGameState(state, generator);
  }, [state, generator]);

  const start = useCallback(() => {
    setState((s) => {
      if (s.currentSessionId !== null) {
        const current = s.sessions.find((sess) => sess.id === s.currentSessionId);
        if (current && current.results.length === 0) return s;
      }
      return startSession(s, generateId(), now());
    });
  }, [generateId, now]);

  const record = useCallback(
    (question: Q, correct: boolean, durationMs?: number) => {
      setState((s) => recordResult(s, question, correct, durationMs));
    },
    [],
  );

  const nextQuestion = useCallback(
    (previousResults?: readonly QuestionResult<Q>[]) => {
      const results = previousResults ?? allResults(state);
      return generator.getNextQuestion(results, random());
    },
    [state, random, generator],
  );

  const currentSession: Session<Q> | null = useMemo(
    () => getCurrentSession(state),
    [state],
  );

  const currentSummary: PeriodSummary = useMemo(
    () => (currentSession ? summarize(currentSession.results) : summarize([])),
    [currentSession],
  );

  const struggling: QuestionStats<Q>[] = useMemo(
    () => strugglingQuestions(allResults(state), generator, 2, 10),
    [state, generator],
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
