import React, { useState, useEffect } from 'react';
import api from '../services/api';
import MetricCard from '../components/common/MetricCard';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import { 
  Building2, 
  FileText, 
  Plus, 
  Download, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Briefcase
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function BusinessPage() {
  const [business, setBusiness] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [cashflow, setCashflow] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Invoice Modal
  const [showModal, setShowModal] = useState(false);
  const [invForm, setInvForm] = useState({
    client_name: '',
    client_state: 'Karnataka',
    client_gstin: '',
    client_email: '',
    item_description: 'Software Architecture Consulting',
    quantity: 1,
    rate: 65000,
    tax_rate: 18.0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bizRes, analyticsRes, cashflowRes, invRes] = await Promise.all([
        api.get('/business/profile'),
        api.get('/business/analytics'),
        api.get('/business/cashflow'),
        api.get('/business/invoices')
      ]);
      setBusiness(bizRes.data.business);
      setAnalytics(analyticsRes.data.summary);
      setCashflow(cashflowRes.data.cashflow_trend);
      setInvoices(invRes.data.invoices || []);
    } catch (err) {
      console.error("Business data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      await api.post('/business/invoices', {
        client_name: invForm.client_name,
        client_state: invForm.client_state,
        client_gstin: invForm.client_gstin,
        client_email: invForm.client_email,
        tax_rate: parseFloat(invForm.tax_rate),
        items: [{
          description: invForm.item_description,
          quantity: parseFloat(invForm.quantity),
          rate: parseFloat(invForm.rate)
        }]
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert("Error generating invoice: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading && !business) {
    return <LoadingSkeleton count={3} height="h-32" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{business?.business_name || "Enterprise Finance"}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            GSTIN: <span className="font-mono font-semibold text-slate-700">{business?.gstin || "Unregistered"}</span> | {business?.industry || "Services"} ({business?.state})
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create GST Invoice
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Billed Revenue"
          value={`₹${(analytics?.total_revenue || 0).toLocaleString('en-IN')}`}
          subtitle="Settled invoices"
          icon={TrendingUp}
          color="emerald"
        />
        <MetricCard
          title="Pending Receivables"
          value={`₹${(analytics?.outstanding_receivables || 0).toLocaleString('en-IN')}`}
          subtitle="Outstanding client balance"
          icon={Clock}
          color="amber"
        />
        <MetricCard
          title="Estimated Net Profit"
          value={`₹${(analytics?.estimated_net_profit || 0).toLocaleString('en-IN')}`}
          subtitle={`Margin: ${analytics?.profit_margin_percent || 0}%`}
          icon={Briefcase}
          color="indigo"
        />
        <MetricCard
          title="Cash Runway"
          value="5.8 Months"
          subtitle="Working capital buffer"
          icon={Building2}
          color="cyan"
        />
      </div>

      {/* Cash Flow Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Monthly Cash Flow & Operating Margin</h3>
            <p className="text-xs text-slate-500">Inflows vs Outflows (INR)</p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Positive Cash Runway
          </span>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashflow || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, '']} />
              <Bar dataKey="inflow" fill="#5146E5" radius={[4, 4, 0, 0]} name="Inflow" />
              <Bar dataKey="outflow" fill="#EF4444" radius={[4, 4, 0, 0]} name="Outflow" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Issued GST Invoices</h3>
          <span className="text-xs text-slate-500">{invoices.length} Invoices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Tax Type</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{inv.invoice_number}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{inv.client_name}</td>
                  <td className="py-3 px-4 text-slate-500">{inv.client_state}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                      {inv.igst_amount > 0 ? 'IGST (18%)' : 'CGST+SGST (18%)'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">₹{inv.subtotal.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">₹{inv.total_amount.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Generator Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Generate GST Invoice</h3>
            <p className="text-xs text-slate-500 mb-4">Creates verified PDF invoice with automated intra/inter-state GST breakdown</p>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Client Entity Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. InnovateTech Global Pvt Ltd"
                  value={invForm.client_name}
                  onChange={(e) => setInvForm({ ...invForm, client_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Client State (For GST)</label>
                  <input
                    type="text"
                    required
                    placeholder="Karnataka / Maharashtra"
                    value={invForm.client_state}
                    onChange={(e) => setInvForm({ ...invForm, client_state: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Client GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="29ABCDE1234F1Z5"
                    value={invForm.client_gstin}
                    onChange={(e) => setInvForm({ ...invForm, client_gstin: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Line Item Description</label>
                <input
                  type="text"
                  required
                  value={invForm.item_description}
                  onChange={(e) => setInvForm({ ...invForm, item_description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Rate (₹)</label>
                  <input
                    type="number"
                    required
                    value={invForm.rate}
                    onChange={(e) => setInvForm({ ...invForm, rate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GST Tax Rate</label>
                  <select
                    value={invForm.tax_rate}
                    onChange={(e) => setInvForm({ ...invForm, tax_rate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="18">18% (Standard Services)</option>
                    <option value="12">12% (Goods / IT Hardware)</option>
                    <option value="5">5% (Essential)</option>
                    <option value="28">28% (Luxury)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-xs"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
