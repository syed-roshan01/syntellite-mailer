import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Section from "../components/Section";
import { Plus, Mail, Trash2, CheckCircle2, Pencil, Send } from "lucide-react";

const STORAGE_KEY = "syntellite:smtp-providers:v1";

const SMTP_PRESETS = [
  {
    label: "Gmail / Google Workspace",
    hosts: ["gmail.com", "googlemail.com", "google.com"],
    config: { host: "smtp.gmail.com", port: 587 },
  },
  {
    label: "Outlook / Microsoft 365",
    hosts: ["outlook.com", "hotmail.com", "live.com", "office365.com", "microsoft.com"],
    config: { host: "smtp.office365.com", port: 587 },
  },
  {
    label: "Yahoo Mail",
    hosts: ["yahoo.com", "yahoo.co.uk", "ymail.com"],
    config: { host: "smtp.mail.yahoo.com", port: 587 },
  },
  {
    label: "Zoho Mail",
    hosts: ["zoho.com"],
    config: { host: "smtp.zoho.com", port: 587 },
  },
];

function detectPreset(email = "") {
  const domain = email.split("@")[1]?.toLowerCase() || "";
  if (!domain) return null;
  const preset = SMTP_PRESETS.find((entry) => entry.hosts.some((suffix) => domain.endsWith(suffix)));
  return preset ? preset.config : null;
}

function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { providers: [], activeId: null };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { providers: parsed, activeId: parsed[0]?.id ?? null };
    }
    return {
      providers: Array.isArray(parsed.providers) ? parsed.providers : [],
      activeId: parsed.activeId ?? null,
    };
  } catch (err) {
    console.error("Failed to load SMTP providers", err);
    return { providers: [], activeId: null };
  }
}

function saveStorage(providers, activeId) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ providers, activeId }));
  } catch (err) {
    console.error("Failed to persist SMTP providers", err);
  }
}

const emptyForm = {
  id: null,
  label: "",
  type: "custom",
  host: "",
  port: 587,
  username: "",
  password: "",
  fromName: "",
  fromEmail: "",
};

