import React, { createContext, useContext, useState } from "react";

const CandidatesContext = createContext();

export function CandidatesProvider({ children }) {
  const [lists, setLists] = useState([]);

  return (
    <CandidatesContext.Provider value={{ lists, setLists }}>
      {children}
    </CandidatesContext.Provider>
  );
}

export function useCandidates() {
  return useContext(CandidatesContext);
}
