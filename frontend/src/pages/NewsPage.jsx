import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Newspaper, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Tag, 
  Building2,
  Info
} from 'lucide-react';

export default function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Custom analysis state
  const [customArticle, setCustomArticle] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await api.get('/news/feed');
      setArticles(res.data.articles || []);
    } catch (err) {
      console.error("News feed fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyseCustom = async (e) => {
    e.preventDefault();
    if (!customArticle.trim()) return;

    try {
      setAnalyzing(true);
      setAnalysisResult(null);
      const res = await api.post('/news/analyse', {
        title: customTitle.trim() || 'Custom Financial Clipping',
        article: customArticle.trim()
      });
      setAnalysisResult(res.data.analysis);
    } catch (err) {
      alert("Error analyzing article: " + (err.response?.data?.message || err.message));
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial News & Macro Intelligence</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time macroeconomic impact analysis, market sentiment scoring, and sectoral implications
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Custom Article Analyzer Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Analyze News Article</h3>
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              AI Sentiment
            </span>
          </div>

          <form onSubmit={handleAnalyseCustom} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Headline / Title</label>
              <input
                type="text"
                placeholder="e.g. Federal Reserve Signals Rate Cut in Q2"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Article Content</label>
              <textarea
                rows="5"
                required
                placeholder="Paste news dispatch, corporate quarterly report, or regulatory circular..."
                value={customArticle}
                onChange={(e) => setCustomArticle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 leading-relaxed"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={analyzing || !customArticle.trim()}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-2"
            >
              {analyzing ? 'Extracting Financial Implications...' : 'Run Sentiment & Sector Scan'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {analysisResult && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Assessed Sentiment:</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                  analysisResult.sentiment === 'Positive' ? 'bg-emerald-50 text-emerald-700' :
                  analysisResult.sentiment === 'Negative' ? 'bg-rose-50 text-rose-700' : 'bg-slate-200 text-slate-700'
                }`}>
                  {analysisResult.sentiment} ({analysisResult.sentiment_score})
                </span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                {analysisResult.ai_synthesis}
              </div>
            </div>
          )}
        </div>

        {/* Curated Feed List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Curated Economic Dispatches</h3>
            <span className="text-xs text-slate-500">Live feed</span>
          </div>

          <div className="space-y-4">
            {articles.map((art) => (
              <div key={art.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {art.source} • {art.published_at}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">{art.title}</h4>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 ${
                    art.sentiment === 'Positive' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    art.sentiment === 'Negative' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {art.sentiment === 'Positive' ? <TrendingUp className="w-3.5 h-3.5" /> :
                     art.sentiment === 'Negative' ? <TrendingDown className="w-3.5 h-3.5" /> :
                     <Minus className="w-3.5 h-3.5" />}
                    {art.sentiment}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{art.summary}</p>

                {/* Sector badges */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Impact:</span>
                    {art.affected_sectors.map((sec, i) => (
                      <span key={i} className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-800">Financial Implication:</span> {art.financial_implication}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-100/80 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Sentiment classifications and sectoral implications are generated for educational awareness and should not be used as guaranteed stock tips.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
