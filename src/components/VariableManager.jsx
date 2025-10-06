import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import Section from "./Section";
import { useVariablesContext } from "../context/VariablesContext";

export default function VariableManager() {
  const {
    vars, names, isCore,
    addVariable, deleteVariable,
    setVariableType, setVariableValue,
  } = useVariablesContext();

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("global");
  const [newValue, setNewValue] = useState("");

  return (
    <Section title="Variables & Placeholders" actions={
      <div className="text-xs text-gray-500">Add/edit/delete global or custom variables. Candidate variables come from uploaded lists.</div>
    }>
      <div className="grid md:grid-cols-4 gap-2 mb-4">
        <input
          className="px-3 py-2 border rounded-xl"
          placeholder="Variable name (e.g. Company_Name or Gender)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <select
          className="px-3 py-2 border rounded-xl"
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
        >
          <option value="global">Global</option>
          <option value="custom">Custom</option>
          <option value="candidate">Candidate (read-only source)</option>
        </select>
        <input
          className="px-3 py-2 border rounded-xl"
          placeholder={newType === "candidate" ? "Value will come from file rows" : "Default value (optional)"}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          disabled={newType === "candidate"}
        />
        <button
          className="px-3 py-2 rounded-xl bg-gray-900 text-white"
          onClick={() => {
            if (!newName.trim()) return;
            addVariable(newName, newType, { value: newType === "candidate" ? undefined : newValue });
            setNewName("");
            setNewValue("");
            setNewType("global");
          }}
        >
          + Add Variable
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2">Name</th>
              <th>Type</th>
              <th>Value / Source</th>
              <th className="w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {names.map((name) => {
              const v = vars[name];
              const isCandidate = v.type === "candidate";
              return (
                <tr key={name} className="border-t">
                  <td className="py-2 font-medium">{name}</td>
                  <td>
                    <select
                      className="px-2 py-1 border rounded-lg text-xs"
                      value={v.type}
                      onChange={(e) => setVariableType(name, e.target.value)}
                      disabled={isCore(name)}
                    >
                      <option value="candidate">candidate</option>
                      <option value="global">global</option>
                      <option value="custom">custom</option>
                    </select>
                    {isCore(name) && <span className="ml-2 text-[11px] text-gray-400">core</span>}
                  </td>
                  <td>
                    {isCandidate ? (
                      <span className="px-2 py-1 rounded-lg border text-xs text-gray-600">
                        from candidate column: {v.sourceColumn || name}
                      </span>
                    ) : (
                      <input
                        className="px-2 py-1 border rounded-lg text-xs w-full max-w-xs"
                        value={v.value ?? ""}
                        onChange={(e) => setVariableValue(name, e.target.value)}
                        placeholder="Set default value"
                      />
                    )}
                  </td>
                  <td>
                    <button
                      className="px-2 py-1 rounded-lg border text-xs hover:bg-red-50 text-red-600 disabled:opacity-50"
                      onClick={() => deleteVariable(name)}
                      disabled={isCore(name)}
                      title={isCore(name) ? "Core variables cannot be deleted" : "Delete variable"}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
