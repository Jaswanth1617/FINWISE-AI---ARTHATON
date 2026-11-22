import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  TrendingUp, 
  PieChart, 
  Bot, 
  ArrowRight, 
  CheckCircle, 
  FileSpreadsheet, 
  Building2,
  Lock,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  Coins,
  Check,
  FileCheck2,
  AlertTriangle,
  ReceiptText
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navigation Bar */}
      <header className="h-18 border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-full px-6 lg:px-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-lg text-white shadow-xs">
              F
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              FINWISE <span className="text-indigo-600">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              to="/login"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg shadow-xs hover:shadow-sm transition-all flex items-center gap-1.5"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24 flex flex-col items-center text-center">
        
        {/* Human Quality Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs text-slate-700 text-xs font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
          Intelligent Personal & Business Financial Operating System
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] max-w-4xl mb-6">
          Understand Your Money. <br />
          <span className="text-indigo-600">Protect Your Financial Future.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mb-10 leading-relaxed font-normal">
          An end-to-end financial intelligence platform that organizes cash flow transactions, flags suspicious phishing messages and URLs, models reducing-balance loan EMIs, compares Indian income tax regimes, and answers your financial questions with verified context.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-16 w-full sm:w-auto">
          <Link
            to="/register"
            className="w-full sm:w-auto text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white px-7 py-3 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
          >
            Start Free Consultation
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto text-sm font-semibold bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 px-7 py-3 rounded-xl shadow-2xs hover:border-slate-300 transition-all flex items-center justify-center gap-2"
          >
            Explore Live Demo Platform
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>

        {/* Real Product Showcase Preview (Human-Designed UI Cards) */}
        <div className="w-full max-w-5xl bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-card text-left space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Unified Ecosystem Preview
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Everything Connected: Ledger, Fraud Guard, and Advisory Engine
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium hidden sm:block">
              Zero mock data required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Feature 1 */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <ReceiptText className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">Smart Ledger & Categorization</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Organize all financial activities. Automatically normalizes descriptions, assigns 13 fintech categories, and computes verified cash flow balances.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all">
              <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">AI Fraud & URL Guard</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Heuristic risk scoring for fake bank SMS, UPI prize hooks, and passive domain verification without making risky network calls.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <Bot className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">FINWISE Assistant</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Contextual chat copilot grounded in your verified accounts. Answers spending questions and models loan affordability with zero hallucination.
              </p>
            </div>
          </div>
        </div>

        {/* Human Trust Section */}
        <div className="mt-20 max-w-4xl w-full border-t border-slate-200/70 pt-12">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 text-center">
            Built On Deterministic Mathematical Foundation
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
            <div>
              <p className="text-sm font-bold text-slate-900">Reducing EMI</p>
              <p className="text-xs text-slate-500 mt-0.5">Amortization schedules with prepayment acceleration</p>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">FY 24-25 Tax</p>
              <p className="text-xs text-slate-500 mt-0.5">Section 87A rebate & Old vs. New Regime comparison</p>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">GST Invoicing</p>
              <p className="text-xs text-slate-500 mt-0.5">Auto intra/inter-state split with PDF download</p>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Institutional PDF</p>
              <p className="text-xs text-slate-500 mt-0.5">Audit-grade ReportLab financial dossiers</p>
            </div>
          </div>
        </div>

      </main>

      {/* Light Clean Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2025 FINWISE AI. All rights reserved. Strictly privacy-first: PINs and banking passwords are never stored.</p>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <Link to="/login" className="hover:text-slate-900">Sign In</Link>
            <Link to="/register" className="hover:text-slate-900">Create Account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
