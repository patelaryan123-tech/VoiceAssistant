import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Zap, Activity, Wifi } from 'lucide-react';
import LiveClock from './LiveClock';

const QUICK_ACTIONS = [
  { icon: '🛡️', label: 'SECURITY', action: 'security', color: '#00ff88' },
  { icon: '✨', label: 'HUB', action: 'features', color: '#f43f5e' },
  { icon: '⚙️', label: 'TELEMETRY', action: 'telemetry', color: '#00d4ff' },
  { icon: '🎭', label: 'PERSONAS', action: 'personas', color: '#c084fc' },
  { icon: '📄', label: 'OCR SCAN', action: 'ocr', color: '#34d399' },
  { icon: '🔐', label: 'VAULT', action: 'vault', color: '#fbbf24' },
  { icon: '⛅', label: 'WEATHER', cmd: 'weather in Mumbai', color: '#00d4ff' },
  { icon: '📡', label: 'NEWS', cmd: 'news', color: '#00ff88' },
  { icon: '☀️', label: 'BRIEF', cmd: 'morning briefing', color: '#fbbf24' },
  { icon: '📈', label: 'STOCK', cmd: 'bitcoin price', color: '#00ff88' },
  { icon: '🌐', label: 'NET', cmd: "what's my IP", color: '#818cf8' },
  { icon: '🔔', label: 'REMIND', cmd: 'show reminders', color: '#ff9f43' },
];

const SidebarPanel = ({
  isOpen, onToggle, onCommand, onOpenFeatures,
  onOpenTelemetry, onOpenPersonas, onOpenOCR, onOpenVault, onOpenSecurity,
  history, isConnected
}) => {
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setUptime(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const uptimeStr = (() => {
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = uptime % 60;
    if (h > 0) return `${h}H ${m}M`;
    if (m > 0) return `${m}M ${s}S`;
    return `${s}S`;
  })();

  const assistantMsgs = history.filter(m => m.role === 'assistant');
  const successRate = assistantMsgs.length === 0 ? 100 :
    Math.round((assistantMsgs.filter(m => m.success !== false).length / assistantMsgs.length) * 100);

  const recentCmds = history
    .filter(m => m.role === 'user')
    .slice(-6)
    .reverse();

  return (
    <>
      {/* Sidebar drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -224 }}
            animate={{ x: 0 }}
            exit={{ x: -224 }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className="sidebar-panel"
          >
            {/* Header */}
            <div className="sidebar-section text-center" style={{ background: 'rgba(0,12,28,0.5)' }}>
              {/* ARIA label */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: isConnected ? '#00ff88' : '#ff4757', boxShadow: isConnected ? '0 0 6px rgba(0,255,136,0.8)' : '0 0 6px rgba(255,71,87,0.8)' }} />
                <span
                  className="font-bold tracking-widest"
                  style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: '#00d4ff', textShadow: '0 0 8px rgba(0,212,255,0.6)', letterSpacing: '2px' }}
                >
                  A.R.I.A.
                </span>
              </div>
              <div
                className="text-center"
                style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: 'rgba(0,212,255,0.4)', letterSpacing: '1.5px' }}
              >
                {isConnected ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
              </div>
              <LiveClock />
            </div>

            {/* Session stats */}
            <div className="sidebar-section">
              <div className="sidebar-section-title">SESSION // STATS</div>
              <div className="space-y-1">
                {[
                  { label: 'UPTIME', val: uptimeStr },
                  { label: 'MESSAGES', val: history.length },
                  { label: 'SUCCESS', val: `${successRate}%` },
                  { label: 'STATUS', val: isConnected ? 'ONLINE' : 'OFFLINE', color: isConnected ? '#00ff88' : '#ff4757' },
                ].map(s => (
                  <div key={s.label} className="sidebar-stat-row">
                    <span className="sidebar-stat-label">{s.label}</span>
                    <span className="sidebar-stat-val sidebar-mono" style={s.color ? { color: s.color, textShadow: `0 0 6px ${s.color}80` } : {}}>
                      {s.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="sidebar-section">
              <div className="sidebar-section-title">QUICK // ACCESS</div>
              <div className="quick-tiles-grid">
                {QUICK_ACTIONS.map(a => (
                  <button
                    key={a.label}
                    className="quick-tile no-drag"
                    style={{ '--tile-color': a.color }}
                    onClick={() => { 
                      if (a.action === 'features') { if (onOpenFeatures) onOpenFeatures(); }
                      else if (a.action === 'security') { if (onOpenSecurity) onOpenSecurity(); }
                      else if (a.action === 'telemetry') { if (onOpenTelemetry) onOpenTelemetry(); }
                      else if (a.action === 'personas') { if (onOpenPersonas) onOpenPersonas(); }
                      else if (a.action === 'ocr') { if (onOpenOCR) onOpenOCR(); }
                      else if (a.action === 'vault') { if (onOpenVault) onOpenVault(); }
                      else { onCommand(a.cmd); }
                    }}
                    title={a.action ? `Open ${a.label}` : a.cmd}
                  >
                    <div className="quick-tile-glow" />
                    <span className="quick-tile-icon">{a.icon}</span>
                    <span className="quick-tile-label" style={{ color: a.color }}>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent commands */}
            {recentCmds.length > 0 && (
              <div className="sidebar-section">
                <div className="sidebar-section-title">RECENT // CMDS</div>
                <div className="sidebar-recent-list">
                  {recentCmds.map((msg, i) => (
                    <button
                      key={i}
                      className="sidebar-recent-item no-drag"
                      onClick={() => onCommand(msg.content)}
                      title={msg.content}
                    >
                      <span className="sidebar-recent-arrow">▸</span>
                      <span className="sidebar-recent-text">{msg.content}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Version */}
            <div className="mt-auto px-4 pb-2 pt-4">
              <div className="text-center" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: 'rgba(0,212,255,0.25)', letterSpacing: '1.5px' }}>
                ARIA v2.0 // BUILD 2026
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle tab */}
      <button
        className="sidebar-toggle-tab no-drag"
        onClick={onToggle}
        title={isOpen ? 'Close sidebar' : 'Open sidebar'}
        style={{ left: isOpen ? 224 : 0, transition: 'left 0.3s' }}
      >
        {isOpen
          ? <ChevronLeft style={{ width: 10, height: 10 }} />
          : <ChevronRight style={{ width: 10, height: 10 }} />
        }
      </button>
    </>
  );
};

export default SidebarPanel;
