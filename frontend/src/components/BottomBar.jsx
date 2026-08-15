import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Settings, Send, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SHORTCUTS = [
  { label: '⛅ WEATHER', cmd: 'weather in Mumbai' },
  { label: '📡 NEWS', cmd: 'news' },
  { label: '🖥 SYS STATS', cmd: 'system dashboard' },
  { label: '☀️ BRIEFING', cmd: 'morning briefing' },
  { label: '📈 BITCOIN', cmd: 'bitcoin price' },
  { label: '🌐 MY IP', cmd: "what's my IP" },
  { label: '📋 CLIPBOARD', cmd: 'read my clipboard' },
  { label: '🔔 REMINDERS', cmd: 'show reminders' },
];

const BottomBar = ({ isListening, onToggleListen, onTextSubmit, onOpenSettings }) => {
  const [text, setText] = useState('');
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [cmdHistory, setCmdHistory] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = (value) => {
    const trimmed = (value || text).trim();
    if (!trimmed) return;
    onTextSubmit(trimmed);
    setCmdHistory(prev => [trimmed, ...prev.slice(0, 49)]);
    setText('');
    setHistoryIdx(-1);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') { submit(); return; }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(historyIdx + 1, cmdHistory.length - 1);
      setHistoryIdx(next);
      setText(cmdHistory[next] || '');
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(historyIdx - 1, -1);
      setHistoryIdx(next);
      setText(next === -1 ? '' : cmdHistory[next] || '');
    }
  };

  return (
    <div className="mx-4 mb-4 space-y-2">
      {/* Shortcut chips */}
      <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
        {SHORTCUTS.map(s => (
          <button
            key={s.cmd}
            onClick={() => submit(s.cmd)}
            className="shortcut-chip shrink-0 no-drag"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Main bar */}
      <div
        className="relative flex items-center gap-2 overflow-hidden"
        style={{
          background: 'linear-gradient(90deg, rgba(0,18,36,0.96), rgba(0,12,26,0.96))',
          border: '1px solid rgba(0,212,255,0.35)',
          borderRadius: '4px',
          padding: '8px 10px',
          boxShadow: '0 0 20px rgba(0,212,255,0.1), inset 0 0 20px rgba(0,212,255,0.02)',
        }}
      >
        {/* Corner decorations */}
        <div className="corner-tl" />
        <div className="corner-tr" />
        <div className="corner-bl" />
        <div className="corner-br" />

        {/* Mic button */}
        <motion.button
          onClick={onToggleListen}
          whileTap={{ scale: 0.92 }}
          className="no-drag relative flex items-center justify-center rounded-sm shrink-0"
          style={{
            width: 38, height: 38,
            background: isListening
              ? 'rgba(0,255,136,0.15)'
              : 'rgba(0,212,255,0.08)',
            border: `1px solid ${isListening ? 'rgba(0,255,136,0.5)' : 'rgba(0,212,255,0.3)'}`,
            boxShadow: isListening ? '0 0 15px rgba(0,255,136,0.4)' : '0 0 8px rgba(0,212,255,0.15)',
            transition: 'all 0.2s',
          }}
          title={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening && (
            <motion.div
              animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 rounded-sm"
              style={{ border: '1px solid rgba(0,255,136,0.5)' }}
            />
          )}
          {isListening
            ? <MicOff style={{ width: 16, height: 16, color: '#00ff88' }} />
            : <Mic style={{ width: 16, height: 16, color: '#00d4ff' }} />
          }
        </motion.button>

        {/* Text input */}
        <div className="flex-1 flex items-center gap-2 relative z-10">
          <span
            className="shrink-0"
            style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: 'rgba(0,212,255,0.45)', letterSpacing: '1px' }}
          >
            ▸
          </span>
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="ENTER COMMAND..."
            className="flex-1 bg-transparent outline-none text-xs"
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              letterSpacing: '0.5px',
              color: 'var(--text-primary)',
            }}
          />
          {/* History nav */}
          {cmdHistory.length > 0 && (
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => {
                  const next = Math.min(historyIdx + 1, cmdHistory.length - 1);
                  setHistoryIdx(next);
                  setText(cmdHistory[next] || '');
                }}
                className="fp-win-btn no-drag"
                style={{ width: 18, height: 18, padding: 2 }}
                title="Previous command"
              >
                <ChevronUp style={{ width: 10, height: 10 }} />
              </button>
              <button
                onClick={() => {
                  const next = Math.max(historyIdx - 1, -1);
                  setHistoryIdx(next);
                  setText(next === -1 ? '' : cmdHistory[next] || '');
                }}
                className="fp-win-btn no-drag"
                style={{ width: 18, height: 18, padding: 2 }}
                title="Next command"
              >
                <ChevronDown style={{ width: 10, height: 10 }} />
              </button>
            </div>
          )}
        </div>

        {/* Send button */}
        <motion.button
          onClick={() => submit()}
          whileTap={{ scale: 0.9 }}
          disabled={!text.trim()}
          className="no-drag flex items-center justify-center rounded-sm shrink-0"
          style={{
            width: 36, height: 36,
            background: text.trim() ? 'linear-gradient(135deg, rgba(0,212,255,0.25), rgba(0,153,204,0.15))' : 'var(--bg-input)',
            border: `1px solid ${text.trim() ? 'rgba(0,212,255,0.5)' : 'var(--border)'}`,
            color: text.trim() ? '#00d4ff' : 'var(--text-muted)',
            boxShadow: text.trim() ? '0 0 10px rgba(0,212,255,0.3)' : 'none',
            transition: 'all 0.2s',
            cursor: text.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          <Send style={{ width: 14, height: 14 }} />
        </motion.button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="no-drag icon-btn shrink-0"
          style={{ width: 36, height: 36 }}
          title="Settings"
        >
          <Settings style={{ width: 14, height: 14 }} />
        </button>

        {/* Scan line */}
        <div className="scan-line" />
      </div>

      {/* Status footer */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <span
            className="text-[9px] tracking-widest"
            style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(0,212,255,0.35)', letterSpacing: '1.5px' }}
          >
            ↑↓ HISTORY
          </span>
          <span
            className="text-[9px] tracking-widest"
            style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(0,212,255,0.35)', letterSpacing: '1.5px' }}
          >
            ENTER SEND
          </span>
        </div>
        {isListening && (
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="text-[9px] tracking-widest"
            style={{ fontFamily: "'Share Tech Mono', monospace", color: '#00ff88', letterSpacing: '1.5px', textShadow: '0 0 6px rgba(0,255,136,0.5)' }}
          >
            ● RECORDING
          </motion.span>
        )}
      </div>
    </div>
  );
};

export default BottomBar;
