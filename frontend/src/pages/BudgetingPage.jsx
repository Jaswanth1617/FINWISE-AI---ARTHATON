import React, { useState, useEffect } from 'react';
import api from '../services/api';
import MetricCard from '../components/common/MetricCard';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import { 
  PieChart, 
  Target, 
  TrendingDown, 
  AlertTriangle, 
  Sparkles, 
  Plus, 
  Calendar,
  CheckCircle2
} from 'lucide-react';

export default function BudgetingPage() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    total_income: 75000,
    savings_target: 20000,
    categories: [
      { category_name: 'Food', allocated_amount: 8000 },
      { category_name: 'Rent', allocated_amount: 20000 },
      { category_name: 'Shopping', allocated_amount: 5000 },
      { category_name: 'Transportation', allocated_amount: 3000 },
      { category_name: 'Bills', allocated_amount: 4000 },
      { category_name: 'EMI', allocated_amount: 18500 }
    ]
  });

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const res = await api.get('/budgets/insights');
      setInsights(res.data);
    } catch (err) {
      console.error("Budget fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    try {
      await api.post('/budgets', budgetForm);
      setShowCreateModal(false);
      fetchInsights();
    } catch (err) {
      alert("Error saving budget: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading && !insights) {
    return <LoadingSkeleton count={3} height="h-32" />;
  }

  const summary = insights?.summary || {
    budgeted: 0,
    spent: 0,
    remaining: 0,
    projected_monthly_spend: 0,
    days_remaining: 12
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Smart Budgeting & Expense Velocity</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Category utilization tracking, threshold alerts, and month-end spending forecasts
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Set Monthly Budget
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Budgeted"
          value={`₹${summary.budgeted.toLocaleString('en-IN')}`}
          subtitle="Monthly cap target"
          icon={Target}
          color="indigo"
        />
        <MetricCard
          title="Actual Spent"
          value={`₹${summary.spent.toLocaleString('en-IN')}`}
          subtitle={`${summary.days_remaining} days remaining`}
          icon={TrendingDown}
          color="rose"
        />
        <MetricCard
          title="Remaining Budget"
          value={`₹${summary.remaining.toLocaleString('en-IN')}`}
          subtitle="Available for allocation"
          icon={CheckCircle2}
          color="emerald"
        />
        <MetricCard
          title="Projected Spend"
          value={`₹${summary.projected_monthly_spend.toLocaleString('en-IN')}`}
          subtitle="Based on current daily velocity"
          icon={PieChart}
          color="cyan"
        />
      </div>

      {/* Budget Alerts Banner */}
      {insights?.alerts?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Budget Threshold Warnings
          </div>
          <div className="space-y-1">
            {insights.alerts.map((alert, idx) => (
              <p key={idx} className="text-xs text-amber-800 font-medium pl-6">
                • {alert}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* AI Spending Insight Box */}
      <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 border border-indigo-200/80 rounded-xl p-5 flex items-start gap-3">
        <div className="p-2 bg-indigo-600 rounded-lg text-white shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-1">AI Velocity Forecast</h4>
          <p className="text-xs text-indigo-900 leading-relaxed font-medium">
            {insights?.ai_insight || "Tracking spending patterns across active categories."}
          </p>
        </div>
      </div>

      {/* Category Progress Cards */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Category Utilization Breakdown</h3>
        <p className="text-xs text-slate-500 mb-6">Real-time ledger comparison against budgeted allocations</p>

        {insights?.categories?.length > 0 ? (
          <div className="space-y-5">
            {insights.categories.map((cat) => {
              const pct = cat.consumed_percent;
              const isOver = pct > 100;
              const isWarning = pct >= 80 && pct <= 100;

              return (
                <div key={cat.category_name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800">{cat.category_name}</span>
                    <span className="text-slate-500">
                      ₹{cat.spent.toLocaleString('en-IN')} of ₹{cat.allocated.toLocaleString('en-IN')}{' '}
                      <span className={`ml-1 font-bold ${
                        isOver ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-slate-700'
                      }`}>
                        ({pct}%)
                      </span>
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Remaining: ₹{cat.remaining.toLocaleString('en-IN')}</span>
                    {isOver && <span className="text-rose-600 font-semibold">Exceeded by ₹{Math.abs(cat.remaining).toLocaleString('en-IN')}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-slate-400">
            No active budget categories configured. Click "Set Monthly Budget" to begin.
          </div>
        )}
      </div>

      {/* Set Budget Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">Configure Monthly Budget</h3>
            <p className="text-xs text-slate-500 mb-4">Set target spending caps for each major category</p>

            <form onSubmit={handleCreateBudget} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expected Monthly Income (₹)</label>
                  <input
                    type="number"
                    required
                    value={budgetForm.total_income}
                    onChange={(e) => setBudgetForm({ ...budgetForm, total_income: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Savings Goal Target (₹)</label>
                  <input
                    type="number"
                    required
                    value={budgetForm.savings_target}
                    onChange={(e) => setBudgetForm({ ...budgetForm, savings_target: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="font-bold text-slate-800 mb-2">Category Spending Caps (₹)</h4>
                <div className="space-y-2">
                  {budgetForm.categories.map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-28 font-medium text-slate-700 truncate">{c.category_name}</span>
                      <input
                        type="number"
                        value={c.allocated_amount}
                        onChange={(e) => {
                          const updated = [...budgetForm.categories];
                          updated[i].allocated_amount = parseFloat(e.target.value) || 0;
                          setBudgetForm({ ...budgetForm, categories: updated });
                        }}
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-xs"
                >
                  Save Budget Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
