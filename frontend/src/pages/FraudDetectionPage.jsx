import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  ShieldAlert, 
  MessageSquareWarning, 
  Globe, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck,
  AlertOctagon,
  Copy,
  Info,
  Database,
  Search,
  Hash,
  ExternalLink,
  PhoneCall,
  Activity,
  Layers
} from 'lucide-react';

export default function FraudDetectionPage() {
  const [activeTab, setActiveTab] = useState('message'); // 'message' | 'url'
  
  // Message Form State
  const [messageInput, setMessageInput] = useState('');
  const [messageSender, setMessageSender] = useState('');
  const [analyzingMessage, setAnalyzingMessage] = useState(false);
  const [messageResult, setMessageResult] = useState(null);

  // URL Form State
  const [urlInput, setUrlInput] = useState('');
  const [analyzingUrl, setAnalyzingUrl] = useState(false);
  const [urlResult, setUrlResult] = useState(null);

  // Research Benchmark Dataset State
  const [benchmarkSamples, setBenchmarkSamples] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loadingBenchmarks, setLoadingBenchmarks] = useState(false);

  useEffect(() => {
    fetchBenchmarkSamples();
  }, []);

  const fetchBenchmarkSamples = async () => {
    setLoadingBenchmarks(true);
    try {
      const res = await api.get('/fraud/benchmark-samples');
      if (res.data?.samples) {
        setBenchmarkSamples(res.data.samples);
      }
    } catch (err) {
      console.warn("Could not load smishing benchmark samples:", err);
    } finally {
      setLoadingBenchmarks(false);
    }
  };

  const handleMessageScan = async (e, customMsg, customSender) => {
    if (e) e.preventDefault();
    const textToScan = (customMsg !== undefined ? customMsg : messageInput).trim();
    const senderToScan = (customSender !== undefined ? customSender : messageSender).trim();

    if (!textToScan) return;

    setAnalyzingMessage(true);
    setMessageResult(null);

    try {
      const res = await api.post('/fraud/analyse-message', {
        message: textToScan,
        sender: senderToScan || 'SMS'
      });
      setMessageResult(res.data.result);
    } catch (err) {
      alert("Error scanning message: " + (err.response?.data?.message || err.message));
    } finally {
      setAnalyzingMessage(false);
    }
  };

  const handleUrlScan = async (e) => {
    e?.preventDefault();
    if (!urlInput.trim()) return;

    setAnalyzingUrl(true);
    setUrlResult(null);

    try {
      const res = await api.post('/fraud/analyse-url', {
        url: urlInput.trim()
      });
      setUrlResult(res.data.result);
    } catch (err) {
      alert("Error inspecting URL: " + (err.response?.data?.message || err.message));
    } finally {
      setAnalyzingUrl(false);
    }
  };

  const loadBenchmarkSample = (sample, autoScan = false) => {
    setMessageSender(sample.sender);
    setMessageInput(sample.text);
    if (autoScan) {
      handleMessageScan(null, sample.text, sample.sender);
    }
  };

  // Demo URL Setters
  const loadSpoofedUrlSample = () => {
    setUrlInput('http://hdfc-bank-netbanking-verify.xyz/auth');
  };

  const loadRawIpUrlSample = () => {
    setUrlInput('http://192.168.1.1/sbi-netbanking-login');
  };

  const loadUrlShortenerSample = () => {
    setUrlInput('http://bit.ly/gpay-cash-reward');
  };

  const categories = ['All', ...new Set(benchmarkSamples.map(s => s.category))];
  const filteredSamples = selectedCategory === 'All' 
    ? benchmarkSamples 
    : benchmarkSamples.filter(s => s.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1.5">
            <Database className="w-3 h-3 text-indigo-600" />
            Smishing Research Dataset & Signal Feature Heuristics
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Fraud & Threat Detection Centre</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Multi-layer defense: Scikit-learn signal feature extraction (INFO-4360), deterministic threat rules, and Groq LLM explainability.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('message')}
          className={`flex items-center gap-2 py-3 px-5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'message'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquareWarning className="w-4 h-4" />
          Phishing SMS & Message Scanner
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={`flex items-center gap-2 py-3 px-5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'url'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          Malicious URL & Domain Inspector
        </button>
      </div>

      {/* TAB 1: SUSPICIOUS MESSAGE SCANNER */}
      {activeTab === 'message' && (
        <div className="space-y-6">
          {/* Research Smishing Dataset Explorer */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  Smishing Benchmark Corpus (84,863 SMS Dataset & Indian Banking Vectors)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any authentic research benchmark sample to load and test signal feature extraction in 1-click.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Benchmark Samples Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {filteredSamples.map((sample, idx) => (
                <div
                  key={idx}
                  onClick={() => loadBenchmarkSample(sample, true)}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group text-left flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 truncate">
                        {sample.sender}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {sample.category}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1">
                      {sample.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      "{sample.text}"
                    </p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold text-indigo-600">
                    <span>1-Click Test</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form & Result Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Form (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Scan Custom Message</h3>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  SMS / UPI / WhatsApp
                </span>
              </div>

              <form onSubmit={handleMessageScan} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sender Identifier (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. AX-SBIINB-ALERT, PHONEPE-REWARD, VM-HDFCBK"
                    value={messageSender}
                    onChange={(e) => setMessageSender(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Message Body</label>
                  <textarea
                    rows="5"
                    required
                    placeholder="Paste bank SMS, WhatsApp notification, or suspicious payment request here..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 leading-relaxed font-sans"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={analyzingMessage || !messageInput.trim()}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-2"
                >
                  {analyzingMessage ? 'Extracting Signal Features & Scoring...' : 'Analyze Message Threat'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Result Card (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col">
              {messageResult ? (
                <div className="space-y-5">
                  {/* Score Meter Header */}
                  <div className={`p-4 rounded-xl border flex items-center justify-between ${
                    messageResult.risk_category === 'Critical' || messageResult.risk_category === 'High'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : messageResult.risk_category === 'Medium'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider">Automated Risk Assessment</span>
                      <h3 className="text-2xl font-black">{messageResult.risk_category} Risk</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-extrabold">{messageResult.risk_score}</span>
                      <span className="text-xs font-semibold opacity-75">/100</span>
                    </div>
                  </div>

                  {/* Signal Features Breakdown (INFO-4360 Inspired) */}
                  {messageResult.signal_features && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-indigo-600" />
                        Scam Signal Feature Engineering (INFO-4360 Features)
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-semibold block">Caps Percentage</span>
                          <span className="text-sm font-extrabold text-slate-900">
                            {messageResult.signal_features.caps_pct ?? 0}%
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-semibold block">Digits Count</span>
                          <span className="text-sm font-extrabold text-slate-900">
                            {messageResult.signal_features.digits_count ?? 0}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-semibold block">Has URL / Link</span>
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                            messageResult.signal_features.has_url ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {messageResult.signal_features.has_url ? 'YES (High Risk)' : 'NO'}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-semibold block">Direct Phone #</span>
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                            messageResult.signal_features.has_phone ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {messageResult.signal_features.has_phone ? 'YES' : 'NO'}
                          </span>
                        </div>
                      </div>

                      {messageResult.signal_features.call_to_action_count > 0 && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                          <span className="font-bold text-slate-800">Action Directives:</span>
                          <span>{messageResult.signal_features.call_to_action_terms?.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Detected Indicators */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Detected Threat Patterns</h4>
                    <ul className="space-y-1.5">
                      {messageResult.indicators?.map((ind, i) => (
                        <li key={i} className="text-xs text-rose-700 bg-rose-50/70 border border-rose-100 px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                          {ind}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* AI Explanation Layer */}
                  <div className="p-3.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs">
                    <h4 className="font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      AI Intelligence Explanation (Groq LLM Layer)
                    </h4>
                    <p className="text-indigo-900 leading-relaxed">{messageResult.explanation}</p>
                  </div>

                  {/* Safety Recommendation */}
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <h4 className="font-bold text-slate-800 mb-1">Recommended Safety Actions</h4>
                    <p className="text-slate-600 leading-relaxed">{messageResult.recommendation}</p>
                  </div>

                  <p className="text-[10px] text-slate-400 italic">
                    * {messageResult.disclaimer}
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <ShieldCheck className="w-12 h-12 text-slate-300 mb-3" />
                  <h4 className="font-bold text-slate-700 text-sm mb-1">Awaiting Message Analysis</h4>
                  <p className="text-xs max-w-xs text-slate-400">
                    Click any benchmark sample above or paste a message on the left to extract signal features and score risk.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUSPICIOUS URL INSPECTOR */}
      {activeTab === 'url' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">URL & Domain Inspector</h3>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Safe Passive Scan (No Visit)
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="font-semibold text-slate-600 block mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Benchmark URL Test Samples:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={loadSpoofedUrlSample}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Spoofed Bank Domain (.xyz)
                </button>
                <button
                  type="button"
                  onClick={loadRawIpUrlSample}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Raw IP Phishing Host
                </button>
                <button
                  type="button"
                  onClick={loadUrlShortenerSample}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Masked URL Shortener
                </button>
              </div>
            </div>

            <form onSubmit={handleUrlScan} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Website URL / Link</label>
                <input
                  type="text"
                  required
                  placeholder="https://example-banking.com/login"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Our cybersecurity engine inspects lexical patterns, top-level domains, IP addressing, and brand homoglyphs without navigating to the URL, guaranteeing your device remains protected.
                </span>
              </div>

              <button
                type="submit"
                disabled={analyzingUrl || !urlInput.trim()}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-2"
              >
                {analyzingUrl ? 'Inspecting Domain Structure...' : 'Inspect URL Risk'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* URL Result Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col">
            {urlResult ? (
              <div className="space-y-5">
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  urlResult.risk_category === 'Critical' || urlResult.risk_category === 'High'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : urlResult.risk_category === 'Medium'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Domain Risk Score</span>
                    <h3 className="text-2xl font-black">{urlResult.risk_category}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-extrabold">{urlResult.risk_score}</span>
                    <span className="text-xs font-semibold opacity-75">/100</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Structural Findings</h4>
                  <ul className="space-y-1.5">
                    {urlResult.indicators?.map((ind, i) => (
                      <li key={i} className="text-xs text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg flex items-center gap-2">
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        {ind}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <h4 className="font-bold text-slate-800 mb-1">Action Directive</h4>
                  <p className="text-slate-600">{urlResult.recommendation}</p>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  * {urlResult.disclaimer}
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <Globe className="w-12 h-12 text-slate-300 mb-3" />
                <h4 className="font-bold text-slate-700 text-sm mb-1">Awaiting URL Submission</h4>
                <p className="text-xs max-w-xs text-slate-400">
                  Enter an unverified URL or link received via SMS to run safety pattern verification.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
