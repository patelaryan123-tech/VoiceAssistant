import React, { useEffect, useRef, useState } from 'react';
import {
  Mic, User, Bot, Check, Trash2, Cloud, Newspaper, Cpu, Globe,
  Clapperboard, BarChart3, Bell, Brain, TrendingUp, TrendingDown, Sun,
  Copy, CheckCheck, Shield, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveChart from './LiveChart';
import ArcReactor3D from './ArcReactor3D';

// ── Copy button ───────────────────────────────────────────────
const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={handle} className="msg-copy-btn" title="Copy">
      {copied
        ? <CheckCheck style={{ width: 10, height: 10, color: '#00ff88' }} />
        : <Copy style={{ width: 10, height: 10 }} />
      }
    </button>
  );
};

// ── Timestamp ─────────────────────────────────────────────────
const Timestamp = ({ iso }) => {
  if (!iso) return null;
  const d = new Date(iso);
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return <span className="msg-timestamp" title={d.toLocaleString()}>{time}</span>;
};

// ── Weather Card ──────────────────────────────────────────────
const WeatherCard = ({ data }) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  return (
    <div className="weather-card mt-2">
      <div className="flex items-center gap-3">
        <Cloud style={{ width: 28, height: 28, color: '#00d4ff' }} />
        <div>
          <p className="font-semibold text-sm" style={{ fontFamily: "'Orbitron', monospace", color: '#00d4ff', letterSpacing: '1px' }}>{data.city}</p>
          <p className="text-xs" style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-dim)' }}>{data.condition}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-2xl font-bold" style={{ fontFamily: "'Orbitron', monospace", color: '#00d4ff', textShadow: '0 0 10px rgba(0,212,255,0.6)' }}>{data.temp}°C</p>
          <p className="text-xs" style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-muted)' }}>
            💧{data.humidity}% &nbsp;·&nbsp; 💨{data.wind} km/h
          </p>
        </div>
      </div>
    </div>
  );
};

// ── News Card ─────────────────────────────────────────────────
const NewsCard = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) return null;
  return (
    <div className="news-card mt-2 space-y-1.5">
      {data.map((headline, i) => (
        <div key={i} className="flex items-start gap-2 text-xs" style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-dim)' }}>
          <span className="shrink-0 font-bold" style={{ color: '#00d4ff' }}>{i + 1}.</span>
          <span>{headline}</span>
        </div>
      ))}
    </div>
  );
};

// ── File List ─────────────────────────────────────────────────
const FileListCard = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) return null;
  return (
    <div className="mt-2 space-y-1">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-xs py-1 px-2 rounded" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-dim)' }}>
          <span style={{ color: '#00d4ff' }}>▸</span>
          <span>{typeof item === 'string' ? item : item.name}</span>
        </div>
      ))}
    </div>
  );
};

