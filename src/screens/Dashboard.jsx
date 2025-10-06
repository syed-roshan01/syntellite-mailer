import React, { useEffect, useMemo, useState, useCallback } from "react";
import StatCard from "../components/StatCard";
import Section from "../components/Section";
import { Upload, FileText, Send, Zap, Users, RefreshCw } from "lucide-react";
import { useCandidates } from "../context/CandidatesContext";
import { useTemplates } from "../context/TemplatesContext";

const LOG_ENDPOINT = "http://localhost:4000/api/logs";
const PROVIDER_STORAGE_KEY = "syntellite:smtp-providers:v1";

function safeParseDetails(details) {
  if (!details) return {};
  if (typeof details === "object") return details;
  try {
    return JSON.parse(details);
  } catch (err) {
    return {};
  }
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ScreenDashboard() {
  const { lists } = useCandidates();
  const { templates } = useTemplates();

  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logError, setLogError] = useState("");
  const [activeProvider, setActiveProvider] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(PROVIDER_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (parsed && Array.isArray(parsed.providers)) {
        const provider = parsed.providers.find((item) => item.id === parsed.activeId) || parsed.providers[0];
        setActiveProvider(provider || null);
      }
    } catch (err) {
      console.warn("Unable to read provider storage", err);
    }
  }, []);

  const loadLogs = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLogError("Session expired. Please log in again.");
      setLoadingLogs(false);
      return;
    }

    setLoadingLogs(true);
    fetch(LOG_ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load activity logs");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setLogs(
            data
              .map((log) => ({
                ...log,
                details: safeParseDetails(log.details_json),
              }))
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          );
        } else {
          setLogs([]);
        }
        setLogError("");
      })
      .catch((err) => {
        console.error(err);
        setLogError(err.message || "Unable to load logs");
      })
      .finally(() => setLoadingLogs(false));
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const aggregate = useMemo(() => {
    const totalContacts = lists.reduce((sum, list) => sum + (list.rows?.length || 0), 0);
    const campaigns = logs.filter((log) => log.action === "bulk");
    const totalCampaigns = campaigns.length;
    const sentFromCampaigns = campaigns.reduce((sum, log) => {
      const { ok, sent } = log.details || {};
      const count = typeof ok === "number" ? ok : typeof sent === "number" ? sent : log.candidate_count || 0;
      return sum + count;
    }, 0);
    const failedFromCampaigns = campaigns.reduce((sum, log) => {
      const { fail, failed } = log.details || {};
      const failures = typeof fail === "number" ? fail : typeof failed === "number" ? failed : 0;
      return sum + failures;
    }, 0);
    const lastActivity = logs[0]?.created_at || null;
    const testEmails = logs.filter((log) => log.action === "test").length;

    const healthScore = (() => {
      const total = sentFromCampaigns + failedFromCampaigns;
      if (!total) return 100;
      const ratio = (sentFromCampaigns / total) * 100;
      return Math.max(0, Math.min(100, Math.round(ratio)));
    })();

    return {
      totalContacts,
      listCount: lists.length,
      templateCount: templates.length,
      totalCampaigns,
      sentFromCampaigns,
      failedFromCampaigns,
      testEmails,
      lastActivity,
      healthScore,
    };
  }, [lists, templates, logs]);

  const recentLogs = useMemo(() => logs.slice(0, 5), [logs]);

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-slate-900 p-6 text-white shadow-2xl shadow-indigo-500/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-white/70">Workspace Snapshot</div>
            <h1 className="mt-2 text-3xl font-semibold lg:text-4xl">Bulk Mail Overview</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/80">
              Track campaign performance, active senders, and recent delivery activity. Metrics update live as
              you send from the platform.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm backdrop-blur">
              <div className="text-white/70">Active sender</div>
              <div className="mt-1 text-lg font-semibold">
                {activeProvider?.fromEmail || activeProvider?.username || "Not configured"}
              </div>
              <div className="text-xs text-white/60">
                {activeProvider ? `${activeProvider.host}:${activeProvider.port}` : "Add an SMTP provider"}
              </div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm backdrop-blur">
              <div className="text-white/70">Deliverability health</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-semibold">{aggregate.healthScore}%</span>
                <span className="text-xs text-white/60">success last campaigns</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Contacts in workspace"
          value={formatNumber(aggregate.totalContacts)}
          sub={`${aggregate.listCount} lists loaded`}
        />
        <StatCard
          title="Templates"
          value={formatNumber(aggregate.templateCount)}
          sub="Ready to personalize"
        />
        <StatCard
          title="Campaign emails sent"
          value={formatNumber(aggregate.sentFromCampaigns)}
          sub={`${aggregate.totalCampaigns} total campaigns`}
        />
        <StatCard
          title="Failures"
          value={formatNumber(aggregate.failedFromCampaigns)}
          sub="Across all campaigns"
        />
      </div>

      <Section
        title="Quick actions"
        subtitle="Get started"
        actions={
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black">
              <Upload size={16} /> Upload new list
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100">
              <FileText size={16} /> Create template
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100">
              <Send size={16} /> Compose campaign
            </button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">Activity feed</div>
              <button
                onClick={loadLogs}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1 text-xs text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
            <div className="mt-3 space-y-3 text-sm">
              {loadingLogs && <div className="text-slate-400">Loading recent logs...</div>}
              {!loadingLogs && logError && <div className="text-red-500">{logError}</div>}
              {!loadingLogs && !logError && recentLogs.length === 0 && (
                <div className="text-slate-400">No activity yet. Send your first campaign!</div>
              )}
              {!loadingLogs && !logError &&
                recentLogs.map((log) => {
                  const details = log.details || {};
                  const sent = details.ok ?? details.sent ?? log.candidate_count ?? 0;
                  const failed = details.fail ?? details.failed ?? 0;
                  return (
                    <div key={log.id} className="rounded-xl border border-slate-100 p-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="uppercase tracking-[0.18em]">{log.action}</span>
                        <span>{formatDate(log.created_at)}</span>
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-800">
                        {log.list_name || log.details?.to || "Workspace"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {sent} sent · {failed} failed · status {log.status}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-slate-800">Lists at a glance</div>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                {lists.length === 0 && <div className="text-slate-400">No lists uploaded yet.</div>}
                {lists.slice(0, 4).map((list) => (
                  <div key={list.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
                    <div>
                      <div className="font-semibold text-slate-800">{list.name}</div>
                      <div className="text-xs text-slate-500">{list.rows.length} contacts</div>
                    </div>
                    <Users size={18} className="text-slate-400" />
                  </div>
                ))}
                {lists.length > 4 && (
                  <div className="text-xs text-slate-500">+{lists.length - 4} more lists</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-slate-800">Templates ready</div>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                {templates.length === 0 && <div className="text-slate-400">No templates created yet.</div>}
                {templates.slice(0, 3).map((template) => (
                  <div key={template.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
                    <div>
                      <div className="font-semibold text-slate-800">{template.name}</div>
                      <div className="text-xs text-slate-500">Subject: {template.subject}</div>
                    </div>
                    <Zap size={18} className="text-indigo-400" />
                  </div>
                ))}
                {templates.length > 3 && (
                  <div className="text-xs text-slate-500">+{templates.length - 3} more templates</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

export default ScreenDashboard;
