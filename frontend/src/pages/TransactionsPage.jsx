import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import { 
  Search, 
  Filter, 
  Plus, 
  ShieldAlert, 
  Tag, 
  Trash2, 
  Check, 
  X,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';

const CATEGORIES = [
  'All', 'Food', 'Shopping', 'Transportation', 'Healthcare', 'Education',
  'Entertainment', 'Bills', 'Rent', 'EMI', 'Investments', 'Salary', 'Transfers', 'Other'
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState('ALL');
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTx, setNewTx] = useState({
    description: '',
    amount: '',
    transaction_type: 'DEBIT',
    category: 'Food',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (search.trim()) params.append('search', search.trim());
      if (suspiciousOnly) params.append('suspicious', 'true');
      if (typeFilter !== 'ALL') params.append('type', typeFilter);

      const res = await api.get(`/financial/transactions?${params.toString()}`);
      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.error("Error loading transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTransactions();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, selectedCategory, suspiciousOnly, typeFilter]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await api.post('/financial/transactions', {
        ...newTx,
        amount: parseFloat(newTx.amount)
      });
      setShowAddModal(false);
      setNewTx({
        description: '',
        amount: '',
        transaction_type: 'DEBIT',
        category: 'Food',
        transaction_date: new Date().toISOString().split('T')[0]
      });
      fetchTransactions();
    } catch (err) {
      alert("Error adding transaction: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction record?")) return;
    try {
      await api.delete(`/financial/transactions/${id}`);
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transactions & Activity</h1>
          <p className="text-xs text-slate-500 mt-0.5">Your organized income, expenses, and safety-verified entries</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search description, merchant, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>

          {/* Type Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs shrink-0">
            {['ALL', 'DEBIT', 'CREDIT'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  typeFilter === t ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Suspicious Only Toggle */}
          <button
            onClick={() => setSuspiciousOnly(!suspiciousOnly)}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-all shrink-0 ${
              suspiciousOnly
                ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            Flagged Only
          </button>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Categories:</span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white font-medium shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={5} height="h-12" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length > 0 ? (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{t.transaction_date}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {t.description}
                        {t.is_demo && (
                          <span className="ml-2 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                            DEMO DATA
                          </span>
                        )}
                        {t.is_suspicious && (
                          <div className="text-[11px] text-rose-600 font-semibold mt-0.5 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" />
                            {t.suspicion_reason || 'Flagged as statistical anomaly'}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                          t.transaction_type === 'CREDIT' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {t.transaction_type === 'CREDIT' ? (
                            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3 text-slate-600" />
                          )}
                          {t.transaction_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {t.category}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                        t.transaction_type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'
                      }`}>
                        {t.transaction_type === 'CREDIT' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 whitespace-nowrap">
                        {t.balance_after ? `₹${t.balance_after.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {t.is_suspicious ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                            High Risk
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Verified
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-500">
                      <p className="font-bold text-slate-800 text-sm mb-1">No transactions found</p>
                      <p className="text-xs text-slate-400 mb-4">You can add records manually or click "Load Demo Data" in the top bar to get started.</p>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Transaction
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Transaction Record</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Merchant</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swiggy Food Delivery"
                  value={newTx.description}
                  onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="650.00"
                    value={newTx.amount}
                    onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={newTx.transaction_type}
                    onChange={(e) => setNewTx({ ...newTx, transaction_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="DEBIT">Debit (Outflow)</option>
                    <option value="CREDIT">Credit (Inflow)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newTx.category}
                    onChange={(e) => setNewTx({ ...newTx, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newTx.transaction_date}
                    onChange={(e) => setNewTx({ ...newTx, transaction_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-xs"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