// ── Help List ─────────────────────────────────────────────────
const HelpCard = ({ data }) => {
  if (!Array.isArray(data)) return null;
  return (
    <div className="mt-2 space-y-1 max-h-48 overflow-y-auto pr-1">
      {data.map((item, i) =>
        item.startsWith('──') ? (
          <p key={i} className="text-xs font-semibold mt-2 first:mt-0" style={{ fontFamily: "'Orbitron', monospace", color: '#00d4ff', letterSpacing: '1px', fontSize: '9px' }}>{item}</p>
        ) : (
          <div key={i} className="text-xs px-2 py-1" style={{ fontFamily: "'Share Tech Mono', monospace", background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-dim)', borderRadius: '2px' }}>{item}</div>
        )
      )}
    </div>
  );
};

// ── System Dashboard Card ─────────────────────────────────────
const SystemDashCard = ({ data }) => {
  if (!data || typeof data !== 'object') return null;
  const bars = [
    { label: 'CPU', pct: data.cpu, val: `${data.cpu}%`, color: '#00ff88' },
    { label: 'RAM', pct: data.ram_pct, val: `${data.ram_used}/${data.ram_total}GB`, color: '#00d4ff' },
    { label: 'DISK', pct: data.disk_pct, val: `${data.disk_used}/${data.disk_total}GB`, color: '#ff9f43' },
  ];
  return (
    <div className="sys-dash-card">
      <div className="flex items-center gap-2 mb-3">
        <Cpu style={{ width: 12, height: 12, color: '#00ff88' }} />
        <span className="text-xs font-bold" style={{ fontFamily: "'Orbitron', monospace", color: '#00ff88', letterSpacing: '2px', fontSize: '9px', textShadow: '0 0 6px rgba(0,255,136,0.5)' }}>SYS // DASHBOARD</span>
      </div>
      {bars.map(bar => (
        <div key={bar.label} className="sys-stat-row">
          <span className="sys-stat-label">{bar.label}</span>
          <div className="sys-bar-track">
            <div className="sys-bar-fill" style={{ width: `${bar.pct}%`, background: `linear-gradient(90deg, ${bar.color}99, ${bar.color})`, boxShadow: `0 0 6px ${bar.color}66` }} />
          </div>
          <span className="sys-stat-val" style={{ color: bar.color }}>{bar.val}</span>
        </div>
      ))}
      <div className="sys-meta-row">
        <span className="sys-meta-chip">⬆ {data.net_sent}</span>
        <span className="sys-meta-chip">⬇ {data.net_recv}</span>
        <span className="sys-meta-chip">⏱ {data.uptime}</span>
      </div>
    </div>
  );
};

// ── Network Card ──────────────────────────────────────────────
const NetworkCard = ({ data }) => {
  if (data && data.host && data.latency_ms) {
    const ms = parseInt(data.latency_ms);
    const color = ms < 50 ? '#00ff88' : ms < 150 ? '#ff9f43' : '#ff4757';
    return (
      <div className="network-card">
        <Globe style={{ width: 18, height: 18, flexShrink: 0, color: '#00d4ff' }} />
        <div>
          <div className="network-ip">{data.host}</div>
          <div className="network-meta">PING RESULT</div>
        </div>
        <div className="ping-pill" style={{ color, borderColor: `${color}44`, background: `${color}18` }}>
          {data.latency_ms} ms
        </div>
      </div>
    );
  }
  if (data && data.ip) {
    return (
      <div className="network-card">
        <Globe style={{ width: 18, height: 18, flexShrink: 0, color: '#00d4ff' }} />
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

// ── Port Scan Card ────────────────────────────────────────────
const PortScanCard = ({ data }) => {
  const PORT_NAMES = {
    21: 'FTP',
    22: 'SSH',
    23: 'Telnet',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP',
    110: 'POP3',
    135: 'RPC',
    139: 'NetBIOS',
    443: 'HTTPS',
    445: 'SMB',
    1433: 'MSSQL',
    3306: 'MySQL',
    3389: 'RDP',
    8000: 'Dev Server',
    8080: 'HTTP Alt'
  };

  const scannedPorts = [21, 22, 23, 25, 53, 80, 110, 135, 139, 443, 445, 1433, 3306, 3389, 8000, 8080];
  const openPorts = data.open_ports || [];

  return (
    <div className="port-scan-card p-3 bg-[rgba(0,212,255,0.02)] border border-[rgba(0,212,255,0.25)] rounded-[3px] space-y-2.5" style={{ minWidth: 260 }}>
      <div className="flex items-center justify-between border-b border-[rgba(0,212,255,0.1)] pb-1.5">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 13 }}>🛡️</span>
          <span style={{ fontFamily: "'Orbitron', monospace", color: '#00d4ff', fontSize: '9px', letterSpacing: '1.5px', fontWeight: 'bold' }}>
            PORT SCANNER // AUDIT
          </span>
        </div>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'rgba(0,212,255,0.4)' }}>
          {data.host}
        </span>
      </div>

      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }} className="flex justify-between">
        <span>IP: {data.ip}</span>
        <span className="text-[#00ff88]" style={{ textShadow: '0 0 4px rgba(0,255,136,0.3)' }}>
          {openPorts.length} OPEN PORTS
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 pt-1">
        {scannedPorts.map(port => {
          const isOpen = openPorts.includes(port);
          const color = isOpen ? '#00ff88' : 'rgba(255,255,255,0.15)';
          const bg = isOpen ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.02)';
          const border = isOpen ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,255,255,0.05)';
          const shadow = isOpen ? '0 0 6px rgba(0,255,136,0.2)' : 'none';

          return (
            <div
              key={port}
              className="flex flex-col items-center justify-center p-1 rounded-[2px] transition-all duration-300"
              style={{ background: bg, border: border, boxShadow: shadow }}
            >
              <span style={{ fontSize: 9, color: color, fontWeight: isOpen ? 'bold' : 'normal' }}>
                {port}
              </span>
              <span style={{ fontSize: 7, color: isOpen ? 'rgba(0,255,136,0.6)' : 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
                {PORT_NAMES[port] || 'UNK'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Process Guard Card ────────────────────────────────────────
const ProcessGuardCard = ({ data }) => {
  const isRunning = data.status === 'running';
  const color = isRunning ? '#00ff88' : '#ff4757';
  const bg = isRunning ? 'rgba(0,255,136,0.04)' : 'rgba(255,71,87,0.04)';
  const border = isRunning ? '1px solid rgba(0,255,136,0.25)' : '1px solid rgba(255,71,87,0.25)';
  const shadow = isRunning ? '0 0 8px rgba(0,255,136,0.1)' : '0 0 8px rgba(255,71,87,0.1)';

  return (
    <div className="process-guard-card p-3 rounded-[3px] flex items-center justify-between" style={{ background: bg, border: border, boxShadow: shadow, minWidth: 260 }}>
      <div className="flex items-center gap-3">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: color }}></span>
          <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: color }}></span>
        </div>
        <div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '9px', letterSpacing: '1px', color: 'var(--text-muted)' }}>
            PROCESS WATCHDOG
          </div>
          <div className="text-xs font-bold" style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-primary)', marginTop: 2 }}>
            {data.name}
          </div>
        </div>
      </div>
      <div
        className="px-2 py-0.5 rounded-[2px] font-mono text-[9px] font-bold uppercase tracking-wider"
        style={{ color: color, border: `1px solid ${color}44`, background: `${color}11` }}
      >
        {data.status}
      </div>
    </div>
  );
};

