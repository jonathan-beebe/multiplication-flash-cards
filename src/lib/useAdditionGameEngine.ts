import { useOperationGameEngine, type GameEngineDeps } from "./useOperationGameEngine";
import { additionGenerator } from "./additionGenerator";

export function useAdditionGameEngine(deps?: Partial<GameEngineDeps>) {
  return useOperationGameEngine(additionGenerator, deps);
}
