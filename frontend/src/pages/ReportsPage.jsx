import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FileText, 
  Download, 
  Sparkles, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

const REPORT_TEMPLATES = [
  { id: 'MONTHLY_FINANCIAL', title: 'Monthly Financial Audit Report', desc: 'Comprehensive statement of all verified inflows, outflows, and net surplus.', icon: FileText },
  { id: 'EXPENSE_ANALYSIS', title: 'Expense Category Breakdown', desc: 'Granular multi-category analysis comparing discretionary vs essential outlays.', icon: Layers },
  { id: 'FRAUD_ANALYSIS', title: 'Fraud & Phishing Threat Log', desc: 'Executive security dossier summarizing scanned suspicious messages and URLs.', icon: ShieldCheck },
  { id: 'LOAN_REPAYMENT', title: 'Loan Repayment & Amortization', desc: 'Mathematical schedule of reducing-balance EMIs and prepayment velocity.', icon: Calendar },
  { id: 'INVESTMENT_SUMMARY', title: 'Investment Portfolio & Wealth Report', desc: 'Multi-asset holding breakdown with compounding CAGR simulations.', icon: FileSpreadsheet }
];

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState('MONTHLY_FINANCIAL');
  const [fileFormat, setFileFormat] = useState('PDF');
  const [lastGenerated, setLastGenerated] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports');
      setReports(res.data.reports || []);
    } catch (err) {
      console.error("Reports fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (templateId = selectedType, format = fileFormat) => {
    try {
      setGenerating(true);
      const res = await api.post('/reports/generate', {
        report_type: templateId,
        file_format: format
      });
      setLastGenerated(res.data.report);
      fetchReports();
    } catch (err) {
      alert("Error generating report: " + (err.response?.data?.message || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (report) => {
    if (!report || !report.id) return;
    try {
      setDownloadingId(report.id);
      
      // Perform authenticated GET with blob responseType
      const res = await api.get(`/reports/download/${report.id}`, {
        responseType: 'blob'
      });

      const ext = (report.file_format || 'PDF').toLowerCase();
      const sanitizedTitle = (report.report_title || 'FINWISE_Financial_Report').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${sanitizedTitle}.${ext}`;

      const mimeType = report.file_format === 'PDF' ? 'application/pdf' : 'text/csv';
      const blob = new Blob([res.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Authenticated blob download error, trying direct token fallback:", err);
      // Fallback: Use token in query parameter if available
      const token = localStorage.getItem('finwise_token');
      if (token) {
        window.open(`/api/reports/download/${report.id}?token=${encodeURIComponent(token)}`, '_blank');
      } else {
        alert("Failed to download report: " + (err.response?.data?.message || err.message));
      }
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Institutional Financial Reports</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate audit-ready PDF and CSV reports containing verified accounting transactions and risk metrics
        </p>
      </div>

      {/* Generator Banner Card (Clean White Theme) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase tracking-wider inline-flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-600" /> ReportLab Document Compiler
            </span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Financial Dossier Generation</h2>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
              Export verified data models into clean, professionally formatted PDF documents or raw CSV spreadsheets for tax preparation, loan underwriting, and personal records.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <select
              value={fileFormat}
              onChange={(e) => setFileFormat(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="PDF">Format: PDF (ReportLab)</option>
              <option value="CSV">Format: CSV (Spreadsheet)</option>
            </select>

            <button
              onClick={() => handleGenerate(selectedType, fileFormat)}
              disabled={generating}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-2"
            >
              {generating ? 'Compiling Dossier...' : 'Generate Dossier'}
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Instant Download Banner for Recently Generated Report */}
      {lastGenerated && (
        <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-5 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-100/80 rounded-xl text-emerald-700 shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-800 uppercase bg-emerald-200/60 px-2 py-0.5 rounded">
                  Compilation Ready
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {(lastGenerated.file_size_bytes / 1024).toFixed(1)} KB • {lastGenerated.file_format}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-1">{lastGenerated.report_title}</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Your report has been compiled and saved to your account archive. Click below to download.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => handleDownload(lastGenerated)}
              disabled={downloadingId === lastGenerated.id}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all disabled:opacity-50"
            >
              {downloadingId === lastGenerated.id ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download Now
                </>
              )}
            </button>
            <button
              onClick={() => setLastGenerated(null)}
              className="px-3 py-2 text-slate-500 hover:text-slate-700 text-xs font-semibold rounded-lg hover:bg-emerald-100/50 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Report Template Selector Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Choose Report Template</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {REPORT_TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            const isSelected = selectedType === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => setSelectedType(tmpl.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-50/50 border-indigo-500 ring-1 ring-indigo-500/30 shadow-2xs'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-card'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-100/80 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-indigo-700 uppercase bg-indigo-100/60 px-1.5 py-0.5 rounded">Selected</span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">{tmpl.title}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">{tmpl.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Previously Generated Reports Archive */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Generated Reports Archive</h3>
          <span className="text-xs text-slate-500">{reports.length} Documents</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.length > 0 ? (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      {r.report_title}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.file_format === 'PDF' ? 'bg-rose-50 text-rose-700 border border-rose-200/60' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      }`}>
                        {r.file_format}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {(r.file_size_bytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDownload(r)}
                        disabled={downloadingId === r.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/80 rounded-md font-semibold text-xs transition-colors disabled:opacity-50"
                        title={`Download ${r.file_format}`}
                      >
                        {downloadingId === r.id ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <span>Downloading...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    No reports generated yet. Click "Generate Dossier" above to build your first audit dossier.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