// ── Macro Card ────────────────────────────────────────────────
const MacroCard = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) return null;
  return (
    <div className="macro-card">
      <div className="flex items-center gap-2 mb-2">
        <Clapperboard style={{ width: 12, height: 12, color: '#ff9f43' }} />
        <span style={{ fontFamily: "'Orbitron', monospace", color: '#ff9f43', fontSize: '9px', letterSpacing: '2px' }}>MACRO // STORE</span>
      </div>
      {data.map((macro, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <div className="text-xs font-bold mb-1" style={{ fontFamily: "'Share Tech Mono', monospace", color: '#ff9f43' }}>
            ▶ {macro.name} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>[ {macro.count} STEPS ]</span>
          </div>
          {macro.commands && macro.commands.slice(0, 3).map((cmd, j) => (
            <div key={j} className="macro-cmd-row">
              <span className="macro-index">{j + 1}.</span>
              <span>{cmd}</span>
            </div>
          ))}
          {macro.commands && macro.commands.length > 3 && (
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'var(--text-muted)', paddingLeft: 24 }}>
              +{macro.commands.length - 3} MORE...
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ── Analytics Card ────────────────────────────────────────────
const AnalyticsCard = ({ data }) => {
  if (!data) return null;
  const intents = data.top_intents || [];
  return (
    <div className="analytics-card">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 style={{ width: 12, height: 12, color: '#00d4ff' }} />
        <span style={{ fontFamily: "'Orbitron', monospace", color: '#00d4ff', fontSize: '9px', letterSpacing: '2px', textShadow: '0 0 6px rgba(0,212,255,0.5)' }}>CMD // ANALYTICS</span>
      </div>
      {intents.length === 0 && (
        <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}>NO USAGE DATA. TRY MORE COMMANDS.</p>
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
        <span className="analytics-chip">💬 {data.user_commands} CMD</span>
        <span className="analytics-chip">🤖 {data.assistant_responses} RSP</span>
        <span className="analytics-chip">📊 {data.total_messages} TOT</span>
      </div>
    </div>
  );
};

// ── Reminder List Card ────────────────────────────────────────
const ReminderCard = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) return null;
  return (
    <div className="reminder-card">
      <div className="flex items-center gap-2 mb-2">
        <Bell style={{ width: 12, height: 12, color: '#ff9f43' }} />
        <span style={{ fontFamily: "'Orbitron', monospace", color: '#ff9f43', fontSize: '9px', letterSpacing: '2px' }}>ACTIVE // REMINDERS</span>
      </div>
      {data.map((r, i) => (
        <div key={i} className="reminder-row">
          <span className="reminder-label">▶ {r.label}</span>
          <span className="reminder-due">{r.due}</span>
          {r.recurring && <span className="reminder-recur">DAILY</span>}
        </div>
      ))}
    </div>
  );
};

// ── Chained Result Card ───────────────────────────────────────
const ChainedCard = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) return null;
  return (
    <div className="chained-card">
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, color: '#00d4ff', marginBottom: 6, letterSpacing: '2px' }}>⛓ CHAIN // EXECUTE</div>
      {data.map((r, i) => (
        <div key={i} className="chained-step">
          <span className="chained-arrow">{i === 0 ? '▶' : '→'}</span>
          <span>{r.text}</span>
          {r.success && <span style={{ color: '#00ff88', marginLeft: 'auto', textShadow: '0 0 6px rgba(0,255,136,0.5)' }}>✓</span>}
        </div>
      ))}
    </div>
  );
};

