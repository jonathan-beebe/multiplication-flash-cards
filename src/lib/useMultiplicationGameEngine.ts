import { useOperationGameEngine, type GameEngineDeps } from "./useOperationGameEngine";
import { multiplicationGenerator } from "./multiplicationGenerator";

export type { GameEngineDeps };

export function useMultiplicationGameEngine(deps?: Partial<GameEngineDeps>) {
  return useOperationGameEngine(multiplicationGenerator, deps);
}
