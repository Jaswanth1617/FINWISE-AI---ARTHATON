import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  UploadCloud, 
  FileCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Sparkles,
  Download,
  Database,
  Layers,
  ChevronDown
} from 'lucide-react';

export default function AnalyserPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Sample Benchmark Statements
  const [sampleStatements, setSampleStatements] = useState([]);
  const [loadingSample, setLoadingSample] = useState(false);
  const [showBenchmarks, setShowBenchmarks] = useState(false);

  useEffect(() => {
    fetchSampleStatements();
  }, []);

  const fetchSampleStatements = async () => {
    try {
      const res = await api.get('/financial/sample-statements');
      if (res.data?.samples) {
        setSampleStatements(res.data.samples);
      }
    } catch (err) {
      console.warn("Could not load sample statements metadata:", err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF, CSV, or Excel statement file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.post('/financial/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process document. Ensure the file contains parseable records.');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadFastDemo = async () => {
    setLoadingSample(true);
    setError('');
    setResult(null);

    try {
      const res = await api.post('/financial/load-sample', {
        sample_id: 'synthetic_12_month_statement.csv',
        limit: 250
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sample statement.');
    } finally {
      setLoadingSample(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Statement Analyser</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload any bank or credit card statement to automatically categorize your spending, identify recurring payments, and protect against duplicates.
        </p>
      </div>

      {/* 1-Click Demo Shortcut Banner */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Want to test without uploading your own statement?</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Load an authentic 12-month statement with 2,393 real Indian transactions (Blinkit, Swiggy, UPI, Salary, Rent).
            </p>
          </div>
        </div>

        <button
          onClick={handleLoadFastDemo}
          disabled={loadingSample}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0 flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          {loadingSample ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Parsing Statement...
            </>
          ) : (
            <>
              <span>Load Sample Statement</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Upload Zone Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="text-center max-w-md mx-auto mb-2">
          <h2 className="text-base font-bold text-slate-900">Upload Your Statement</h2>
          <p className="text-xs text-slate-500 mt-1">Supports PDF bank statements, CSV transactions, and Excel files (.xlsx, .xls)</p>
        </div>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all ${
            dragActive 
              ? 'border-indigo-500 bg-indigo-50/40' 
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4 shadow-2xs">
            <UploadCloud className="w-7 h-7" />
          </div>

          <p className="text-sm font-bold text-slate-800 mb-1">
            {file ? file.name : "Drag and drop your file here"}
          </p>
          <p className="text-xs text-slate-400 mb-5">
            {file ? `${(file.size / 1024).toFixed(1)} KB ready for extraction` : "or choose a file from your computer"}
          </p>

          <input
            type="file"
            id="statement-file-input"
            className="hidden"
            accept=".pdf,.csv,.xlsx,.xls"
            onChange={handleFileChange}
          />
          <label
            htmlFor="statement-file-input"
            className="cursor-pointer inline-flex items-center gap-2 text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 px-5 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            Browse Files
          </label>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {file && !result && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3 text-xs text-slate-800 font-semibold truncate">
              <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
              <span className="truncate">{file.name}</span>
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Extracting...
                </>
              ) : (
                <>
                  Process Document
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Results Summary Card */}
      {result && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-950 text-sm">{result.message}</p>
              <p className="text-[11px] text-emerald-800 mt-0.5">Transactions have been saved and categorized in your accounting ledger.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Extracted Records</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{result.records_extracted}</p>
              {result.total_in_sample && (
                <span className="text-[10px] text-slate-400 mt-0.5 block">from sample dataset</span>
              )}
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Duplicate Prevention</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{result.duplicates_skipped}</p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Existing records skipped</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">Reconciled</p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Ready in ledger</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/transactions"
              className="text-xs font-bold bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-2"
            >
              <span>View In Ledger & Categories</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => { setFile(null); setResult(null); }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Upload Another Statement
            </button>
          </div>
        </div>
      )}

      {/* Clean Collapsible for Benchmark Files (Non-Intrusive) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <button
          onClick={() => setShowBenchmarks(!showBenchmarks)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              Download Sample Bank Statements (For Hackathon Testing)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Click to view and download authentic CSV and PDF statement files for manual testing.
            </p>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showBenchmarks ? 'rotate-180' : ''}`} />
        </button>

        {showBenchmarks && (
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sampleStatements.map((sample) => (
              <div key={sample.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{sample.title}</h4>
                  <p className="text-[10px] text-slate-500">{sample.format} · {sample.source}</p>
                </div>
                <a
                  href={`/api/financial/download-sample/${sample.file_name}`}
                  download
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1 shrink-0"
                >
                  <Download className="w-3 h-3" />
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
