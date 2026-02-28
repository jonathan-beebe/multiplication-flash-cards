import { useOperationGameEngine, type GameEngineDeps } from "../engine/useOperationGameEngine";
import { additionGenerator } from "./additionGenerator";

export function useAdditionGameEngine(deps?: Partial<GameEngineDeps>) {
  return useOperationGameEngine(additionGenerator, deps);
}