// ── Session Mood ──────────────────────────────────────────────
const getMood = (history) => {
  const assistant = history.filter(m => m.role === 'assistant');
  if (assistant.length === 0) return { emoji: '◉', label: 'IDLE', color: 'var(--text-muted)' };
  const success = assistant.filter(m => m.success !== false).length;
  const ratio = success / assistant.length;
  if (ratio >= 0.85) return { emoji: '◉', label: 'OPTIMAL', color: '#00ff88' };
  if (ratio >= 0.6)  return { emoji: '◎', label: 'NOMINAL', color: '#ff9f43' };
  return { emoji: '◌', label: 'DEGRADED', color: '#ff4757' };
};

// ── Stock Card ────────────────────────────────────────────────
const StockCard = ({ data }) => {
  if (!data) return null;
  const isUp = data.change_pct >= 0;
  const color = isUp ? '#00ff88' : '#ff4757';
  const Icon = isUp ? TrendingUp : TrendingDown;
  return (
    <div className={`stock-card ${isUp ? 'up' : 'down'}`}>
      <Icon style={{ width: 20, height: 20, flexShrink: 0, color }} />
      <div>
        <div className="stock-price" style={{ color, textShadow: `0 0 8px ${color}88` }}>
          {data.currency} {data.price_str}
        </div>
        <div className="stock-ticker">{data.name} · {data.ticker} · {data.exchange}</div>
      </div>
      <div className={`stock-change ${isUp ? 'up' : 'down'}`}>
        {isUp ? '+' : ''}{data.change_pct}%
      </div>
    </div>
  );
};

