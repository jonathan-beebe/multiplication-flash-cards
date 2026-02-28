import { useOperationGameEngine, type GameEngineDeps } from "../engine/useOperationGameEngine";
import { subtractionGenerator } from "./subtractionGenerator";

export function useSubtractionGameEngine(deps?: Partial<GameEngineDeps>) {
  return useOperationGameEngine(subtractionGenerator, deps);
}
