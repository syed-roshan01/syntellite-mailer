import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Section from "../components/Section";
import { Plus, Edit3, Trash2, Wand2 } from "lucide-react";
import VariablePicker from "../components/VariablePicker";
import { useVariablesContext } from "../context/VariablesContext";
import { useTemplates } from "../context/TemplatesContext";

const NEW_TEMPLATE = {
  id: 0,
  name: "New Template",
  subject: "",
  bodyText: "",
  bodyHtml: "",
};

function ScreenTemplates() {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useTemplates();
  const { names } = useVariablesContext();

  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [activeTab, setActiveTab] = useState("text");

  const textAreaRef = useRef(null);
  const htmlAreaRef = useRef(null);
  const textSelectionRef = useRef({ start: 0, end: 0 });
  const htmlSelectionRef = useRef({ start: 0, end: 0 });

  const resetEditor = () => {
    setEditing(null);
    setName("");
    setSubject("");
    setBodyText("");
    setBodyHtml("");
    setActiveTab("text");
    textSelectionRef.current = { start: 0, end: 0 };
    htmlSelectionRef.current = { start: 0, end: 0 };
  };

  const openEditor = (template) => {
    const target = template || NEW_TEMPLATE;
    setEditing(target);
    setName(target.name || "");
    setSubject(target.subject || "");
    setBodyText(target.bodyText || "");
    setBodyHtml(target.bodyHtml || "");
    const textLen = (target.bodyText || "").length;
    const htmlLen = (target.bodyHtml || "").length;
    textSelectionRef.current = { start: textLen, end: textLen };
    htmlSelectionRef.current = { start: htmlLen, end: htmlLen };
    setActiveTab(target.bodyHtml ? "html" : "text");
  };

  useEffect(() => {
    if (!editing) return;
    requestAnimationFrame(() => {
      const ref = activeTab === "html" ? htmlAreaRef.current : textAreaRef.current;
      const selection = activeTab === "html" ? htmlSelectionRef.current : textSelectionRef.current;
      if (ref) {
        ref.focus();
        const pos = selection.start ?? ref.value.length;
        ref.setSelectionRange(pos, pos);
      }
    });
  }, [editing, activeTab]);

  const updateSelection = (ref, selectionRef) => {
    const el = ref.current;
    if (!el) return;
    selectionRef.current = {
      start: el.selectionStart,
      end: el.selectionEnd,
    };
  };

  const insertTokenAtCursor = (ref, selectionRef, setter, token) => {
    const selection = selectionRef.current;
    const element = ref.current;
    const start = typeof selection.start === "number"
      ? selection.start
      : element?.selectionStart ?? (element?.value?.length ?? 0);
    const end = typeof selection.end === "number"
      ? selection.end
      : element?.selectionEnd ?? start;

    setter((prev) => {
      const before = prev.slice(0, start);
      const after = prev.slice(end);
      return `${before}${token}${after}`;
    });

    requestAnimationFrame(() => {
      if (element) {
        element.focus();
        const position = start + token.length;
        element.setSelectionRange(position, position);
        selectionRef.current = { start: position, end: position };
      } else {
        selectionRef.current = {
          start: start + token.length,
          end: start + token.length,
        };
      }
    });
  };

  const insertVar = (token) => {
    if (activeTab === "html") {
      insertTokenAtCursor(htmlAreaRef, htmlSelectionRef, setBodyHtml, token);
    } else {
      insertTokenAtCursor(textAreaRef, textSelectionRef, setBodyText, token);
    }
  };

  const saveTemplate = () => {
    const payload = {
      id: editing?.id,
      name: name.trim(),
      subject: subject.trim(),
      bodyText: bodyText.trim(),
      bodyHtml: bodyHtml.trim(),
    };

    if (!payload.name || !payload.subject || (!payload.bodyText && !payload.bodyHtml)) {
      alert("Name, subject, and at least one body format are required.");
      return;
    }

    if (payload.bodyHtml && !payload.bodyText) {
      payload.bodyText = "";
    }

    if (editing && editing.id) {
      updateTemplate(payload);
    } else {
      addTemplate(payload);
    }

    resetEditor();
  };

  return (
    <div className="grid gap-6">
      <Section
        title="Content Templates"
        subtitle="Library"
        actions={
          <button
            onClick={() => openEditor(NEW_TEMPLATE)}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
          >
            <Plus size={16} /> New template
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 font-medium">Template</th>
                <th className="font-medium">Subject line</th>
                <th className="font-medium">Format</th>
                <th className="font-medium">Updated</th>
                <th className="w-40 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    Build your first template to reuse across campaigns.
                  </td>
                </tr>
              )}
              {templates.map((template) => (
                <tr key={template.id} className="border-b border-slate-100">
                  <td className="py-3 font-medium text-slate-800">{template.name}</td>
                  <td className="text-slate-600">{template.subject}</td>
                  <td className="text-slate-500">{template.bodyHtml ? "HTML" : "Plain text"}</td>
                  <td className="text-slate-500">{template.updated}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openEditor(template)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:border-red-300 hover:bg-red-50"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/20"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {editing.id ? "Edit template" : "Create template"}
                  </div>
                  <div className="text-xl font-semibold text-slate-900">Content builder</div>
                </div>
                <button
                  onClick={resetEditor}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>

              <div className="grid gap-4 overflow-y-auto px-5 pb-6 pt-4" style={{ maxHeight: "calc(100vh - 6rem)" }}>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</label>
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Follow-up #1"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</label>
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Quick update about {Company}"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("text")}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      activeTab === "text"
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    Plain text
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("html")}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      activeTab === "html"
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    HTML
                  </button>
                </div>

                {activeTab === "text" ? (
                  <textarea
                    ref={textAreaRef}
                    className="min-h-[200px] w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                    value={bodyText}
                    onChange={(event) => setBodyText(event.target.value)}
                    onClick={() => updateSelection(textAreaRef, textSelectionRef)}
                    onKeyUp={() => updateSelection(textAreaRef, textSelectionRef)}
                    onSelect={() => updateSelection(textAreaRef, textSelectionRef)}
                    onMouseUp={() => updateSelection(textAreaRef, textSelectionRef)}
                    placeholder="Hi {First_Name},\n\nJust wanted to share an update..."
                  />
                ) : (
                  <textarea
                    ref={htmlAreaRef}
                    className="min-h-[200px] w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                    value={bodyHtml}
                    onChange={(event) => setBodyHtml(event.target.value)}
                    onClick={() => updateSelection(htmlAreaRef, htmlSelectionRef)}
                    onKeyUp={() => updateSelection(htmlAreaRef, htmlSelectionRef)}
                    onSelect={() => updateSelection(htmlAreaRef, htmlSelectionRef)}
                    onMouseUp={() => updateSelection(htmlAreaRef, htmlSelectionRef)}
                    placeholder="<p>Hi {First_Name},</p>"
                  />
                )}

                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Merge fields</span>
                    <VariablePicker variables={names} onInsert={insertVar} />
                  </div>
                  <div className="text-xs text-slate-500">
                    Palette: {names.length ? names.map((value) => `{${value}}`).join(" · ") : "Import list fields to populate your palette."}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100">
                    AI Improve <Wand2 size={16} className="text-indigo-500" />
                  </button>
                  <button
                    onClick={saveTemplate}
                    className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
                  >
                    Save template
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ScreenTemplates;