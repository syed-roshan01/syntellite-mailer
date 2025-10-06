import React, { useState } from "react";
import Section from "../components/Section";
import { useVariablesContext } from "../context/VariablesContext";
import { useCandidates } from "../context/CandidatesContext";
import { Trash2, Plus } from "lucide-react";

function ScreenSettings() {
  const {
    vars,
    names,
    isCore,
    addVariable,
    deleteVariable,
    setVariableType,
    setVariableValue,
    setCustomOverride,
    clearCustomOverride,
  } = useVariablesContext();

  const { lists } = useCandidates();

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("global");
  const [customScopes, setCustomScopes] = useState({});

  const [showOutlookModal, setShowOutlookModal] = useState(false);
  const [outlookForm, setOutlookForm] = useState({
    email: "",
    password: "",
    fromName: "",
  });
  const [outlookStatus, setOutlookStatus] = useState({ loading: false, message: "" });

  const connectOutlook = async () => {
    if (!outlookForm.email || !outlookForm.password) {
      setOutlookStatus({ loading: false, message: "Email and app password are required." });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setOutlookStatus({ loading: false, message: "Session expired. Please log in again." });
      return;
    }

    setOutlookStatus({ loading: true, message: "Connecting to Outlook..." });

    try {
      const res = await fetch("http://localhost:4000/api/provider", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "outlook",
          host: "smtp.office365.com",
          port: 587,
          username: outlookForm.email,
          password: outlookForm.password,
          fromName: outlookForm.fromName || outlookForm.email.split("@")[0],
          fromEmail: outlookForm.email,
        }),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        setOutlookStatus({ loading: false, message: "Outlook provider connected." });
        setTimeout(() => {
          setShowOutlookModal(false);
          setOutlookStatus({ loading: false, message: "" });
          setOutlookForm({ email: "", password: "", fromName: "" });
        }, 1000);
      } else {
        setOutlookStatus({ loading: false, message: `Error: ${json.error || "Unable to save provider."}` });
      }
    } catch (err) {
      setOutlookStatus({ loading: false, message: `Error: ${err.message}` });
    }
  };

  return (
    <div className="grid gap-6">
      <Section
        title="Workspace Variables"
        subtitle="Personalization"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <input
              className="flex-1 min-w-[180px] rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="Variable name (e.g. Brand_Name)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
            >
              <option value="global">Global</option>
              <option value="custom">Custom</option>
            </select>
            <button
              onClick={() => {
                if (!newName.trim()) return;
                addVariable(newName, newType);
                setNewName("");
                setNewType("global");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        }
      >
        <div className="grid gap-3">
          {names.map((name) => {
            const variable = vars[name] || {};
            const overrides = variable.overrides || {};
            const selectedScope = customScopes[name] || "default";
            const overrideDisabled = selectedScope === "default";
            const overrideValue = overrideDisabled ? "" : overrides[selectedScope] ?? "";
            const selectedList = overrideDisabled
              ? null
              : lists.find((item) => String(item.id) === selectedScope) || null;
            const overridePlaceholder = overrideDisabled
              ? "Select a list to override"
              : `Value for ${selectedList ? selectedList.name : `list ${selectedScope}`}`;
            const overrideSummary = Object.entries(overrides).map(([listId, value]) => {
              const list = lists.find((item) => String(item.id) === listId);
              const label = list ? list.name : `List ${listId}`;
              const display = value ? value : "(blank)";
              return `${label}: ${display}`;
            });

            return (
              <div key={name} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-semibold text-slate-800">{name}</span>
                    <select
                      className="rounded-xl border border-slate-200 px-2 py-1 text-xs font-medium uppercase tracking-wide text-slate-600 focus:border-indigo-500 focus:outline-none"
                      value={variable.type || "global"}
                      disabled={isCore(name)}
                      onChange={(e) => setVariableType(name, e.target.value)}
                    >
                      <option value="candidate">Contact field</option>
                      <option value="global">Global</option>
                      <option value="custom">Custom</option>
                    </select>
                    {isCore(name) && <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Core</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    {variable.type !== "candidate" && (
                      <input
                        className="w-full min-w-[200px] rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        value={variable.value || ""}
                        onChange={(e) => setVariableValue(name, e.target.value)}
                        placeholder={
                          variable.type === "custom"
                            ? "Default value when no override is set"
                            : "Global value"
                        }
                      />
                    )}

                    {!isCore(name) && (
                      <button
                        onClick={() => deleteVariable(name)}
                        className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-500 transition hover:border-red-300 hover:bg-red-50"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>
                </div>

                {variable.type === "custom" && (
                  <div className="mt-4 grid gap-3">
                    <div className="grid gap-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Override for list
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                          value={selectedScope}
                          onChange={(e) =>
                            setCustomScopes((prev) => ({ ...prev, [name]: e.target.value }))
                          }
                        >
                          <option value="default">Default (all lists)</option>
                          {lists.map((list) => (
                            <option key={list.id} value={String(list.id)}>
                              {list.name}
                            </option>
                          ))}
                        </select>
                        <input
                          className="flex-1 min-w-[180px] rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                          value={overrideValue}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (overrideDisabled) {
                              setVariableValue(name, value);
                            } else {
                              setCustomOverride(name, selectedScope, value);
                            }
                          }}
                          placeholder={overridePlaceholder}
                          disabled={!lists.length || overrideDisabled}
                        />
                        {!overrideDisabled && overrides[selectedScope] !== undefined && (
                          <button
                            type="button"
                            onClick={() => clearCustomOverride(name, selectedScope)}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      {!lists.length && (
                        <p className="text-xs text-slate-500">
                          Import a contact list to enable list-specific overrides.
                        </p>
                      )}
                    </div>
                    {!!overrideSummary.length && (
                      <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                        Active overrides: {overrideSummary.join(", ")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        title="Email Providers"
        subtitle="Delivery"
        actions={
          <button
            onClick={() => setShowOutlookModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
          >
            Connect Outlook / Microsoft 365
          </button>
        }
      >
        <div className="text-sm text-slate-600">
          Store SMTP credentials once and reuse them across every campaign. Additional providers coming soon.
        </div>
      </Section>

      <Section title="API Keys" subtitle="Integrations">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            Generate API keys to sync contact lists or trigger campaigns from your own stack.
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100">
            Generate key
          </button>
        </div>
      </Section>

      {showOutlookModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl shadow-slate-900/20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Provider</div>
                <div className="text-lg font-semibold text-slate-900">Connect Outlook / Microsoft 365</div>
              </div>
              <button
                onClick={() => {
                  if (!outlookStatus.loading) {
                    setShowOutlookModal(false);
                    setOutlookStatus({ loading: false, message: "" });
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <input
                className="rounded-xl border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                placeholder="Outlook email (e.g. user@company.com)"
                value={outlookForm.email}
                onChange={(e) => setOutlookForm((prev) => ({ ...prev, email: e.target.value }))}
                disabled={outlookStatus.loading}
              />
              <input
                className="rounded-xl border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                placeholder="App password"
                type="password"
                value={outlookForm.password}
                onChange={(e) => setOutlookForm((prev) => ({ ...prev, password: e.target.value }))}
                disabled={outlookStatus.loading}
              />
              <input
                className="rounded-xl border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                placeholder="From name (optional)"
                value={outlookForm.fromName}
                onChange={(e) => setOutlookForm((prev) => ({ ...prev, fromName: e.target.value }))}
                disabled={outlookStatus.loading}
              />
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Use an Outlook/Office 365 SMTP app password. Host is prefilled as smtp.office365.com on port 587.
              </div>
            </div>

            {outlookStatus.message && (
              <p className={`mt-3 text-sm ${outlookStatus.message.startsWith("Error") ? "text-red-500" : "text-emerald-600"}`}>
                {outlookStatus.message}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  if (!outlookStatus.loading) {
                    setShowOutlookModal(false);
                    setOutlookStatus({ loading: false, message: "" });
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                disabled={outlookStatus.loading}
              >
                Cancel
              </button>
              <button
                onClick={connectOutlook}
                disabled={outlookStatus.loading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {outlookStatus.loading ? "Connecting..." : "Connect Outlook"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScreenSettings;