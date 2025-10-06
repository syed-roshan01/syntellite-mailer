import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import Section from "../components/Section";
import { Upload, Eye, Download, Trash2, ArrowLeft } from "lucide-react";
import { useVariablesContext } from "../context/VariablesContext";
import { useCandidates } from "../context/CandidatesContext";

const normalizeColumnName = (raw = "") =>
  String(raw)
    .replace(/[{}]/g, "")
    .trim()
    .replace(/\s+/g, "_");

function ScreenCandidates() {
  const { lists, setLists } = useCandidates();
  const [previewing, setPreviewing] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [importStatus, setImportStatus] = useState("");
  const { vars, setDetectedColumns, removeCandidateList } = useVariablesContext();

  useEffect(() => {
    setSelectedColumns([]);
    setImportStatus("");
  }, [previewing?.id]);

  const handleCSVUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        if (rows.length === 0) return;

        const detected = Object.keys(rows[0]);
        const newList = {
          id: Date.now(),
          name: file.name.replace(/\.(csv|xlsx)$/i, ""),
          rows,
          columns: detected,
          updated: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        };

        setLists((prev) => [...prev, newList]);
        setPreviewing(newList);
        setImportStatus("");
        setSelectedColumns([]);
      },
    });

    event.target.value = "";
  };

  const handleDelete = (id) => {
    if (window.confirm("Remove this contact list?")) {
      setLists((prev) => prev.filter((list) => list.id !== id));
      removeCandidateList(id);
      if (previewing?.id === id) {
        setPreviewing(null);
      }
    }
  };

  const handleDownload = (list) => {
    const csv = Papa.unparse(list.rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${list.name}.csv`;
    link.click();
  };

  const toggleColumn = (column) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((item) => item !== column)
        : [...prev, column]
    );
    setImportStatus("");
  };

  const isColumnImported = (column) => {
    const key = normalizeColumnName(column);
    const variable = vars[key];
    if (!variable || variable.type !== "candidate") return false;

    const listKey = previewing ? String(previewing.id) : null;
    if (listKey) {
      const lists = Array.isArray(variable.lists) ? variable.lists : [];
      if (!lists.includes(listKey)) return false;
    } else if (variable.autoImported !== false) {
      return false;
    }

    if (!variable.sourceColumn) return true;
    return normalizeColumnName(variable.sourceColumn) === key;
  };

  const handleImportSelected = () => {
    if (!selectedColumns.length) return;

    const pending = selectedColumns.filter((column) => {
      const key = normalizeColumnName(column);
      const variable = vars[key];
      if (!variable || variable.type !== "candidate") return true;
      const listKey = previewing ? String(previewing.id) : null;
      if (listKey) {
        const lists = Array.isArray(variable.lists) ? variable.lists : [];
        return !lists.includes(listKey);
      }
      return variable.autoImported !== false;
    });

    if (!pending.length) {
      setImportStatus("Selected columns are already available as variables.");
      return;
    }

    setDetectedColumns(pending, { autoImported: false, listId: previewing?.id });
    setImportStatus(
      `${pending.length} field${pending.length > 1 ? "s" : ""} added to your variables.`
    );
    setSelectedColumns([]);
  };

  const clearSelection = () => {
    setSelectedColumns([]);
    setImportStatus("");
  };

  return (
    <div className="grid gap-6">
      {!previewing ? (
        <Section
          title="Contact Lists"
          subtitle="Audience"
          actions={
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-white cursor-pointer">
                <Upload size={16} /> Upload CSV
                <input type="file" accept=".csv" hidden onChange={handleCSVUpload} />
              </label>
              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100">
                Connect Sheets
              </button>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 font-medium">List name</th>
                  <th className="font-medium">Contacts</th>
                  <th className="font-medium">Updated</th>
                  <th className="w-44 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lists.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      No lists yet. Import a CSV to get started.
                    </td>
                  </tr>
                )}
                {lists.map((list) => (
                  <tr key={list.id} className="border-b border-slate-100">
                    <td className="py-3 font-medium text-slate-800">{list.name}</td>
                    <td className="text-slate-600">{list.rows.length.toLocaleString()}</td>
                    <td className="text-slate-500">{list.updated}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setPreviewing(list)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                        >
                          <Eye size={14} /> Preview
                        </button>
                        <button
                          onClick={() => handleDownload(list)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                        >
                          <Download size={14} /> Export
                        </button>
                        <button
                          onClick={() => handleDelete(list.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:border-red-300 hover:bg-red-50"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : (
        <Section
          title={`Preview: ${previewing.name}`}
          subtitle="List details"
          actions={
            <button
              onClick={() => setPreviewing(null)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
            >
              <ArrowLeft size={16} /> Back to lists
            </button>
          }
        >
          <div className="mb-6">
            <div className="font-semibold text-slate-800">Mapped fields</div>
            <p className="mt-1 text-sm text-slate-500">
              Select the columns you want to expose as variables inside templates and campaigns. Imported
              fields are highlighted with a badge.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {previewing.columns.map((col) => {
                const imported = isColumnImported(col);
                const checked = imported || selectedColumns.includes(col);
                return (
                  <label
                    key={col}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                      imported
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                      checked={checked}
                      disabled={imported}
                      onChange={() => toggleColumn(col)}
                    />
                    <span className="font-medium">{col}</span>
                    {imported && <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Imported</span>}
                  </label>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleImportSelected}
                disabled={!selectedColumns.length}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                Import selected fields
              </button>
              <button
                type="button"
                onClick={clearSelection}
                disabled={!selectedColumns.length}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-60 hover:border-slate-300 hover:bg-slate-100"
              >
                Clear selection
              </button>
              {importStatus && <span className="text-sm text-slate-500">{importStatus}</span>}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  {previewing.columns.map((col) => (
                    <th key={col} className="px-3 py-2 font-medium">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewing.rows.slice(0, 20).map((row, index) => (
                  <tr key={index} className="border-t border-slate-100">
                    {previewing.columns.map((col) => (
                      <td key={col} className="px-3 py-2 text-slate-700">{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {previewing.rows.length > 20 && (
            <div className="mt-2 text-xs text-slate-500">
              Showing first 20 of {previewing.rows.length.toLocaleString()} contacts
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

export default ScreenCandidates;