import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import MetricCard from '../components/common/MetricCard';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  PiggyBank, 
  ShieldAlert, 
  Activity, 
  Upload, 
  Calendar, 
  Sparkles,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  CreditCard,
  FileText,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  CartesianGrid 
} from 'recharts';

const PIE_COLORS = ['#4F46E5', '#0284C7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#64748B'];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [timeFilter, setTimeFilter] = useState('month');

  const fetchDashboard = async (filter) => {
    try {
      setLoading(true);
      const [summaryRes, analyticsRes] = await Promise.all([
        api.get(`/dashboard/summary?filter=${filter}`),
        api.get('/dashboard/analytics')
      ]);
      setData(summaryRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(timeFilter);
  }, [timeFilter]);

  if (loading && !data) {
    return <LoadingSkeleton count={4} height="h-32" />;
  }

  const summary = data?.summary || {
    total_income: 0,
    total_expenses: 0,
    current_balance: 0,
    monthly_savings: 0,
    budget_utilized_percent: 0,
    suspicious_transaction_count: 0,
    health_score: 85,
    health_status: 'Good'
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time ledger analytics, budget velocity, and risk surveillance
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Filter Pill Switcher */}
          <div className="inline-flex rounded-lg border border-slate-200/90 bg-slate-100/70 p-0.5 shadow-2xs text-xs">
            {['today', 'week', 'month', 'last_month'].map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`px-3 py-1.5 rounded-md font-medium capitalize transition-all ${
                  timeFilter === f
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>

          <Link
            to="/analyser"
            className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg shadow-2xs transition-colors shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Statement
          </Link>
        </div>
      </div>

      {/* Primary Financial Metric Cards (White theme, crisp borders) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Inflow"
          value={`₹${summary.total_income.toLocaleString('en-IN')}`}
          subtitle={`${timeFilter.replace('_', ' ')} period`}
          icon={ArrowUpRight}
          color="emerald"
        />
        <MetricCard
          title="Total Outflow"
          value={`₹${summary.total_expenses.toLocaleString('en-IN')}`}
          subtitle={`Budget utilization: ${summary.budget_utilized_percent}%`}
          icon={ArrowDownRight}
          color="rose"
        />
        <MetricCard
          title="Net Savings"
          value={`₹${summary.monthly_savings.toLocaleString('en-IN')}`}
          subtitle="Available surplus"
          icon={PiggyBank}
          color="indigo"
        />
        <MetricCard
          title="Calculated Balance"
          value={`₹${summary.current_balance.toLocaleString('en-IN')}`}
          subtitle={`Health Score: ${summary.health_status} (${summary.health_score}/100)`}
          icon={Wallet}
          color="cyan"
        />
      </div>

      {/* Flagged Anomaly Warning Banner (Human friendly, subtle pastel) */}
      {summary.suspicious_transaction_count > 0 && (
        <div className="bg-rose-50/80 border border-rose-200/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg text-rose-600 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-900">
                {summary.suspicious_transaction_count} Transaction Anomaly Flagged for Review
              </h4>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Our algorithmic engine flagged transactions differing substantially from your historical baseline or exhibiting duplicate signatures.
              </p>
            </div>
          </div>
          <Link
            to="/fraud-detection"
            className="text-xs font-bold bg-white text-rose-700 border border-rose-200 px-3.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors shadow-2xs shrink-0 self-start sm:self-auto"
          >
            Review In Fraud Centre
          </Link>
        </div>
      )}

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Income vs Expenses Cashflow Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Income vs. Expense Dynamics</h3>
              <p className="text-xs text-slate-500">6-Month historical cash-flow analysis (INR)</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Inflow
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Outflow
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.monthly_trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip 
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                />
                <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#incomeGrad)" name="Income" />
                <Area type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#expenseGrad)" name="Expense" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Donut */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-card flex flex-col">
          <h3 className="text-sm font-bold text-slate-900">Category Spending Share</h3>
          <p className="text-xs text-slate-500 mb-2">Current period expenditure distribution</p>

          <div className="h-44 w-full relative flex items-center justify-center">
            {data?.category_distribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.category_distribution}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {data.category_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-400 py-10">No expense records in this filter</div>
            )}
          </div>

          <div className="space-y-1.5 mt-auto pt-2 border-t border-slate-100 max-h-36 overflow-y-auto">
            {data?.category_distribution?.slice(0, 4).map((c, i) => (
              <div key={c.category} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                  {c.category}
                </span>
                <span className="font-semibold text-slate-800">₹{c.amount.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Ledger & Human-Crafted AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Ledger Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Ledger Activity</h3>
              <p className="text-xs text-slate-500">Verified transactions recorded in database</p>
            </div>
            <Link to="/transactions" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Complete Ledger <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-y border-slate-200/80">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recent_transactions?.length > 0 ? (
                  data.recent_transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{tx.transaction_date}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 max-w-[200px] truncate">
                        {tx.description}
                        {tx.is_suspicious && (
                          <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">
                            Flagged
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[11px]">
                          {tx.category}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-semibold whitespace-nowrap ${
                        tx.transaction_type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'
                      }`}>
                        {tx.transaction_type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-10 text-center text-slate-400">
                      No transactions recorded yet. Click "Load Demo Data" above for instant review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: AI Insights & Upcoming EMIs (Clean White Theme) */}
        <div className="space-y-6">
          
          {/* AI Insights Card (Clean White Theme) */}
          <div className="bg-white rounded-xl border border-indigo-100 p-5 shadow-card relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  AI Contextual Insights
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                Groq Llama-3.3
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {data?.ai_insights || "Upload statements to receive automated spending velocity warnings and savings optimizations."}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Grounded on your ledger
              </span>
              <Link to="/assistant" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                Consult Assistant <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Upcoming EMIs Card */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Upcoming EMI Obligations
              </h3>
              <Link to="/loans" className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800">
                Calculator
              </Link>
            </div>
            
            <div className="space-y-2.5">
              {data?.upcoming_emis?.length > 0 ? (
                data.upcoming_emis.map((emi, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-white rounded border border-slate-200 text-indigo-600">
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{emi.loan_name}</p>
                        <p className="text-[10px] text-slate-400">{emi.loan_type}</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">₹{emi.monthly_emi.toLocaleString('en-IN')}/mo</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-slate-400 py-4">
                  No active loan schedules linked.{' '}
                  <Link to="/loans" className="text-indigo-600 font-medium underline">Add Loan</Link>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
