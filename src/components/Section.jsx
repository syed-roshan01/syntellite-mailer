import React from "react";

const Section = ({ title, subtitle, actions, children }) => (
  <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-lg shadow-slate-200/40 backdrop-blur supports-[backdrop-filter]:bg-white/80">
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        {subtitle && (
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{subtitle}</div>
        )}
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
    <div className="mt-5">{children}</div>
  </section>
);

export default Section;