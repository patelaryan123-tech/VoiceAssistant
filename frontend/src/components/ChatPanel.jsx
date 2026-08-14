import React, { useEffect, useRef, useState } from 'react';
import { Mic, User, Bot, Check, Trash2, Cloud, Newspaper, Cpu, Globe, Clapperboard, BarChart3, Bell, Brain, TrendingUp, TrendingDown, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Weather Card ─────────────────────────────────────────────────────────
const WeatherCard = ({ data }) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  return (
    <div className="weather-card mt-2">
      <div className="flex items-center gap-3">
        <Cloud className="w-8 h-8" style={{ color: 'var(--color-info)' }} />
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{data.city}</p>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{data.condition}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-2xl font-bold gradient-text">{data.temp}°C</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>💧{data.humidity}% · 💨{data.wind}km/h</p>
        </div>
      </div>
    </div>
  );
};

// ── News Card ─────────────────────────────────────────────────────────────
const NewsCard = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) return null;
  return (
    <div className="news-card mt-2 space-y-1.5">
      {data.map((headline, i) => (
        <div key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-dim)' }}>
          <span className="shrink-0 font-bold" style={{ color: 'var(--color-accent1)' }}>{i + 1}.</span>
          <span>{headline}</span>
        </div>
      ))}
    </div>
  );
};

// ── File List ─────────────────────────────────────────────────────────────
const FileListCard = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) return null;
  return (
    <div className="mt-2 space-y-1">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-xs py-1 px-2 rounded-md" style={{ background: 'var(--bg-input)', color: 'var(--text-dim)' }}>
          <span style={{ color: 'var(--color-accent2)' }}>📄</span>
          <span>{typeof item === 'string' ? item : item.name}</span>
        </div>
      ))}
    </div>
  );
};

// ── Help List ─────────────────────────────────────────────────────────────
const HelpCard = ({ data }) => {
  if (!Array.isArray(data)) return null;
  return (
    <div className="mt-2 space-y-1 max-h-48 overflow-y-auto pr-1">
      {data.map((item, i) => (
        item.startsWith('──') ? (
          <p key={i} className="text-xs font-semibold mt-2 first:mt-0" style={{ color: 'var(--color-accent1)' }}>{item}</p>
        ) : (
          <div key={i} className="text-xs px-2 py-1 rounded font-mono" style={{ background: 'var(--bg-input)', color: 'var(--text-dim)' }}>{item}</div>
        )
      ))}
    </div>
  );
};

// ── 🆕 System Dashboard Card ──────────────────────────────────────────────
const SystemDashCard = ({ data }) => {
  if (!data || typeof data !== 'object') return null;
  const bars = [
    { label: 'CPU', pct: data.cpu, val: `${data.cpu}%`, color: '#10b981' },
    { label: 'RAM', pct: data.ram_pct, val: `${data.ram_used}/${data.ram_total}GB`, color: '#06b6d4' },
    { label: 'DISK', pct: data.disk_pct, val: `${data.disk_used}/${data.disk_total}GB`, color: '#f59e0b' },
  ];
  return (
    <div className="sys-dash-card">
      <div className="flex items-center gap-2 mb-3">
        <Cpu className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
        <span className="text-xs font-semibold font-mono" style={{ color: '#10b981' }}>SYSTEM DASHBOARD</span>
      </div>
      {bars.map(bar => (
        <div key={bar.label} className="sys-stat-row">
          <span className="sys-stat-label">{bar.label}</span>
          <div className="sys-bar-track">
            <div className="sys-bar-fill" style={{ width: `${bar.pct}%`, background: bar.color }} />
          </div>
          <span className="sys-stat-val">{bar.val}</span>
        </div>
      ))}
      <div className="sys-meta-row">
        <span className="sys-meta-chip">⬆ {data.net_sent}</span>
        <span className="sys-meta-chip">⬇ {data.net_recv}</span>
        <span className="sys-meta-chip">⏱ Uptime {data.uptime}</span>
      </div>
    </div>
  );
};

