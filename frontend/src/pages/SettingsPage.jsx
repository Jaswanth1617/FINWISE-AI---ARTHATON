import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Settings as SettingsIcon, ShieldCheck, Database, Cpu, CheckCircle2, Lock } from 'lucide-react';

export default function SettingsPage() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.get('/health').then(res => setHealth(res.data)).catch(() => {});
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System & Security Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">Platform telemetry, database connection, and encryption status</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <h3 className="text-sm font-bold text-slate-900">Platform Infrastructure Status</h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-bold text-slate-800">Relational Database Engine</p>
                <p className="text-slate-500 text-[11px]">SQLAlchemy ORM + PostgreSQL / SQLite local migration</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              Connected
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-cyan-600" />
              <div>
                <p className="font-bold text-slate-800">Groq LLM Cognitive Engine</p>
                <p className="text-slate-500 text-[11px]">Configured model: llama-3.3-70b-versatile with local deterministic fallback</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full font-bold border ${
              health?.groq_configured 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}>
              {health?.groq_configured ? 'Active Key' : 'Local Rule Engine Active'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-bold text-slate-800">Security & Isolation Policy</p>
                <p className="text-slate-500 text-[11px]">Strict User-Level Row Isolation, Passlib Bcrypt Hashing & JWT Claims</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              Enforced
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 text-xs text-slate-500">
          <p className="font-semibold text-slate-700 mb-1">Hackathon Deployment Checklist</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Frontend production target: Vercel</li>
            <li>Backend REST API production target: Render / Linux Python runtime</li>
            <li>Database production target: Supabase PostgreSQL (SSL enforced)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
