// App.jsx
import React, { useState, useEffect } from "react";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import ScreenDashboard from "./screens/Dashboard";
import ScreenCandidates from "./screens/Candidates";
import ScreenTemplates from "./screens/Templates";
import ScreenCompose from "./screens/Compose";
import ScreenLogs from "./screens/Logs";
import ScreenBilling from "./screens/Billing";
import ScreenSettings from "./screens/Settings";
import ScreenProviderSettings from "./screens/ProviderSettings";
import { Sparkles } from "lucide-react";
import { TemplatesProvider } from "./context/TemplatesContext";
import { VariablesProvider } from "./context/VariablesContext";
import { CandidatesProvider } from "./context/CandidatesContext";
import logo from "./assets/logo.png";

export default function App() {
  const [current, setCurrent] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [registerMode, setRegisterMode] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setAuthed(true);
    setLoading(false);
  }, []);

  const handleAuth = async () => {
    setError("");
    try {
      const endpoint = registerMode ? "register" : "login";
      const res = await fetch(`http://localhost:4000/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        setAuthed(true);
      } else {
        setError(data.error || "Auth failed");
      }
    } catch (err) {
      setError("Server error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthed(false);
  };

  const handleLogoClick = () => {
    setCurrent("dashboard");
    setSidebarOpen(false);
  };

  const handleNavigate = (key) => {
    setCurrent(key);
    setSidebarOpen(false);
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center">Loading...</div>;
  }

  if (!authed) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white/10 p-8 shadow-2xl shadow-black/40 backdrop-blur supports-[backdrop-filter]:bg-white/15">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Syntellite logo"
              className="h-12 w-12 rounded-2xl object-cover shadow-md shadow-blue-500/20"
            />
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">Welcome to</div>
              <div className="text-lg font-semibold text-white">Syntellite Bulk Mail</div>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 rounded-xl border border-white/20 bg-white/5 text-white placeholder:text-slate-300 focus:border-white/40 focus:outline-none"
            />
            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-3 py-2 rounded-xl border border-white/20 bg-white/5 text-white placeholder:text-slate-300 focus:border-white/40 focus:outline-none"
            />
            <button
              onClick={handleAuth}
              className="px-3 py-2 rounded-xl bg-white text-slate-900 text-sm font-semibold transition hover:bg-slate-100"
            >
              {registerMode ? "Register" : "Login"}
            </button>
            {error && <div className="text-red-200 text-sm">{error}</div>}
            <button
              type="button"
              className="text-sm text-blue-200 hover:text-white"
              onClick={() => setRegisterMode(!registerMode)}
            >
              {registerMode
                ? "Already have an account? Login"
                : "Don't have an account? Register"}
            </button>
          </div>
          <div className="text-[11px] text-slate-300/80 mt-4">
            By continuing you agree to the Terms & Privacy.
          </div>
        </div>
      </div>
    );
  }

  return (
    <VariablesProvider>
      <TemplatesProvider>
        <CandidatesProvider>
          <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
            <Topbar onLogout={handleLogout} onToggleNav={() => setSidebarOpen(true)} onLogoClick={handleLogoClick} />

            <div className="relative flex flex-1">
              {sidebarOpen && (
                <div className="fixed inset-0 z-40 flex lg:hidden">
                  <div
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                  />
                  <div className="relative h-full w-72 max-w-[80%]">
                    <Sidebar current={current} setCurrent={handleNavigate} onClose={() => setSidebarOpen(false)} />
                  </div>
                </div>
              )}

              <aside className="hidden h-[calc(100vh-64px)] w-72 shrink-0 border-r border-slate-200 bg-white/80 backdrop-blur lg:flex lg:flex-col">
                <Sidebar current={current} setCurrent={handleNavigate} />
              </aside>

              <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-16">
                  {current === "dashboard" && <ScreenDashboard />}
                  {current === "candidates" && <ScreenCandidates />}
                  {current === "templates" && <ScreenTemplates />}
                  {current === "compose" && <ScreenCompose />}
                  {current === "logs" && <ScreenLogs />}
                  {current === "billing" && <ScreenBilling />}
                  {current === "settings" && <ScreenSettings />}
                  {current === "provider" && <ScreenProviderSettings />}
                </div>
              </main>
            </div>

            <div className="pointer-events-none fixed bottom-4 right-4 z-20 hidden sm:block">
              <button className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-lg shadow-slate-500/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-500/20">
                <Sparkles size={16} className="text-indigo-500" /> Need a hand?
              </button>
            </div>
          </div>
        </CandidatesProvider>
      </TemplatesProvider>
    </VariablesProvider>
  );
}