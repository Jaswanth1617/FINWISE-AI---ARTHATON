import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ReceiptText, 
  PieChart, 
  ShieldAlert, 
  Calculator, 
  Bot, 
  FileText, 
  UploadCloud, 
  Database, 
  Newspaper, 
  UserCircle, 
  Settings, 
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileSpreadsheet,
  TrendingUp,
  Building2
} from 'lucide-react';

const MAIN_NAV = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: ReceiptText },
  { name: 'Smart Budgets', path: '/budgeting', icon: PieChart },
  { name: 'Scam & Fraud Shield', path: '/fraud-detection', icon: ShieldAlert, badge: 'Guard' },
  { name: 'Calculators & Tools', path: '/tools', icon: Calculator, badge: 'Hub' },
  { name: 'AI Assistant', path: '/assistant', icon: Bot, badge: 'Copilot' },
  { name: 'Reports', path: '/reports', icon: FileText },
];

const MORE_TOOLS = [
  { name: 'Statement Analyser', path: '/analyser', icon: UploadCloud },
  { name: 'Loan & EMI Assistant', path: '/loans', icon: Calculator },
  { name: 'Income Tax Estimator', path: '/tax', icon: FileSpreadsheet },
  { name: 'Investment Wealth', path: '/investments', icon: TrendingUp },
  { name: 'Small Business Finance', path: '/business', icon: Building2 },
  { name: 'Research Datasets', path: '/datasets', icon: Database, badge: '84k' },
  { name: 'Financial News', path: '/news', icon: Newspaper },
];

const ACCOUNT_NAV = [
  { name: 'Profile', path: '/profile', icon: UserCircle },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar({ isCollapsed }) {
  const location = useLocation();
  const isMoreToolActive = MORE_TOOLS.some(t => t.path === location.pathname);
  const [showMore, setShowMore] = useState(isMoreToolActive);

  useEffect(() => {
    if (isMoreToolActive) {
      setShowMore(true);
    }
  }, [location.pathname, isMoreToolActive]);

  return (
    <aside 
      className={`bg-white border-r border-slate-200/90 transition-all duration-200 ease-in-out flex flex-col z-30 shrink-0 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-100 justify-between">
        <NavLink to="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
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
        </NavLink>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
        {/* Main Essentials */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Overview & Money
            </p>
          )}
          {MAIN_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
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

        {/* More Tools Accordion (Clean & Uncluttered) */}
        {!isCollapsed && (
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowMore(!showMore)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors rounded-lg hover:bg-slate-50"
            >
              <span className="uppercase tracking-wider text-[10px]">Specialized Tools</span>
              {showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showMore && (
              <div className="mt-1 space-y-0.5 pl-1">
                {MORE_TOOLS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all group ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`
                      }
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100" />
                      <span className="truncate flex-1 text-[11px]">{item.name}</span>
                      {item.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Account & Settings */}
        <div className="pt-2 border-t border-slate-100 space-y-0.5">
          {!isCollapsed && (
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Account
            </p>
          )}
          {ACCOUNT_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`
                }
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Footer Trust Badge */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 m-2 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 mb-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bank-Grade Privacy</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            No banking credentials are ever stored. Pure deterministic calculations.
          </p>
        </div>
      )}
    </aside>
  );
}