// ── Briefing Card ─────────────────────────────────────────────
const BriefingCard = ({ data }) => {
  if (!data) return null;
  return (
    <div className="briefing-card">
      <div className="briefing-greeting">
        <Sun style={{ display: 'inline', width: 14, height: 14, marginRight: 6, color: '#ff9f43', WebkitTextFillColor: 'initial' }} />
        {data.greeting} // {data.time}
      </div>
      {data.weather && (
        <div className="briefing-section">
          <span className="briefing-icon">⛅</span>
          <span>{data.weather.city}: {data.weather.temp}°C · {data.weather.condition}</span>
        </div>
      )}
      {data.news && data.news.length > 0 && (
        <div className="briefing-section">
          <span className="briefing-icon">📡</span>
          <div className="space-y-0.5">
            {data.news.map((h, i) => <div key={i}>[{i + 1}] {h}</div>)}
          </div>
        </div>
      )}
      {data.reminders && data.reminders.length > 0 && (
        <div className="briefing-section">
          <span className="briefing-icon">🔔</span>
          <span>{data.reminders.map(r => `${r.label} @ ${r.due}`).join(' · ')}</span>
        </div>
      )}
      <div className="briefing-meta">
        <span className="briefing-meta-chip">📅 {data.date}</span>
        <span className="briefing-meta-chip">🏙 {data.city}</span>
      </div>
    </div>
  );
};

// ── Translation Card ──────────────────────────────────────────
const TranslationCard = ({ data }) => {
  if (!data) return null;
  return (
    <div className="translation-card">
      <div className="translation-original">INPUT: "{data.original}"</div>
      <div className="translation-result">{data.translated}</div>
      <div className="translation-lang">TARGET: {data.target_lang} // {data.lang_code}</div>
    </div>
  );
};

