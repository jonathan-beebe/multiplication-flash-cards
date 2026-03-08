import { useState, useCallback, useMemo } from "react";
import {
  startSession,
  recordResult,
  allResults,
  createGameState,
  type GameState,
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
  const [state, setState] = useState<GameState<Q>>(() => createGameState<Q>());

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

  return useMemo(
    () => ({
      start,
      recordResult: record,
      getNextQuestion: nextQuestion,
    }),
    [start, record, nextQuestion],
  );
}
