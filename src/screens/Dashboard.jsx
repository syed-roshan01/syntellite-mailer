import React from "react";
import StatCard from "../components/StatCard";
import Section from "../components/Section";
import { Upload, FileText, Send } from "lucide-react";

function ScreenDashboard() {
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Candidates" value="1,284" sub="across 6 lists" />
        <StatCard title="Emails Sent" value="3,420" sub="last 30 days" />
        <StatCard title="Open Rate" value="61%" sub="avg across campaigns" />
        <StatCard title="Failures" value="12" sub="bounces/blocked" />
      </div>

      <Section
        title="Quick Actions"
        actions={
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-xl bg-gray-900 text-white text-sm hover:bg-black flex items-center gap-2">
              <Upload size={16} /> Upload List
            </button>
            <button className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50 flex items-center gap-2">
              <FileText size={16} /> New Template
            </button>
            <button className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50 flex items-center gap-2">
              <Send size={16} /> Compose
            </button>
          </div>
        }
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border p-4">
            <div className="text-sm text-gray-500 mb-2">Recent Activity</div>
            <ul className="space-y-2 text-sm list-disc list-inside">
              <li>Sent 152 interview invites to "July-Grad-List".</li>
              <li>AI refined the "Offer v3" template (tone: formal).</li>
              <li>Scheduled follow-ups for tomorrow at 10:00.</li>
            </ul>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-gray-500 mb-2">Tips</div>
            <ul className="space-y-2 text-sm list-disc list-inside">
              <li>Personalize subject lines with {"{First_Name}"}.</li>
              <li>Include calendar links to increase reply rates.</li>
              <li>Warm up domains to protect deliverability.</li>
            </ul>
          </div>
        </div>
      </Section>
    </div>
  );
}

export default ScreenDashboard;
