import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  ShieldCheck, 
  Info,
  Clock,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  "Where did most of my money go this month?",
  "How much did I spend on food and dining?",
  "Can I afford an EMI of ₹5,000 with my current savings?",
  "Explain the suspicious transaction flagged in my report.",
  "Which tax regime is best for an annual salary of ₹12 Lakhs?"
];

export default function AssistantPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am FINWISE Assistant, your private financial copilot. I am securely grounded in your actual uploaded bank statements, category budgets, active loan schedules, and tax models. How can I help you understand your financial picture today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/assistant/chat', {
        message: textToSend,
        conversation_id: conversationId
      });

      if (res.data.conversation_id) {
        setConversationId(res.data.conversation_id);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.data.message.content,
          source: res.data.source
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I encountered an issue retrieving your records: " + (err.response?.data?.message || err.message)
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              FINWISE Assistant
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Grounding Active
              </span>
            </h1>
            <p className="text-xs text-slate-500">Private, context-aware financial intelligence engine</p>
          </div>
        </div>
      </div>

      {/* Suggested Prompts Pill Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 text-xs">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-500" /> Suggestions:
        </span>
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 text-xs font-medium whitespace-nowrap shadow-2xs transition-all shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Thread Container (White theme with subtle slate bubbles) */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/90 p-4 md:p-6 overflow-y-auto space-y-4 shadow-card">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${
              m.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-slate-900 text-white shadow-2xs font-medium'
                  : 'bg-slate-50 border border-slate-200/80 text-slate-800'
              }`}
            >
              <p className="whitespace-pre-line">{m.content}</p>
              {m.role === 'assistant' && m.source && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Engine: {m.source}</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Grounded on your ledger
                  </span>
                </div>
              )}
            </div>

            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                U
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></div>
              Analyzing context and formulating response...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 shrink-0 bg-white p-2 rounded-xl border border-slate-200/90 shadow-card"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your spending, budget alerts, EMI affordability, or taxes..."
          className="flex-1 px-3 py-2 text-xs border-0 focus:outline-none bg-transparent text-slate-800 placeholder-slate-400"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg transition-colors shadow-2xs"
          title="Send query"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
