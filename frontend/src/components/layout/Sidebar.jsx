import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  ReceiptText, 
  ShieldAlert, 
  PieChart, 
  Calculator, 
  TrendingUp, 
  FileSpreadsheet, 
  Building2, 
  Newspaper, 
  Bot, 
  FileText, 
  UserCircle, 
  Settings,
  ShieldCheck,
  Sparkles,
  Database
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    title: 'Core Accounting',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Statement Analyser', path: '/analyser', icon: UploadCloud },
      { name: 'Transactions', path: '/transactions', icon: ReceiptText },
    ]
  },
  {
    title: 'Intelligence & Protection',
    items: [
      { name: 'Fraud Detection', path: '/fraud-detection', icon: ShieldAlert, badge: 'Guard' },
      { name: 'Research Datasets', path: '/datasets', icon: Database, badge: '84k SMS' },
      { name: 'Smart Budgeting', path: '/budgeting', icon: PieChart },
      { name: 'Loan & EMI Assistant', path: '/loans', icon: Calculator },
      { name: 'Investments', path: '/investments', icon: TrendingUp },
      { name: 'Tax Intelligence', path: '/tax', icon: FileSpreadsheet },
      { name: 'Business Finance', path: '/business', icon: Building2 },
      { name: 'Financial News', path: '/news', icon: Newspaper },
      { name: 'FINWISE Assistant', path: '/assistant', icon: Bot, badge: 'AI Copilot' },
    ]
  },
  {
    title: 'Outputs & Account',
    items: [
      { name: 'Financial Reports', path: '/reports', icon: FileText },
      { name: 'Profile & Baseline', path: '/profile', icon: UserCircle },
      { name: 'Settings & Security', path: '/settings', icon: Settings },
    ]
  }
];

export default function Sidebar({ isCollapsed }) {
  return (
    <aside 
      className={`bg-white border-r border-slate-200/90 transition-all duration-200 ease-in-out flex flex-col z-30 shrink-0 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-100 justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-xs shrink-0">
            F
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <span className="font-extrabold text-slate-900 text-base tracking-tight">FINWISE</span>
              <span className="ml-1 text-[11px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200/60">
                AI
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-indigo-50/90 text-indigo-700 font-semibold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`
                    }
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                    {!isCollapsed && (
                      <span className="truncate flex-1">{item.name}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span className="text-[10px] font-bold tracking-tight px-1.5 py-0.5 rounded-full bg-indigo-100/70 text-indigo-700">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Trust Badge */}
      {!isCollapsed && (
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 m-2 rounded-xl">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 mb-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Strict Privacy Shield</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            Row-isolated ledger. Passwords and credentials never logged.
          </p>
        </div>
      )}
    </aside>
  );
}