// ── 🆕 Network Info Card ──────────────────────────────────────────────────
const NetworkCard = ({ data, text }) => {
  // Show ping result
  if (data && data.host && data.latency_ms) {
    const ms = parseInt(data.latency_ms);
    const color = ms < 50 ? '#34d399' : ms < 150 ? '#fbbf24' : '#f87171';
    return (
      <div className="network-card">
        <Globe className="w-5 h-5 shrink-0" style={{ color: '#818cf8' }} />
        <div>
          <div className="network-ip">{data.host}</div>
          <div className="network-meta">Ping result</div>
        </div>
        <div className="ping-pill" style={{ color, borderColor: `${color}33`, background: `${color}22` }}>
          {data.latency_ms} ms
        </div>
      </div>
    );
  }
  // Show IP info
  if (data && data.ip) {
    return (
      <div className="network-card">
        <Globe className="w-5 h-5 shrink-0" style={{ color: '#818cf8' }} />
        <div>
          <div className="network-ip">{data.ip}</div>
          <div className="network-meta">{data.city}, {data.country}</div>
          <div className="network-meta" style={{ marginTop: 2 }}>{data.isp}</div>
        </div>
      </div>
    );
  }
  return null;
};

// ── 🆕 Macro List Card ────────────────────────────────────────────────────
const MacroCard = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) return null;
  return (
    <div className="macro-card">
      <div className="flex items-center gap-2 mb-2">
        <Clapperboard className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
        <span className="text-xs font-semibold font-mono" style={{ color: '#fbbf24' }}>SAVED MACROS</span>
      </div>
      {data.map((macro, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <div className="text-xs font-semibold font-mono mb-1" style={{ color: '#fcd34d' }}>
            📼 {macro.name} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>({macro.count} steps)</span>
          </div>
          {macro.commands && macro.commands.slice(0, 3).map((cmd, j) => (
            <div key={j} className="macro-cmd-row">
              <span className="macro-index">{j + 1}.</span>
              <span>{cmd}</span>
            </div>
          ))}
          {macro.commands && macro.commands.length > 3 && (
            <div className="text-xs font-mono" style={{ color: 'var(--text-muted)', paddingLeft: 24 }}>+{macro.commands.length - 3} more...</div>
          )}
        </div>
      ))}
    </div>
  );
};

// ── 🆕 Analytics Card ─────────────────────────────────────────────────────
const AnalyticsCard = ({ data }) => {
  if (!data) return null;
  const intents = data.top_intents || [];
  return (
    <div className="analytics-card">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-3.5 h-3.5" style={{ color: '#ec4899' }} />
        <span className="text-xs font-semibold font-mono" style={{ color: '#ec4899' }}>COMMAND ANALYTICS</span>
      </div>
      {intents.length === 0 && (
        <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>No usage data yet. Try more commands!</p>
      )}
      {intents.map((item, i) => (
        <div key={i} className="analytics-bar-row">
          <span className="analytics-name">{item.name}</span>
          <div className="analytics-track">
            <div className="analytics-fill" style={{ width: `${item.pct}%` }} />
          </div>
          <span className="analytics-count">{item.count}</span>
        </div>
      ))}
      <div className="analytics-summary-chips">
        <span className="analytics-chip">💬 {data.user_commands} commands</span>
        <span className="analytics-chip">🤖 {data.assistant_responses} responses</span>
        <span className="analytics-chip">📊 {data.total_messages} total</span>
      </div>
    </div>
  );
};

// ── 🆕 Reminder List Card ─────────────────────────────────────────────────
const ReminderCard = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) return null;
  return (
    <div className="reminder-card">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="w-3.5 h-3.5" style={{ color: '#fb923c' }} />
        <span className="text-xs font-semibold font-mono" style={{ color: '#fb923c' }}>ACTIVE REMINDERS</span>
      </div>
      {data.map((r, i) => (
        <div key={i} className="reminder-row">
          <span className="reminder-label">🔔 {r.label}</span>
          <span className="reminder-due">{r.due}</span>
          {r.recurring && <span className="reminder-recur">🔁 daily</span>}
        </div>
      ))}
    </div>
  );
};

// ── 🆕 Chained Result Card ────────────────────────────────────────────────
const ChainedCard = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) return null;
  return (
    <div className="chained-card">
      <div className="text-xs font-mono font-semibold mb-1" style={{ color: '#6366f1' }}>⛓ CHAINED COMMANDS</div>
      {data.map((r, i) => (
        <div key={i} className="chained-step">
          <span className="chained-arrow">{i === 0 ? '▶' : '→'}</span>
          <span>{r.text}</span>
          {r.success && <span style={{ color: 'var(--color-success)', marginLeft: 'auto' }}>✓</span>}
        </div>
      ))}
    </div>
  );
};

