import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Bell, 
  Sparkles, 
  LogOut, 
  User as UserIcon, 
  Menu,
  ShieldCheck,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

const ROUTE_NAMES = {
  '/dashboard': 'Dashboard Overview',
  '/analyser': 'Statement Analyser',
  '/transactions': 'Transactions Ledger',
  '/fraud-detection': 'AI Fraud & Threat Centre',
  '/budgeting': 'Smart Budgeting',
  '/loans': 'Loan & EMI Assistant',
  '/investments': 'Investment Intelligence',
  '/tax': 'Tax Intelligence (India)',
  '/business': 'Small Business Finance',
  '/news': 'Market & Macro Intelligence',
  '/assistant': 'FINWISE Assistant (Copilot)',
  '/reports': 'Institutional Reports',
  '/profile': 'My Financial Profile',
  '/settings': 'System Settings'
};

export default function Navbar({ onToggleSidebar, isSidebarCollapsed }) {
  const { user, logout, seedDemoData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const currentPageTitle = ROUTE_NAMES[location.pathname] || 'Financial Intelligence';

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await seedDemoData();
      setSeedSuccess(true);
      setTimeout(() => {
        setSeedSuccess(false);
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error("Demo seed error:", err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Toggle Sidebar"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Human Breadcrumb Navigation */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Finwise</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-semibold text-slate-800">{currentPageTitle}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role Pill */}
        <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          {user?.role || 'Individual Account'}
        </span>

        {/* Quick Demo Data Seeder Button */}
        <button
          onClick={handleSeed}
          disabled={seeding || seedSuccess}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
            seedSuccess 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-white hover:bg-slate-50 text-indigo-700 border-indigo-200 shadow-2xs hover:border-indigo-300'
          }`}
          title="Seed realistic transactions, budgets, and loans for instant testing"
        >
          {seedSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Demo Data Loaded
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              {seeding ? 'Loading Data...' : 'Load Demo Data'}
            </>
          )}
        </button>

        {/* Notification Bell */}
        <button 
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors"
          title="System notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
        </button>

        {/* User Profile Capsule */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <button 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              {user?.username ? user.username.slice(0, 2) : 'FW'}
            </div>
            <div className="hidden lg:block text-left pr-1">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.profile?.full_name || user?.username}
              </p>
              <p className="text-[10px] text-slate-400 truncate max-w-[110px]">
                {user?.email}
              </p>
            </div>
          </button>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-0.5"
            title="Sign out of account"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
