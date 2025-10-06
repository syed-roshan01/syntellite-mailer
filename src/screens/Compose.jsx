import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Section from "../components/Section";
import { Send, CalendarClock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useTemplates } from "../context/TemplatesContext";
import { useVariablesContext } from "../context/VariablesContext";
import { useCandidates } from "../context/CandidatesContext";

function stripHtml(value = "") {
  return value
    .replace(/<br\s*\/?>(?!\n)/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const cleanName = (raw = "") =>
  String(raw)
    .replace(/[{}]/g, "")
    .trim()
    .replace(/\s+/g, "_");

function ScreenCompose() {
  const { templates } = useTemplates();
  const { resolve, vars } = useVariablesContext();
  const { lists } = useCandidates();

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedList, setSelectedList] = useState(null);
  const [customValues, setCustomValues] = useState({});
  const [status, setStatus] = useState({ state: "idle", text: "", meta: null });

  const selectedListKey = selectedList ? String(selectedList.id) : null;
  const previousListKeyRef = useRef(selectedListKey);
  const previousDefaultsRef = useRef({});

  const globalValues = useMemo(() => {
    return Object.fromEntries(
      Object.entries(vars)
        .filter(([, value]) => value.type === "global")
        .map(([key, value]) => [key, value.value || ""])
    );
  }, [vars]);

  const customVariables = useMemo(() => {
    return Object.entries(vars).filter(([, value]) => value.type === "custom");
  }, [vars]);

  const customDefaults = useMemo(() => {
    const map = {};
    customVariables.forEach(([key, value]) => {
      const listOverride = selectedListKey ? value.overrides?.[selectedListKey] : undefined;
      map[key] = listOverride ?? value.value ?? "";
    });
    return map;
  }, [customVariables, selectedListKey]);

  useEffect(() => {
    const listChanged = previousListKeyRef.current !== selectedListKey;
    setCustomValues((prev) => {
      if (listChanged) {
        return customDefaults;
      }
      const next = { ...prev };
      Object.keys(customDefaults).forEach((key) => {
        if (!(key in next)) {
          next[key] = customDefaults[key];
          return;
        }
        if (
          previousDefaultsRef.current[key] === next[key] &&
          customDefaults[key] !== previousDefaultsRef.current[key]
        ) {
          next[key] = customDefaults[key];
        }
      });
      Object.keys(next).forEach((key) => {
        if (!(key in customDefaults)) delete next[key];
      });
      return next;
    });
    previousListKeyRef.current = selectedListKey;
    previousDefaultsRef.current = customDefaults;
  }, [customDefaults, selectedListKey]);

  useEffect(() => {
    if (status.state === "success" || status.state === "error") {
      const timeout = setTimeout(() => setStatus({ state: "idle", text: "", meta: null }), 4000);
      return () => clearTimeout(timeout);
    }
  }, [status.state]);

  const resetCustomValues = () => setCustomValues(customDefaults);

  const handleCustomChange = (key, value) => {
    setCustomValues((prev) => ({ ...prev, [key]: value }));
  };

  const overrides = useMemo(
    () => ({ ...globalValues, ...customValues }),
    [globalValues, customValues]
  );

  const candidateSample = selectedList?.rows?.[0] || {};
  const htmlTemplate = selectedTemplate?.bodyHtml || "";
  const textTemplate = selectedTemplate?.bodyText || "";

  const resolvedSubject =
    selectedTemplate && selectedList
      ? resolve(selectedTemplate.subject, candidateSample, overrides)
      : "";

  const resolvedHtml =
    selectedTemplate && selectedList && htmlTemplate
      ? resolve(htmlTemplate, candidateSample, overrides)
      : "";

  const resolvedText =
    selectedTemplate && selectedList
      ? textTemplate
        ? resolve(textTemplate, candidateSample, overrides)
        : stripHtml(resolvedHtml)
      : "";

  const normalizeRow = (row) => {
    const sanitized = {};
    Object.entries(row).forEach(([key, value]) => {
      sanitized[cleanName(key)] = value;
    });
    return { ...row, ...sanitized };
  };

  const buildCandidatePayload = () => {
    if (!selectedList) return [];
    return selectedList.rows.map((row) => ({
      ...normalizeRow(row),
      ...overrides,
    }));
  };

  const handleSendTest = async () => {
    if (!selectedTemplate || !selectedList) return;
    setStatus({ state: "loading", text: "Sending test email...", meta: null });
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:4000/api/send/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: resolvedSubject,
          html: resolvedHtml || resolvedText,
          text: resolvedText || stripHtml(resolvedHtml),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setStatus({ state: "success", text: "Test email sent", meta: { sent: 1, failed: 0 } });
      } else {
        setStatus({ state: "error", text: json.error || "Unable to send test email.", meta: null });
      }
    } catch (error) {
      setStatus({ state: "error", text: error.message, meta: null });
    }
  };

  const handleSendBulk = async () => {
    if (!selectedTemplate || !selectedList) return;
    setStatus({ state: "loading", text: "Sending campaign...", meta: null });
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setStatus({ state: "error", text: "Session expired. Please log in again.", meta: null });
        return;
      }

      const htmlToSend = htmlTemplate || "";
      const textToSend = textTemplate || (htmlTemplate ? stripHtml(htmlTemplate) : "");
      const candidates = buildCandidatePayload();

      const payload = {
        listName: selectedList.name,
        candidates,
        subject: selectedTemplate.subject,
        html: htmlToSend || textToSend,
        text: textToSend || stripHtml(htmlToSend),
      };

      const res = await fetch("http://localhost:4000/api/send/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok) {
        setStatus({
          state: "success",
          text: "Campaign sent",
          meta: {
            sent: json.ok ?? 0,
            failed: json.fail ?? 0,
          },
        });
      } else {
        setStatus({ state: "error", text: json.error || "Unable to send campaign.", meta: null });
      }
    } catch (error) {
      setStatus({ state: "error", text: error.message, meta: null });
    }
  };

  const isLoading = status.state === "loading";

  return (
    <Section title="Campaign Composer" subtitle="Send">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="grid gap-6">
          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact list</label>
                <select
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  value={selectedList?.id || ""}
                  onChange={(event) => {
                    const list = lists.find((item) => item.id === Number(event.target.value));
                    setSelectedList(list || null);
                  }}
                >
                  <option value="">Select a list</option>
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name} ({list.rows.length})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Template</label>
                <select
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  value={selectedTemplate?.id || ""}
                  onChange={(event) => {
                    const template = templates.find((item) => item.id === Number(event.target.value));
                    setSelectedTemplate(template || null);
                  }}
                >
                  <option value="">Select a template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Schedule</label>
              <div className="flex flex-wrap gap-2">
                <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100">
                  Send now
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100">
                  <CalendarClock size={16} /> Schedule
                </button>
              </div>
            </div>
          </div>

          {customVariables.length > 0 && (
            <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-700">Custom merge fields</div>
                <button
                  className="text-xs font-semibold uppercase tracking-wide text-indigo-500"
                  onClick={resetCustomValues}
                >
                  Reset defaults
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {customVariables.map(([key]) => (
                  <div key={key} className="grid gap-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{key}</label>
                    <input
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                      value={customValues[key] ?? ""}
                      onChange={(event) => handleCustomChange(key, event.target.value)}
                      placeholder={`Value for {${key}}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSendTest}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
              disabled={isLoading}
            >
              Send test
            </button>
            <button
              onClick={handleSendBulk}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-400"
              disabled={!selectedList || !selectedTemplate || isLoading}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {isLoading
                ? "Sending..."
                : selectedList
                ? `Send to ${selectedList.rows.length} contacts`
                : "Select a list"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subject preview</div>
              <div className="mt-1 min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800">
                {resolvedSubject || "Select a list and template to preview."}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Message preview</div>
              <div className="mt-1 min-h-[260px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
                {selectedTemplate && selectedList ? (
                  htmlTemplate ? (
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: resolvedHtml }} />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700">{resolvedText}</pre>
                  )
                ) : (
                  <div className="text-slate-500">Choose a list and template to see the personalized preview.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {status.state !== "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4"
          >
            <div
              className={`pointer-events-auto inline-flex min-w-[260px] max-w-xl items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-xl backdrop-blur ${
                status.state === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : status.state === "error"
                  ? "border-red-200 bg-red-50 text-red-600"
                  : "border-slate-200 bg-white/95 text-slate-700"
              }`}
            >
              {status.state === "loading" && <Loader2 size={18} className="animate-spin" />}
              {status.state === "success" && <CheckCircle2 size={18} />}
              {status.state === "error" && <AlertCircle size={18} />}
              <div className="flex-1">
                <div className="font-medium">{status.text}</div>
                {status.meta && (
                  <div className="text-xs text-slate-500">
                    Sent {status.meta.sent?.toLocaleString?.() ?? status.meta.sent} · Failed {status.meta.failed?.toLocaleString?.() ?? status.meta.failed}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}

export default ScreenCompose;