// ── 🆕 Session Mood Tracker ───────────────────────────────────────────────
const getMood = (history) => {
  const assistant = history.filter(m => m.role === 'assistant');
  if (assistant.length === 0) return { emoji: '🤖', label: 'idle', color: 'var(--text-muted)' };
  const success = assistant.filter(m => m.success !== false).length;
  const ratio = success / assistant.length;
  if (ratio >= 0.85) return { emoji: '😊', label: 'great', color: '#34d399' };
  if (ratio >= 0.6)  return { emoji: '😐', label: 'ok', color: '#fbbf24' };
  return { emoji: '😤', label: 'errors', color: '#f87171' };
};

// ── 🆕 Stock & Crypto Card ──────────────────────────────────────────
const StockCard = ({ data }) => {
  if (!data) return null;
  const isUp = data.change_pct >= 0;
  const color = isUp ? '#34d399' : '#f87171';
  const Icon = isUp ? TrendingUp : TrendingDown;
  return (
    <div className={`stock-card ${isUp ? 'up' : 'down'}`}>
      <Icon className="w-6 h-6 shrink-0" style={{ color }} />
      <div>
        <div className="stock-price" style={{ color }}>
          {data.currency} {data.price_str}
        </div>
        <div className="stock-ticker">{data.name} &middot; {data.ticker} &middot; {data.exchange}</div>
      </div>
      <div className={`stock-change ${isUp ? 'up' : 'down'}`}>
        {isUp ? '+' : ''}{data.change_pct}%
      </div>
    </div>
  );
};

// ── 🆕 Morning Briefing Card ─────────────────────────────────────
const BriefingCard = ({ data }) => {
  if (!data) return null;
  return (
    <div className="briefing-card">
      <div className="briefing-greeting">
        <Sun className="inline w-4 h-4 mr-1" style={{ color: '#f59e0b', marginBottom: 2, WebkitTextFillColor: 'initial' }} />
        {data.greeting} — {data.time}
      </div>

      {data.weather && (
        <div className="briefing-section">
          <span className="briefing-icon">⛅</span>
          <span>{data.weather.city}: {data.weather.temp}°C, {data.weather.condition} | Humidity {data.weather.humidity}%</span>
        </div>
      )}

      {data.news && data.news.length > 0 && (
        <div className="briefing-section">
          <span className="briefing-icon">📰</span>
          <div className="space-y-1">
            {data.news.map((h, i) => <div key={i}>{i + 1}. {h}</div>)}
          </div>
        </div>
      )}

      {data.reminders && data.reminders.length > 0 && (
        <div className="briefing-section">
          <span className="briefing-icon">🔔</span>
          <span>{data.reminders.map(r => `${r.label} at ${r.due}`).join(' · ')}</span>
        </div>
      )}

      <div className="briefing-meta">
        <span className="briefing-meta-chip">📅 {data.date}</span>
        <span className="briefing-meta-chip">🏙 {data.city}</span>
      </div>
    </div>
  );
};

// ── 🆕 Translation Card ───────────────────────────────────────────
const TranslationCard = ({ data }) => {
  if (!data) return null;
  return (
    <div className="translation-card">
      <div className="translation-original">“{data.original}”</div>
      <div className="translation-result">{data.translated}</div>
      <div className="translation-lang">🌐 {data.target_lang} ({data.lang_code})</div>
    </div>
  );
};

// ── 🆕 AI Answer Card ────────────────────────────────────────────
const AIAnswerCard = ({ text, data }) => {
  const clean = text?.replace(/^🤖\s*/, '').replace(/^🧠\s*/, '') || '';
  const model = data?.model || 'llama3';
  return (
    <div className="ai-card">
      <div className="ai-badge">
        <Brain className="w-3 h-3" />
        ARIA · {model} · 🔒 LOCAL
      </div>
      <div style={{ color: 'var(--text-primary)', lineHeight: 1.65 }}>{clean}</div>
      {data?.eval_ms && (
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 6, fontFamily: 'monospace' }}>
          {data.tokens} tokens · {data.eval_ms}ms inference
        </div>
      )}
    </div>
  );
};

