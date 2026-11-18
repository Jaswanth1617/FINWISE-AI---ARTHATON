import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calculator, 
  FileSpreadsheet, 
  TrendingUp, 
  Building2, 
  Database, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  PieChart,
  Newspaper
} from 'lucide-react';

const TOOLS = [
  {
    id: 'loans',
    title: 'Loan & EMI Calculator',
    path: '/loans',
    icon: Calculator,
    iconBg: 'bg-indigo-50 text-indigo-600',
    description: 'Calculate monthly reducing-balance EMIs, compare bank interest rates, and discover how extra payments save years of debt.',
    features: ['Reducing balance formula', 'Prepayment tenure accelerator', 'Full repayment schedules']
  },
  {
    id: 'tax',
    title: 'Income Tax Estimator (FY 2024-25)',
    path: '/tax',
    icon: FileSpreadsheet,
    iconBg: 'bg-emerald-50 text-emerald-600',
    description: 'Instant side-by-side comparison of the Old vs. New Tax Regime with Section 87A rebate and standard deduction calculations.',
    features: ['Old vs New regime comparison', 'Rebate 87A up to ₹7 Lakhs', '80C & 80D deductions']
  },
  {
    id: 'investments',
    title: 'Investment & SIP Wealth Builder',
    path: '/investments',
    icon: TrendingUp,
    iconBg: 'bg-cyan-50 text-cyan-600',
    description: 'Model wealth compounding over 5 to 30 years with monthly SIP contributions, expected return rates, and FD interest calculators.',
    features: ['Compound interest curves', 'Asset allocation pie chart', 'Quarterly-compounded FD']
  },
  {
    id: 'business',
    title: 'Small Business & GST Invoices',
    path: '/business',
    icon: Building2,
    iconBg: 'bg-amber-50 text-amber-600',
    description: 'Monitor business cash flow runways, revenue velocity, and generate professional GST invoices with 1-click PDF download.',
    features: ['Cash runway calculator', 'Automated CGST/SGST/IGST split', 'Instant PDF invoice export']
  },
  {
    id: 'datasets',
    title: 'Research Datasets & Benchmarks',
    path: '/datasets',
    icon: Database,
    iconBg: 'bg-purple-50 text-purple-600',
    description: 'Explore the 84,863 SMS Smishing research corpus and 12-month authentic banking transactions with live AI threat scanning.',
    features: ['84k labeled SMS dataset', 'INFO-4360 signal features', '2,393 real bank transactions']
  },
  {
    id: 'news',
    title: 'Market & Financial News',
    path: '/news',
    icon: Newspaper,
    iconBg: 'bg-rose-50 text-rose-600',
    description: 'Stay updated with curated macroeconomic updates, RBI monetary policy insights, and automated market sentiment scoring.',
    features: ['Market sentiment indicators', 'Sectoral impact tags', 'Curated economic briefings']
  }
];

export default function ToolsPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Financial Intelligence Suite
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Financial Calculators & Planning Tools
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Select any planning tool below to estimate loan costs, minimize your tax liabilities, project investment growth, or generate business invoices.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.id}
              to={tool.path}
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tool.iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">
                  {tool.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {tool.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                {tool.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
