import React from "react";
import { LogOut, Menu, HelpCircle } from "lucide-react";
import logo from "../assets/logo.png";

function Topbar({ onLogout, onToggleNav, onLogoClick }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleNav}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-slate-600 transition hover:border-slate-200 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation"
          >
            <Menu size={18} />
          </button>
          <button
            type="button"
            onClick={onLogoClick}
            className="group flex items-center gap-3 rounded-2xl border border-transparent px-2 py-1 transition hover:border-slate-200"
          >
            <img
              src={logo}
              alt="Syntellite logo"
              className="h-10 w-auto object-contain"
            />
            <div className="text-left">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400 group-hover:text-slate-500">
                Syntellite
              </div>
              <div className="text-lg font-semibold text-slate-900 group-hover:text-slate-950">Bulk Mail Workspace</div>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex">
            <HelpCircle size={16} />
            Support
          </button>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-black"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Topbar;