// ── Main ChatPanel ────────────────────────────────────────────────────────
const ChatPanel = ({ history, statusText, onClearChat, isListening }) => {
  const bottomRef = useRef(null);
  const mood = getMood(history);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, statusText]);

  return (
    <div
      className="rounded-2xl mx-4 mt-2 flex flex-col h-[500px]"
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-accent)',
        boxShadow: '0 20px 60px var(--shadow-color)',
      }}
    >
      {/* Header */}
      <div
        className="drag-region flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 font-mono text-xs font-semibold" style={{ color: 'var(--color-success)' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-success)' }} />
          <span>&gt;_ VOICE ASSISTANT</span>
        </div>

        <div className="no-drag flex items-center gap-2">
          {/* 🆕 Mood Tracker */}
          <div className="mood-pill" title={`Session mood: ${mood.label}`} style={{ borderColor: `${mood.color}44` }}>
            <span>{mood.emoji}</span>
            <span style={{ color: mood.color }}>{mood.label}</span>
          </div>

          <button onClick={onClearChat} className="icon-btn" title="Clear chat" style={{ color: 'var(--text-muted)' }}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chat Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 font-mono text-sm">
        <AnimatePresence initial={false}>
          {history.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex gap-3"
            >
              {msg.role === 'user' ? (
                <>
                  <User className="w-3.5 h-3.5 shrink-0 mt-1" style={{ color: 'var(--color-accent1)' }} />
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--color-accent1)' }}>You: </span>
                    <span style={{ color: 'var(--text-dim)' }}>{msg.content}</span>
                  </div>
                </>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5 shrink-0 mt-1" style={{ color: 'var(--color-accent2)' }} />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold" style={{ color: 'var(--color-accent2)' }}>Assistant: </span>
                    <span style={{ color: '#c084fc' }}>{msg.content}</span>

                    {/* ── Intent-specific rich cards ── */}
                    {msg.intent_type === 'weather'      && msg.data && <WeatherCard data={msg.data} />}
                    {msg.intent_type === 'news'         && msg.data && <NewsCard data={msg.data} />}
                    {msg.intent_type === 'file_list'    && msg.data && <FileListCard data={msg.data} />}
                    {msg.intent_type === 'help'         && msg.data && <HelpCard data={msg.data} />}
                    {msg.intent_type === 'system_stats' && msg.data && <SystemDashCard data={msg.data} />}
                    {msg.intent_type === 'network'      && msg.data && <NetworkCard data={msg.data} text={msg.content} />}
                    {msg.intent_type === 'macro_list'   && msg.data && <MacroCard data={msg.data} />}
                    {msg.intent_type === 'analytics'    && msg.data && <AnalyticsCard data={msg.data} />}
                    {msg.intent_type === 'reminder_list'&& msg.data && <ReminderCard data={msg.data} />}
                    {msg.intent_type === 'chained'      && msg.data && <ChainedCard data={msg.data} />}
                    {/* ── JARVIS cards ── */}
                    {msg.intent_type === 'stock'        && msg.data && <StockCard data={msg.data} />}
                    {msg.intent_type === 'briefing'     && msg.data && <BriefingCard data={msg.data} />}
                    {msg.intent_type === 'translation'  && msg.data && <TranslationCard data={msg.data} />}
                    {msg.intent_type === 'ai_answer'              && <AIAnswerCard text={msg.content} data={msg.data} />}

                    {/* Generic list data */}
                    {msg.data && Array.isArray(msg.data) &&
                      !['weather','news','file_list','help','system_stats','network','macro_list','analytics','reminder_list','chained'].includes(msg.intent_type) && (
                      <div className="mt-2 pl-2 space-y-1" style={{ borderLeft: '2px solid var(--border-accent)' }}>
                        {msg.data.map((item, i) => (
                          <div key={i} className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {typeof item === 'string' ? item : `${item.name} — ${item.path}`}
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.success && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color: 'var(--color-success)' }}>
                        <Check className="w-3 h-3" />
                        <span>Done</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Status line */}
        <div className="flex gap-3 mt-2" style={{ color: 'var(--text-muted)' }}>
          <Mic className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isListening ? 'animate-pulse' : ''}`}
            style={{ color: isListening ? 'var(--color-success)' : 'var(--text-muted)' }}
          />
          <span className="text-xs" style={{ color: isListening ? 'var(--color-success)' : 'var(--text-muted)' }}>
            {statusText}
          </span>
        </div>

        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatPanel;
