import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Database, 
  Search, 
  Filter, 
  ArrowRight, 
  Download, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  FileText, 
  Layers, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Activity,
  X,
  CreditCard,
  ShieldCheck
} from 'lucide-react';

export default function DatasetsPage() {
  const [activeTab, setActiveTab] = useState('smishing'); // 'smishing' | 'scam_features' | 'financial'
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Tab 1: Smishing dataset state
  const [smishingData, setSmishingData] = useState({ records: [], total: 0, page: 1, total_pages: 1 });
  const [smishingLoading, setSmishingLoading] = useState(false);
  const [smishingFilter, setSmishingFilter] = useState('all'); // 'all' | 'smishing' | 'legit'
  const [smishingSearch, setSmishingSearch] = useState('');
  const [smishingPage, setSmishingPage] = useState(1);

  // Tab 2: Scam features dataset state
  const [scamData, setScamData] = useState({ records: [], total: 0, page: 1, total_pages: 1 });
  const [scamLoading, setScamLoading] = useState(false);
  const [scamFilter, setScamFilter] = useState('all');
  const [scamSearch, setScamSearch] = useState('');
  const [scamPage, setScamPage] = useState(1);

  // Tab 3: Financial statement dataset state
  const [financialData, setFinancialData] = useState({ records: [], total: 0, page: 1, total_pages: 1 });
  const [financialLoading, setFinancialLoading] = useState(false);
  const [financialSearch, setFinancialSearch] = useState('');
  const [financialPage, setFinancialPage] = useState(1);
  const [loadingToLedger, setLoadingToLedger] = useState(false);
  const [ledgerMessage, setLedgerMessage] = useState('');

  // Live Test Modal State
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testingRecord, setTestingRecord] = useState(null);
  const [testingLoading, setTestingLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'smishing') {
      fetchSmishingRecords(smishingPage, smishingFilter, smishingSearch);
    } else if (activeTab === 'scam_features') {
      fetchScamRecords(scamPage, scamFilter, scamSearch);
    } else if (activeTab === 'financial') {
      fetchFinancialRecords(financialPage, financialSearch);
    }
  }, [activeTab, smishingPage, smishingFilter, scamPage, scamFilter, financialPage]);

  const fetchOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await api.get('/datasets/overview');
      if (res.data?.overview) {
        setOverview(res.data.overview);
      }
    } catch (err) {
      console.warn("Could not load datasets overview:", err);
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchSmishingRecords = async (page = 1, label = 'all', search = '') => {
    setSmishingLoading(true);
    try {
      const res = await api.get('/datasets/smishing', {
        params: { page, per_page: 15, label, search }
      });
      setSmishingData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSmishingLoading(false);
    }
  };

  const fetchScamRecords = async (page = 1, label = 'all', search = '') => {
    setScamLoading(true);
    try {
      const res = await api.get('/datasets/scam-features', {
        params: { page, per_page: 15, label, search }
      });
      setScamData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setScamLoading(false);
    }
  };

  const fetchFinancialRecords = async (page = 1, search = '') => {
    setFinancialLoading(true);
    try {
      const res = await api.get('/datasets/financial', {
        params: { page, per_page: 15, search }
      });
      setFinancialData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setFinancialLoading(false);
    }
  };

  const handleTestMessage = async (messageText) => {
    setTestingRecord(messageText);
    setTestingLoading(true);
    setTestResult(null);
    setTestModalOpen(true);

    try {
      const res = await api.post('/datasets/test-message', { message: messageText });
      setTestResult(res.data.result);
    } catch (err) {
      alert("Error testing message: " + (err.response?.data?.message || err.message));
    } finally {
      setTestingLoading(false);
    }
  };

  const handleLoadToLedger = async () => {
    setLoadingToLedger(true);
    setLedgerMessage('');
    try {
      const res = await api.post('/financial/load-sample', {
        sample_id: 'synthetic_12_month_statement.csv',
        limit: 250
      });
      setLedgerMessage(res.data.message || 'Successfully loaded 250 records into your active ledger.');
    } catch (err) {
      setLedgerMessage('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingToLedger(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1.5">
            <Database className="w-3 h-3 text-indigo-600" />
            Integrated Open-Source & Academic Research Datasets
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Research Datasets & Benchmark Explorer</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Direct access to the 84,863 SMS Smishing Corpus, INFO-4360 Scam Features, and 12-Month Indian Banking Statement.
        </p>
      </div>

      {/* Top Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Smishing SMS Corpus</span>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              84,863 Total
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {overview?.smishing_dataset?.total_records?.toLocaleString() || '84,863'}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Smishing: <strong className="text-rose-600">{overview?.smishing_dataset?.smishing_records?.toLocaleString() || '24,086'}</strong></span>
            <span>Legitimate: <strong className="text-emerald-600">{overview?.smishing_dataset?.legitimate_records?.toLocaleString() || '60,777'}</strong></span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scam Text Features</span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              INFO-4360
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {overview?.scam_features_dataset?.total_records?.toLocaleString() || '5,971'}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Flagged: <strong className="text-amber-600">{overview?.scam_features_dataset?.flagged_records?.toLocaleString() || '1,127'}</strong></span>
            <span>Benign: <strong className="text-slate-600">{overview?.scam_features_dataset?.benign_records?.toLocaleString() || '4,844'}</strong></span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">12-Month Banking Data</span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              UPI & BBPS
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {overview?.financial_dataset?.total_records?.toLocaleString() || '2,393'}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Span: <strong className="text-slate-700">12 Full Months</strong></span>
            <span>Ledger: <strong className="text-indigo-600">Reconciled</strong></span>
          </div>
        </div>
      </div>

      {/* Dataset Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1">
        <button
          onClick={() => setActiveTab('smishing')}
          className={`flex items-center gap-2 py-3 px-5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'smishing'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Smishing Corpus (84,863 SMS)
        </button>
        <button
          onClick={() => setActiveTab('scam_features')}
          className={`flex items-center gap-2 py-3 px-5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'scam_features'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          Scam Text Features (5,971 Vectors)
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={`flex items-center gap-2 py-3 px-5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'financial'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          12-Month Banking Transactions (2,393 Txns)
        </button>
      </div>

      {/* TAB 1: SMISHING CORPUS EXPLORER */}
      {activeTab === 'smishing' && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Smishing Research Dataset Explorer (shaghayegh-hp/Smishing_Dataset)
              </h3>
              <p className="text-xs text-slate-500">
                Browse labeled messages. Click "Test with AI Threat Engine" on any row to extract signal features and verify risk.
              </p>
            </div>
            <a
              href="/api/datasets/download/smishing"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Download Raw CSV (8.75 MB)
            </a>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search across 84,863 messages (e.g. account, blocked, refund, prize, verify)..."
                value={smishingSearch}
                onChange={(e) => setSmishingSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setSmishingPage(1); fetchSmishingRecords(1, smishingFilter, smishingSearch); } }}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => { setSmishingPage(1); fetchSmishingRecords(1, smishingFilter, smishingSearch); }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Search
            </button>
            <div className="flex items-center gap-1.5">
              {['all', 'smishing', 'legit'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setSmishingFilter(opt); setSmishingPage(1); }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    smishingFilter === opt
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt === 'all' ? 'All Records' : opt === 'smishing' ? 'Smishing Only' : 'Legitimate Only'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 w-16">#</th>
                  <th className="py-2.5 px-4">Message Content</th>
                  <th className="py-2.5 px-4 w-32">Ground Truth</th>
                  <th className="py-2.5 px-4 w-28">Spam Flag</th>
                  <th className="py-2.5 px-4 w-40 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {smishingLoading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      Querying smishing corpus...
                    </td>
                  </tr>
                ) : smishingData.records.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  smishingData.records.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                        {(smishingPage - 1) * 15 + i + 1}
                      </td>
                      <td className="py-2.5 px-4 text-slate-800 font-sans max-w-lg leading-relaxed">
                        {r.message}
                      </td>
                      <td className="py-2.5 px-4">
                        {r.is_smishing === 1 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            SMISHING
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            LEGITIMATE
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                        {r.spam_label || '0'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleTestMessage(r.message)}
                          className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-600 rounded text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          Test AI Scan
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>
              Showing {smishingData.records.length} of {smishingData.total.toLocaleString()} records (Page {smishingPage} of {smishingData.total_pages})
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={smishingPage <= 1 || smishingLoading}
                onClick={() => setSmishingPage(p => Math.max(1, p - 1))}
                className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-700 px-1">{smishingPage}</span>
              <button
                disabled={smishingPage >= smishingData.total_pages || smishingLoading}
                onClick={() => setSmishingPage(p => p + 1)}
                className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCAM TEXT FEATURES (INFO-4360) */}
      {activeTab === 'scam_features' && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Scam Text Signal Features Corpus (INFO-4360-Project)
              </h3>
              <p className="text-xs text-slate-500">
                5,971 SMS records annotated with lexical signals (URL flag, Email flag, Phone number call-out).
              </p>
            </div>
            <a
              href="/api/datasets/download/scam_features"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV (595 KB)
            </a>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search across 5,971 messages..."
                value={scamSearch}
                onChange={(e) => setScamSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setScamPage(1); fetchScamRecords(1, scamFilter, scamSearch); } }}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => { setScamPage(1); fetchScamRecords(1, scamFilter, scamSearch); }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Search
            </button>
            <div className="flex items-center gap-1.5">
              {['all', 'smishing', 'legit'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setScamFilter(opt); setScamPage(1); }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    scamFilter === opt
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt === 'all' ? 'All' : opt === 'smishing' ? 'Scam / Spam' : 'Ham (Benign)'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 w-16">#</th>
                  <th className="py-2.5 px-4">Message Text</th>
                  <th className="py-2.5 px-4 w-28">Label</th>
                  <th className="py-2.5 px-4 w-24">Has URL</th>
                  <th className="py-2.5 px-4 w-24">Has Phone</th>
                  <th className="py-2.5 px-4 w-36 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scamLoading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      Loading records...
                    </td>
                  </tr>
                ) : scamData.records.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  scamData.records.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                        {(scamPage - 1) * 15 + i + 1}
                      </td>
                      <td className="py-2.5 px-4 text-slate-800 font-sans max-w-lg leading-relaxed">
                        {r.text}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          r.is_smishing === 1
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {r.label.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold">
                        <span className={r.has_url_label?.toLowerCase() === 'yes' ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                          {r.has_url_label}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold">
                        <span className={r.has_phone_label?.toLowerCase() === 'yes' ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                          {r.has_phone_label}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleTestMessage(r.text)}
                          className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-600 rounded text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          Test AI Scan
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>
              Showing {scamData.records.length} of {scamData.total.toLocaleString()} records (Page {scamPage} of {scamData.total_pages})
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={scamPage <= 1 || scamLoading}
                onClick={() => setScamPage(p => Math.max(1, p - 1))}
                className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-700 px-1">{scamPage}</span>
              <button
                disabled={scamPage >= scamData.total_pages || scamLoading}
                onClick={() => setScamPage(p => p + 1)}
                className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 12-MONTH BANK STATEMENT (personal-finance-intelligence) */}
      {activeTab === 'financial' && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                12-Month Indian Bank Statement Corpus (personal-finance-intelligence)
              </h3>
              <p className="text-xs text-slate-500">
                2,393 authentic transactions with UPI, Blinkit, Zepto, D-Mart, Swiggy, Netflix, Bescom, Rent & Groww SIP.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleLoadToLedger}
                disabled={loadingToLedger}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                {loadingToLedger ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Reconciling...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5" />
                    Load 250 Records into My Ledger
                  </>
                )}
              </button>
              <a
                href="/api/datasets/download/financial"
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download CSV
              </a>
            </div>
          </div>

          {ledgerMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between">
              <span>{ledgerMessage}</span>
              <a href="/transactions" className="font-bold underline text-emerald-900 ml-2">View in Ledger</a>
            </div>
          )}

          {/* Search Bar */}
          <div className="flex gap-3 pt-1">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by merchant or narration (e.g. Swiggy, Blinkit, D-Mart, Bescom, Rent)..."
                value={financialSearch}
                onChange={(e) => setFinancialSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setFinancialPage(1); fetchFinancialRecords(1, financialSearch); } }}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => { setFinancialPage(1); fetchFinancialRecords(1, financialSearch); }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Search
            </button>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 w-16">#</th>
                  <th className="py-2.5 px-4 w-28">Date</th>
                  <th className="py-2.5 px-4">Narration / Description</th>
                  <th className="py-2.5 px-4 w-28 text-right">Debit (₹)</th>
                  <th className="py-2.5 px-4 w-28 text-right">Credit (₹)</th>
                  <th className="py-2.5 px-4 w-32 text-right">Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {financialLoading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      Loading financial records...
                    </td>
                  </tr>
                ) : financialData.records.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  financialData.records.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                        {(financialPage - 1) * 15 + i + 1}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">
                        {r.date}
                      </td>
                      <td className="py-2.5 px-4 text-slate-900 font-medium">
                        {r.description}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-rose-600">
                        {r.debit ? `₹${r.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-emerald-600">
                        {r.credit ? `₹${r.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                        {r.balance ? `₹${r.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>
              Showing {financialData.records.length} of {financialData.total.toLocaleString()} transactions (Page {financialPage} of {financialData.total_pages})
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={financialPage <= 1 || financialLoading}
                onClick={() => setFinancialPage(p => Math.max(1, p - 1))}
                className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-700 px-1">{financialPage}</span>
              <button
                disabled={financialPage >= financialData.total_pages || financialLoading}
                onClick={() => setFinancialPage(p => p + 1)}
                className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live AI Test Modal */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">Dataset Item AI Threat Evaluation</h3>
              </div>
              <button
                onClick={() => setTestModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Message Preview */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Dataset Message Evaluated
              </span>
              <p className="text-slate-800 font-sans leading-relaxed">"{testingRecord}"</p>
            </div>

            {testingLoading ? (
              <div className="py-8 text-center text-slate-500 space-y-2">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-semibold">Running Signal Feature Extraction & Groq Scoring...</p>
              </div>
            ) : testResult ? (
              <div className="space-y-4">
                {/* Risk Score */}
                <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  testResult.risk_category === 'Critical' || testResult.risk_category === 'High'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : testResult.risk_category === 'Medium'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Computed Risk</span>
                    <h4 className="text-xl font-black">{testResult.risk_category} Risk</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold">{testResult.risk_score}</span>
                    <span className="text-xs font-semibold opacity-75">/100</span>
                  </div>
                </div>

                {/* Signal Features (INFO-4360) */}
                {testResult.signal_features && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <h5 className="font-bold text-slate-800 text-[11px] mb-2 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-indigo-600" />
                      Extracted Scam Signal Features
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">Capitalization</span>
                        <strong className="text-slate-900">{testResult.signal_features.caps_pct ?? 0}%</strong>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">Digit Count</span>
                        <strong className="text-slate-900">{testResult.signal_features.digits_count ?? 0}</strong>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">Contains URL</span>
                        <strong className={testResult.signal_features.has_url ? 'text-rose-600' : 'text-slate-700'}>
                          {testResult.signal_features.has_url ? 'YES' : 'NO'}
                        </strong>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">Contains Phone</span>
                        <strong className={testResult.signal_features.has_phone ? 'text-amber-600' : 'text-slate-700'}>
                          {testResult.signal_features.has_phone ? 'YES' : 'NO'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Indicators */}
                <div>
                  <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">Detected Threat Indicators</h5>
                  <ul className="space-y-1">
                    {testResult.indicators?.map((ind, i) => (
                      <li key={i} className="text-xs text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                        {ind}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* AI Explanation */}
                <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-xs">
                  <h5 className="font-bold text-indigo-950 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    AI Intelligence Explanation
                  </h5>
                  <p className="text-indigo-900 leading-relaxed">{testResult.explanation}</p>
                </div>
              </div>
            ) : null}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setTestModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Close Evaluation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
