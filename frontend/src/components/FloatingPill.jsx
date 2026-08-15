import React from 'react';
import { Mic, Minus, Square, X, Activity, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import LiveClock from './LiveClock';

const FloatingPill = ({ isListening, theme, wakeWordEnabled, messageCount = 0 }) => {
  const handleMin = () => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('window-min');
    }
  };
  const handleMax = () => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('window-max');
    }
  };
  const handleClose = () => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('window-close');
    }
  };

  return (
    <div
      className="drag-region mx-4 mt-4 flex items-center justify-between relative overflow-hidden"
      style={{
        background: 'linear-gradient(90deg, rgba(0,18,36,0.98), rgba(0,26,50,0.98))',
        border: '1px solid rgba(0,212,255,0.35)',
        borderRadius: '4px',
        padding: '8px 14px',
        boxShadow: '0 0 20px rgba(0,212,255,0.12), inset 0 0 30px rgba(0,212,255,0.02)',
      }}
    >
      {/* Scanning line */}
      <div className="scan-line" style={{ top: '50%', zIndex: 0 }} />

      {/* Corner decorations */}
      <div className="corner-tl" />
      <div className="corner-tr" />
      <div className="corner-bl" />
      <div className="corner-br" />

      {/* Left: ARIA logo + status */}
      <div className="flex items-center gap-3 relative z-10">
        {/* Arc reactor orb */}
        <div className="relative flex items-center justify-center" style={{ width: 34, height: 34 }}>
          {/* Outer spinning ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            className="absolute inset-0 rounded-full"
            style={{
              border: '1px solid transparent',
              borderTopColor: 'rgba(0,212,255,0.6)',
              borderRightColor: 'rgba(0,212,255,0.2)',
            }}
          />
          {/* Middle pulse ring */}
          <motion.div
            animate={{ scale: isListening ? [1, 1.2, 1] : [1, 1.05, 1], opacity: isListening ? [0.8, 1, 0.8] : [0.4, 0.6, 0.4] }}
            transition={{ repeat: Infinity, duration: isListening ? 0.8 : 2.5 }}
            className="absolute rounded-full"
            style={{
              width: 26, height: 26,
              border: `1px solid ${isListening ? 'rgba(0,255,136,0.7)' : 'rgba(0,212,255,0.4)'}`,
              boxShadow: isListening
                ? '0 0 12px rgba(0,255,136,0.5), inset 0 0 8px rgba(0,255,136,0.2)'
                : '0 0 8px rgba(0,212,255,0.3)',
            }}
          />
          {/* Core */}
          <div
            className="relative flex items-center justify-center rounded-full"
            style={{
              width: 18, height: 18,
              background: isListening
                ? 'radial-gradient(circle, rgba(0,255,136,0.4), rgba(0,255,136,0.1))'
                : 'radial-gradient(circle, rgba(0,212,255,0.3), rgba(0,212,255,0.05))',
              boxShadow: isListening ? '0 0 8px rgba(0,255,136,0.7)' : '0 0 6px rgba(0,212,255,0.5)',
            }}
          >
            <Mic style={{ width: 9, height: 9, color: isListening ? '#00ff88' : '#00d4ff' }} />
          </div>
        </div>

        {/* Identity */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span
              className="font-bold tracking-widest text-xs"
              style={{
                fontFamily: "'Orbitron', monospace",
                color: '#00d4ff',
                textShadow: '0 0 8px rgba(0,212,255,0.8)',
                letterSpacing: '3px',
              }}
            >
              A.R.I.A.
            </span>
            {isListening && (
              <Activity
                className="animate-pulse"
                style={{ width: 10, height: 10, color: '#00ff88' }}
              />
            )}
          </div>
          <div
            className="text-[8px] tracking-widest mt-0.5"
            style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(0,212,255,0.5)', letterSpacing: '1.5px' }}
          >
            {isListening ? 'AUDIO INPUT ACTIVE' : 'SYSTEM ONLINE'}
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-2 ml-2">
          {wakeWordEnabled && !isListening && (
            <div className="wake-badge">
              <div className="wake-dot" />
              LISTENING
            </div>
          )}
          {messageCount > 0 && (
            <div className="pill-msg-badge">
              {messageCount} MSG
            </div>
          )}
        </div>
      </div>

      {/* Center: Status text */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-[9px] tracking-widest hidden lg:block"
        style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(0,212,255,0.45)', letterSpacing: '2px' }}
      >
        {isListening ? '── RECORDING ──' : '── STANDBY ──'}
      </div>

      {/* Right: Clock + controls */}
      <div className="flex items-center gap-4 relative z-10">
        <LiveClock compact />

        {/* Theme indicator */}
        <div
          className="text-[8px] tracking-widest px-2 py-0.5 rounded-sm"
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            background: 'rgba(0,212,255,0.06)',
            border: '1px solid rgba(0,212,255,0.15)',
            color: 'rgba(0,212,255,0.5)',
            letterSpacing: '1px',
          }}
        >
          {theme === 'dark' ? 'NIGHT' : 'DAY'}
        </div>

        {/* Window controls */}
        <div className="no-drag flex items-center gap-1">
          <button onClick={handleMin} className="fp-win-btn" title="Minimize">
            <Minus style={{ width: 10, height: 10 }} />
          </button>
          <button onClick={handleMax} className="fp-win-btn" title="Maximize">
            <Square style={{ width: 9, height: 9 }} />
          </button>
          <button onClick={handleClose} className="fp-win-btn close" title="Close">
            <X style={{ width: 10, height: 10 }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingPill;
