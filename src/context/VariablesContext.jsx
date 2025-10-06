import React, { createContext, useContext } from "react";
import { useVariables } from "../hooks/useVariables";

const VariablesCtx = createContext(null);

export function VariablesProvider({ children, initialDetected = [] }) {
  const api = useVariables(initialDetected);
  return <VariablesCtx.Provider value={api}>{children}</VariablesCtx.Provider>;
}

export function useVariablesContext() {
  const ctx = useContext(VariablesCtx);
  if (!ctx) throw new Error("useVariablesContext must be used within VariablesProvider");
  return ctx;
}
