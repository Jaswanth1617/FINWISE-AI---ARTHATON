import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  UploadCloud, 
  FileCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Sparkles,
  PieChart,
  ShieldCheck,
  Download,
  Database,
  Layers,
  Calendar,
  CreditCard
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
  const [selectedSampleId, setSelectedSampleId] = useState('');

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

  const handleLoadSample = async (sampleId, limit = 250) => {
    setLoadingSample(true);
    setSelectedSampleId(sampleId);
    setError('');
    setResult(null);

    try {
      const res = await api.post('/financial/load-sample', {
        sample_id: sampleId,
        limit: limit
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sample statement.');
    } finally {
      setLoadingSample(false);
      setSelectedSampleId('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1.5">
            <Database className="w-3 h-3 text-indigo-600" />
            UPI / NEFT / IMPS Normalization & Merchant Dictionary
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Statement Analyser</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Intelligent parsing of PDF bank statements, CSV transactions, and Excel ledgers with automated merchant entity cleaning and duplicate protection.
        </p>
      </div>

      {/* 1-Click Authentic Datasets Showcase (personal-finance-intelligence corpus) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Instant Benchmark Datasets (Research Bank Statements)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluate real-world multi-month statements containing authentic Indian UPI, BBPS, salary, and grocery transactions.
            </p>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            No File Required for Evaluation
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {sampleStatements.map((sample) => (
            <div
              key={sample.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    sample.format === 'PDF' 
                      ? 'bg-rose-50 text-rose-700 border-rose-200' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {sample.format} STATEMENT
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {sample.source}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1 leading-snug">
                  {sample.title}
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                  {sample.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/70 flex items-center gap-2">
                <button
                  type="button"
                  disabled={loadingSample}
                  onClick={() => handleLoadSample(sample.id, 250)}
                  className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  {loadingSample && selectedSampleId === sample.id ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Parsing...
                    </>
                  ) : (
                    <>
                      <span>1-Click Load & Parse</span>
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
                <a
                  href={`/api/financial/download-sample/${sample.file_name}`}
                  download
                  title="Download Raw Statement"
                  className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Zone Card for Custom Statements */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Upload Your Own Bank Statement</h3>
        <p className="text-xs text-slate-500 mb-4">Supported formats: PDF Bank Statements, CSV Transactions, Excel (.xlsx, .xls)</p>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragActive 
              ? 'border-indigo-500 bg-indigo-50/50' 
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>

          <p className="text-sm font-semibold text-slate-700 mb-1">
            {file ? file.name : "Drag and drop your bank statement here"}
          </p>
          <p className="text-xs text-slate-400 mb-4">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : "or browse from your local drive"}
          </p>

          <input
            type="file"
            id="statement-file"
            className="hidden"
            accept=".pdf,.csv,.xlsx,.xls"
            onChange={handleFileChange}
          />
          <label
            htmlFor="statement-file"
            className="cursor-pointer inline-flex items-center gap-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg shadow-xs transition-colors"
          >
            Select Document
          </label>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {file && !result && (
          <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>{file.name}</span>
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-xs transition-colors flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Parsing Statement...
                </>
              ) : (
                <>
                  Extract & Normalize
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Analysis Extraction Result */}
      {result && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-900">{result.message}</p>
              <p className="text-[11px] text-emerald-700">Transactions have been saved, categorized, and reconciled in your account ledger.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase">Records Extracted</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{result.records_extracted}</p>
              {result.total_in_sample && (
                <span className="text-[10px] text-slate-400 mt-0.5 block">of {result.total_in_sample} total in dataset</span>
              )}
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase">Duplicates Prevented</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{result.duplicates_skipped}</p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Idempotent import protection</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase">Document Status</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">PROCESSED</p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Reconciled to ledger</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="/transactions"
              className="text-xs font-bold bg-slate-900 text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs flex items-center gap-2"
            >
              <span>View Reconciled Ledger & Categorization</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => { setFile(null); setResult(null); }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3.5 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Load Another Statement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
