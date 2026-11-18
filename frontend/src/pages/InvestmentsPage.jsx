import React, { useState, useEffect } from 'react';
import api from '../services/api';
import MetricCard from '../components/common/MetricCard';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import { 
  TrendingUp, 
  Coins, 
  Landmark, 
  PieChart as PieIcon, 
  Calculator, 
  BookOpen, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const ASSET_COLORS = ['#5146E5', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6'];

export default function InvestmentsPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  // SIP Calculator State
  const [sipMonthly, setSipMonthly] = useState(10000);
  const [sipCagr, setSipCagr] = useState(12.5);
  const [sipYears, setSipYears] = useState(10);
  const [sipResult, setSipResult] = useState(null);

  // FD Calculator State
  const [fdPrincipal, setFdPrincipal] = useState(100000);
  const [fdRate, setFdRate] = useState(7.25);
  const [fdYears, setFdYears] = useState(3);
  const [fdResult, setFdResult] = useState(null);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const res = await api.get('/investments/portfolio');
      if (res.data.portfolios && res.data.portfolios.length > 0) {
        setPortfolio(res.data.portfolios[0]);
      }
    } catch (err) {
      console.error("Portfolio fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSip = async () => {
    try {
      const res = await api.post('/investments/sip', {
        monthly_investment: parseFloat(sipMonthly),
        expected_cagr: parseFloat(sipCagr),
        tenure_years: parseInt(sipYears)
      });
      setSipResult(res.data.calculation);
    } catch (err) {
      console.error("SIP calc error:", err);
    }
  };

  const calculateFd = async () => {
    try {
      const res = await api.post('/investments/fd', {
        principal: parseFloat(fdPrincipal),
        annual_rate: parseFloat(fdRate),
        tenure_years: parseFloat(fdYears)
      });
      setFdResult(res.data.calculation);
    } catch (err) {
      console.error("FD calc error:", err);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  useEffect(() => {
    calculateSip();
  }, [sipMonthly, sipCagr, sipYears]);

  useEffect(() => {
    calculateFd();
  }, [fdPrincipal, fdRate, fdYears]);

  if (loading && !portfolio) {
    return <LoadingSkeleton count={3} height="h-32" />;
  }

  const assets = portfolio?.assets || [];
  const pieData = assets.map(a => ({
    name: a.asset_name,
    value: a.current_market_value
  }));

  const totalInvested = portfolio?.total_invested || 0;
  const currentValue = portfolio?.current_value || totalInvested;
  const wealthGain = currentValue - totalInvested;
  const roiPct = totalInvested > 0 ? ((wealthGain / totalInvested) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Investment Intelligence & Compounding</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Multi-asset allocation tracking, compounding simulations, and educational risk guidance
        </p>
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Capital Invested"
          value={`₹${totalInvested.toLocaleString('en-IN')}`}
          subtitle="Cumulative deposit"
          icon={Coins}
          color="slate"
        />
        <MetricCard
          title="Portfolio Valuation"
          value={`₹${currentValue.toLocaleString('en-IN')}`}
          subtitle="Estimated market value"
          icon={Landmark}
          color="indigo"
        />
        <MetricCard
          title="Unrealized Wealth Gain"
          value={`+₹${wealthGain.toLocaleString('en-IN')}`}
          subtitle="Capital appreciation"
          icon={TrendingUp}
          color="emerald"
        />
        <MetricCard
          title="Overall Return (ROI)"
          value={`${roiPct}%`}
          subtitle={`Risk: ${portfolio?.risk_level || 'Moderate'}`}
          icon={PieIcon}
          color="cyan"
        />
      </div>

      {/* Holdings & Asset Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Portfolio Holdings</h3>
              <p className="text-xs text-slate-500">Asset breakdown & historical benchmark CAGR</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-600">
              {assets.length} Active Holdings
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Asset</th>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3 text-right">Invested</th>
                  <th className="py-2.5 px-3 text-right">Current Value</th>
                  <th className="py-2.5 px-3 text-right">Target CAGR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.map((a, i) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-semibold text-slate-800">{a.asset_name}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {a.asset_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">₹{a.invested_amount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600">₹{a.current_market_value.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-right font-semibold text-indigo-600">{a.expected_cagr}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Donut Allocation */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Asset Allocation</h3>
          <p className="text-xs text-slate-500 mb-2">Weightage distribution</p>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ASSET_COLORS[index % ASSET_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Valuation']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-auto pt-2 border-t border-slate-100 text-xs">
            {assets.map((a, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ASSET_COLORS[i % ASSET_COLORS.length] }}></span>
                  {a.asset_name}
                </span>
                <span className="font-semibold text-slate-800">
                  {currentValue > 0 ? ((a.current_market_value / currentValue) * 100).toFixed(0) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Compounding Calculators (SIP & Fixed Deposit) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SIP Calculator */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-600" />
              SIP Future Value Calculator
            </h3>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">
              Monthly Compounding
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700">Monthly Contribution</span>
                <span className="text-indigo-600 font-bold">₹{Number(sipMonthly).toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="100000"
                step="500"
                value={sipMonthly}
                onChange={(e) => setSipMonthly(e.target.value)}
                className="w-full h-1.5 bg-slate-200 rounded-lg accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700">Expected Annual Return (CAGR)</span>
                <span className="text-indigo-600 font-bold">{sipCagr}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                step="0.5"
                value={sipCagr}
                onChange={(e) => setSipCagr(e.target.value)}
                className="w-full h-1.5 bg-slate-200 rounded-lg accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700">Time Horizon</span>
                <span className="text-indigo-600 font-bold">{sipYears} Years</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={sipYears}
                onChange={(e) => setSipYears(e.target.value)}
                className="w-full h-1.5 bg-slate-200 rounded-lg accent-indigo-600"
              />
            </div>
          </div>

          {sipResult && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500">Total Invested:</span>
                <p className="font-bold text-slate-800 text-sm">₹{sipResult.total_invested.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-slate-500">Estimated Wealth:</span>
                <p className="font-bold text-indigo-600 text-sm">₹{sipResult.maturity_value.toLocaleString('en-IN')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Deposit Calculator */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-600" />
              Fixed Deposit (FD) Calculator
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">
              Quarterly Compounding
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700">Deposit Principal</span>
                <span className="text-emerald-700 font-bold">₹{Number(fdPrincipal).toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="2000000"
                step="10000"
                value={fdPrincipal}
                onChange={(e) => setFdPrincipal(e.target.value)}
                className="w-full h-1.5 bg-slate-200 rounded-lg accent-emerald-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700">Bank Interest Rate</span>
                <span className="text-emerald-700 font-bold">{fdRate}%</span>
              </div>
              <input
                type="range"
                min="4"
                max="10"
                step="0.25"
                value={fdRate}
                onChange={(e) => setFdRate(e.target.value)}
                className="w-full h-1.5 bg-slate-200 rounded-lg accent-emerald-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700">Tenure</span>
                <span className="text-emerald-700 font-bold">{fdYears} Years</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={fdYears}
                onChange={(e) => setFdYears(e.target.value)}
                className="w-full h-1.5 bg-slate-200 rounded-lg accent-emerald-600"
              />
            </div>
          </div>

          {fdResult && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500">Interest Earned:</span>
                <p className="font-bold text-slate-800 text-sm">₹{fdResult.interest_earned.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-slate-500">Maturity Value:</span>
                <p className="font-bold text-emerald-600 text-sm">₹{fdResult.maturity_amount.toLocaleString('en-IN')}</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Educational Note */}
      <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <BookOpen className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="font-bold text-slate-800">Educational Notice:</span> FINWISE AI does not execute real securities transactions or provide guaranteed investment tips. All compounding projections use standard financial formulas to illustrate the power of disciplined asset allocation.
        </p>
      </div>
    </div>
  );
}
