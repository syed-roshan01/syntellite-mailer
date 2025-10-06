// src/hooks/useVariables.js
import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "syntellite:variables:v1";
const CORE_VARIABLES = new Set(["Email", "Company_Name", "Role"]);
const LEGACY_DEFAULTS = new Set(["Meeting_Link", "Offer_Letter_Link"]);

function buildInitialMap(detected = []) {
  const map = {};
  detected.forEach((name) => {
    const key = cleanName(name);
    if (!map[key]) map[key] = { type: "candidate", sourceColumn: name, autoImported: false, lists: [] };
  });
  return map;
}

function cleanName(raw = "") {
  return String(raw)
    .replace(/[{}]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

function migrateLegacyVariables(saved) {
  if (!saved || typeof saved !== "object") return saved;

  const next = {};
  let changed = false;

  Object.entries(saved).forEach(([key, value]) => {
    if (!value || typeof value !== "object") return;

    if (LEGACY_DEFAULTS.has(key) && value.type !== "candidate") {
      changed = true;
      return;
    }

    if (value.type === "candidate" && value.autoImported !== false) {
      changed = true;
      return;
    }

    if (value.type === "candidate" && !Array.isArray(value.lists)) {
      value = { ...value, lists: [] };
    }

    next[key] = value;
  });

  return changed ? next : saved;
}

export function useVariables(initialDetectedColumns = []) {
  const [vars, setVars] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return migrateLegacyVariables(JSON.parse(saved));
    } catch {}
    return buildInitialMap(initialDetectedColumns);
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vars));
    } catch {}
  }, [vars]);

  const names = useMemo(() => Object.keys(vars).sort(), [vars]);

  const isCore = useCallback((name) => CORE_VARIABLES.has(cleanName(name)), []);

  const addVariable = useCallback(
    (rawName, type = "global", options = {}) => {
      const name = cleanName(rawName);
      if (!name) return;

      setVars((prev) => {
        const next = { ...prev };
        const existing = next[name];

        if (existing) {
          const updated = { ...existing };
          if (options.value !== undefined) updated.value = options.value;
          if (options.sourceColumn) updated.sourceColumn = options.sourceColumn;
          if (!isCore(name)) updated.type = type || updated.type;
          if (updated.type === "custom" && options.overrides) {
            updated.overrides = { ...(updated.overrides || {}), ...options.overrides };
          }
          if (updated.type === "candidate") {
            if (options.autoImported !== undefined) updated.autoImported = options.autoImported;
            if (!Array.isArray(updated.lists)) updated.lists = [];
          } else {
            delete updated.autoImported;
            delete updated.lists;
          }
          next[name] = updated;
          return next;
        }

        if (type === "candidate" || isCore(name)) {
          next[name] = {
            type: "candidate",
            sourceColumn: options.sourceColumn || rawName,
            autoImported: options.autoImported ?? false,
            lists: Array.isArray(options.lists) ? [...new Set(options.lists.map(toOverrideKey).filter(Boolean))] : [],
          };
        } else {
          const base = {
            type: type || "global",
            value: options.value ?? "",
          };
          if (base.type === "custom") {
            base.overrides = options.overrides ? { ...options.overrides } : {};
          }
          next[name] = base;
        }
        return next;
      });
    },
    [isCore]
  );

  const deleteVariable = useCallback(
    (rawName) => {
      const name = cleanName(rawName);
      if (isCore(name)) return false;
      setVars((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      return true;
    },
    [isCore]
  );

  const setVariableType = useCallback(
    (rawName, type) => {
      const name = cleanName(rawName);
      setVars((prev) => {
        const current = prev[name];
        if (!current || isCore(name)) return prev;
        const nextVar = { ...current, type };

        if (type === "candidate") {
          if (!nextVar.sourceColumn) nextVar.sourceColumn = rawName;
          if (nextVar.autoImported === undefined) nextVar.autoImported = false;
          if (!Array.isArray(nextVar.lists)) nextVar.lists = [];
        } else {
          delete nextVar.sourceColumn;
          delete nextVar.autoImported;
          delete nextVar.lists;
          if (type === "custom") {
            if (nextVar.value === undefined) nextVar.value = "";
            if (!nextVar.overrides) nextVar.overrides = {};
          } else {
            delete nextVar.overrides;
            if (nextVar.value === undefined) nextVar.value = "";
          }
        }

        return { ...prev, [name]: nextVar };
      });
    },
    [isCore]
  );

  const setVariableValue = useCallback((rawName, value) => {
    const name = cleanName(rawName);
    setVars((prev) => {
      const current = prev[name];
      if (!current || current.type === "candidate") return prev;
      return { ...prev, [name]: { ...current, value } };
    });
  }, []);

  const setCustomOverride = useCallback((rawName, listId, value) => {
    const name = cleanName(rawName);
    const key = toOverrideKey(listId);
    if (!key) return;
    setVars((prev) => {
      const current = prev[name];
      if (!current || current.type !== "custom") return prev;
      const overrides = { ...(current.overrides || {}) };
      overrides[key] = value;
      return { ...prev, [name]: { ...current, overrides } };
    });
  }, []);

  const clearCustomOverride = useCallback((rawName, listId) => {
    const name = cleanName(rawName);
    const key = toOverrideKey(listId);
    if (!key) return;
    setVars((prev) => {
      const current = prev[name];
      if (!current || current.type !== "custom" || !current.overrides || !(key in current.overrides)) {
        return prev;
      }
      const overrides = { ...current.overrides };
      delete overrides[key];
      const nextVar = { ...current };
      if (Object.keys(overrides).length > 0) {
        nextVar.overrides = overrides;
      } else {
        delete nextVar.overrides;
      }
      return { ...prev, [name]: nextVar };
    });
  }, []);

  const setDetectedColumns = useCallback((columns = [], options = {}) => {
    const { autoImported = false, listId = null } = options;
    const listKey = toOverrideKey(listId);
    setVars((prev) => {
      const next = { ...prev };
      columns.forEach((column) => {
        const key = cleanName(column);
        const existing = next[key];
        if (existing && existing.type !== "candidate") return;

        const lists = Array.isArray(existing?.lists)
          ? Array.from(new Set(existing.lists))
          : [];
        if (listKey && !lists.includes(listKey)) lists.push(listKey);

        const candidate = {
          type: "candidate",
          sourceColumn: column,
          autoImported: existing?.autoImported ?? autoImported,
        };

        if (lists.length) candidate.lists = lists;

        next[key] = existing ? { ...existing, ...candidate } : { ...candidate, lists: candidate.lists || [] };
      });
      return next;
    });
  }, []);

  const removeCandidateList = useCallback((listId) => {
    const key = toOverrideKey(listId);
    if (!key) return;
    setVars((prev) => {
      let changed = false;
      const next = { ...prev };
      Object.entries(prev).forEach(([name, variable]) => {
        if (!variable || variable.type !== "candidate") return;
        const lists = Array.isArray(variable.lists)
          ? variable.lists.filter((entry) => entry !== key)
          : [];
        if (lists.length === (variable.lists?.length || 0)) return;
        changed = true;
        if (lists.length === 0 && variable.autoImported === false) {
          delete next[name];
          return;
        }
        const updated = { ...variable };
        if (lists.length) {
          updated.lists = lists;
        } else {
          delete updated.lists;
        }
        next[name] = updated;
      });
      return changed ? next : prev;
    });
  }, []);

  const resolve = useCallback(
    (template, candidateRow = {}, globalsOverride = {}) => {
      if (!template) return "";
      return template.replace(/\{([^}]+)\}/g, (_, raw) => {
        const key = cleanName(raw);
        const def = vars[key];
        if (!def) return "";

        if (def.type === "candidate") {
          if (candidateRow[key]) return candidateRow[key];
          if (def.sourceColumn && candidateRow[def.sourceColumn] !== undefined) {
            return candidateRow[def.sourceColumn];
          }
          const caseInsensitiveMatch = Object.keys(candidateRow).find((col) => cleanName(col) === key);
          if (caseInsensitiveMatch) return candidateRow[caseInsensitiveMatch];
          return "";
        }

        return globalsOverride[key] ?? def.value ?? "";
      });
    },
    [vars]
  );

  return {
    vars,
    names,
    addVariable,
    deleteVariable,
    setVariableType,
    setVariableValue,
    setCustomOverride,
    clearCustomOverride,
    setDetectedColumns,
    removeCandidateList,
    resolve,
    isCore,
  };
}

function toOverrideKey(listId) {
  if (listId === null || listId === undefined) return null;
  return String(listId);
}