import React, { useState } from "react";

export default function VariablePicker({ variables = [], onInsert }) {
  const [query, setQuery] = useState("");
  const filtered = variables.filter((value) => value.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
      <input
        placeholder="Search variable..."
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {filtered.length === 0 && (
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-500">No matches</span>
        )}
        {filtered.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onInsert(`{${value}}`)}
            className="rounded-lg border border-slate-200 px-2 py-1 font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
          >
            {`{${value}}`}
          </button>
        ))}
      </div>
    </div>
  );
}