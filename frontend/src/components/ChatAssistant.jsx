import React, { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, RotateCcw, Send, X } from 'lucide-react';

const welcome = {
  role: 'assistant',
  text: "Hi! I'm your BESS operations assistant. Ask about fleet health, alarms, or site performance. This demo uses sample dashboard data.",
};

const suggestions = [
  'Summarize fleet health',
  'What needs attention?',
  'How is Jodhpur performing?',
];

function getDemoReply(question) {
  const q = question.toLowerCase();
  if (q.includes('jodhpur') || q.includes('site')) {
    return 'Jodhpur Desert BESS is reporting a fault, with 92% battery health, 97.8% availability, and 32 active alarms. Open the site dashboard to review the alarm list and asset details.';
  }
  if (q.includes('attention') || q.includes('alarm') || q.includes('fault')) {
    return 'The fleet has 32 active alarms at Jodhpur Desert BESS, currently marked Fault. I recommend reviewing the highest-severity active alarms first and checking site communications and battery health.';
  }
  if (q.includes('health') || q.includes('fleet') || q.includes('summary')) {
    return 'Fleet health snapshot: sites are online and monitored, with battery health, availability, alarms, and communications available on the dashboard. Jodhpur Desert BESS is the current priority because it has an active fault and 32 alarms.';
  }
  return 'I can help summarize fleet health, highlight alarms, or review Jodhpur site performance. Try one of the suggested questions for this demo.';
}

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([welcome]);
  const [draft, setDraft] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, open]);

  const sendMessage = (value = draft) => {
    const text = value.trim();
    if (!text) return;
    setMessages((current) => [...current, { role: 'user', text }, { role: 'assistant', text: getDemoReply(text) }].slice(-41));
    setDraft('');
  };

  const resetChat = () => setMessages([welcome]);

  return (
    <div className="fixed bottom-4 right-4 z-[1200] sm:bottom-6 sm:right-6">
      {open && (
        <section aria-label="BESS operations assistant" className="mb-3 flex h-[min(560px,calc(100dvh-6rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900">
          <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/80">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600 text-white"><Bot className="h-5 w-5" /></span>
              <div><h2 className="text-sm font-semibold text-slate-900 dark:text-white">BESS Copilot</h2><p className="text-[11px] text-emerald-600 dark:text-emerald-400">Demo assistant · Sample data</p></div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={resetChat} title="Restart demo conversation" aria-label="Restart demo conversation" className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white"><RotateCcw className="h-4 w-4" /></button>
              <button type="button" onClick={() => setOpen(false)} title="Close chat" aria-label="Close chat" className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white"><X className="h-4 w-4" /></button>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${index}-${message.role}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${message.role === 'user' ? 'rounded-br-md bg-cyan-700 text-white' : 'rounded-bl-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>{message.text}</p>
              </div>
            ))}
            {messages.length === 1 && (
              <div className="pt-1">
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400"><MessageCircle className="h-3 w-3" />Try asking</p>
                <div className="flex flex-wrap gap-2">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => sendMessage(suggestion)} className="rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-medium text-slate-600 transition-colors hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-cyan-300">{suggestion}</button>)}</div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={(event) => { event.preventDefault(); sendMessage(); }} className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-slate-700">
            <label className="sr-only" htmlFor="assistant-message">Ask the BESS assistant</label>
            <input id="assistant-message" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about fleet operations..." className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500" />
            <button type="submit" disabled={!draft.trim()} aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-700 text-white transition-colors hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4" /></button>
          </form>
        </section>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? 'Close BESS Copilot' : 'Open BESS Copilot'} aria-expanded={open} className="ml-auto flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-700 text-white shadow-md transition-colors hover:bg-cyan-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-500/30">
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