// ── AI Answer Card ────────────────────────────────────────────
const AIAnswerCard = ({ text, data }) => {
  const clean = text?.replace(/^🤖\s*/, '').replace(/^🧠\s*/, '') || '';
  const model = data?.model || 'llama3';
  return (
    <div className="ai-card">
      <div className="ai-badge">
        <Brain style={{ width: 9, height: 9 }} />
        A.R.I.A. // {model.toUpperCase()} // LOCAL
      </div>
      <div style={{ color: 'var(--text-primary)', lineHeight: 1.7, fontFamily: "'Exo 2', sans-serif" }}>{clean}</div>
      {data?.eval_ms && (
        <div style={{ fontSize: 9, fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-muted)', marginTop: 6, letterSpacing: '0.5px' }}>
          {data.tokens} TOKENS // {data.eval_ms}ms INFERENCE
        </div>
      )}
    </div>
  );
};

// ── Empty State ───────────────────────────────────────────────
const EmptyState = ({ jarvisMode }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
    className="flex flex-col items-center justify-center flex-1 gap-5 py-10"
  >
    {/* 3D Arc Reactor */}
    <ArcReactor3D isListening={false} size={150} jarvisMode={jarvisMode} />

    <div className="text-center space-y-1">
      <p className="font-bold tracking-widest text-sm" style={{ fontFamily: "'Orbitron', monospace", color: jarvisMode ? '#ff4757' : '#00d4ff', textShadow: jarvisMode ? '0 0 10px rgba(255,71,87,0.6)' : '0 0 10px rgba(0,212,255,0.6)', letterSpacing: '3px' }}>
        {jarvisMode ? 'J.A.R.V.I.S.' : 'A.R.I.A.'} ONLINE
      </p>
      <p className="text-xs" style={{ fontFamily: "'Share Tech Mono', monospace", color: jarvisMode ? 'rgba(255,71,87,0.5)' : 'rgba(0,212,255,0.5)', letterSpacing: '1.5px' }}>
        AWAITING INPUT COMMAND
      </p>
    </div>

    {/* Sample commands */}
    <div className="flex flex-wrap justify-center gap-2 max-w-xs">
      {['weather in Mumbai', 'news', 'system stats', 'morning briefing'].map(cmd => (
        <span key={cmd} className="text-[9px] px-2.5 py-1" style={{ fontFamily: "'Share Tech Mono', monospace", background: jarvisMode ? 'rgba(255,71,87,0.05)' : 'rgba(0,212,255,0.05)', border: `1px solid ${jarvisMode ? 'rgba(255,71,87,0.2)' : 'rgba(0,212,255,0.2)'}`, color: jarvisMode ? 'rgba(255,71,87,0.6)' : 'rgba(0,212,255,0.6)', borderRadius: '2px', letterSpacing: '0.5px' }}>
          ▸ {cmd}
        </span>
      ))}
    </div>
  </motion.div>
);

// ── Main ChatPanel ────────────────────────────────────────────
const ChatPanel = ({ history, statusText, onClearChat, isListening, jarvisMode }) => {
  const bottomRef = useRef(null);
  const mood = getMood(history);
  const msgCount = history.length;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, statusText]);

  return (
    <div
      className="relative mx-4 mt-2 flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(0,18,36,0.97) 0%, rgba(0,12,26,0.99) 100%)',
        border: '1px solid rgba(0,212,255,0.25)',
        borderRadius: '4px',
        boxShadow: '0 0 40px rgba(0,212,255,0.08), inset 0 0 60px rgba(0,212,255,0.02)',
        height: 'calc(100vh - 195px)',
        minHeight: 320,
      }}
    >
      {/* Holographic grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Scan line */}
      <div className="scan-line" />

      {/* Corner decorations */}
      <div className="corner-tl" />
      <div className="corner-tr" />
      <div className="corner-bl" />
      <div className="corner-br" />

      {/* Header */}
      <div
        className="drag-region relative flex items-center justify-between px-4 py-2.5 shrink-0 z-10"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.15)', background: 'rgba(0,12,28,0.6)' }}
      >
        <div className="flex items-center gap-3">
          {/* Status dot */}
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px rgba(0,255,136,0.8)' }}
            />
            <span
              className="font-bold tracking-widest text-xs"
              style={{ fontFamily: "'Orbitron', monospace", color: '#00d4ff', letterSpacing: '2px', fontSize: '10px' }}
            >
              ARIA // INTERFACE
            </span>
          </div>

          {msgCount > 0 && (
            <span
              className="px-2 py-0.5"
              style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff', borderRadius: '2px', letterSpacing: '1px' }}
            >
              {msgCount} MSG
            </span>
          )}
        </div>

        <div className="no-drag flex items-center gap-2">
          {/* Mood indicator */}
          <div className="mood-pill" title={`Status: ${mood.label}`} style={{ borderColor: `${mood.color}55` }}>
            <span style={{ color: mood.color, fontSize: 9 }}>{mood.emoji}</span>
            <span style={{ color: mood.color }}>{mood.label}</span>
          </div>

          <button onClick={onClearChat} className="icon-btn" title="Clear session">
            <Trash2 style={{ width: 13, height: 13 }} />
          </button>
        </div>
      </div>

      {/* Chat Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col relative z-10">
        {history.length === 0 ? (
          <EmptyState jarvisMode={jarvisMode} />
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {history.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10, y: 6 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="flex gap-3 group"
                >
                  {msg.role === 'user' ? (
                    <>
                      {/* User icon */}
                      <div
                        className="shrink-0 mt-0.5 flex items-center justify-center rounded-sm"
                        style={{ width: 18, height: 18, background: 'rgba(255,159,67,0.15)', border: '1px solid rgba(255,159,67,0.3)' }}
                      >
                        <User style={{ width: 10, height: 10, color: '#ff9f43' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold tracking-widest" style={{ fontFamily: "'Orbitron', monospace", color: '#ff9f43', fontSize: '9px', letterSpacing: '1.5px' }}>USER INPUT</span>
                          <Timestamp iso={msg.timestamp} />
                          <CopyBtn text={msg.content} />
                        </div>
                        <span className="text-xs" style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-dim)', lineHeight: 1.6 }}>{msg.content}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* ARIA icon */}
                      <div
                        className="shrink-0 mt-0.5 flex items-center justify-center rounded-sm"
                        style={{ width: 18, height: 18, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)' }}
                      >
                        <Bot style={{ width: 10, height: 10, color: '#00d4ff' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold tracking-widest" style={{ fontFamily: "'Orbitron', monospace", color: '#00d4ff', fontSize: '9px', letterSpacing: '1.5px', textShadow: '0 0 6px rgba(0,212,255,0.5)' }}>A.R.I.A.</span>
                          <Timestamp iso={msg.timestamp} />
                          <CopyBtn text={msg.content} />
                        </div>
                        <span className="text-xs" style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-primary)', lineHeight: 1.7 }}>{msg.content}</span>

                        {/* Rich cards */}
                        {msg.intent_type === 'weather'       && msg.data && <WeatherCard data={msg.data} />}
                        {msg.intent_type === 'news'          && msg.data && <NewsCard data={msg.data} />}
                        {msg.intent_type === 'file_list'     && msg.data && <FileListCard data={msg.data} />}
                        {msg.intent_type === 'help'          && msg.data && <HelpCard data={msg.data} />}
                        {msg.intent_type === 'system_stats'  && msg.data && <SystemDashCard data={msg.data} />}
                        {msg.intent_type === 'network'       && msg.data && <NetworkCard data={msg.data} />}
                        {msg.intent_type === 'macro_list'    && msg.data && <MacroCard data={msg.data} />}
                        {msg.intent_type === 'analytics'     && msg.data && <AnalyticsCard data={msg.data} />}
                        {msg.intent_type === 'reminder_list' && msg.data && <ReminderCard data={msg.data} />}
                        {msg.intent_type === 'chained'       && msg.data && <ChainedCard data={msg.data} />}
                        {msg.intent_type === 'port_scan'     && msg.data && <PortScanCard data={msg.data} />}
                        {msg.intent_type === 'process_guard' && msg.data && <ProcessGuardCard data={msg.data} />}
                        {msg.intent_type === 'stock' && msg.data && (
                          <>
                            <StockCard data={msg.data} />
                            <LiveChart
                              data={msg.data.history || []}
                              ticker={msg.data.ticker || ''}
                              currency={msg.data.currency || '$'}
                              isUp={(msg.data.change_pct || 0) >= 0}
                            />
                          </>
                        )}
                        {msg.intent_type === 'briefing'      && msg.data && <BriefingCard data={msg.data} />}
                        {msg.intent_type === 'translation'   && msg.data && <TranslationCard data={msg.data} />}
                        {msg.intent_type === 'ai_answer'               && <AIAnswerCard text={msg.content} data={msg.data} />}

                        {/* Generic list */}
                        {msg.data && Array.isArray(msg.data) &&
                          !['weather','news','file_list','help','system_stats','network','macro_list','analytics','reminder_list','chained','port_scan','process_guard'].includes(msg.intent_type) && (
                          <div className="mt-2 pl-2 space-y-1" style={{ borderLeft: '2px solid rgba(0,212,255,0.3)' }}>
                            {msg.data.map((item, i) => (
                              <div key={i} className="text-xs" style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-muted)' }}>
                                ▸ {typeof item === 'string' 
                                    ? item 
                                    : (item.label && item.confidence !== undefined)
                                      ? `${item.label} (${Math.round(item.confidence * 100)}%)`
                                      : `${item.name || ''} — ${item.path || ''}`}
                              </div>
                            ))}
                          </div>
                        )}

                        {msg.success && (
                          <div className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color: '#00ff88' }}>
                            <Check style={{ width: 10, height: 10 }} />
                            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '1px' }}>EXECUTED</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Status bar */}
        <div className="flex gap-3 mt-3 shrink-0 items-center">
          <motion.div
            animate={isListening ? { opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] } : { opacity: 0.4 }}
            transition={{ repeat: Infinity, duration: 1 }}
            style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: isListening ? '#00ff88' : 'rgba(0,212,255,0.4)', boxShadow: isListening ? '0 0 8px rgba(0,255,136,0.7)' : 'none' }}
          />
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '1px', color: isListening ? '#00ff88' : 'var(--text-muted)', textShadow: isListening ? '0 0 6px rgba(0,255,136,0.5)' : 'none' }}>
            {statusText.toUpperCase()}
          </span>
        </div>

        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatPanel;
