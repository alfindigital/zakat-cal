import { createContext, useContext } from "react";

// Reactive mirror of the persisted "round zakat up" setting so the visible
// result updates immediately when the user toggles it (the persisted value in
// localStorage remains the source of truth for save/PDF paths).
export const RoundUpContext = createContext<boolean>(false);

export function useRoundUp(): boolean {
  return useContext(RoundUpContext);
}
