import React from "react";
import {
  BarChart3,
  Users2,
  FileText,
  Send,
  History,
  CreditCard,
  Settings as SettingsIcon,
  Mail,
  ChevronRight,
} from "lucide-react";

function Sidebar({ current, setCurrent, onClose }) {
  const items = [
    { key: "dashboard", label: "Overview", icon: BarChart3 },
    { key: "candidates", label: "Contact Lists", icon: Users2 },
    { key: "templates", label: "Templates", icon: FileText },
    { key: "compose", label: "Campaigns", icon: Send },
    { key: "logs", label: "History", icon: History },
    { key: "billing", label: "Billing", icon: CreditCard },
    { key: "settings", label: "Variables", icon: SettingsIcon },
    { key: "provider", label: "SMTP & Providers", icon: Mail },
  ];

  const handleNavigate = (key) => {
    setCurrent(key);
    if (onClose) onClose();
  };

  return (
    <div className="flex h-full w-full flex-col justify-between border-r border-slate-200 bg-white/85 px-4 py-5 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <nav className="space-y-1">
        <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Menu
        </div>
        {items.map((item) => {
          const Icon = item.icon;
          const active = current === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleNavigate(item.key)}
              className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                active
                  ? "bg-gray-900 text-white shadow-lg shadow-gray-900/15"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon size={18} className={active ? "text-white" : "text-slate-500 group-hover:text-slate-700"} />
              <span className="font-medium">{item.label}</span>
              {active && <ChevronRight className="ml-auto text-white" size={16} />}
            </button>
          );
        })}
      </nav>

      <div className="rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 p-4 text-white shadow-xl shadow-blue-600/20">
        <div className="text-xs uppercase tracking-wide text-white/70">Plan</div>
        <div className="mt-1 text-lg font-semibold">Starter</div>
        <div className="text-xs text-white/80">Send up to 5,000 messages / month</div>
        <button
          onClick={() => handleNavigate("billing")}
          className="mt-4 w-full rounded-xl bg-white/15 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/25"
        >
          Upgrade workspace
        </button>
      </div>
    </div>
  );
}

export default Sidebar;