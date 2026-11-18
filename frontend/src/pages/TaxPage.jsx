import React, { useState, useEffect } from 'react';
import api from '../services/api';
import MetricCard from '../components/common/MetricCard';
import { 
  FileSpreadsheet, 
  HelpCircle, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  ShieldAlert,
  Percent,
  TrendingDown,
  Info
} from 'lucide-react';

export default function TaxPage() {
  const [income, setIncome] = useState(1200000);
  const [ded80c, setDed80c] = useState(150000);
  const [ded80d, setDed80d] = useState(25000);
  const [hra, setHra] = useState(0);
  const [otherDed, setOtherDed] = useState(0);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Chatbot question
  const [taxQuery, setTaxQuery] = useState('');
  const [taxAnswer, setTaxAnswer] = useState('');
  const [askingAi, setAskingAi] = useState(false);

  const calculateTax = async () => {
    try {
      setLoading(true);
      const res = await api.post('/tax/calculate', {
        annual_income: parseFloat(income || 0),
        deduction_80c: parseFloat(ded80c || 0),
        deduction_80d: parseFloat(ded80d || 0),
        hra_exemption: parseFloat(hra || 0),
        other_deductions: parseFloat(otherDed || 0)
      });
      setResult(res.data.result);
    } catch (err) {
      console.error("Tax calc error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAskTaxAi = async (e) => {
    e.preventDefault();
    if (!taxQuery.trim()) return;
    try {
      setAskingAi(true);
      const res = await api.post('/tax/explain', { query: taxQuery });
      setTaxAnswer(res.data.response);
    } catch (err) {
      console.error("Tax query error:", err);
    } finally {
      setAskingAi(false);
    }
  };

  useEffect(() => {
    calculateTax();
  }, [income, ded80c, ded80d, hra, otherDed]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Income Tax Intelligence (India)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            FY 2024-25 (AY 2025-26) Statutory Slab Modeling & Regime Comparison
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
          Finance Act 2024 Ready
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Income & Deductions Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Income & Declarations</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Gross Annual Income (CTC)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₹</span>
              <input
                type="number"
                step="25000"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-slate-50/50"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Chapter VI-A Deductions (Old Regime)</h4>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Section 80C (PPF, EPF, ELSS, Life Ins) [Max ₹1.5L]
              </label>
              <input
                type="number"
                value={ded80c}
                onChange={(e) => setDed80c(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Section 80D (Health Insurance Premium) [Max ₹50k]
              </label>
              <input
                type="number"
                value={ded80d}
                onChange={(e) => setDed80d(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                HRA Exemption (House Rent Allowance)
              </label>
              <input
                type="number"
                value={hra}
                onChange={(e) => setHra(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Other Eligible Exemptions (NPS 80CCD(1B), 80TTA)
              </label>
              <input
                type="number"
                value={otherDed}
                onChange={(e) => setOtherDed(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Comparison Output & Slabs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Regime Winner Announcement Card */}
          {result && (
            <div className={`p-5 rounded-xl border flex items-center justify-between ${
              result.recommended_regime === 'New Regime'
                ? 'bg-gradient-to-r from-cyan-50 to-indigo-50 border-cyan-200 text-slate-900'
                : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-slate-900'
            }`}>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Automated Regime Recommendation</span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  Choose {result.recommended_regime}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {result.tax_savings > 0 ? (
                    <>You save <span className="font-bold text-emerald-700">₹{result.tax_savings.toLocaleString('en-IN')}</span> in statutory tax liability by adopting the {result.recommended_regime}.</>
                  ) : (
                    <>Both tax regimes result in equivalent tax liability for your income bracket.</>
                  )}
                </p>
              </div>
              <div className="p-3 rounded-full bg-white shadow-xs shrink-0">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          )}

          {/* Comparison Side-by-Side Cards */}
          {result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* New Regime Card */}
              <div className={`p-5 rounded-xl border transition-all ${
                result.recommended_regime === 'New Regime'
                  ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 text-sm">New Tax Regime</h4>
                  {result.recommended_regime === 'New Regime' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                      Recommended
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Standard Deduction:</span>
                    <span className="font-semibold text-slate-700">₹75,000</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Taxable Income:</span>
                    <span className="font-semibold text-slate-800">₹{result.new_regime.taxable_income.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Section 87A Rebate:</span>
                    <span className="font-semibold text-emerald-600">-₹{result.new_regime.rebate_87a.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Health & Edu Cess (4%):</span>
                    <span className="font-semibold text-slate-700">₹{result.new_regime.health_education_cess.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-sm font-bold text-slate-900">
                    <span>Total Tax Payable:</span>
                    <span className="text-indigo-600">₹{result.new_regime.total_tax.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Old Regime Card */}
              <div className={`p-5 rounded-xl border transition-all ${
                result.recommended_regime === 'Old Regime'
                  ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 text-sm">Old Tax Regime</h4>
                  {result.recommended_regime === 'Old Regime' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                      Recommended
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Total Deductions Claimed:</span>
                    <span className="font-semibold text-slate-700">₹{result.old_regime.total_deductions.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Taxable Income:</span>
                    <span className="font-semibold text-slate-800">₹{result.old_regime.taxable_income.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Section 87A Rebate:</span>
                    <span className="font-semibold text-emerald-600">-₹{result.old_regime.rebate_87a.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Health & Edu Cess (4%):</span>
                    <span className="font-semibold text-slate-700">₹{result.old_regime.health_education_cess.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-sm font-bold text-slate-900">
                    <span>Total Tax Payable:</span>
                    <span className="text-slate-900">₹{result.old_regime.total_tax.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Tax AI Chatbot Assistant */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Ask FINWISE Tax AI
            </h4>
            <form onSubmit={handleAskTaxAi} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Can I claim both HRA and home loan tax benefits together?"
                value={taxQuery}
                onChange={(e) => setTaxQuery(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50"
              />
              <button
                type="submit"
                disabled={askingAi || !taxQuery.trim()}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-2xs"
              >
                {askingAi ? 'Consulting...' : 'Ask AI'}
              </button>
            </form>
            {taxAnswer && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
                {taxAnswer}
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Statutory calculation is an informational model under Finance Act 2024. Always consult a licensed Chartered Accountant (CA) for official income tax return (ITR) filing.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