export default function ProviderSettings() {
  const [{ providers, activeId }, setState] = useState(() => loadStorage());
  const [form, setForm] = useState(emptyForm);
  const [makeActive, setMakeActive] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const serverSynced = useRef(false);

  useEffect(() => {
    saveStorage(providers, activeId);
  }, [providers, activeId]);

  const activeProvider = useMemo(() => providers.find((item) => item.id === activeId) || null, [providers, activeId]);

  const syncActiveProvider = useCallback(
    async (provider) => {
      if (!provider) return;
      try {
        setLoading(true);
        setMessage("Syncing provider...");
        const token = localStorage.getItem("token");
        const payload = {
          type: provider.type || "custom",
          host: provider.host,
          port: provider.port,
          username: provider.username,
          password: provider.password || "",
          fromName: provider.fromName,
          fromEmail: provider.fromEmail,
        };
        const res = await fetch("http://localhost:4000/api/provider", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!json.ok) {
          throw new Error(json.error || "Unable to save provider");
        }
        setMessage(`Active provider set to ${provider.fromEmail}`);
      } catch (err) {
        console.error(err);
        setMessage(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (serverSynced.current) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:4000/api/provider", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data) {
          serverSynced.current = true;
          return;
        }
        setState((prev) => {
          const existing = prev.providers.find(
            (item) => item.fromEmail === data.fromEmail && item.host === data.host
          );
          if (existing) {
            serverSynced.current = true;
            return { providers: prev.providers, activeId: existing.id };
          }
          const hydrated = {
            ...data,
            id: Date.now(),
            label: data.fromEmail || data.username,
            password: "",
          };
          serverSynced.current = true;
          return {
            providers: [...prev.providers, hydrated],
            activeId: hydrated.id,
          };
        });
      })
      .catch((err) => {
        console.error("Fetch provider failed:", err);
      });
  }, []);

  const handleInput = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "fromEmail") {
      const detected = detectPreset(value);
      if (detected) {
        setForm((prev) => ({
          ...prev,
          host: prev.host ? prev.host : detected.host,
          port: prev.port && prev.port !== 587 ? prev.port : detected.port,
        }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!form.fromEmail || !form.host || !form.username) {
      setMessage("Please fill host, username, and from email.");
      return;
    }
    const timestamp = new Date().toISOString();
    const provider = {
      ...form,
      id: form.id || Date.now(),
      label: form.label || form.fromEmail || form.username,
      updatedAt: timestamp,
    };

    setState((prev) => {
      const hasExisting = prev.providers.some((item) => item.id === provider.id);
      const nextProviders = hasExisting
        ? prev.providers.map((item) => (item.id === provider.id ? provider : item))
        : [...prev.providers, provider];
      const nextActiveId = makeActive ? provider.id : prev.activeId || provider.id;
      return { providers: nextProviders, activeId: nextActiveId };
    });

    setMessage(makeActive ? "Provider saved & set active." : "Provider saved.");
    setForm(emptyForm);
    setMakeActive(true);

    if (makeActive) {
      await syncActiveProvider(provider);
    }
  };

  const handleUseProvider = async (provider) => {
    setState((prev) => ({ providers: prev.providers, activeId: provider.id }));
    await syncActiveProvider(provider);
  };

  const handleEdit = (provider) => {
    setForm({ ...provider, password: "" });
    setMakeActive(false);
  };

  const handleRemove = async (provider) => {
    setState((prev) => {
      const nextProviders = prev.providers.filter((item) => item.id !== provider.id);
      const nextActive = prev.activeId === provider.id ? nextProviders[0]?.id ?? null : prev.activeId;
      return { providers: nextProviders, activeId: nextActive };
    });
    setMessage(`Removed ${provider.fromEmail || provider.label}.`);
    if (activeId === provider.id && providers.length > 1) {
      const fallback = providers.find((item) => item.id !== provider.id);
      if (fallback) await syncActiveProvider(fallback);
    }
  };

  const sendTest = async (provider) => {
    try {
      setLoading(true);
      setMessage("Sending test email...");
      await syncActiveProvider(provider || activeProvider);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:4000/api/send/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: (provider || activeProvider)?.fromEmail,
          subject: "Test Email",
          html: "<h1>Hello from Syntellite</h1>",
          text: "Hello from Syntellite",
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Unable to send test email");
      setMessage("Test email sent.");
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Section
        title={form.id ? "Edit Provider" : "Add SMTP Provider"}
        subtitle="Connection"
        actions={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <input
                type="checkbox"
                checked={makeActive}
                onChange={(event) => setMakeActive(event.target.checked)}
                className="h-3 w-3 rounded border-slate-300"
              />
              Use after saving
            </label>
            <button
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
              disabled={loading}
            >
              <Plus size={16} /> Save provider
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="grid gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Label</label>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="Internal name"
              value={form.label}
              onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">From name</label>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="Sender name"
              value={form.fromName}
              onChange={(event) => handleInput("fromName", event.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">From email</label>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="sender@domain.com"
              value={form.fromEmail}
              onChange={(event) => handleInput("fromEmail", event.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">SMTP username</label>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="SMTP login"
              value={form.username}
              onChange={(event) => handleInput("username", event.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">SMTP host</label>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="smtp.domain.com"
              value={form.host}
              onChange={(event) => handleInput("host", event.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Port</label>
            <input
              type="number"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              value={form.port}
              onChange={(event) => handleInput("port", Number(event.target.value))}
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">SMTP password / app token</label>
            <input
              type="password"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="App password"
              value={form.password}
              onChange={(event) => handleInput("password", event.target.value)}
            />
          </div>
        </div>
      </Section>

      <Section title="Connected Providers" subtitle="Accounts">
        <div className="grid gap-4">
          {providers.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              No SMTP providers added yet. Save a provider above to start rotating accounts.
            </div>
          )}
          {providers.map((provider) => {
            const isActive = provider.id === activeId;
            return (
              <div
                key={provider.id}
                className={`flex flex-col gap-4 rounded-3xl border px-4 py-4 shadow-sm transition hover:border-indigo-200 ${
                  isActive ? "border-indigo-300 bg-indigo-50/60" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <Mail size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        {provider.label || provider.fromEmail || provider.username}
                      </div>
                      <div className="text-xs text-slate-500">
                        {provider.fromEmail} · {provider.host}:{provider.port}
                      </div>
                    </div>
                  </div>
                  {isActive && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 size={14} /> In use
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!isActive && (
                    <button
                      onClick={() => handleUseProvider(provider)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50"
                      disabled={loading}
                    >
                      Use this provider
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(provider)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    onClick={() => sendTest(provider)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                    disabled={loading}
                  >
                    <Send size={14} /> Send test
                  </button>
                  <button
                    onClick={() => handleRemove(provider)}
                    className="ml-auto inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-500 transition hover:border-red-300 hover:bg-red-50"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {message && (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
          {message}
        </div>
      )}
    </div>
  );
}