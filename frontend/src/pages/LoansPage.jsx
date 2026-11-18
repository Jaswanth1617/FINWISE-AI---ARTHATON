import React, { useState, useEffect } from 'react';
import api from '../services/api';
import MetricCard from '../components/common/MetricCard';
import { 
  Calculator, 
  Layers, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  PieChart as PieIcon,
  ShieldCheck,
  TrendingDown
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export default function LoansPage() {
  const [principal, setPrincipal] = useState(1000000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenureYears, setTenureYears] = useState(15);
  const [loanType, setLoanType] = useState('Home Loan');
  const [extraPayment, setExtraPayment] = useState(2000);
  
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creditGuidance, setCreditGuidance] = useState(null);

  const calculateLoan = async () => {
    try {
      setLoading(true);
      const res = await api.post('/loans/calculate-emi', {
        principal: parseFloat(principal),
        interest_rate: parseFloat(interestRate),
        tenure_months: parseInt(tenureYears * 12),
        loan_type: loanType,
        extra_monthly_payment: parseFloat(extraPayment || 0)
      });
      setCalculation(res.data.calculation);
      setCreditGuidance(res.data.credit_score_guidance);
    } catch (err) {
      console.error("Loan calculation error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateLoan();
  }, [principal, interestRate, tenureYears, extraPayment, loanType]);

  const summary = calculation?.summary || {
    monthly_emi: 0,
    total_interest: 0,
    total_payment: 0
  };

  const pieData = [
    { name: 'Principal Loan Amount', value: parseFloat(principal), color: '#5146E5' },
    { name: 'Total Interest Payable', value: summary.total_interest, color: '#F59E0B' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Loan & EMI Planning Assistant</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Mathematical reducing-balance amortization schedules and prepayment savings analysis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input Parameters Form Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-slate-900">Loan Parameters</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Loan Category</label>
            <select
              value={loanType}
              onChange={(e) => setLoanType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50"
            >
              <option value="Home Loan">Home Loan (Secured)</option>
              <option value="Personal Loan">Personal Loan (Unsecured)</option>
              <option value="Education Loan">Education Loan</option>
              <option value="Auto / Vehicle Loan">Auto / Vehicle Loan</option>
              <option value="Business Expansion Loan">Business Expansion Loan</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-700">Principal Amount</span>
              <span className="text-indigo-600 font-bold">₹{Number(principal).toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="50000"
              max="15000000"
              step="50000"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-700">Annual Interest Rate</span>
              <span className="text-indigo-600 font-bold">{interestRate}%</span>
            </div>
            <input
              type="range"
              min="5.0"
              max="24.0"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-700">Tenure (Years)</span>
              <span className="text-indigo-600 font-bold">{tenureYears} Years ({tenureYears * 12} Mo)</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={tenureYears}
              onChange={(e) => setTenureYears(e.target.value)}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Prepayment Accelerator Input */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Extra Monthly Prepayment (₹)
            </label>
            <input
              type="number"
              step="500"
              value={extraPayment}
              onChange={(e) => setExtraPayment(e.target.value)}
              placeholder="e.g. 2000"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50"
            />
            <p className="text-[11px] text-slate-400 mt-1">See interest and tenure saved below</p>
          </div>
        </div>

        {/* Results Card & Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              title="Calculated Monthly EMI"
              value={`₹${summary.monthly_emi.toLocaleString('en-IN')}`}
              subtitle="Reducing balance monthly"
              icon={Calculator}
              color="indigo"
            />
            <MetricCard
              title="Total Interest Payable"
              value={`₹${summary.total_interest.toLocaleString('en-IN')}`}
              subtitle="Over total loan lifecycle"
              icon={TrendingDown}
              color="amber"
            />
            <MetricCard
              title="Total Repayment"
              value={`₹${summary.total_payment.toLocaleString('en-IN')}`}
              subtitle="Principal + Interest"
              icon={CheckCircle2}
              color="slate"
            />
          </div>

          {/* Prepayment Impact Box */}
          {parseFloat(extraPayment) > 0 && calculation && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-xs">
              <div>
                <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Prepayment Accelerator Impact
                </h4>
                <p className="text-emerald-800 mt-0.5">
                  Paying an extra ₹{Number(extraPayment).toLocaleString('en-IN')}/mo closes your loan{' '}
                  <span className="font-bold">{calculation.months_saved} months earlier</span> and saves you{' '}
                  <span className="font-bold">₹{calculation.interest_saved.toLocaleString('en-IN')} in interest</span>!
                </p>
              </div>
            </div>
          )}

          {/* Principal vs Interest Pie Chart Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3 flex-1 text-xs">
              <h4 className="font-bold text-slate-800">Total Outlay Composition</h4>
              <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/50 border border-indigo-100">
                <span className="flex items-center gap-2 text-indigo-900 font-medium">
                  <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
                  Principal Amount:
                </span>
                <span className="font-bold text-indigo-950">₹{Number(principal).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-100">
                <span className="flex items-center gap-2 text-amber-900 font-medium">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  Total Interest:
                </span>
                <span className="font-bold text-amber-950">₹{summary.total_interest.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Credit Guidance & Educational Disclaimers */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Credit Score & Underwriting Principles
            </h4>
            <p>• {creditGuidance?.repayment_discipline}</p>
            <p>• {creditGuidance?.utilization_ratio}</p>
            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-200">
              * {creditGuidance?.disclaimer}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
