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
  Info,
  ChevronDown,
  Activity,
  Layers,
  Database
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

  // Benchmarks State
  const [benchmarkSamples, setBenchmarkSamples] = useState([]);
  const [showTechnicalSignals, setShowTechnicalSignals] = useState(false);

  useEffect(() => {
    fetchBenchmarkSamples();
  }, []);

  const fetchBenchmarkSamples = async () => {
    try {
      const res = await api.get('/fraud/benchmark-samples');
      if (res.data?.samples) {
        setBenchmarkSamples(res.data.samples);
      }
    } catch (err) {
      console.warn("Could not load benchmark samples:", err);
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

  const quickSamples = [
    {
      label: '🚨 KYC Block Threat',
      sender: 'AX-SBIINB-ALERT',
      text: 'Dear SBI User, your NetBanking account has been suspended due to pending PAN-Aadhaar KYC. Please click http://sbi-netbanking-verify.top/update immediately to prevent deactivation.'
    },
    {
      label: '🎁 PhonePe ₹25,000 Prize',
      sender: 'PHONEPE-REWARDS',
      text: 'Congratulations! You have won ₹25,000 cash reward from PhonePe. Click here to claim into your account: http://tinyurl.com/claim-reward-upi and enter your 6-digit UPI PIN.'
    },
    {
      label: '⚡ Electricity Cutoff Notice',
      sender: 'BESCOM-OFFICIAL',
      text: 'Dear Consumer, your electricity power connection will be disconnected tonight at 9:30 PM because your bill was not updated. Call our electricity officer at 9876543211 immediately.'
    },
    {
      label: '📦 Fake Delivery Parcel',
      sender: 'IN-POST-NOTICE',
      text: 'IndiaPost Alert: Your package consignment #IN8492041 cannot be delivered due to incomplete address. Update within 24 hours at http://indiapost-parcel-update.top to avoid return.'
    }
  ];

  const loadQuickSample = (sample) => {
    setMessageSender(sample.sender);
    setMessageInput(sample.text);
    handleMessageScan(null, sample.text, sample.sender);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Friendly Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            AI Scam & Phishing Protection
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fraud & Scam Shield</h1>
        <p className="text-sm text-slate-500 mt-1">
          Not sure if an SMS, WhatsApp message, or payment link is genuine? Check it here before clicking or sharing OTPs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('message')}
          className={`flex items-center gap-2 py-3 px-5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'message'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquareWarning className="w-4 h-4" />
          Check a Message or SMS
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
          Check a Website Link
        </button>
      </div>

      {/* TAB 1: MESSAGE SCANNER */}
      {activeTab === 'message' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Box (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Scan Suspicious Text</h2>
              <p className="text-xs text-slate-500 mt-0.5">Paste any SMS or notification to scan for threat patterns.</p>
            </div>

            {/* Quick Test Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 block">💡 Try with common scam examples:</span>
              <div className="flex flex-wrap gap-1.5">
                {quickSamples.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => loadQuickSample(s)}
                    className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-[11px] font-semibold text-slate-700 hover:text-indigo-700 transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleMessageScan} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sender Name or ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. AX-SBIINB, PHONEPE-REWARD"
                  value={messageSender}
                  onChange={(e) => setMessageSender(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message Content</label>
                <textarea
                  rows="5"
                  required
                  placeholder="Paste message here..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={analyzingMessage || !messageInput.trim()}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 text-xs"
              >
                {analyzingMessage ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Scanning Threat Patterns...
                  </>
                ) : (
                  <>
                    Check Message Safety
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Box (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-center">
            {messageResult ? (
              <div className="space-y-5">
                {/* Visual Risk Banner */}
                <div className={`p-5 rounded-2xl border flex items-center justify-between ${
                  messageResult.risk_category === 'Critical' || messageResult.risk_category === 'High'
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : messageResult.risk_category === 'Medium'
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                }`}>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                      Safety Assessment
                    </span>
                    <h3 className="text-2xl font-black mt-0.5">
                      {messageResult.risk_category === 'Critical' || messageResult.risk_category === 'High'
                        ? '🚨 DANGEROUS SCAM'
                        : messageResult.risk_category === 'Medium'
                        ? '⚠️ CAUTION ADVISED'
                        : '✅ SAFE / LEGITIMATE'}
                    </h3>
                    <p className="text-xs font-semibold mt-1">
                      Risk Score: {messageResult.risk_score} / 100
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-4xl font-black">{messageResult.risk_score}</span>
                    <span className="text-xs font-bold opacity-60">/100</span>
                  </div>
                </div>

                {/* Why was this flagged? */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Why was this flagged?
                  </h4>
                  <ul className="space-y-1.5">
                    {messageResult.indicators?.map((ind, i) => (
                      <li key={i} className="text-xs text-rose-700 bg-rose-50/70 border border-rose-100 px-3 py-2 rounded-xl flex items-center gap-2 font-medium">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                        <span>{ind}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* What should you do? */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <h4 className="font-bold text-slate-800 mb-1">What should you do?</h4>
                  <p className="text-slate-600 leading-relaxed font-medium">{messageResult.recommendation}</p>
                </div>

                {/* AI Explanation */}
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs">
                  <h4 className="font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    AI Copilot Explanation
                  </h4>
                  <p className="text-indigo-900 leading-relaxed">{messageResult.explanation}</p>
                </div>

                {/* Optional Technical Breakdown Accordion (For Judges & Researchers) */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setShowTechnicalSignals(!showTechnicalSignals)}
                    className="flex items-center justify-between w-full text-[11px] font-bold text-slate-500 hover:text-slate-800"
                  >
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-indigo-600" />
                      View Technical Signal Features (INFO-4360 & ML Markers)
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTechnicalSignals ? 'rotate-180' : ''}`} />
                  </button>

                  {showTechnicalSignals && messageResult.signal_features && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-semibold">Caps Ratio</span>
                        <strong className="text-slate-800">{messageResult.signal_features.caps_pct ?? 0}%</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-semibold">Digit Count</span>
                        <strong className="text-slate-800">{messageResult.signal_features.digits_count ?? 0}</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-semibold">Has Link</span>
                        <strong className={messageResult.signal_features.has_url ? 'text-rose-600' : 'text-slate-800'}>
                          {messageResult.signal_features.has_url ? 'YES' : 'NO'}
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-semibold">Phone #</span>
                        <strong className={messageResult.signal_features.has_phone ? 'text-amber-600' : 'text-slate-800'}>
                          {messageResult.signal_features.has_phone ? 'YES' : 'NO'}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-slate-400 space-y-2">
                <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-700 text-sm">Awaiting Message Input</h4>
                <p className="text-xs max-w-sm mx-auto text-slate-400">
                  Select one of the sample messages on the left or paste your own message to evaluate fraud risk.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: URL INSPECTOR */}
      {activeTab === 'url' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Website & Link Safety Check</h2>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Safe Passive Scan
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Our engine inspects domain structure and lookalike letters without loading the page on your device.
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 block">💡 Quick test links:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setUrlInput('http://hdfc-bank-netbanking-verify.xyz/auth')}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700"
                >
                  Fake HDFC Domain (.xyz)
                </button>
                <button
                  type="button"
                  onClick={() => setUrlInput('http://192.168.1.1/sbi-netbanking-login')}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700"
                >
                  Raw IP Phishing Host
                </button>
                <button
                  type="button"
                  onClick={() => setUrlInput('http://bit.ly/gpay-cash-reward')}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700"
                >
                  Masked Short Link
                </button>
              </div>
            </div>

            <form onSubmit={handleUrlScan} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Website URL / Link</label>
                <input
                  type="text"
                  required
                  placeholder="https://example-bank.com/login"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={analyzingUrl || !urlInput.trim()}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 text-xs"
              >
                {analyzingUrl ? 'Inspecting Link Structure...' : 'Inspect Link Safety'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* URL Result Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-center">
            {urlResult ? (
              <div className="space-y-4">
                <div className={`p-5 rounded-2xl border flex items-center justify-between ${
                  urlResult.risk_category === 'Critical' || urlResult.risk_category === 'High'
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : urlResult.risk_category === 'Medium'
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                }`}>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                      Domain Safety Score
                    </span>
                    <h3 className="text-2xl font-black mt-0.5">
                      {urlResult.risk_category === 'Critical' || urlResult.risk_category === 'High'
                        ? '🚨 DANGEROUS LINK'
                        : urlResult.risk_category === 'Medium'
                        ? '⚠️ UNVERIFIED LINK'
                        : '✅ LEGITIMATE DOMAIN'}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-black">{urlResult.risk_score}</span>
                    <span className="text-xs font-bold opacity-60">/100</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Findings</h4>
                  <ul className="space-y-1.5">
                    {urlResult.indicators?.map((ind, i) => (
                      <li key={i} className="text-xs text-slate-800 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{ind}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <h4 className="font-bold text-slate-800 mb-1">Safety Advice</h4>
                  <p className="text-slate-600">{urlResult.recommendation}</p>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-slate-400 space-y-2">
                <Globe className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-700 text-sm">No URL Analyzed Yet</h4>
                <p className="text-xs max-w-sm mx-auto text-slate-400">
                  Enter an unverified URL or click one of the quick test links to check for spoofed domains or suspicious TLDs.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
